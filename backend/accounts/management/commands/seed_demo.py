"""
Creates demo accounts so you can try the system straight away.

Run:  python manage.py seed_demo

It is safe to run more than once (existing accounts are left alone).
"""
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import User
from donors.models import DonorProfile
from hospitals.models import Hospital

PASSWORD = "password123"

DONORS = [
    # email, full name, blood group, gender, city, days since last donation (None = never donated)
    ("amina@demo.com", "Amina Bello", "O+", "female", "Kano", None),
    ("musa@demo.com", "Musa Ibrahim", "O-", "male", "Kano", 120),
    ("fatima@demo.com", "Fatima Sani", "A+", "female", "Kano", 30),   # not eligible yet
    ("yusuf@demo.com", "Yusuf Abdullahi", "B+", "male", "Kaduna", None),
    ("zainab@demo.com", "Zainab Umar", "AB+", "female", "Kano", None),
]


class Command(BaseCommand):
    help = "Create demo users, hospitals and donors."

    def handle(self, *args, **options):
        # 1. System admin
        if not User.objects.filter(email="admin@demo.com").exists():
            User.objects.create_superuser(email="admin@demo.com", password=PASSWORD, full_name="System Admin")

        # 2. A verified hospital and a pending one
        admin = User.objects.get(email="admin@demo.com")
        self.make_hospital("manager@demo.com", "Hauwa Musa", "City General Hospital", "Kano",
                           Hospital.Status.VERIFIED, admin, "O+,O-,A+")
        self.make_hospital("manager2@demo.com", "Sani Lawal", "Unity Specialist Hospital", "Kaduna",
                           Hospital.Status.PENDING, None, "")

        # 3. Donors
        today = timezone.localdate()
        for email, name, group, gender, city, days_ago in DONORS:
            if User.objects.filter(email=email).exists():
                continue
            user = User.objects.create_user(email=email, password=PASSWORD, full_name=name,
                                            phone="08030000000", role=User.Role.DONOR)
            DonorProfile.objects.create(
                user=user, blood_group=group, gender=gender, city=city,
                last_donation_date=(today - timedelta(days=days_ago)) if days_ago else None,
            )

        self.stdout.write(self.style.SUCCESS("Demo data ready. All demo passwords are: " + PASSWORD))
        self.stdout.write("  Admin:            admin@demo.com")
        self.stdout.write("  Hospital manager: manager@demo.com  (verified hospital)")
        self.stdout.write("  Hospital manager: manager2@demo.com (hospital waiting for verification)")
        self.stdout.write("  Donors:           amina@demo.com, musa@demo.com, fatima@demo.com, "
                          "yusuf@demo.com, zainab@demo.com")

    def make_hospital(self, email, manager_name, hospital_name, city, status, verified_by, groups):
        if User.objects.filter(email=email).exists():
            return
        manager = User.objects.create_user(email=email, password=PASSWORD, full_name=manager_name,
                                           phone="08040000000", role=User.Role.HOSPITAL_MANAGER)
        Hospital.objects.create(
            manager=manager, name=hospital_name, address="1 Hospital Road", city=city,
            phone="08050000000", email=f"info@{hospital_name.split()[0].lower()}hospital.demo",
            blood_bank_details="Blood bank open Monday to Saturday, 8am to 4pm.",
            blood_groups_needed=groups, verification_status=status, verified_by=verified_by,
            verified_at=timezone.now() if verified_by else None,
        )
