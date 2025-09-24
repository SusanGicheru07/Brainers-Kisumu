from django.urls import path

from .views import *


urlpatterns = [
    path('register/', SignUpView.as_view(), name='register'),
    path('login/', CustomLoginView.as_view(), name='login'),
    path('logout/', CustomLogoutView.as_view(), name='logout'),

    path('hospital/signup/', HospitalSignUpView.as_view(), name='hospital_signup'),
    path('staff/request-access/', StaffRequestAccessView.as_view(), name='staff_request_access'),
    path('access-pending/', AccessPendingView.as_view(), name='access_pending'),

    path('hospital/<int:hospital_id>/', hospital_detail, name='hospital_detail'),
    path('', hospital_list, name='hospital_list'),

    path("api/dashboard/hospital/", hospital_dashboard_data, name="hospital_dashboard_data"),
    path("api/dashboard/county/", county_dashboard_data, name="county_dashboard_data"),

]
