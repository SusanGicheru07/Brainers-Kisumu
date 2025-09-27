from rest_framework import generics, viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils.timezone import now
from datetime import timedelta
from django.db.models import Count
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework import viewsets
from rest_framework.exceptions import NotFound
from .models import Appointment, Patient
from .serializers import AppointmentSerializer



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
                health_worker = self.request.user.health_worker_profile
                health_worker_hospitals = health_worker.hospitals.all()
                if health_worker_hospitals.exists():
                    user_hospitals = list(health_worker_hospitals)
            except AttributeError:
                print(f"User {self.request.user} has no health_worker_profile")
                pass
        
        # Return empty queryset if no hospital association found - NO sample data fallbacks
        if not user_hospitals:
            print(f"No hospitals found for user {self.request.user} - returning empty queryset")
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
        print(f"=== Patient Creation Debug ===")
        print(f"User: {self.request.user}")
        print(f"User authenticated: {self.request.user.is_authenticated}")
        print(f"User type: {getattr(self.request.user, 'user_type', 'No user_type')}")
        
        # Get user's hospital - strict validation, no fallbacks
        user_hospital = None
        
        # Check if user has a direct hospital relationship
        if hasattr(self.request.user, 'hospital') and self.request.user.hospital:
            user_hospital = self.request.user.hospital
            print(f"Found direct hospital relationship: {user_hospital}")
        else:
            # Check if user is a health worker with hospital assignments
            try:
                health_worker = self.request.user.health_worker_profile
                health_worker_hospitals = health_worker.hospitals.all()
                if health_worker_hospitals.exists():
                    # Use the first hospital if multiple, but ensure it exists
                    user_hospital = health_worker_hospitals.first()
                    print(f"Found health worker hospital: {user_hospital}")
                else:
                    print("Health worker has no hospital assignments")
            except AttributeError:
                print("User has no health_worker_profile")
                pass
        
        if not user_hospital:
            print("ERROR: No hospital found for user - patient creation will fail")
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("User not associated with any hospital. Please contact administrator.")
        
        # Save first so we get patient object
        patient = serializer.save()
        print(f"Patient created: {patient}")

        # Add user's hospital as preferred hospital
        if user_hospital:
            patient.preferred_hospitals.add(user_hospital)
            print(f"Added {user_hospital} as preferred hospital for patient {patient}")

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
                health_worker = self.request.user.health_worker_profile
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
                health_worker = self.request.user.health_worker_profile
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
    Return comprehensive weekly patient visit data for the authenticated user's hospital.
    Provides structured data for frontend dashboard visualization.
    """
    # Debug: Log authentication details
    print(f"=== Weekly Patient Visits Debug ===")
    print(f"User authenticated: {request.user.is_authenticated}")
    print(f"User: {request.user}")
    print(f"User ID: {request.user.id if hasattr(request.user, 'id') else 'No ID'}")
    print(f"Username: {request.user.username if hasattr(request.user, 'username') else 'No username'}")
    
    # Get user's hospital - strict validation, no fallbacks
    user_hospital = None
    hospital_source = "unknown"
    
    # Check if user has a direct hospital relationship (for hospital accounts)
    if hasattr(request.user, 'hospital') and request.user.hospital:
        user_hospital = request.user.hospital
        hospital_source = "direct_hospital_relationship"
    else:
        # Check if user is a health worker with hospital assignments
        try:
            health_worker = request.user.health_worker_profile
            health_worker_hospitals = health_worker.hospitals.all()
            if health_worker_hospitals.exists():
                # Use the first hospital - in production, you might want to add hospital selection logic
                user_hospital = health_worker_hospitals.first()
                hospital_source = "healthworker_assignment"
            else:
                print("Health worker has no hospital assignments")
        except AttributeError:
            print("User has no health_worker_profile")
            pass
    
    print(f"Hospital source: {hospital_source}")
    print(f"User hospital: {user_hospital}")
    
    if not user_hospital:
        return Response({
            'error': 'User not associated with any hospital',
            'user_id': request.user.id,
            'username': request.user.username,
            'user_type': getattr(request.user, 'user_type', 'unknown'),
            'suggestion': 'Please ensure your user account is properly associated with a hospital or assigned as a health worker to hospitals',
            'debug_info': f'Hospital source attempted: {hospital_source}'
        }, status=403)
    
    today = now().date()
    start_week = today - timedelta(days=today.weekday())  # Monday
    end_week = start_week + timedelta(days=6)  # Sunday

    # Get all appointments for this week
    weekly_appointments = Appointment.objects.filter(
        hospital=user_hospital,
        appointment_date__range=(start_week, end_week)
    ).select_related('patient')

    # Group appointments by status
    appointments_by_status = {
        'scheduled': weekly_appointments.filter(status='scheduled').count(),
        'completed': weekly_appointments.filter(status='completed').count(),
        'missed': weekly_appointments.filter(status='missed').count(),
        'cancelled': weekly_appointments.filter(status='cancelled').count(),
    }

    # Group appointments by day with day names
    daily_appointments = []
    for i in range(7):
        day_date = start_week + timedelta(days=i)
        day_appointments = weekly_appointments.filter(appointment_date=day_date)
        daily_appointments.append({
            'date': day_date,
            'day_name': day_date.strftime('%A'),  # Monday, Tuesday, etc.
            'total_appointments': day_appointments.count(),
            'scheduled': day_appointments.filter(status='scheduled').count(),
            'completed': day_appointments.filter(status='completed').count(),
            'missed': day_appointments.filter(status='missed').count(),
            'cancelled': day_appointments.filter(status='cancelled').count(),
        })

    # Get patient visit status summary
    patients_this_week = Patient.objects.filter(
        appointments__hospital=user_hospital,
        appointments__appointment_date__range=(start_week, end_week)
    ).distinct()

    patients_by_status = {
        'should_visit': patients_this_week.filter(status='should visit').count(),
        'good': patients_this_week.filter(status='good').count(),
        'total_patients': patients_this_week.count(),
    }

    # Calculate capacity utilization
    anc_service = ANCService.objects.filter(hospital=user_hospital).first()
    capacity_info = {
        'daily_capacity': anc_service.daily_capacity if anc_service else 0,
        'current_capacity': anc_service.current_capacity if anc_service else 0,
        'utilization_percentage': round(
            (anc_service.current_capacity / anc_service.daily_capacity * 100) 
            if anc_service and anc_service.daily_capacity > 0 else 0, 1
        ),
        'available_slots': (anc_service.daily_capacity - anc_service.current_capacity) 
                          if anc_service else 0,
    }

    # ANC Information and Guidelines
    anc_info = {
        'title': 'Antenatal Care (ANC) Guidelines',
        'description': 'Essential healthcare service for pregnant women to ensure healthy pregnancy and safe delivery.',
        'recommended_visits': [
            {'week': 12, 'description': 'First visit - Initial assessment, health history, and basic tests'},
            {'week': 20, 'description': 'Second visit - Ultrasound scan and growth monitoring'},
            {'week': 26, 'description': 'Third visit - Blood pressure and weight monitoring'},
            {'week': 30, 'description': 'Fourth visit - Position assessment and health check'},
            {'week': 34, 'description': 'Fifth visit - Pre-delivery preparation and counseling'},
            {'week': 36, 'description': 'Sixth visit - Final preparations and birth planning'},
            {'week': 38, 'description': 'Seventh visit - Ready for delivery assessment'},
            {'week': 40, 'description': 'Final visit - Delivery readiness and emergency planning'},
        ],
        'key_services': [
            'Health education and counseling',
            'Nutritional guidance and supplements',
            'Prevention and treatment of infections',
            'Early detection of complications',
            'Birth planning and emergency preparedness',
            'Immunization (Tetanus Toxoid)',
            'Iron and folic acid supplementation',
            'HIV/AIDS counseling and testing'
        ],
        'warning_signs': [
            'Severe headaches',
            'Blurred vision',
            'Severe abdominal pain',
            'Vaginal bleeding',
            'Reduced fetal movements',
            'Persistent vomiting',
            'High fever',
            'Severe swelling of face/hands'
        ]
    }

    data = {
        'hospital_info': {
            'name': user_hospital.name,
            'ward': user_hospital.ward,
            'county': user_hospital.county,
        },
        'week_period': {
            'start_date': start_week,
            'end_date': end_week,
            'week_number': start_week.isocalendar()[1],  # ISO week number
            'year': start_week.year,
        },
        'appointments_summary': {
            'total_appointments': weekly_appointments.count(),
            'by_status': appointments_by_status,
            'by_day': daily_appointments,
        },
        'patients_summary': patients_by_status,
        'capacity_info': capacity_info,
        'anc_information': anc_info,
        'dashboard_metrics': {
            'completion_rate': round(
                (appointments_by_status['completed'] / weekly_appointments.count() * 100)
                if weekly_appointments.count() > 0 else 0, 1
            ),
            'no_show_rate': round(
                (appointments_by_status['missed'] / weekly_appointments.count() * 100)
                if weekly_appointments.count() > 0 else 0, 1
            ),
            'cancellation_rate': round(
                (appointments_by_status['cancelled'] / weekly_appointments.count() * 100)
                if weekly_appointments.count() > 0 else 0, 1
            ),
        }
    }
    
    return Response(data)
