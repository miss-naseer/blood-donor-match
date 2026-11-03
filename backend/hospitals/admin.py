from django.contrib import admin

from .models import Hospital


@admin.register(Hospital)
class HospitalAdmin(admin.ModelAdmin):
    list_display = ["name", "city", "manager", "verification_status", "created_at"]
    list_filter = ["verification_status", "city"]
    search_fields = ["name", "city"]
