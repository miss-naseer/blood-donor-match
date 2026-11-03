from django.contrib import admin

from .models import DonorProfile


@admin.register(DonorProfile)
class DonorProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "blood_group", "city", "is_available", "last_donation_date"]
    list_filter = ["blood_group", "is_available"]
