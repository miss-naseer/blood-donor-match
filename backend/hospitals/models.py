"""
A hospital registered on the platform by a hospital manager.
Donors can only see a hospital after the admin has verified it.
"""
from django.conf import settings
from django.db import models


class Hospital(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending Verification"
        VERIFIED = "verified", "Verified"
        REJECTED = "rejected", "Rejected"

    manager = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="hospital")
    name = models.CharField(max_length=150)
    address = models.CharField(max_length=255)
    city = models.CharField(max_length=50)
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    blood_bank_details = models.TextField(blank=True)
    # Stored as text like "O+,A-". The serializer turns it into a list.
    blood_groups_needed = models.CharField(max_length=50, blank=True)

    verification_status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    rejection_reason = models.TextField(blank=True)
    verified_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name="verified_hospitals")
    verified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name
