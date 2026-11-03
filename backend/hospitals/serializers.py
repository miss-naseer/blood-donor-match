from rest_framework import serializers

from donors.models import BLOOD_GROUPS

from .models import Hospital


class BloodGroupListField(serializers.Field):
    """Shows "O+,A-" as ["O+", "A-"] in JSON, and turns the list back into text when saving."""

    def to_representation(self, value):
        return [group for group in value.split(",") if group]

    def to_internal_value(self, data):
        if not isinstance(data, list):
            raise serializers.ValidationError("Send a list of blood groups.")
        invalid = [group for group in data if group not in BLOOD_GROUPS]
        if invalid:
            raise serializers.ValidationError(f"Unknown blood group(s): {', '.join(invalid)}")
        return ",".join(data)


class HospitalSerializer(serializers.ModelSerializer):
    blood_groups_needed = BloodGroupListField(required=False)
    status_label = serializers.CharField(source="get_verification_status_display", read_only=True)
    manager_name = serializers.CharField(source="manager.full_name", read_only=True)

    class Meta:
        model = Hospital
        fields = ["id", "name", "address", "city", "phone", "email", "blood_bank_details",
                  "blood_groups_needed", "verification_status", "status_label", "rejection_reason",
                  "manager_name", "verified_at", "created_at"]
        read_only_fields = ["verification_status", "rejection_reason", "verified_at", "created_at"]
