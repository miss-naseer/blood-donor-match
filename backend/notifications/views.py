from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Notification
from .serializers import NotificationSerializer


@api_view(["GET"])
def my_notifications(request):
    notifications = Notification.objects.filter(user=request.user)[:50]
    unread = Notification.objects.filter(user=request.user, is_read=False).count()
    return Response({"unread": unread, "results": NotificationSerializer(notifications, many=True).data})


@api_view(["POST"])
def mark_read(request, pk):
    notification = Notification.objects.filter(pk=pk, user=request.user).first()
    if notification is None:
        return Response({"detail": "Notification not found."}, status=status.HTTP_404_NOT_FOUND)
    notification.is_read = True
    notification.save(update_fields=["is_read"])
    return Response(NotificationSerializer(notification).data)


@api_view(["POST"])
def mark_all_read(request):
    Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
    return Response({"detail": "All notifications marked as read."})
