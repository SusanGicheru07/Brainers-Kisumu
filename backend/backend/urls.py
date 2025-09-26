from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('apps.hospital.urls')),
    path('patients/', include('apps.wa_patient.urls')),
]
