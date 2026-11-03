"""
A permanent record of a completed donation (the shared donation history).
"""
from django.db import models

from donations.models import Appointment
from donors.models import DonorProfile
from hospitals.models import Hospital


class DonationHistory(models.Model):
    appointment = models.OneToOneField(Appointment, on_delete=models.SET_NULL, null=True, blank=True,
                                       related_name="record")
    donor = models.ForeignKey(DonorProfile, on_delete=models.CASCADE, related_name="history")
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name="history")
    donation_date = models.DateField()
    quantity_ml = models.PositiveIntegerField(default=450)
    remarks = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-donation_date"]
        verbose_name_plural = "donation history"

    def __str__(self):
        return f"{self.donor} at {self.hospital} on {self.donation_date}"
