"""
Hospital endpoints.

Hospital manager: register a hospital, view/update it.
Donor: list verified hospitals.
Admin: list hospitals by status, verify or reject them.
"""
from django.db.models import Q
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import User
from accounts.permissions import IsAdminRole, IsHospitalManager
from notifications.utils import notify

from .models import Hospital
from .serializers import HospitalSerializer


@api_view(["POST"])
@permission_classes([IsHospitalManager])
def register_hospital(request):
    if Hospital.objects.filter(manager=request.user).exists():
        return Response({"detail": "You have already registered a hospital."}, status=status.HTTP_400_BAD_REQUEST)
    serializer = HospitalSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    hospital = serializer.save(manager=request.user)  # saved as "pending"

    for admin in User.objects.filter(role=User.Role.ADMIN, is_active=True):
        notify(admin, f"{hospital.name} has registered and is waiting for verification.")
    return Response(HospitalSerializer(hospital).data, status=status.HTTP_201_CREATED)


@api_view(["GET", "PATCH"])
@permission_classes([IsHospitalManager])
def my_hospital(request):
    hospital = Hospital.objects.filter(manager=request.user).first()
    if hospital is None:
        return Response({"detail": "You have not registered a hospital yet."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "PATCH":
        serializer = HospitalSerializer(hospital, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        hospital = serializer.save()
        # A rejected hospital that fixes its details goes back into the review queue
        if hospital.verification_status == Hospital.Status.REJECTED:
            hospital.verification_status = Hospital.Status.PENDING
            hospital.rejection_reason = ""
            hospital.save(update_fields=["verification_status", "rejection_reason"])
            for admin in User.objects.filter(role=User.Role.ADMIN, is_active=True):
                notify(admin, f"{hospital.name} updated its details and is waiting for verification again.")
    return Response(HospitalSerializer(hospital).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def verified_hospitals(request):
    """Directory of verified hospitals. Optional ?search= filters by name or city."""
    hospitals = Hospital.objects.filter(verification_status=Hospital.Status.VERIFIED)
    search = request.query_params.get("search")
    if search:
        hospitals = hospitals.filter(Q(name__icontains=search) | Q(city__icontains=search))
    return Response(HospitalSerializer(hospitals, many=True).data)


@api_view(["GET"])
@permission_classes([IsAdminRole])
def admin_hospital_list(request):
    """All hospitals, optionally filtered with ?status=pending|verified|rejected."""
    hospitals = Hospital.objects.all().order_by("-created_at")
    status_filter = request.query_params.get("status")
    if status_filter:
        hospitals = hospitals.filter(verification_status=status_filter)
    return Response(HospitalSerializer(hospitals, many=True).data)


@api_view(["POST"])
@permission_classes([IsAdminRole])
def verify_hospital(request, pk):
    """Body: {"action": "verify"} or {"action": "reject", "reason": "..."}"""
    hospital = Hospital.objects.filter(pk=pk).first()
    if hospital is None:
        return Response({"detail": "Hospital not found."}, status=status.HTTP_404_NOT_FOUND)

    action = request.data.get("action")
    if action == "verify":
        hospital.verification_status = Hospital.Status.VERIFIED
        hospital.rejection_reason = ""
        hospital.verified_by = request.user
        hospital.verified_at = timezone.now()
        message = f"{hospital.name} has been verified and is now visible to donors."
    elif action == "reject":
        reason = str(request.data.get("reason", "")).strip()
        if not reason:
            return Response({"detail": "Please give a reason for rejecting the hospital."},
                            status=status.HTTP_400_BAD_REQUEST)
        hospital.verification_status = Hospital.Status.REJECTED
        hospital.rejection_reason = reason
        message = f"{hospital.name} was not verified. Reason: {reason}"
    else:
        return Response({"detail": 'Action must be "verify" or "reject".'}, status=status.HTTP_400_BAD_REQUEST)

    hospital.save()
    notify(hospital.manager, message)
    return Response(HospitalSerializer(hospital).data)
