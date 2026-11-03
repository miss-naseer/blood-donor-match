from rest_framework import serializers

from .models import Appointment, DonationRequest


class AppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = ["id", "scheduled_date", "scheduled_time", "instructions", "donor_confirmed",
                  "reschedule_note", "status"]


class DonationRequestSerializer(serializers.ModelSerializer):
    hospital = serializers.SerializerMethodField()
    donor = serializers.SerializerMethodField()
    appointment = serializers.SerializerMethodField()
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    urgency_label = serializers.CharField(source="get_urgency_level_display", read_only=True)

    class Meta:
        model = DonationRequest
        fields = ["id", "initiated_by", "blood_group_needed", "urgency_level", "urgency_label", "reason",
                  "required_date", "status", "status_label", "decline_reason", "created_at",
                  "hospital", "donor", "appointment"]

    def get_hospital(self, obj):
        h = obj.hospital
        return {"id": h.id, "name": h.name, "address": h.address, "city": h.city,
                "phone": h.phone, "email": h.email}

    def get_donor(self, obj):
        d = obj.donor
        data = {"id": d.id, "full_name": d.user.full_name, "blood_group": d.blood_group, "city": d.city,
                "is_eligible": d.is_eligible, "next_eligible_date": d.next_eligible_date}

        # Privacy rule: a hospital only sees a donor's contact details after the
        # request has been approved/accepted. Health details are also shown when
        # the donor chose to send the request to this hospital.
        request = self.context.get("request")
        viewer_is_hospital = request is not None and request.user.role == "hospital_manager"
        past_pending = obj.status not in (DonationRequest.Status.PENDING, DonationRequest.Status.DECLINED)

        if not viewer_is_hospital or past_pending:
            data["phone"] = d.user.phone
            data["email"] = d.user.email
        if not viewer_is_hospital or past_pending or obj.initiated_by == DonationRequest.Initiator.DONOR:
            data["health_conditions"] = d.health_conditions
        return data

    def get_appointment(self, obj):
        appointment = getattr(obj, "appointment", None)
        return AppointmentSerializer(appointment).data if appointment else None
