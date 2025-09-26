from rest_framework import generics, viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils.timezone import now
from datetime import timedelta
from django.db.models import Count
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from apps.hospital.models import Hospital, ANCService
from .models import Patient, Appointment
from .serializers import PatientSerializer, AppointmentSerializer

@method_decorator(csrf_exempt, name='dispatch')
class PatientViewSet(viewsets.ModelViewSet):
    """
    API endpoint for patients (CRUD).
    Filters patients based on the authenticated user's hospital.
    """
    serializer_class = PatientSerializer

    def get_queryset(self):
        """
        Filter patients based on the hospital the authenticated user works at.
        Returns patients who have the user's hospital as preferred or suggested.
        Only returns actual data for properly authenticated users with hospital associations.
        """
        if not self.request.user.is_authenticated:
            return Patient.objects.none()
        
        # Get user's hospital(s) - no fallbacks, strict validation
        user_hospitals = []
        
        # Check if user has a direct hospital relationship
        if hasattr(self.request.user, 'hospital') and self.request.user.hospital:
            user_hospitals = [self.request.user.hospital]
        else:
            # Check if user is a health worker with hospital assignments
            try:
                health_worker = self.request.user.healthworker
                health_worker_hospitals = health_worker.hospitals.all()
                if health_worker_hospitals.exists():
                    user_hospitals = list(health_worker_hospitals)
            except AttributeError:
                pass
        
        # Return empty queryset if no hospital association found - NO sample data fallbacks
        if not user_hospitals:
            return Patient.objects.none()
        
        # Return patients associated with user's hospital(s) (suggested or preferred)
        from django.db.models import Q
        return Patient.objects.filter(
            Q(suggested_hospitals__in=user_hospitals) | 
            Q(preferred_hospitals__in=user_hospitals)
        ).distinct().prefetch_related("preferred_hospitals", "suggested_hospitals")

    def destroy(self, request, *args, **kwargs):
        """
        Override destroy method to handle patient deletion properly.
        """
        try:
            instance = self.get_object()
            patient_name = instance.name
            patient_id = instance.id
            
            # Check if patient has any related appointments
            appointments_count = instance.appointments.count()
            
            # Perform the deletion (CASCADE will handle related appointments)
            self.perform_destroy(instance)
            
            print(f"Successfully deleted patient: {patient_name} (ID: {patient_id}) with {appointments_count} appointments")
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        except Exception as e:
            error_message = str(e)
            print(f"Error deleting patient: {error_message}")
            return Response(
                {"error": f"Failed to delete patient: {error_message}"},
                status=status.HTTP_400_BAD_REQUEST
            )

    def perform_create(self, serializer):
        """
        Override to auto-suggest hospitals when a patient is created.
        Automatically adds the creating user's hospital as a preferred hospital.
        """
        # Get user's hospital - strict validation, no fallbacks
        user_hospital = None
        
        # Check if user has a direct hospital relationship
        if hasattr(self.request.user, 'hospital') and self.request.user.hospital:
            user_hospital = self.request.user.hospital
        else:
            # Check if user is a health worker with hospital assignments
            try:
                health_worker = self.request.user.healthworker
                health_worker_hospitals = health_worker.hospitals.all()
                if health_worker_hospitals.exists():
                    # Use the first hospital if multiple, but ensure it exists
                    user_hospital = health_worker_hospitals.first()
            except AttributeError:
                pass
        
        # Save first so we get patient object
        patient = serializer.save()

        # Add user's hospital as preferred hospital
        if user_hospital:
            patient.preferred_hospitals.add(user_hospital)

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


@method_decorator(csrf_exempt, name='dispatch')
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
        Filter appointments based on the authenticated user's hospital.
        If `patient_pk` is provided in the URL, filter appointments by patient.
        Only returns actual data for properly authenticated users with hospital associations.
        """
        if not self.request.user.is_authenticated:
            return Appointment.objects.none()
        
        # Get user's hospital(s) - strict validation, no fallbacks
        user_hospitals = []
        
        # Check if user has a direct hospital relationship
        if hasattr(self.request.user, 'hospital') and self.request.user.hospital:
            user_hospitals = [self.request.user.hospital]
        else:
            # Check if user is a health worker with hospital assignments
            try:
                health_worker = self.request.user.healthworker
                health_worker_hospitals = health_worker.hospitals.all()
                if health_worker_hospitals.exists():
                    user_hospitals = list(health_worker_hospitals)
            except AttributeError:
                pass
        
        # Return empty queryset if no hospital association found - NO sample data fallbacks
        if not user_hospitals:
            return Appointment.objects.none()
        
        # Filter appointments for user's hospital(s)
        queryset = Appointment.objects.filter(hospital__in=user_hospitals).select_related("patient", "hospital")
        
        # Additional filtering by patient if patient_pk is provided
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
        If no hospital is specified, automatically assign the user's hospital.
        """
        # Get user's hospital - strict validation, no fallbacks  
        user_hospital = None
        
        # Check if user has a direct hospital relationship
        if hasattr(self.request.user, 'hospital') and self.request.user.hospital:
            user_hospital = self.request.user.hospital
        else:
            # Check if user is a health worker with hospital assignments
            try:
                health_worker = self.request.user.healthworker
                health_worker_hospitals = health_worker.hospitals.all()
                if health_worker_hospitals.exists():
                    # Use the first hospital if multiple, but ensure it exists
                    user_hospital = health_worker_hospitals.first()
            except AttributeError:
                pass
        
        # Prepare save arguments
        save_kwargs = {}
        
        # Handle nested patient route
        patient_pk = self.kwargs.get("patient_pk")
        if patient_pk:
            try:
                patient = Patient.objects.get(pk=patient_pk)
                save_kwargs['patient'] = patient
            except Patient.DoesNotExist:
                raise NotFound("Patient not found.")
        
        # If no hospital specified in data, use user's hospital
        if 'hospital' not in serializer.validated_data and user_hospital:
            save_kwargs['hospital'] = user_hospital
        
        serializer.save(**save_kwargs)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def weekly_patient_visits(request):
    """
    Return the number of patients who have appointments scheduled this week 
    for the authenticated user's hospital.
    """
    # Get user's hospital - strict validation, no fallbacks
    user_hospital = None
    
    # Check if user has a direct hospital relationship
    if hasattr(request.user, 'hospital') and request.user.hospital:
        user_hospital = request.user.hospital
    else:
        # Check if user is a health worker with hospital assignments
        try:
            health_worker = request.user.healthworker
            health_worker_hospitals = health_worker.hospitals.all()
            if health_worker_hospitals.exists():
                # Use the first hospital if multiple, but ensure it exists
                user_hospital = health_worker_hospitals.first()
        except AttributeError:
            pass
    
    if not user_hospital:
        return Response({
            'error': 'User not associated with any hospital',
            'user_id': request.user.id,
            'username': request.user.username,
            'suggestion': 'Please ensure your user account is properly associated with a hospital or assigned as a health worker to hospitals'
        }, status=403)
    
    today = now().date()
    start_week = today - timedelta(days=today.weekday())  # Monday
    end_week = start_week + timedelta(days=6)  # Sunday

    # Filter appointments by user's hospital
    appointments = Appointment.objects.filter(
        hospital=user_hospital,
        appointment_date__range=(start_week, end_week),
        status="scheduled"
    )

    data = {
        "hospital_name": user_hospital.name,
        "start_week": start_week,
        "end_week": end_week,
        "total_appointments": appointments.count(),
        "appointments_by_day": appointments.extra(
            select={'day': 'date(appointment_date)'}
        ).values('day').annotate(count=Count('id')).order_by('day'),
    }
    return Response(data)
