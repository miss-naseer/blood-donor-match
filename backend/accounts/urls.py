from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views
from .views import VerifyOTPView

urlpatterns = [
    path("register/", views.register),
    path("login/", views.login),
    path("refresh/", TokenRefreshView.as_view()),
    path("me/", views.me),
    path("users/", views.user_list),
    path("users/<int:pk>/toggle-active/", views.toggle_user_active),
    path('api/auth/verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
]
