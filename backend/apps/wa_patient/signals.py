from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Patient


@receiver(post_save, sender=Patient)
def assign_hospitals_on_create(sender, instance, created, **kwargs):
    if created:
        instance.assign_suggested_hospitals()
