from rest_framework import serializers

from .models import DonationHistory


class DonationHistorySerializer(serializers.ModelSerializer):
    donor_name = serializers.CharField(source="donor.user.full_name", read_only=True)
    blood_group = serializers.CharField(source="donor.blood_group", read_only=True)
    hospital_name = serializers.CharField(source="hospital.name", read_only=True)

    class Meta:
        model = DonationHistory
        fields = ["id", "donation_date", "quantity_ml", "remarks", "donor_name", "blood_group", "hospital_name"]
