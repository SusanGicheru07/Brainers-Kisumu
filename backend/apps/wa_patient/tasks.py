from celery import shared_task
from apps.wa_patient.models import Patient

@shared_task
def update_patients():
    """
    Update pregnancy current_week and status for all patients daily.
    """
    patients = Patient.objects.all()
    for patient in patients:
        patient.update_pregnancy_status()
        patient.save(update_fields=["current_week", "status"])
    return f"Updated {patients.count()} patients"
