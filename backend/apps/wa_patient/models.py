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
    preferred_hospitals = models.ManyToManyField("Hospital", related_name="preferred_patients", blank=True)
    suggested_hospitals = models.ManyToManyField("Hospital", related_name="suggested_patients", blank=True)
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
