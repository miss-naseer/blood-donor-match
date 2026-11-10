"""
Donor matching rules (the MatchingService in the class diagram).

A hospital asks for a blood group. We find donors who:
  1. have a COMPATIBLE blood group,
  2. are marked as available, and
  3. are ELIGIBLE (90 days have passed since their last donation).
"""
from donors.models import BLOOD_GROUPS

# Blood group needed by the patient -> donor blood groups that can give to them
COMPATIBLE_DONORS = {
    "O-": ["O-"],
    "O+": ["O+", "O-"],
    "A-": ["A-", "O-"],
    "A+": ["A+", "A-", "O+", "O-"],
    "B-": ["B-", "O-"],
    "B+": ["B+", "B-", "O+", "O-"],
    "AB-": ["AB-", "A-", "B-", "O-"],
    "AB+": list(BLOOD_GROUPS),  # AB+ can receive from every group
}


def is_compatible(donor_group, needed_group):
    return donor_group in COMPATIBLE_DONORS.get(needed_group, [])


def is_eligible(donor):
    return donor.is_available and donor.is_eligible


def find_compatible_donors(needed_group, hospital):
    """Return the list of DonorProfiles that can be sent a request for `needed_group`."""
    # Imported here to avoid a circular import between models and matching
    from donors.models import DonorProfile

    from .models import ACTIVE_STATUSES, DonationRequest

    candidates = DonorProfile.objects.filter(
        blood_group__in=COMPATIBLE_DONORS.get(needed_group, []),
        is_available=True,
        user__is_active=True,
    ).select_related("user")

    # Don't contact donors who already have an open request with this hospital
    busy_donor_ids = DonationRequest.objects.filter(
        hospital=hospital, status__in=ACTIVE_STATUSES
    ).values_list("donor_id", flat=True)

    return [donor for donor in candidates.exclude(id__in=busy_donor_ids) if donor.is_eligible]
