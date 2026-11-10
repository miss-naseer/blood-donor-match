"""
Account endpoints: register, login, "who am I", and admin user management.
"""
from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .permissions import IsAdminRole
from .serializers import RegisterSerializer, UserSerializer

from rest_framework.views import APIView
from django.core.mail import send_mail


# Trigger email sending upon successful registration
def send_otp_email(user):
    otp = user.generate_otp()
    subject = "BloodMatch Account Verification OTP"
    message = f"Hello {user.first_name},\n\nYour account verification OTP code is: {otp}\nThis code is valid for 10 minutes."
    send_mail(subject, message, 'noreply@bloodmatch.com', [user.email])

class VerifyOTPView(APIView):
    def post(self, request):
        email = request.data.get('email')
        otp_entered = request.data.get('otp')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Check if OTP matches and is not expired (10 mins limit)
        if user.otp_code == otp_entered:
            if timezone.now() - user.otp_created_at < timedelta(minutes=10):
                user.is_email_verified = True
                user.is_active = True
                user.otp_code = None  # Clear OTP after use
                user.save()
                return Response({'message': 'Email verified successfully! You can now log in.'}, status=status.HTTP_200_OK)
            else:
                return Response({'error': 'OTP has expired. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({'error': 'Invalid OTP code.'}, status=status.HTTP_400_BAD_REQUEST) 

def tokens_for(user):
    """Create a JWT access token (sent with every request) and a refresh token."""
    refresh = RefreshToken.for_user(user)
    return {"access": str(refresh.access_token), "refresh": str(refresh)}


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    # Log the new user in straight away
    return Response({**tokens_for(user), "user": UserSerializer(user).data}, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    """
    Checks email and password. After MAX_LOGIN_ATTEMPTS wrong passwords in a row,
    the account is locked for LOCKOUT_MINUTES (see the Login use case in Chapter 3).
    """
    email = str(request.data.get("email", "")).strip().lower()
    password = request.data.get("password", "")
    user = User.objects.filter(email__iexact=email).first()

    if user and user.locked_until and user.locked_until > timezone.now():
        return Response({"detail": "Too many failed attempts. Please try again later."},
                        status=status.HTTP_403_FORBIDDEN)

    if user is None or not user.check_password(password):
        if user:
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= settings.MAX_LOGIN_ATTEMPTS:
                user.locked_until = timezone.now() + timedelta(minutes=settings.LOCKOUT_MINUTES)
                user.failed_login_attempts = 0
            user.save(update_fields=["failed_login_attempts", "locked_until"])
        return Response({"detail": "Invalid email or password."}, status=status.HTTP_400_BAD_REQUEST)

    if not user.is_active:
        return Response({"detail": "Your account has been deactivated. Please contact the administrator."},
                        status=status.HTTP_403_FORBIDDEN)

    # Successful login: reset the counter
    user.failed_login_attempts = 0
    user.locked_until = None
    user.last_login = timezone.now()
    user.save(update_fields=["failed_login_attempts", "locked_until", "last_login"])
    return Response({**tokens_for(user), "user": UserSerializer(user).data})


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def me(request):
    """GET returns the logged-in user. PATCH updates their name and phone."""
    if request.method == "PATCH":
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
    return Response(UserSerializer(request.user).data)


# ---------- Admin only ----------

@api_view(["GET"])
@permission_classes([IsAdminRole])
def user_list(request):
    users = User.objects.all().order_by("-date_joined")
    role = request.query_params.get("role")
    if role:
        users = users.filter(role=role)
    return Response(UserSerializer(users, many=True).data)


@api_view(["POST"])
@permission_classes([IsAdminRole])
def toggle_user_active(request, pk):
    user = User.objects.filter(pk=pk).first()
    if user is None:
        return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)
    if user == request.user:
        return Response({"detail": "You cannot deactivate your own account."}, status=status.HTTP_400_BAD_REQUEST)
    user.is_active = not user.is_active
    user.save(update_fields=["is_active"])
    return Response(UserSerializer(user).data)
