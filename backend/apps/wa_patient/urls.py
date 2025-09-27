from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import PatientViewSet, AppointmentViewSet, weekly_patient_visits

# Create a router for patient + appointment endpoints
router = DefaultRouter()
router.register(r'patients', PatientViewSet, basename='patients')
router.register(r'appointments', AppointmentViewSet, basename='appointments')

urlpatterns = [
    # All patients + appointments will be under /api/
    path("api/", include(router.urls)),
    # Weekly patient visits stats
    path("api/weekly-patient-visits/", weekly_patient_visits, name="weekly-patient-visits"),
]
