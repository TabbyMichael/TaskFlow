from django_ratelimit.decorators import ratelimit
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


class RateLimitedTokenObtainPairView(TokenObtainPairView):
    """
    POST /api/auth/token/
    Rate-limited to 5 requests per minute per IP/key to prevent
    credential-stuffing and brute-force attacks.
    """
    @ratelimit(key='ip', rate='5/m', block=True)
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class RateLimitedTokenRefreshView(TokenRefreshView):
    """
    POST /api/auth/token/refresh/
    Rate-limited to 30 requests per minute per IP/key.
    """
    @ratelimit(key='ip', rate='30/m', block=True)
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)
