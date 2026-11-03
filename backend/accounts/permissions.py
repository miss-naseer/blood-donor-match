"""
Permission classes used by the views to check a user's role.

Example: @permission_classes([IsDonor]) means only donors can use that endpoint.
"""
from rest_framework.permissions import BasePermission


class IsDonor(BasePermission):
    message = "Only donors can do this."

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "donor"


class IsHospitalManager(BasePermission):
    message = "Only hospital managers can do this."

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "hospital_manager"


class IsAdminRole(BasePermission):
    message = "Only the system admin can do this."

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"
