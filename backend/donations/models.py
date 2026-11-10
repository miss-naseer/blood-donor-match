"""
Donation requests and appointments.

A DonationRequest connects one donor and one hospital. It can be started by
the donor ("I want to donate here") or by the hospital ("we need your blood group").

Status flow :
  pending -> approved -> scheduled -> confirmed -> completed
  pending -> declined
  scheduled -> reschedule_requested -> scheduled
  scheduled / confirmed -> cancelled
"""
from django.db import models

from donors.models import BLOOD_GROUP_CHOICES, DonorProfile
from hospitals.models import Hospital


class DonationRequest(models.Model):
    class Initiator(models.TextChoices):
        DONOR = "donor", "Donor"
        HOSPITAL = "hospital", "Hospital"

    class Urgency(models.TextChoices):
        NORMAL = "normal", "Normal"
        URGENT = "urgent", "Urgent"
        CRITICAL = "critical", "Critical"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        DECLINED = "declined", "Declined"
        SCHEDULED = "scheduled", "Scheduled"
        RESCHEDULE_REQUESTED = "reschedule_requested", "Reschedule Requested"
        CONFIRMED = "confirmed", "Confirmed"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    donor = models.ForeignKey(DonorProfile, on_delete=models.CASCADE, related_name="donation_requests")
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name="donation_requests")
    initiated_by = models.CharField(max_length=10, choices=Initiator.choices)
    blood_group_needed = models.CharField(max_length=3, choices=BLOOD_GROUP_CHOICES, blank=True)
    urgency_level = models.CharField(max_length=10, choices=Urgency.choices, default=Urgency.NORMAL)
    reason = models.TextField(blank=True)
    required_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=25, choices=Status.choices, default=Status.PENDING)
    decline_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def set_status(self, new_status):
        """Change the status and keep the appointment's status in step with it."""
        self.status = new_status
        self.save(update_fields=["status", "updated_at"])
        appointment = getattr(self, "appointment", None)
        if appointment is not None and new_status in Appointment.STATUSES:
            appointment.status = new_status
            appointment.save(update_fields=["status"])

    def __str__(self):
        return f"Request #{self.pk}: {self.donor} -> {self.hospital} ({self.status})"


# Requests in these statuses are still "open"
ACTIVE_STATUSES = [
    DonationRequest.Status.PENDING,
    DonationRequest.Status.APPROVED,
    DonationRequest.Status.SCHEDULED,
    DonationRequest.Status.RESCHEDULE_REQUESTED,
    DonationRequest.Status.CONFIRMED,
]


class Appointment(models.Model):
    STATUSES = ["scheduled", "reschedule_requested", "confirmed", "completed", "cancelled"]

    request = models.OneToOneField(DonationRequest, on_delete=models.CASCADE, related_name="appointment")
    scheduled_date = models.DateField()
    scheduled_time = models.TimeField()
    instructions = models.TextField(blank=True)
    donor_confirmed = models.BooleanField(default=False)
    reschedule_note = models.TextField(blank=True)
    status = models.CharField(max_length=25, default="scheduled")

    def __str__(self):
        return f"Appointment for request #{self.request_id} on {self.scheduled_date}"
