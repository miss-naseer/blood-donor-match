from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from accounts.permissions import IsDonor

from .serializers import DonorProfileSerializer


@api_view(["GET", "PATCH"])
@permission_classes([IsDonor])
def my_profile(request):
    """GET shows the donor's profile. PATCH updates it (for example availability)."""
    profile = request.user.donor_profile
    if request.method == "PATCH":
        serializer = DonorProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
    return Response(DonorProfileSerializer(profile).data)
