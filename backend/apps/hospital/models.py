from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _


class CustomUser(AbstractUser):
    """
    Custom User model extending Django's AbstractUser.

    Attributes:
        user_type (str): Defines the type of user.
            Choices:
                - hospital
                - health_worker
                - admin
    """
    USER_TYPES = [
        ('hospital', 'Hospital'),
        ('health_worker', 'Health Worker'),
        ('admin', 'Admin'),
    ]
    user_type = models.CharField(max_length=20, choices=USER_TYPES, default='health_worker')

    def __str__(self):
        return f"{self.username} ({self.get_user_type_display()})"


class Hospital(models.Model):
    """
    Represents a hospital entity.

    Attributes:
        user (OneToOne): Linked User account for authentication.
        name (str): Hospital name.
        type (str): Type of hospital (public, private, etc.).
        county (str): County where the hospital is located.
        sub_county (str): Sub-county where the hospital is located.
        ward (str): Ward where the hospital is located.
        address (str): Optional physical address.
        phone (str): Contact phone number.
        email (str): Contact email address.
    """
    HOSPITAL_TYPES = [
        ('public', 'Public'),
        ('private', 'Private'),
        ('mission', 'Mission'),
        ('referral', 'Referral'),
        ('dispensary', 'Dispensary'),
        ('health_center', 'Health Center'),
    ]

    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name="hospital_profile", null=True, blank=True)
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=50, choices=HOSPITAL_TYPES)
    county = models.CharField(max_length=50)
    sub_county = models.CharField(max_length=100)
    ward = models.CharField(max_length=100)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=20)
    email = models.EmailField()

    def __str__(self):
        return self.name


class ANCService(models.Model):
    """
    Antenatal Care (ANC) service information for a hospital.

    Attributes:
        hospital (OneToOne): Associated hospital.
        clinic_days (str): Days when the ANC clinic operates.
        operating_hours (str): Hours when the clinic is open.
        capacity_per_day (int): Number of patients the clinic can handle daily.
        ultrasound_available (bool): Whether ultrasound is available.
        lab_available (bool): Whether laboratory services are available.
        pharmacy_available (bool): Whether a pharmacy is available.
        emergency_services (bool): Whether emergency services are available.
        blood_bank (bool): Whether a blood bank is available.
        insurance_accepted (str): Insurance providers accepted.
        avg_wait_time_minutes (int): Average patient waiting time.
    """
    hospital = models.OneToOneField(Hospital, on_delete=models.CASCADE, related_name="anc_service")
    clinic_days = models.CharField(max_length=255, help_text="e.g. Mon, Wed, Fri")
    operating_hours = models.CharField(max_length=100, help_text="e.g. 8am - 4pm")
    capacity_per_day = models.IntegerField(blank=True, null=True)
    ultrasound_available = models.BooleanField(default=False)
    lab_available = models.BooleanField(default=False)
    pharmacy_available = models.BooleanField(default=False)
    emergency_services = models.BooleanField(default=False)
    blood_bank = models.BooleanField(default=False)
    insurance_accepted = models.CharField(max_length=255)
    avg_wait_time_minutes = models.IntegerField(blank=True, null=True)

    def __str__(self):
        return f"ANC Service - {self.hospital.name}"


class ANCRecord(models.Model):
    """
    Antenatal Care (ANC) record for tracking hospital statistics.

    Attributes:
        hospital (ForeignKey): Associated hospital.
        periodname (date): Reporting period.
        cervical_cancer (int): Number screened for cervical cancer.
        iron_folate_supplements (int): Number given iron + folate supplements.
        iron_supplements (int): Number given iron supplements.
        folic_supplements (int): Number given folic acid supplements.
        preg_adol_15_19_first_anc (int): Pregnant adolescents (15-19) attending first ANC.
        completed_4anc (int): Number completing 4 ANC visits.
        re_visit_anc_clients (int): Number of revisits.
        ipt_3rd_dose (int): Clients receiving IPT 3rd dose.
        first_anc_before_12_weeks (int): Clients attending ANC before 12 weeks.
        completed_8anc (int): Number completing 8 ANC visits.
        fgm_complications (int): FGM-related complications.
        preg_youth_20_24 (int): Pregnant youth (20-24 years).
        breast_cancer_screened (int): Number screened for breast cancer.
        cervical_cancer_screened (int): Number screened for cervical cancer.
        new_anc_clients (int): New ANC clients.
    """
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name="anc_records")
    periodname = models.DateField()
    cervical_cancer = models.IntegerField(default=0)
    iron_folate_supplements = models.IntegerField(default=0)
    iron_supplements = models.IntegerField(default=0)
    folic_supplements = models.IntegerField(default=0)
    preg_adol_15_19_first_anc = models.IntegerField(default=0)
    completed_4anc = models.IntegerField(default=0)
    re_visit_anc_clients = models.IntegerField(default=0)
    ipt_3rd_dose = models.IntegerField(default=0)
    first_anc_before_12_weeks = models.IntegerField(default=0)
    completed_8anc = models.IntegerField(default=0)
    fgm_complications = models.IntegerField(default=0)
    preg_youth_20_24 = models.IntegerField(default=0)
    breast_cancer_screened = models.IntegerField(default=0)
    cervical_cancer_screened = models.IntegerField(default=0)
    new_anc_clients = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.hospital.name} - {self.periodname}"


class HealthWorker(models.Model):
    """
    Represents a health worker associated with one or more hospitals.

    Attributes:
        user (OneToOne): Linked User account for authentication.
        hospitals (ManyToMany): Hospitals where the health worker operates.
        name (str): Full name of the health worker.
        role (str): Professional role (doctor, nurse, etc.).
        phone (str): Contact phone number.
        email (str): Contact email address.
        available_days (str): Days when the health worker is available.
        shift_hours (str): Shift hours of the health worker.
    """
    ROLE_CHOICES = [
        ('doctor', 'Doctor'),
        ('nurse', 'Nurse'),
        ('midwife', 'Midwife'),
        ('obstetrician', 'Obstetrician'),
        ('lab_technician', 'Lab Technician'),
        ('pharmacist', 'Pharmacist'),
        ('other', 'Other'),
    ]

    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name="health_worker_profile", null=True, blank=True)
    hospitals = models.ManyToManyField(Hospital, related_name="health_workers")
    name = models.CharField(max_length=255)
    role = models.CharField(max_length=50, choices=ROLE_CHOICES)
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    available_days = models.CharField(max_length=255)
    shift_hours = models.CharField(max_length=100)
    is_approved = models.BooleanField(default=False)  

    def __str__(self):
        hospitals = ", ".join([h.name for h in self.hospitals.all()])
        return f"{self.name} ({self.role}) - {hospitals}"
