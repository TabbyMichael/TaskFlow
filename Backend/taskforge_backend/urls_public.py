from django.urls import path
from taskforge_backend.rate_limits import RateLimitedTokenObtainPairView, RateLimitedTokenRefreshView
from health.views import HealthView
from organizations.views import OnboardingView

urlpatterns = [
    path('health/', HealthView.as_view(), name='health'),
    path('api/onboard/', OnboardingView.as_view(), name='onboarding'),
    path('api/auth/token/', RateLimitedTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', RateLimitedTokenRefreshView.as_view(), name='token_refresh'),
]
