from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from organizations.views import OnboardingView

urlpatterns = [
    path('api/onboard/', OnboardingView.as_view(), name='onboarding'),
    path('', include('taskforge_backend.urls_public')),
    path('', include('taskforge_backend.urls_tenant')),
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]
