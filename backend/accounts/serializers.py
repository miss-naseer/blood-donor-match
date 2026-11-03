"""
Serializers convert model objects to JSON (and check incoming JSON).
"""
from rest_framework import serializers

from donors.models import BLOOD_GROUP_CHOICES, DonorProfile

from .models import User


class UserSerializer(serializers.ModelSerializer):
    role_label = serializers.CharField(source="get_role_display", read_only=True)

    class Meta:
        model = User
        fields = ["id", "full_name", "email", "phone", "role", "role_label", "is_active", "date_joined"]
        read_only_fields = ["id", "email", "role", "is_active", "date_joined"]


class RegisterSerializer(serializers.ModelSerializer):
    """
    Used when someone creates an account.
    Donors also send their blood group (and optionally other details),
    so a DonorProfile is created for them at the same time.
    """

    password = serializers.CharField(write_only=True, min_length=6)
    blood_group = serializers.ChoiceField(choices=BLOOD_GROUP_CHOICES, required=False, write_only=True)
    gender = serializers.ChoiceField(choices=DonorProfile.GENDER_CHOICES, required=False, write_only=True)
    date_of_birth = serializers.DateField(required=False, allow_null=True, write_only=True)
    city = serializers.CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = User
        fields = ["id", "full_name", "email", "phone", "role", "password",
                  "blood_group", "gender", "date_of_birth", "city"]

    def validate_email(self, value):
        value = value.lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate_role(self, value):
        # People can only sign up as donors or hospital managers.
        # Admin accounts are created with `python manage.py createsuperuser`.
        if value not in (User.Role.DONOR, User.Role.HOSPITAL_MANAGER):
            raise serializers.ValidationError("Choose either donor or hospital manager.")
        return value

    def validate(self, attrs):
        if attrs.get("role") == User.Role.DONOR and not attrs.get("blood_group"):
            raise serializers.ValidationError({"blood_group": "Blood group is required for donors."})
        return attrs

    def create(self, validated_data):
        donor_fields = {}
        for key in ["blood_group", "gender", "date_of_birth", "city"]:
            if key in validated_data:
                donor_fields[key] = validated_data.pop(key)
        password = validated_data.pop("password")

        user = User.objects.create_user(password=password, **validated_data)
        if user.role == User.Role.DONOR:
            DonorProfile.objects.create(user=user, **donor_fields)
        return user
