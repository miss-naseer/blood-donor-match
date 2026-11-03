from rest_framework import serializers

from .models import DonorProfile


class DonorProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="user.full_name", read_only=True)
    email = serializers.CharField(source="user.email", read_only=True)
    phone = serializers.CharField(source="user.phone", read_only=True)
    next_eligible_date = serializers.DateField(read_only=True)
    is_eligible = serializers.BooleanField(read_only=True)

    class Meta:
        model = DonorProfile
        fields = ["id", "full_name", "email", "phone", "blood_group", "date_of_birth", "gender",
                  "address", "city", "health_conditions", "last_donation_date", "is_available",
                  "next_eligible_date", "is_eligible"]
