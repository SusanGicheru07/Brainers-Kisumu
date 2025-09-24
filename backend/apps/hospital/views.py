from django.shortcuts import render, get_object_or_404
from django.core.paginator import Paginator
from django.views.generic import CreateView, TemplateView
from django.urls import reverse_lazy
from django.contrib.auth.views import LoginView, LogoutView
from django.core.mail import send_mail
from django.db.models import Sum
from django.http import JsonResponse

from .models import *
from .forms import CustomUserCreationForm, HospitalSignUpForm, StaffRequestAccessForm


class SignUpView(CreateView):
    form_class = CustomUserCreationForm
    success_url = reverse_lazy("login")
    template_name = "registration/signup.html"


class HospitalSignUpView(CreateView):
    model = CustomUser
    form_class = HospitalSignUpForm
    template_name = "registration/hospital_signup.html"
    success_url = reverse_lazy("login")


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


class CustomLoginView(LoginView):
    template_name = "registration/login.html"

    def form_valid(self, form):
        user = form.get_user()
        if hasattr(user, "health_worker_profile"):
            hw = user.health_worker_profile
            if not hw.is_approved:
                form.add_error(None, "Your account is pending hospital approval.")
                return self.form_invalid(form)
        return super().form_valid(form)


class CustomLogoutView(LogoutView):
    next_page = reverse_lazy("login")


def hospital_list(request):
    hospitals = Hospital.objects.all()
    paginator = Paginator(hospitals, 15)
    page_number = request.GET.get("page", 1)
    page_obj = paginator.get_page(page_number)
    return render(request, "hospital/hospital_list.html", {"page_obj": page_obj})


def hospital_detail(request, hospital_id):
    hospital = get_object_or_404(Hospital, id=hospital_id)
    return render(request, "hospital/hospital_detail.html", {"hospital": hospital})

def hospital_dashboard_data(request):
    """
    Returns all ANC stats for the logged-in hospital over time (for charts).
    Includes every column in ANCRecord.
    """
    hospital = get_object_or_404(Hospital, user=request.user)

    # Group by periodname (e.g., year or month)
    records = (
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

    return JsonResponse(list(records), safe=False)

def county_dashboard_data(request):
    """
    Compare hospital with others in the same county.
    """
    hospital = get_object_or_404(Hospital, user=request.user)
    county = hospital.county

    data = (
        ANCRecord.objects.filter(hospital__county=county)
        .values("hospital__name")
        .annotate(
            new_clients=Sum("new_anc_clients"),
            completed4=Sum("completed_4anc"),
            completed8=Sum("completed_8anc"),
            cervical_cancer=Sum("cervical_cancer"),
            breast_cancer=Sum("breast_cancer_screened"),
        )
        .order_by("-new_clients")
    )

    return JsonResponse(list(data), safe=False)

