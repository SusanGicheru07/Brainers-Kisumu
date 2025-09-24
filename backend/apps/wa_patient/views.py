from rest_framework import generics, viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.utils.timezone import now
from datetime import timedelta
from django.db.models import Count

from apps.hospital.models import Hospital, ANCService
from .models import Patient, Appointment
from .serializers import PatientSerializer, AppointmentSerializer

class PatientViewSet(viewsets.ModelViewSet):
    """
    API endpoint for patients (CRUD).
    """
    queryset = Patient.objects.all().select_related("preferred_hospital").prefetch_related("suggested_hospitals")
    serializer_class = PatientSerializer

    def perform_create(self, serializer):
        """
        Override to auto-suggest hospitals when a patient is created
        (either via website or WhatsApp/n8n).
        If suggested_hospitals_ids are passed manually, override the automatic logic.
        """
        # Save first so we get patient object
        patient = serializer.save()

        # If manual suggested_hospitals_ids are passed -> don't auto assign
        request_data = self.request.data
        if "suggested_hospitals_ids" in request_data and request_data["suggested_hospitals_ids"]:
            patient.suggestion_source = "manual"
            patient.save()
            return

        ward = patient.ward
        county = None

        # Step 1: Find hospitals in same ward
        ward_hospitals = Hospital.objects.filter(ward=ward)

        # Step 2: Filter hospitals by available ANC capacity
        available_hospitals = []
        for hospital in ward_hospitals:
            service = ANCService.objects.filter(hospital=hospital).first()
            if service and service.current_capacity < service.daily_capacity:
                available_hospitals.append(hospital)

        # Step 3: If no available in ward, fallback to other wards in county
        if not available_hospitals:
            # Get county from first hospital in ward
            if ward_hospitals.exists():
                county = ward_hospitals.first().county

            if county:
                county_hospitals = Hospital.objects.filter(county=county).exclude(ward=ward)
                for hospital in county_hospitals:
                    service = ANCService.objects.filter(hospital=hospital).first()
                    if service and service.current_capacity < service.daily_capacity:
                        available_hospitals.append(hospital)

        # Step 4: Assign suggested hospitals
        if available_hospitals:
            patient.suggested_hospitals.set(available_hospitals)
        else:
            patient.suggested_hospitals.clear()

        patient.save()


from rest_framework import viewsets
from rest_framework.exceptions import NotFound
from .models import Appointment, Patient
from .serializers import AppointmentSerializer


class AppointmentViewSet(viewsets.ModelViewSet):
    """
    API endpoint for appointments (CRUD).
    Supports nested routes under patients.
    Example:
      - /appointments/ -> all appointments
      - /patients/{patient_id}/appointments/ -> appointments for a given patient
    """
    serializer_class = AppointmentSerializer

    def get_queryset(self):
        """
        If `patient_pk` is provided in the URL, filter appointments by patient.
        Otherwise, return all appointments.
        """
        queryset = Appointment.objects.select_related("patient", "hospital")
        patient_pk = self.kwargs.get("patient_pk")

        if patient_pk:
            try:
                patient = Patient.objects.get(pk=patient_pk)
            except Patient.DoesNotExist:
                raise NotFound("Patient not found.")
            queryset = queryset.filter(patient=patient)

        return queryset

    def perform_create(self, serializer):
        """
        If creating under a nested patient route, automatically assign the patient.
        """
        patient_pk = self.kwargs.get("patient_pk")
        if patient_pk:
            try:
                patient = Patient.objects.get(pk=patient_pk)
            except Patient.DoesNotExist:
                raise NotFound("Patient not found.")
            serializer.save(patient=patient)
        else:
            serializer.save()


@api_view(["GET"])
def weekly_patient_visits(request):
    """
    Return the number of patients who have appointments scheduled this week.
    """
    today = now().date()
    start_week = today - timedelta(days=today.weekday())  # Monday
    end_week = start_week + timedelta(days=6)  # Sunday

    appointments = Appointment.objects.filter(
        appointment_date__range=(start_week, end_week),
        status="scheduled"
    )

    data = {
        "start_week": start_week,
        "end_week": end_week,
        "total_appointments": appointments.count(),
        "by_hospital": appointments.values("hospital__name").annotate(count=Count("id")),
    }
    return Response(data)
