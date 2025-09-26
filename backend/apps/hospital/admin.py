from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.core.mail import send_mail
from django.urls import reverse
from django.conf import settings
from django.contrib.auth import get_user_model

from .models import HealthWorker, Hospital, ANCRecord, ANCService


User = get_user_model()

@admin.register(HealthWorker)
class HealthWorkerAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "role", "is_approved", "get_hospitals")
    filter_horizontal = ("hospitals",)  # Better hospital selector
    raw_id_fields = ("user",)  # allows linking to any user, not just staff

    def get_hospitals(self, obj):
        return ", ".join([h.name for h in obj.hospitals.all()])
    get_hospitals.short_description = "Hospitals"


    list_filter = ("role", "is_approved")
    search_fields = ("name", "email")

    actions = ["approve_health_workers"]

    def approve_health_workers(self, request, queryset):
        """
        Approve selected health workers:
        1. Mark them approved.
        2. Create a linked User account if missing.
        3. Send password setup email.
        """
        for hw in queryset:
            if not hw.is_approved:
                hw.is_approved = True
                hw.save()

                # Create linked User if not existing
                if not hw.user:
                    username = hw.email.split("@")[0]  # safer than full email
                    user = User.objects.create_user(
                        username=username,
                        email=hw.email,
                        is_active=True
                    )
                    hw.user = user
                    hw.save()

                    # Build password reset link
                    uid = urlsafe_base64_encode(force_bytes(user.pk))
                    token = default_token_generator.make_token(user)
                    reset_url = f"{settings.SITE_URL}{reverse('password_reset_confirm', kwargs={'uidb64': uid, 'token': token})}"

                    # Send email
                    send_mail(
                        subject="Set up your password",
                        message=(
                            f"Hello {hw.name},\n\n"
                            f"Your request to access the hospital system has been approved.\n"
                            f"Please click the link below to set your password and log in:\n\n{reset_url}\n\n"
                            f"Thank you."
                        ),
                        from_email="noreply@system.com",
                        recipient_list=[hw.email],
                    )

        self.message_user(request, "✅ Selected health workers approved and notified.")

    approve_health_workers.short_description = "Approve selected health workers"


@admin.register(Hospital)
class HospitalAdmin(admin.ModelAdmin):
    list_display = ("name", "type", "county", "sub_county", "ward", "phone", "email")
    search_fields = ("name", "county", "sub_county", "ward")
    list_filter = ("type", "county", "ward")
    ordering = ("name",)


@admin.register(ANCRecord)
class ANCRecordAdmin(admin.ModelAdmin):
    list_display = (
        "hospital",
        "periodname",
        "new_anc_clients",
        "cervical_cancer",
        "iron_folate_supplements",
        "iron_supplements",
        "folic_supplements",
        "preg_adol_15_19_first_anc",
        "completed_4anc",
        "re_visit_anc_clients",
        "ipt_3rd_dose",
        "first_anc_before_12_weeks",
        "completed_8anc",
        "fgm_complications",
        "preg_youth_20_24",
        "breast_cancer_screened",
        "cervical_cancer_screened",
    )
    list_filter = ("hospital", "periodname")
    search_fields = ("hospital__name", "periodname")
    ordering = ("-periodname",)


@admin.register(ANCService)
class ANCServiceAdmin(admin.ModelAdmin):
    list_display = (
        "hospital",
        "clinic_days",
        "operating_hours",
        "capacity_per_day",
        "ultrasound_available",
        "lab_available",
        "pharmacy_available",
        "emergency_services",
        "blood_bank",
        "insurance_accepted",
        "avg_wait_time_minutes",
    )
    search_fields = ("hospital__name",)
    list_filter = (
        "clinic_days",
        "ultrasound_available",
        "lab_available",
        "pharmacy_available",
        "emergency_services",
        "blood_bank",
    )
    ordering = ("hospital__name",)