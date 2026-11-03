"""
Main URL map. Each app has its own urls.py; they are all mounted under /api/.
"""
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),  # Django's built-in admin site
    path("api/auth/", include("accounts.urls")),
    path("api/donors/", include("donors.urls")),
    path("api/hospitals/", include("hospitals.urls")),
    path("api/donations/", include("donations.urls")),
    path("api/records/", include("records.urls")),
    path("api/notifications/", include("notifications.urls")),
]
