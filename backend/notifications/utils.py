from .models import Notification


def notify(user, message, request=None):
    """Create a notification for one user. `request` is an optional DonationRequest."""
    return Notification.objects.create(user=user, message=message[:255], request=request)
