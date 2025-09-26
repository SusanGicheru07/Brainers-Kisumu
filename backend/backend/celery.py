import os
from celery import Celery

from celery.schedules import crontab


# set default Django settings
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")

app = Celery("backend")

# use Django settings with CELERY_ prefix
app.config_from_object("django.conf:settings", namespace="CELERY")

# auto-discover tasks.py in your apps
app.autodiscover_tasks()

app.conf.beat_schedule = {
    "update-patients-every-midnight": {
        "task": "apps.patient.tasks.update_patients",
        "schedule": crontab(hour=0, minute=0),  # runs daily at midnight
    },
}

