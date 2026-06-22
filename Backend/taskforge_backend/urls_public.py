from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from organizations.views import OnboardingView

urlpatterns = [
    path('api/onboard/', OnboardingView.as_view(), name='onboarding'),
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
