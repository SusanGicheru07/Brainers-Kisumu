from django.contrib import admin
from .models import Patient, Appointment


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ("name", "phone", "date_registered", "ward", "county", "emergency_contact")
    search_fields = ("name", "phone", "ward")
    list_filter = ("ward", "preferred_hospitals")
    filter_horizontal = ("preferred_hospitals", "suggested_hospitals")


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ("patient", "hospital", "appointment_date", "status", "created_at")
    list_filter = ("status", "hospital", "appointment_date")
    search_fields = ("patient__full_name", "hospital__name")
