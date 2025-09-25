import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")  
django.setup()

from apps.hospital.models import Hospital, ANCRecord, HealthWorker
from django.contrib.auth import get_user_model
from datetime import date

User = get_user_model()

def create_sample_data():
    """Create sample data for testing the dashboard"""
    
    # Create sample hospitals
    hospitals_data = [
        {"name": "Kisumu County Referral Hospital", "county": "Kisumu", "sub_county": "Kisumu Central", "ward": "Central"},
        {"name": "Jaramogi Oginga Odinga Teaching & Referral Hospital", "county": "Kisumu", "sub_county": "Kisumu West", "ward": "West"},
        {"name": "Ahero Sub-County Hospital", "county": "Kisumu", "sub_county": "Nyando", "ward": "Ahero"},
        {"name": "Katito Health Center", "county": "Kisumu", "sub_county": "Nyando", "ward": "Katito"},
    ]
    
    hospitals = []
    for hospital_data in hospitals_data:
        hospital, created = Hospital.objects.get_or_create(**hospital_data)
        hospitals.append(hospital)
        if created:
            print(f"Created hospital: {hospital.name}")
    
    # Create sample users and health workers
    for i, hospital in enumerate(hospitals[:2]):  # Create users for first 2 hospitals
        email = f"admin{i+1}@{hospital.name.lower().replace(' ', '').replace('-', '')[:10]}.com"
        
        # Create user if doesn't exist
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'first_name': f'Admin {i+1}',
                'last_name': f'User',
                'is_hospital_admin': True,
            }
        )
        if created:
            user.set_password('password123')
            user.save()
            print(f"Created user: {email}")
        
        # Create health worker
        health_worker, created = HealthWorker.objects.get_or_create(
            user=user,
            defaults={
                'hospital': hospital,
                'role': 'Administrator',
            }
        )
        if created:
            print(f"Created health worker for {hospital.name}")
    
    # Create sample ANC records for each hospital
    periods = ["2024-Q1", "2024-Q2", "2024-Q3", "2024-Q4"]
    
    for hospital in hospitals:
        for period in periods:
            anc_record, created = ANCRecord.objects.get_or_create(
                hospital=hospital,
                periodname=period,
                defaults={
                    'new_anc_clients': 150 + (hospital.id * 10),
                    'cervical_cancer': 45 + (hospital.id * 5),
                    'iron_folate_supplements': 120 + (hospital.id * 8),
                    'iron_supplements': 110 + (hospital.id * 7),
                    'folic_supplements': 100 + (hospital.id * 6),
                    'preg_adol_15_19_first_anc': 25 + (hospital.id * 3),
                    'completed_4anc': 90 + (hospital.id * 5),
                    're_visit_anc_clients': 200 + (hospital.id * 12),
                    'ipt_3rd_dose': 80 + (hospital.id * 4),
                    'first_anc_before_12_weeks': 70 + (hospital.id * 4),
                    'completed_8anc': 60 + (hospital.id * 3),
                    'fgm_complications': 5 + hospital.id,
                    'preg_youth_20_24': 40 + (hospital.id * 3),
                    'breast_cancer_screened': 30 + (hospital.id * 2),
                    'cervical_cancer_screened': 35 + (hospital.id * 2),
                }
            )
            if created:
                print(f"Created ANC record for {hospital.name} - {period}")

    print("\n✅ Sample data creation completed!")
    print("\nTest users created:")
    print("Email: admin1@kisumucoun.com, Password: password123")
    print("Email: admin2@jaramogiog.com, Password: password123")

if __name__ == "__main__":
    create_sample_data()