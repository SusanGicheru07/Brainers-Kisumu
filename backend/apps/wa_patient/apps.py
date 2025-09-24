from django.apps import AppConfig


class WaPatientConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.wa_patient'

    def ready(self):
        import apps.wa_patient.signals
