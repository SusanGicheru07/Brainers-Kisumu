from django.shortcuts import render, get_object_or_404
from django.core.paginator import Paginator
from django.views.generic import CreateView, TemplateView
from django.urls import reverse_lazy
from django.contrib.auth.views import LoginView, LogoutView
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from django.core.mail import send_mail
from django.db.models import Sum, F, Q
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views import View
import json
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated

from .models import *
from .forms import CustomUserCreationForm, HospitalSignUpForm, StaffRequestAccessForm


@method_decorator(csrf_exempt, name='dispatch')
class SignUpView(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            print(f"Received data: {data}")  # Debug log
            
            # Map frontend fields to Django form fields
            form_data = {
                'username': data.get('email', ''),  # Use email as username
                'email': data.get('email', ''),
                'password1': data.get('password', ''),
                'password2': data.get('password2', ''),
            }
            
            print(f"Form data: {form_data}")  # Debug log
            
            form = CustomUserCreationForm(form_data)
            
            if form.is_valid():
                user = form.save()
                user.user_type = 'health_worker'
                user.save()
                
                # Create HealthWorker profile with additional fields
                from .models import HealthWorker, Hospital
                
                # Find hospital by name (you may need to adjust this logic)
                hospital_name = data.get('hospital', '')
                hospital = None
                if hospital_name:
                    # Try to find hospital by name or create a placeholder
                    hospital, created = Hospital.objects.get_or_create(
                        name=hospital_name,
                        defaults={
                            'county': 'Unknown',
                            'sub_county': 'Unknown', 
                            'ward': 'Unknown',
                            'phone': '000-000-0000',
                            'email': f'{hospital_name.lower().replace(" ", "")}@hospital.com'
                        }
                    )
                
                health_worker = HealthWorker.objects.create(
                    user=user,
                    name=data.get('name', ''),
                    email=data.get('email', ''),
                    role=data.get('role', ''),
                    phone=data.get('phone', '000-000-0000'),  # Provide default
                    available_days=data.get('available_days', 'Monday-Friday'),  # Provide default
                    shift_hours=data.get('shift_hours', '8:00 AM - 5:00 PM'),  # Provide default
                    is_approved=True  # Auto-approve for now
                )
                
                # Add hospital to many-to-many relationship
                if hospital:
                    health_worker.hospitals.add(hospital)
                
                return JsonResponse({
                    'message': 'User created successfully',
                    'user_id': user.id
                }, status=201)
            else:
                print(f"Form errors: {form.errors}")  # Debug log
                return JsonResponse({
                    'message': 'Validation failed',
                    'errors': form.errors
                }, status=400)
                
        except json.JSONDecodeError as e:
            print(f"JSON decode error: {e}")  # Debug log
            return JsonResponse({'message': 'Invalid JSON data'}, status=400)
        except Exception as e:
            print(f"Exception: {e}")  # Debug log
            return JsonResponse({'message': str(e)}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
@method_decorator(csrf_exempt, name='dispatch')
class HospitalSignUpView(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            print(f"Hospital signup data received: {data}")  # Debug log
            
            # Validate required fields
            required_fields = ['name', 'county', 'sub_county', 'ward', 'phone', 'email']
            missing_fields = []
            
            for field in required_fields:
                if not data.get(field):
                    missing_fields.append(field)
            
            if missing_fields:
                return JsonResponse({
                    'message': f'Missing required fields: {", ".join(missing_fields)}'
                }, status=400)
            
            # Check if hospital with this name already exists
            if Hospital.objects.filter(name=data['name']).exists():
                return JsonResponse({
                    'message': 'A hospital with this name already exists'
                }, status=400)
            
            # Check if hospital with this email already exists
            if Hospital.objects.filter(email=data['email']).exists():
                return JsonResponse({
                    'message': 'A hospital with this email already exists'
                }, status=400)
            
            # Create the hospital
            hospital = Hospital.objects.create(
                name=data['name'],
                county=data['county'],
                sub_county=data['sub_county'],
                ward=data['ward'],
                phone=data['phone'],
                email=data['email'],
                type='public',  # Default type
                address=f"{data['ward']}, {data['sub_county']}, {data['county']}"
            )
            
            return JsonResponse({
                'message': 'Hospital registered successfully',
                'hospital_id': hospital.id,
                'hospital_name': hospital.name
            }, status=201)
                
        except json.JSONDecodeError:
            return JsonResponse({'message': 'Invalid JSON data'}, status=400)
        except Exception as e:
            print(f"Hospital signup exception: {e}")  # Debug log
            return JsonResponse({'message': str(e)}, status=500)


class StaffRequestAccessView(CreateView):
    model = HealthWorker
    form_class = StaffRequestAccessForm
    template_name = "registration/staff_request_access.html"
    success_url = reverse_lazy("access_pending")

    def form_valid(self, form):
        health_worker = form.save(commit=False)
        health_worker.user = None
        health_worker.is_approved = False
        health_worker.save()
        form.save_m2m()

        # Notify hospital
        recipient_list = [h.email for h in health_worker.hospitals.all() if h.email]
        if not recipient_list:
            recipient_list = ["susangicheru07@gmail.com"]

        send_mail(
            subject="New Health Worker Access Request",
            message=(
                f"{health_worker.name} ({health_worker.email}, role: {health_worker.role}) "
                f"has requested access to your hospital account(s): "
                f"{', '.join([h.name for h in health_worker.hospitals.all()])}."
            ),
            from_email="noreply@system.com",
            recipient_list=recipient_list,
        )
        return super().form_valid(form)


class AccessPendingView(TemplateView):
    template_name = "registration/access_pending.html"


@method_decorator(csrf_exempt, name='dispatch')
class CustomLoginView(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            print(f"Login data received: {data}")  # Debug log
            
            from django.contrib.auth import authenticate, login
            
            # Get credentials - accept both 'email' and 'username' fields
            email = data.get('email', '') or data.get('username', '')
            password = data.get('password', '')
            
            if not email or not password:
                return JsonResponse({
                    'message': 'Email/username and password are required'
                }, status=400)
            
            # Authenticate user (using email as username)
            user = authenticate(request, username=email, password=password)
            
            if user is not None:
                # Check if user is approved (for health workers)
                if hasattr(user, "health_worker_profile"):
                    hw = user.health_worker_profile
                    if not hw.is_approved:
                        return JsonResponse({
                            'message': 'Your account is pending hospital approval.'
                        }, status=403)
                
                # Log the user in
                login(request, user)
                
                # Prepare user data for frontend
                user_data = {
                    'id': user.id,
                    'email': user.email,
                    'user_type': user.user_type,
                    'name': getattr(user, 'name', user.email.split('@')[0]),
                }
                
                # Add health worker specific data if applicable
                if hasattr(user, "health_worker_profile"):
                    hw = user.health_worker_profile
                    hospitals_data = [{
                        'id': h.id,
                        'name': h.name,
                        'county': h.county,
                        'ward': h.ward,
                        'type': h.type
                    } for h in hw.hospitals.all()]
                    
                    user_data.update({
                        'role': hw.role,
                        'hospitals': hospitals_data,
                        'primary_hospital_id': hospitals_data[0]['id'] if hospitals_data else None,
                        'is_approved': hw.is_approved
                    })
                
                return JsonResponse({
                    'message': 'Login successful',
                    'user': user_data,
                    'token': f'session_{user.id}',  # Using session-based auth, provide session indicator
                }, status=200)
            else:
                return JsonResponse({
                    'message': 'Invalid email or password'
                }, status=401)
                
        except json.JSONDecodeError as e:
            print(f"JSON decode error: {e}")  # Debug log
            return JsonResponse({'message': 'Invalid JSON data'}, status=400)
        except Exception as e:
            print(f"Login exception: {e}")  # Debug log
            return JsonResponse({'message': str(e)}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class CustomLogoutView(View):
    def post(self, request):
        try:
            from django.contrib.auth import logout
            logout(request)
            return JsonResponse({
                'message': 'Logout successful'
            }, status=200)
        except Exception as e:
            return JsonResponse({'message': str(e)}, status=500)


@csrf_exempt
def hospital_list(request):
    """
    API endpoint to get list of hospitals.
    Returns JSON data instead of rendering a template.
    """
    hospitals = Hospital.objects.all()
    
    # Serialize hospital data
    hospital_data = []
    for hospital in hospitals:
        hospital_data.append({
            'id': hospital.id,
            'name': hospital.name,
            'county': hospital.county,
            'ward': hospital.ward,
            'phone': hospital.phone,
        })
    
    return JsonResponse(hospital_data, safe=False)


from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods


@csrf_exempt
def hospital_detail(request, hospital_id):
    """
    API endpoint to get single hospital details.
    Returns JSON data instead of rendering a template.
    """
    hospital = get_object_or_404(Hospital, id=hospital_id)
    
    hospital_data = {
        'id': hospital.id,
        'name': hospital.name,
        'county': hospital.county,
        'ward': hospital.ward,
        'phone': hospital.phone,
    }
    
    return JsonResponse(hospital_data)

@api_view(['GET'])
@authentication_classes([SessionAuthentication])
@permission_classes([IsAuthenticated])
def hospital_dashboard_data(request):
    """
    Returns ANC stats for the logged-in user's hospital over time (for charts).
    Filters data based on the hospital the authenticated user works at.
    """
    try:
        # Get the hospital associated with the logged-in user
        hospital = None
        user_hospitals = []
        
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Authentication required. Please log in.'}, status=401)
        
        # Option 1: User is directly associated with a hospital (hospital admin)
        try:
            hospital = Hospital.objects.get(user=request.user)
            user_hospitals = [hospital]
        except Hospital.DoesNotExist:
            # Option 2: User is a health worker associated with hospitals
            try:
                health_worker = request.user.health_worker_profile
                user_hospitals = list(health_worker.hospitals.all())
                if user_hospitals:
                    hospital = user_hospitals[0]  # Use first hospital for dashboard
                else:
                    return JsonResponse({
                        'error': 'Health worker account not assigned to any hospital. Please contact your administrator.',
                        'user_info': {
                            'name': health_worker.name,
                            'role': health_worker.role,
                            'is_approved': health_worker.is_approved
                        }
                    }, status=403)
            except AttributeError:
                return JsonResponse({
                    'error': 'User account is not associated with any hospital. Please contact your administrator.',
                    'user_type': request.user.user_type,
                    'username': request.user.username
                }, status=403)
        
        if not hospital:
            return JsonResponse({
                'error': 'No hospital found for authenticated user. Please contact your administrator.',
                'user_type': request.user.user_type
            }, status=404)

        # Import Patient and Appointment models
        from apps.wa_patient.models import Patient, Appointment
        from datetime import datetime, timedelta
        from django.utils import timezone
        
        # Get current date for filtering
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        # Get patients associated with this hospital (suggested or preferred)
        hospital_patients = Patient.objects.filter(
            Q(suggested_hospitals=hospital) | 
            Q(preferred_hospitals=hospital)
        ).distinct()
        
        # Get appointments for this hospital
        hospital_appointments = Appointment.objects.filter(hospital=hospital)
        
        # Calculate statistics
        stats = {
            'hospital_info': {
                'id': hospital.id,
                'name': hospital.name,
                'county': hospital.county,
                'ward': hospital.ward,
                'phone': hospital.phone,
            },
            'patient_stats': {
                'total_patients': hospital_patients.count(),
                'new_patients_this_week': hospital_patients.filter(
                    date_registered__gte=week_ago
                ).count(),
                'new_patients_this_month': hospital_patients.filter(
                    date_registered__gte=month_ago
                ).count(),
            },
            'appointment_stats': {
                'total_appointments': hospital_appointments.count(),
                'scheduled_appointments': hospital_appointments.filter(status='scheduled').count(),
                'completed_appointments': hospital_appointments.filter(status='completed').count(),
                'cancelled_appointments': hospital_appointments.filter(status='cancelled').count(),
                'missed_appointments': hospital_appointments.filter(status='missed').count(),
                'appointments_this_week': hospital_appointments.filter(
                    appointment_date__gte=week_ago
                ).count(),
                'appointments_this_month': hospital_appointments.filter(
                    appointment_date__gte=month_ago
                ).count(),
            },
            'recent_appointments': [
                {
                    'id': apt.id,
                    'patient_name': apt.patient.name,
                    'patient_phone': apt.patient.phone,
                    'appointment_date': apt.appointment_date.strftime('%Y-%m-%d'),
                    'status': apt.status,
                    'created_at': apt.created_at.strftime('%Y-%m-%d %H:%M')
                }
                for apt in hospital_appointments.select_related('patient').order_by('-created_at')[:10]
            ]
        }
        
        # Add ANC service information if available
        try:
            anc_service = hospital.anc_service
            stats['anc_service'] = {
                'clinic_days': anc_service.clinic_days,
                'operating_hours': anc_service.operating_hours,
                'capacity_per_day': anc_service.capacity_per_day,
                'ultrasound_available': anc_service.ultrasound_available,
                'lab_available': anc_service.lab_available,
                'pharmacy_available': anc_service.pharmacy_available,
                'emergency_services': anc_service.emergency_services,
                'blood_bank': anc_service.blood_bank,
                'insurance_accepted': anc_service.insurance_accepted,
                'avg_wait_time_minutes': anc_service.avg_wait_time_minutes,
            }
        except:
            stats['anc_service'] = None
        
        # Group ANC records by periodname (e.g., year or month) 
        anc_records = (
            ANCRecord.objects.filter(hospital=hospital)
            .values("periodname")
            .annotate(
                new_clients=Sum("new_anc_clients"),
                cervical_cancer=Sum("cervical_cancer"),
                iron_folate=Sum("iron_folate_supplements"),
                iron=Sum("iron_supplements"),
                folic=Sum("folic_supplements"),
                preg_adol=Sum("preg_adol_15_19_first_anc"),
                completed4=Sum("completed_4anc"),
                revisit=Sum("re_visit_anc_clients"),
                ipt3=Sum("ipt_3rd_dose"),
                anc12=Sum("first_anc_before_12_weeks"),
                completed8=Sum("completed_8anc"),
                fgm=Sum("fgm_complications"),
                preg_youth=Sum("preg_youth_20_24"),
                breast_cancer=Sum("breast_cancer_screened"),
                cervical_cancer_screened=Sum("cervical_cancer_screened"),
            )
            .order_by("periodname")
        )
        
        stats['anc_records'] = list(anc_records)

        return JsonResponse(stats, safe=False)
        
    except Exception as e:
        return JsonResponse({'error': f'Failed to fetch dashboard data: {str(e)}'}, status=500)

@api_view(['GET'])
@authentication_classes([SessionAuthentication])
@permission_classes([IsAuthenticated])
def county_dashboard_data(request):
    """
    Compare hospitals within the same county as the user's hospital.
    Returns county-wide statistics and hospital comparisons.
    """
    try:
        # Get the hospital associated with the logged-in user
        hospital = None
        
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Authentication required. Please log in.'}, status=401)
        
        # Option 1: User is directly associated with a hospital (hospital admin)
        try:
            hospital = Hospital.objects.get(user=request.user)
        except Hospital.DoesNotExist:
            # Option 2: User is a health worker associated with hospitals
            try:
                health_worker = request.user.health_worker_profile
                user_hospitals = list(health_worker.hospitals.all())
                if user_hospitals:
                    hospital = user_hospitals[0]  # Use first hospital for county comparison
                else:
                    return JsonResponse({
                        'error': 'Health worker account not assigned to any hospital. Please contact your administrator.',
                        'user_info': {
                            'name': health_worker.name,
                            'role': health_worker.role,
                            'is_approved': health_worker.is_approved
                        }
                    }, status=403)
            except AttributeError:
                return JsonResponse({
                    'error': 'User account is not associated with any hospital. Please contact your administrator.',
                    'user_type': request.user.user_type,
                    'username': request.user.username
                }, status=403)
        
        if not hospital:
            return JsonResponse({
                'error': 'No hospital found for authenticated user. Please contact your administrator.',
                'user_type': request.user.user_type
            }, status=404)

        # Filter data by the user's hospital county - NO FALLBACKS, NO SAMPLE DATA
        user_county = hospital.county
        
        if not user_county:
            return JsonResponse({
                'error': f'Hospital "{hospital.name}" does not have a county specified. Please contact your administrator to update hospital information.',
                'hospital_info': {
                    'name': hospital.name,
                    'id': hospital.id,
                    'ward': hospital.ward
                }
            }, status=422)
        
        # Get all hospitals in the same county
        county_hospitals = Hospital.objects.filter(county=user_county)
        if not county_hospitals.exists():
            return JsonResponse({
                'error': f'No hospitals found in county "{user_county}". Please verify the county information.',
                'user_hospital': hospital.name
            }, status=404)
        
        data = (
            ANCRecord.objects.filter(hospital__county=user_county).values(
                "hospital__name",
                "hospital__county", 
                "hospital__sub_county",
                "hospital__ward"
            )
            .annotate(
                hospital_name=F("hospital__name"),
                county=F("hospital__county"),
                sub_county=F("hospital__sub_county"),
                ward=F("hospital__ward"),
                new_clients=Sum("new_anc_clients"),
                completed4=Sum("completed_4anc"),
                completed8=Sum("completed_8anc"),
                anc12=Sum("first_anc_before_12_weeks"),
                cervical_cancer_screened=Sum("cervical_cancer_screened"),
                breast_cancer=Sum("breast_cancer_screened"),
                iron_folate=Sum("iron_folate_supplements"),
                revisit=Sum("re_visit_anc_clients"),
                ipt3=Sum("ipt_3rd_dose"),
            )
            .order_by("-new_clients")
        )

        # Clean up the data structure for frontend consumption
        result = []
        for item in data:
            result.append({
                'hospital_name': item['hospital_name'],
                'county': item['county'],
                'sub_county': item['sub_county'],
                'ward': item['ward'],
                'new_clients': item['new_clients'] or 0,
                'completed4': item['completed4'] or 0,
                'completed8': item['completed8'] or 0,
                'anc12': item['anc12'] or 0,
                'cervical_cancer_screened': item['cervical_cancer_screened'] or 0,
                'breast_cancer': item['breast_cancer'] or 0,
                'iron_folate': item['iron_folate'] or 0,
                'revisit': item['revisit'] or 0,
                'ipt3': item['ipt3'] or 0,
            })

        # Validate that we have actual data
        if not result:
            return JsonResponse({
                'error': f'No ANC data found for hospitals in county "{user_county}". Data may not be available yet.',
                'county': user_county,
                'hospitals_in_county': [h.name for h in county_hospitals],
                'suggestion': 'Please ensure ANC data has been imported for hospitals in this county.'
            }, status=404)

        # Add metadata about the county
        county_info = {
            'county': user_county,
            'user_hospital': hospital.name,
            'hospitals_count': county_hospitals.count(),
            'data_records': len(result)
        }

        return JsonResponse({
            'county_info': county_info,
            'hospitals_data': result
        }, safe=False)
        
    except Exception as e:
        return JsonResponse({'error': f'Failed to fetch county dashboard data: {str(e)}'}, status=500)


# Simple test view to debug URL routing
@api_view(['GET'])
def test_county_endpoint(request):
    return JsonResponse({'message': 'Test county endpoint working', 'status': 'success'})