<<<<<<< HEAD
<<<<<<< HEAD
from django.db import models
from django.utils import timezone
from django.conf import settings
from math import floor
from apps.hospital.models import Hospital


class Patient(models.Model):
    """
    Represents a patient (mother) receiving ANC services.
    """
    name = models.CharField(max_length=255, default="")
    phone = models.CharField(max_length=20, unique=True, default="")
    date_registered = models.DateField(default=timezone.now)
    weeks_pregnant = models.PositiveIntegerField(default=0, help_text="Number of weeks pregnant")
    ward = models.CharField(max_length=100, default="")
    county = models.CharField(max_length=100, default="")
    preferred_hospitals = models.ManyToManyField("hospital.Hospital", related_name="preferred_patients", blank=True)
    suggested_hospitals = models.ManyToManyField("hospital.Hospital", related_name="suggested_patients", blank=True)
    emergency_contact = models.CharField(max_length=20, blank=True, help_text="Hospital phone number")

    def __str__(self):
        return f"{self.name} ({self.phone})"

    # -------------------- NEW FIELDS --------------------
    @property
    def current_date(self):
        """Return today’s date."""
        return timezone.now().date()

    @property
    def current_week(self):
        days_diff = (self.current_date - self.date_registered).days
        return self.weeks_pregnant + floor(days_diff / 7)


    @property
    def status(self):
        """
        Pregnancy visit status.
        Returns 'should visit' if current week is one of the milestone weeks,
        otherwise returns 'good'.
        """
        visit_weeks = {12, 20, 26, 30, 34, 36, 38, 40}
        if self.current_week in visit_weeks:
            return "should visit"
        return "good"

    # -------------------- EXISTING LOGIC --------------------
    def assign_suggested_hospitals(self):
        """
        Auto-assign hospitals based on ward capacity.
        - Prefer hospitals in the same ward.
        - If all are full, suggest from same county.
        - Update emergency contact with the first suggested hospital phone.
        """
        from apps.hospital.models import Hospital  # avoid circular import

        # 1. Get hospitals in same ward
        ward_hospitals = Hospital.objects.filter(ward=self.ward)
        suggested = []

        for hospital in ward_hospitals:
            if getattr(hospital, "anc_service", None) and hospital.anc_service.capacity_per_day:
                # Check number of patients already suggested to this hospital today
                patients_today = Patient.objects.filter(
                    suggested_hospitals=hospital,
                    date_registered=timezone.now().date()
                ).count()

                if patients_today < hospital.anc_service.capacity_per_day:
                    suggested.append(hospital)

        # 2. If none available, get from county
        if not suggested:
            county_hospitals = Hospital.objects.filter(county=self.county).exclude(ward=self.ward)
            for hospital in county_hospitals:
                if hasattr(hospital, "anc_service") and hospital.anc_service.capacity_per_day:
                    patients_today = Patient.objects.filter(
                        suggested_hospitals=hospital,
                        date_registered=timezone.now().date()
                    ).count()

                    if patients_today < hospital.anc_service.capacity_per_day:
                        suggested.append(hospital)

        # 3. Save suggested hospitals
        self.suggested_hospitals.set(suggested)

        # 4. Set emergency contact to first hospital’s phone
        if suggested:
            self.emergency_contact = suggested[0].phone
            self.save()


class Appointment(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="appointments")
    hospital = models.ForeignKey("hospital.Hospital", on_delete=models.CASCADE, related_name="appointments")
    appointment_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    STATUS_CHOICES = (
        ("scheduled", "Scheduled"),
        ("completed", "Completed"),
        ("missed", "Missed"),
        ("cancelled", "Cancelled"),
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="scheduled")

    def __str__(self):
        return f"{self.patient.name} - {self.hospital.name} on {self.appointment_date}"
=======
from django.db import models
from django.utils import timezone
from django.conf import settings
from math import floor
from apps.hospital.models import Hospital


class Patient(models.Model):
    """
    Represents a patient (mother) receiving ANC services.
    """
    id_number = models.CharField(primary_key=True, max_length=20)
    name = models.CharField(max_length=255, default="")
    phone = models.CharField(max_length=20, unique=True, default="")
    date_registered = models.DateField(default=timezone.now)
    weeks_pregnant = models.PositiveIntegerField(default=0, help_text="Number of weeks pregnant")
    ward = models.CharField(max_length=100, default="")
    county = models.CharField(max_length=100, default="")
    preferred_hospitals = models.ManyToManyField("hospital.Hospital", related_name="preferred_patients", blank=True)
    suggested_hospitals = models.ManyToManyField("hospital.Hospital", related_name="suggested_patients", blank=True)

    emergency_contact = models.CharField(max_length=20, blank=True, help_text="Hospital phone number")

    current_week = models.PositiveIntegerField(default=0, help_text="Auto-calculated pregnancy week")
    status = models.CharField(max_length=20, default="good", help_text="Pregnancy visit status")

    def __str__(self):
        return f"{self.name} ({self.phone})"

    def update_pregnancy_status(self):
        """Update current_week and status based on registration date + weeks_pregnant."""
        days_diff = (timezone.now().date() - self.date_registered).days
        self.current_week = self.weeks_pregnant + floor(days_diff / 7)

        visit_weeks = {12, 20, 26, 30, 34, 36, 38, 40}
        self.status = "should visit" if self.current_week in visit_weeks else "good"

    def save(self, *args, **kwargs):
        """Ensure current_week and status are updated before saving."""
        self.update_pregnancy_status()
        super().save(*args, **kwargs)

    def assign_suggested_hospitals(self):
        """
        Auto-assign hospitals based on ward capacity.
        - Prefer hospitals in the same ward.
        - If all are full, suggest from same county.
        - Update emergency contact with the first suggested hospital phone.
        """
        from apps.hospital.models import Hospital  # avoid circular import

        ward_hospitals = Hospital.objects.filter(ward=self.ward)
        suggested = []

        for hospital in ward_hospitals:
            if getattr(hospital, "anc_service", None) and hospital.anc_service.capacity_per_day:
                patients_today = Patient.objects.filter(
                    suggested_hospitals=hospital,
                    date_registered=timezone.now().date()
                ).count()

                if patients_today < hospital.anc_service.capacity_per_day:
                    suggested.append(hospital)

        if not suggested:
            county_hospitals = Hospital.objects.filter(county=self.county).exclude(ward=self.ward)
            for hospital in county_hospitals:
                if hasattr(hospital, "anc_service") and hospital.anc_service.capacity_per_day:
                    patients_today = Patient.objects.filter(
                        suggested_hospitals=hospital,
                        date_registered=timezone.now().date()
                    ).count()

                    if patients_today < hospital.anc_service.capacity_per_day:
                        suggested.append(hospital)

        self.suggested_hospitals.set(suggested)

        if suggested:
            self.emergency_contact = suggested[0].phone
            self.save()


class Appointment(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="appointments")
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name="appointments")
    appointment_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    STATUS_CHOICES = (
        ("scheduled", "Scheduled"),
        ("completed", "Completed"),
        ("missed", "Missed"),
        ("cancelled", "Cancelled"),
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="scheduled")

    def __str__(self):
        return f"{self.patient.name} - {self.hospital.name} on {self.appointment_date}"
>>>>>>> a431eaf5362c7ecdf79f69d1697c7c217f272a23
=======
from django.db import models
from django.utils import timezone
from django.conf import settings
from math import floor
from apps.hospital.models import Hospital


class Patient(models.Model):
    """
    Represents a patient (mother) receiving ANC services.
    """
    id_number = models.CharField(primary_key=True, max_length=20)
    telegram_id = models.CharField(max_length=50, unique=True, null=True, blank=True)
    name = models.CharField(max_length=255, default="")
    phone = models.CharField(max_length=20, unique=True, default="")
    date_registered = models.DateField(default=timezone.now)
    weeks_pregnant = models.PositiveIntegerField(default=0, help_text="Number of weeks pregnant")
    ward = models.CharField(max_length=100, default="")
    county = models.CharField(max_length=100, default="")
    preferred_hospitals = models.ManyToManyField("hospital.Hospital", related_name="preferred_patients", blank=True)
    suggested_hospitals = models.ManyToManyField("hospital.Hospital", related_name="suggested_patients", blank=True)

    emergency_contact = models.CharField(max_length=20, blank=True, help_text="Hospital phone number")

    current_week = models.PositiveIntegerField(default=0, help_text="Auto-calculated pregnancy week", null=True)
    status = models.CharField(max_length=20, default="good", help_text="Pregnancy visit status", null=True)

    def __str__(self):
        return f"{self.name} ({self.phone})"

    def update_pregnancy_status(self):
        """Update current_week and status based on registration date + weeks_pregnant."""
        days_diff = (timezone.now().date() - self.date_registered).days
        self.current_week = self.weeks_pregnant + floor(days_diff / 7)

        visit_weeks = {12, 20, 26, 30, 34, 36, 38, 40}
        self.status = "Should Visit" if self.current_week in visit_weeks else "Good"

    def save(self, *args, **kwargs):
        """Ensure current_week and status are updated before saving."""
        self.update_pregnancy_status()
        super().save(*args, **kwargs)

    def assign_suggested_hospitals(self):
        """
        Auto-assign hospitals based on ward capacity.
        - Prefer hospitals in the same ward.
        - If all are full, suggest from same county.
        - Update emergency contact with the first suggested hospital phone.
        """
        from apps.hospital.models import Hospital  # avoid circular import

        ward_hospitals = Hospital.objects.filter(ward=self.ward)
        suggested = []

        for hospital in ward_hospitals:
            if getattr(hospital, "anc_service", None) and hospital.anc_service.capacity_per_day:
                patients_today = Patient.objects.filter(
                    suggested_hospitals=hospital,
                    date_registered=timezone.now().date()
                ).count()

                if patients_today < hospital.anc_service.capacity_per_day:
                    suggested.append(hospital)

        if not suggested:
            county_hospitals = Hospital.objects.filter(county=self.county).exclude(ward=self.ward)
            for hospital in county_hospitals:
                if hasattr(hospital, "anc_service") and hospital.anc_service.capacity_per_day:
                    patients_today = Patient.objects.filter(
                        suggested_hospitals=hospital,
                        date_registered=timezone.now().date()
                    ).count()

                    if patients_today < hospital.anc_service.capacity_per_day:
                        suggested.append(hospital)

        self.suggested_hospitals.set(suggested)

        if suggested:
            self.emergency_contact = suggested[0].phone
            self.save()


class Appointment(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="appointments")
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name="appointments")
    appointment_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    STATUS_CHOICES = (
        ("scheduled", "Scheduled"),
        ("completed", "Completed"),
        ("missed", "Missed"),
        ("cancelled", "Cancelled"),
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="scheduled")

    def __str__(self):
        return f"{self.patient.name} - {self.hospital.name} on {self.appointment_date}"
>>>>>>> 0562f4a4295743da9a30bf063823e2fb39d3339e
