from django.contrib import admin

from .models import Appointment, DonationRequest


@admin.register(DonationRequest)
class DonationRequestAdmin(admin.ModelAdmin):
    list_display = ["id", "donor", "hospital", "initiated_by", "blood_group_needed", "urgency_level", "status",
                    "created_at"]
    list_filter = ["status", "initiated_by", "urgency_level"]


admin.site.register(Appointment)
