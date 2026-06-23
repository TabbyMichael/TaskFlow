from django.contrib import admin
from django.urls import path, include
from organizations.views import OnboardingView

urlpatterns = [
    path('api/onboard/', OnboardingView.as_view(), name='onboarding'),
    path('', include('taskforge_backend.urls_public')),
    path('', include('taskforge_backend.urls_tenant')),
]
