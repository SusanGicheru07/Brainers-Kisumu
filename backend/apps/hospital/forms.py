from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth import get_user_model
from .models import Hospital, HealthWorker

User = get_user_model()


class CustomUserCreationForm(UserCreationForm):
    """
    Generic form for creating a User (not commonly used since hospitals
    and health workers have their own flows).
    """
    class Meta:
        model = User
        fields = ("username", "email", "password1", "password2")


class CustomLoginForm(AuthenticationForm):
    """Form for logging in users."""
    class Meta:
        model = User
        fields = ("username", "password")


class HospitalSignUpForm(UserCreationForm):
    """
    Form for hospitals to create an account (as a User).
    Hospitals are stored in both User (for login) and Hospital (for profile).
    """
    hospital_name = forms.CharField(max_length=255)

    class Meta(UserCreationForm.Meta):
        model = User
        fields = ("username", "email", "password1", "password2")

    def save(self, commit=True):
        user = super().save(commit=False)
        if commit:
            user.save()
            # Also create the Hospital profile
            Hospital.objects.create(
                name=self.cleaned_data["hospital_name"],
                email=self.cleaned_data["email"]
            )
        return user


class StaffRequestAccessForm(forms.ModelForm):
    """
    Form for health workers to request access under a hospital.
    Only stores HealthWorker data (no User yet).
    """
    hospitals = forms.ModelMultipleChoiceField(
        queryset=Hospital.objects.all(),
        widget=forms.CheckboxSelectMultiple,
        help_text="Select all hospitals you work in."
    )

    class Meta:
        model = HealthWorker
        fields = ("name", "role", "phone", "email", "available_days", "shift_hours", "hospitals")
