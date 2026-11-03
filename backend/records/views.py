from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import DonationHistory
from .serializers import DonationHistorySerializer


@api_view(["GET"])
def my_history(request):
    """Donors see their own donations; hospital managers see their hospital's; admins see all."""
    user = request.user
    records = DonationHistory.objects.select_related("donor__user", "hospital")
    if user.role == "donor":
        records = records.filter(donor__user=user)
    elif user.role == "hospital_manager":
        records = records.filter(hospital__manager=user)
    return Response(DonationHistorySerializer(records, many=True).data)
