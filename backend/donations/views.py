"""
Donation workflow endpoints.

DONOR
  POST requests/                      submit a request to a verified hospital
  GET  requests/mine/                 all my requests (both directions)
  POST requests/<id>/respond/         accept or decline a hospital's request
  POST requests/<id>/confirm/         confirm a scheduled appointment
  POST requests/<id>/reschedule/      ask for a new date/time

HOSPITAL MANAGER
  GET  requests/hospital/             all requests for my hospital
  POST requests/send/                 send a request to compatible donors (matching)
  POST requests/<id>/review/          approve or decline a donor's request
  POST requests/<id>/schedule/        set date, time and instructions
  POST requests/<id>/complete/        mark the donation as completed
  POST requests/<id>/cancel/          cancel (e.g. donor did not attend)

ADMIN
  GET  admin/requests/                every request (monitoring)
  GET  admin/stats/                   counts for the admin dashboard
"""
from datetime import datetime

from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from accounts.models import User
from accounts.permissions import IsAdminRole, IsDonor, IsHospitalManager
from donors.models import BLOOD_GROUPS, DonorProfile
from hospitals.models import Hospital
from notifications.utils import notify
from records.models import DonationHistory

from .matching import find_compatible_donors
from .models import ACTIVE_STATUSES, Appointment, DonationRequest
from .serializers import DonationRequestSerializer

Status = DonationRequest.Status


# ---------- small helpers ----------

def error(message, code=status.HTTP_400_BAD_REQUEST):
    return Response({"detail": message}, status=code)


def parse_date(value):
    """Turn "2026-10-15" into a date object, or return None if it is empty/invalid."""
    try:
        return datetime.strptime(str(value), "%Y-%m-%d").date()
    except (TypeError, ValueError):
        return None


def parse_time(value):
    """Turn "09:30" (or "09:30:00") into a time object, or return None."""
    for fmt in ("%H:%M", "%H:%M:%S"):
        try:
            return datetime.strptime(str(value), fmt).time()
        except (TypeError, ValueError):
            continue
    return None


def serialize(request, obj, many=False):
    return DonationRequestSerializer(obj, many=many, context={"request": request}).data


def get_verified_hospital(user):
    """The manager's hospital, or None if it doesn't exist or isn't verified yet."""
    return Hospital.objects.filter(manager=user, verification_status=Hospital.Status.VERIFIED).first()


# ---------- DONOR ----------

@api_view(["POST"])
@permission_classes([IsDonor])
def submit_request(request):
    """Body: {"hospital_id": 1, "required_date": "2026-10-15" (optional), "reason": "..." (optional)}"""
    donor = request.user.donor_profile
    hospital = Hospital.objects.filter(pk=request.data.get("hospital_id"),
                                       verification_status=Hospital.Status.VERIFIED).first()
    if hospital is None:
        return error("Please choose a verified hospital.")
    if not donor.is_eligible:
        return error(f"You are not eligible to donate until {donor.next_eligible_date:%d %b %Y}.")
    if DonationRequest.objects.filter(donor=donor, hospital=hospital, status__in=ACTIVE_STATUSES).exists():
        return error("You already have an open request with this hospital.")

    required_date = parse_date(request.data.get("required_date"))
    if required_date and required_date < timezone.localdate():
        return error("The preferred date is in the past. Please choose a valid date.")

    donation_request = DonationRequest.objects.create(
        donor=donor,
        hospital=hospital,
        initiated_by=DonationRequest.Initiator.DONOR,
        blood_group_needed=donor.blood_group,
        required_date=required_date,
        reason=str(request.data.get("reason", "")).strip(),
    )
    notify(hospital.manager, f"{request.user.full_name} ({donor.blood_group}) wants to donate at your hospital.",
           donation_request)
    return Response(serialize(request, donation_request), status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsDonor])
def my_requests(request):
    requests_qs = DonationRequest.objects.filter(donor=request.user.donor_profile).select_related(
        "hospital", "donor__user")
    return Response(serialize(request, requests_qs, many=True))


def get_donor_request(request, pk):
    return DonationRequest.objects.filter(pk=pk, donor=request.user.donor_profile).first()


@api_view(["POST"])
@permission_classes([IsDonor])
def respond_to_request(request, pk):
    """Donor accepts or declines a request that a hospital sent. Body: {"accept": true/false}"""
    donation_request = get_donor_request(request, pk)
    if donation_request is None:
        return error("Request not found.", status.HTTP_404_NOT_FOUND)
    if donation_request.initiated_by != DonationRequest.Initiator.HOSPITAL or donation_request.status != Status.PENDING:
        return error("You can only respond to pending requests sent by a hospital.")

    accept = request.data.get("accept") in (True, "true", "True", 1, "1")
    if accept and not donation_request.donor.is_eligible:
        return error(f"You are not eligible to donate until "
                     f"{donation_request.donor.next_eligible_date:%d %b %Y}.")

    donation_request.set_status(Status.APPROVED if accept else Status.DECLINED)
    verb = "accepted" if accept else "declined"
    notify(donation_request.hospital.manager,
           f"{request.user.full_name} {verb} your request for {donation_request.blood_group_needed} blood.",
           donation_request)
    return Response(serialize(request, donation_request))


@api_view(["POST"])
@permission_classes([IsDonor])
def confirm_appointment(request, pk):
    donation_request = get_donor_request(request, pk)
    if donation_request is None:
        return error("Request not found.", status.HTTP_404_NOT_FOUND)
    if donation_request.status != Status.SCHEDULED:
        return error("Only scheduled appointments can be confirmed.")

    appointment = donation_request.appointment
    appointment.donor_confirmed = True
    appointment.save(update_fields=["donor_confirmed"])
    donation_request.set_status(Status.CONFIRMED)
    notify(donation_request.hospital.manager,
           f"{request.user.full_name} confirmed the appointment on {appointment.scheduled_date:%d %b %Y}.",
           donation_request)
    return Response(serialize(request, donation_request))


@api_view(["POST"])
@permission_classes([IsDonor])
def request_reschedule(request, pk):
    """Body: {"note": "I am free next Monday morning"}"""
    donation_request = get_donor_request(request, pk)
    if donation_request is None:
        return error("Request not found.", status.HTTP_404_NOT_FOUND)
    if donation_request.status != Status.SCHEDULED:
        return error("You can only ask to reschedule a scheduled appointment.")

    note = str(request.data.get("note", "")).strip()
    if not note:
        return error("Please say which date or time works better for you.")
    appointment = donation_request.appointment
    appointment.reschedule_note = note
    appointment.save(update_fields=["reschedule_note"])
    donation_request.set_status(Status.RESCHEDULE_REQUESTED)
    notify(donation_request.hospital.manager,
           f"{request.user.full_name} asked for a new appointment time: {note}", donation_request)
    return Response(serialize(request, donation_request))


# ---------- HOSPITAL MANAGER ----------

@api_view(["GET"])
@permission_classes([IsHospitalManager])
def hospital_requests(request):
    hospital = Hospital.objects.filter(manager=request.user).first()
    if hospital is None:
        return Response([])
    requests_qs = DonationRequest.objects.filter(hospital=hospital).select_related("hospital", "donor__user")
    status_filter = request.query_params.get("status")
    if status_filter:
        requests_qs = requests_qs.filter(status=status_filter)
    return Response(serialize(request, requests_qs, many=True))


@api_view(["POST"])
@permission_classes([IsHospitalManager])
def send_request_to_donors(request):
    """
    Body: {"blood_group_needed": "O+", "urgency_level": "urgent",
           "reason": "Surgery patient", "required_date": "2026-10-10"}
    Finds compatible, available and eligible donors and sends each one a request.
    """
    hospital = get_verified_hospital(request.user)
    if hospital is None:
        return error("Your hospital must be verified before you can request donors.")

    blood_group = request.data.get("blood_group_needed")
    required_date = parse_date(request.data.get("required_date"))
    urgency = request.data.get("urgency_level") or DonationRequest.Urgency.NORMAL
    if blood_group not in BLOOD_GROUPS or required_date is None:
        return error("Please select the blood group needed and the required date.")
    if required_date < timezone.localdate():
        return error("The required date is in the past. Please choose a valid date.")
    if urgency not in DonationRequest.Urgency.values:
        return error("Urgency must be normal, urgent or critical.")

    donors = find_compatible_donors(blood_group, hospital)
    if not donors:
        return error("No compatible donors are currently available.")

    reason = str(request.data.get("reason", "")).strip()
    with transaction.atomic():
        for donor in donors:
            donation_request = DonationRequest.objects.create(
                donor=donor, hospital=hospital, initiated_by=DonationRequest.Initiator.HOSPITAL,
                blood_group_needed=blood_group, urgency_level=urgency, reason=reason,
                required_date=required_date,
            )
            notify(donor.user, f"{hospital.name} needs {blood_group} blood ({urgency}). Can you help?",
                   donation_request)
    return Response({"donors_contacted": len(donors)}, status=status.HTTP_201_CREATED)


def get_hospital_request(request, pk):
    return DonationRequest.objects.filter(pk=pk, hospital__manager=request.user).first()


@api_view(["POST"])
@permission_classes([IsHospitalManager])
def review_request(request, pk):
    """Approve or decline a donor's request. Body: {"approve": true} or {"approve": false, "reason": "..."}"""
    donation_request = get_hospital_request(request, pk)
    if donation_request is None:
        return error("Request not found.", status.HTTP_404_NOT_FOUND)
    if donation_request.initiated_by != DonationRequest.Initiator.DONOR or donation_request.status != Status.PENDING:
        return error("Only pending requests from donors can be reviewed.")

    approve = request.data.get("approve") in (True, "true", "True", 1, "1")
    if approve:
        donation_request.set_status(Status.APPROVED)
        message = f"{donation_request.hospital.name} approved your donation request. An appointment will follow."
    else:
        donation_request.decline_reason = str(request.data.get("reason", "")).strip()
        donation_request.save(update_fields=["decline_reason"])
        donation_request.set_status(Status.DECLINED)
        message = f"{donation_request.hospital.name} declined your donation request."
        if donation_request.decline_reason:
            message += f" Reason: {donation_request.decline_reason}"
    notify(donation_request.donor.user, message, donation_request)
    return Response(serialize(request, donation_request))


@api_view(["POST"])
@permission_classes([IsHospitalManager])
def schedule_donation(request, pk):
    """Body: {"scheduled_date": "2026-10-15", "scheduled_time": "10:00", "instructions": "..."}"""
    donation_request = get_hospital_request(request, pk)
    if donation_request is None:
        return error("Request not found.", status.HTTP_404_NOT_FOUND)
    if donation_request.status not in (Status.APPROVED, Status.RESCHEDULE_REQUESTED):
        return error("Only approved requests (or reschedule requests) can be scheduled.")

    scheduled_date = parse_date(request.data.get("scheduled_date"))
    scheduled_time = parse_time(request.data.get("scheduled_time"))
    if scheduled_date is None or scheduled_time is None:
        return error("Please enter a valid date and time.")
    if scheduled_date < timezone.localdate():
        return error("The selected date is in the past. Please choose a valid date.")

    Appointment.objects.update_or_create(
        request=donation_request,
        defaults={
            "scheduled_date": scheduled_date,
            "scheduled_time": scheduled_time,
            "instructions": str(request.data.get("instructions", "")).strip(),
            "donor_confirmed": False,
            "status": "scheduled",
        },
    )
    donation_request.set_status(Status.SCHEDULED)
    notify(donation_request.donor.user,
           f"{donation_request.hospital.name} scheduled your donation for "
           f"{scheduled_date:%d %b %Y} at {scheduled_time:%H:%M}. Please confirm.", donation_request)
    return Response(serialize(request, donation_request))


@api_view(["POST"])
@permission_classes([IsHospitalManager])
def complete_donation(request, pk):
    """Body: {"donation_date": "2026-10-15", "quantity_ml": 450, "remarks": "..."}"""
    donation_request = get_hospital_request(request, pk)
    if donation_request is None:
        return error("Request not found.", status.HTTP_404_NOT_FOUND)
    if donation_request.status != Status.CONFIRMED:
        return error("Only confirmed appointments can be marked as completed.")

    donation_date = parse_date(request.data.get("donation_date")) or timezone.localdate()
    if donation_date > timezone.localdate():
        return error("The donation date cannot be in the future.")
    try:
        quantity = int(request.data.get("quantity_ml", 450))
        if quantity <= 0:
            raise ValueError
    except (TypeError, ValueError):
        return error("Quantity collected must be a valid number.")

    donor = donation_request.donor
    with transaction.atomic():
        DonationHistory.objects.create(
            appointment=donation_request.appointment,
            donor=donor,
            hospital=donation_request.hospital,
            donation_date=donation_date,
            quantity_ml=quantity,
            remarks=str(request.data.get("remarks", "")).strip(),
        )
        donor.last_donation_date = donation_date  # this starts the 90-day waiting period
        donor.save(update_fields=["last_donation_date"])
        donation_request.set_status(Status.COMPLETED)

    notify(donor.user, f"Thank you. Your donation at {donation_request.hospital.name} has been recorded. "
                       f"You can donate again from {donor.next_eligible_date:%d %b %Y}.", donation_request)
    return Response(serialize(request, donation_request))


@api_view(["POST"])
@permission_classes([IsHospitalManager])
def cancel_request(request, pk):
    """Body: {"reason": "Donor did not attend"}"""
    donation_request = get_hospital_request(request, pk)
    if donation_request is None:
        return error("Request not found.", status.HTTP_404_NOT_FOUND)
    if donation_request.status not in (Status.SCHEDULED, Status.CONFIRMED, Status.RESCHEDULE_REQUESTED,
                                       Status.APPROVED):
        return error("This request cannot be cancelled.")

    reason = str(request.data.get("reason", "")).strip()
    donation_request.decline_reason = reason
    donation_request.save(update_fields=["decline_reason"])
    donation_request.set_status(Status.CANCELLED)
    message = f"Your appointment at {donation_request.hospital.name} was cancelled."
    if reason:
        message += f" Reason: {reason}"
    notify(donation_request.donor.user, message, donation_request)
    return Response(serialize(request, donation_request))


# ---------- ADMIN ----------

@api_view(["GET"])
@permission_classes([IsAdminRole])
def all_requests(request):
    requests_qs = DonationRequest.objects.select_related("hospital", "donor__user")
    status_filter = request.query_params.get("status")
    if status_filter:
        requests_qs = requests_qs.filter(status=status_filter)
    return Response(serialize(request, requests_qs[:200], many=True))


@api_view(["GET"])
@permission_classes([IsAdminRole])
def stats(request):
    """Numbers shown on the admin dashboard."""
    return Response({
        "donors": User.objects.filter(role=User.Role.DONOR).count(),
        "available_donors": DonorProfile.objects.filter(is_available=True).count(),
        "hospital_managers": User.objects.filter(role=User.Role.HOSPITAL_MANAGER).count(),
        "hospitals_verified": Hospital.objects.filter(verification_status=Hospital.Status.VERIFIED).count(),
        "hospitals_pending": Hospital.objects.filter(verification_status=Hospital.Status.PENDING).count(),
        "requests_open": DonationRequest.objects.filter(status__in=ACTIVE_STATUSES).count(),
        "requests_total": DonationRequest.objects.count(),
        "donations_completed": DonationHistory.objects.count(),
        "donors_by_blood_group": {
            group: DonorProfile.objects.filter(blood_group=group).count() for group in BLOOD_GROUPS
        },
    })
