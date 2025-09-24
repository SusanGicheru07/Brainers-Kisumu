from rest_framework import serializers
from .models import Patient, Appointment
from apps.hospital.models import Hospital


class HospitalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hospital
        fields = ["id", "name", "county", "ward", "phone"]  # phone acts as emergency contact


# Minimal patient serializer for nesting inside Appointment
class PatientMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = ["id", "name", "phone"]


class PatientSerializer(serializers.ModelSerializer):
    preferred_hospitals = HospitalSerializer(read_only=True, many=True)
    preferred_hospitals_ids = serializers.PrimaryKeyRelatedField(
        queryset=Hospital.objects.all(),
        source="preferred_hospitals",
        many=True,
        write_only=True,
        required=False
    )
    suggested_hospitals = HospitalSerializer(read_only=True, many=True)
    suggested_hospitals_ids = serializers.PrimaryKeyRelatedField(
        queryset=Hospital.objects.all(),
        source="suggested_hospitals",
        many=True,
        write_only=True,
        required=False
    )
    emergency_contact = serializers.ReadOnlyField()
    suggestion_source = serializers.CharField(read_only=True)

    class Meta:
        model = Patient
        fields = [
            "id", "name", "phone", "date_registered", "weeks_pregnant",
            "ward", "county",
            "preferred_hospitals", "preferred_hospitals_ids",
            "suggested_hospitals", "suggested_hospitals_ids",
            "emergency_contact", "suggestion_source"
        ]


class AppointmentSerializer(serializers.ModelSerializer):
    # Nested hospital info
    hospital = HospitalSerializer(read_only=True)
    hospital_id = serializers.PrimaryKeyRelatedField(
        queryset=Hospital.objects.all(),
        source="hospital",
        write_only=True
    )

    # Nested patient info (read-only, lightweight)
    patient = PatientMinimalSerializer(read_only=True)
    patient_id = serializers.PrimaryKeyRelatedField(
        queryset=Patient.objects.all(),
        source="patient",
        write_only=True,
        required=False  # not required for nested route
    )

    class Meta:
        model = Appointment
        fields = [
            "id", "patient", "patient_id",
            "hospital", "hospital_id",
            "appointment_date", "status", "created_at"
        ]
        read_only_fields = ["created_at"]
