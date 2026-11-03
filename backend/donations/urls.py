from django.urls import path

from . import views

urlpatterns = [
    # Donor
    path("requests/", views.submit_request),
    path("requests/mine/", views.my_requests),
    path("requests/<int:pk>/respond/", views.respond_to_request),
    path("requests/<int:pk>/confirm/", views.confirm_appointment),
    path("requests/<int:pk>/reschedule/", views.request_reschedule),
    # Hospital manager
    path("requests/hospital/", views.hospital_requests),
    path("requests/send/", views.send_request_to_donors),
    path("requests/<int:pk>/review/", views.review_request),
    path("requests/<int:pk>/schedule/", views.schedule_donation),
    path("requests/<int:pk>/complete/", views.complete_donation),
    path("requests/<int:pk>/cancel/", views.cancel_request),
    # Admin
    path("admin/requests/", views.all_requests),
    path("admin/stats/", views.stats),
]
