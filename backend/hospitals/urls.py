from django.urls import path

from . import views

urlpatterns = [
    path("", views.verified_hospitals),
    path("register/", views.register_hospital),
    path("mine/", views.my_hospital),
    path("admin/", views.admin_hospital_list),
    path("<int:pk>/verify/", views.verify_hospital),
]
