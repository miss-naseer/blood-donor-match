"""
Donor profile: the blood-donation details of a user with the "donor" role.
"""
from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone

BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
BLOOD_GROUP_CHOICES = [(group, group) for group in BLOOD_GROUPS]


class DonorProfile(models.Model):
    GENDER_CHOICES = [("male", "Male"), ("female", "Female")]

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="donor_profile")
    blood_group = models.CharField(max_length=3, choices=BLOOD_GROUP_CHOICES)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True)
    address = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=50, blank=True)
    health_conditions = models.TextField(blank=True)
    last_donation_date = models.DateField(null=True, blank=True)
    is_available = models.BooleanField(default=True)

    @property
    def next_eligible_date(self):
        """Last donation date + 90 days (None if the donor has never donated)."""
        if self.last_donation_date is None:
            return None
        return self.last_donation_date + timedelta(days=settings.DONATION_INTERVAL_DAYS)

    @property
    def is_eligible(self):
        """True if enough time has passed since the last donation."""
        next_date = self.next_eligible_date
        return next_date is None or next_date <= timezone.localdate()

    def __str__(self):
        return f"{self.user.full_name} ({self.blood_group})"
