"""
Request logging middleware for monitoring and debugging.
Logs all API requests with timing, user info, and tenant context.
"""
import time
import logging

logger = logging.getLogger('taskflow.request')


class RequestLoggingMiddleware:
    """Log all incoming requests with timing and context."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Skip logging for health checks and static files
        if request.path in ['/health/', '/api/schema/', '/api/docs/']:
            return self.get_response(request)

        start_time = time.time()
        tenant = getattr(request, 'tenant', None)

        # Log request
        logger.info(
            f"Request started: {request.method} {request.path} | "
            f"Tenant: {tenant.schema_name if tenant else 'public'} | "
            f"User: {request.user.username if request.user.is_authenticated else 'anonymous'}"
        )

        response = self.get_response(request)

        # Calculate timing
        duration = time.time() - start_time

        # Log response
        logger.info(
            f"Request completed: {request.method} {request.path} | "
            f"Status: {response.status_code} | "
            f"Duration: {duration:.3f}s | "
            f"Tenant: {tenant.schema_name if tenant else 'public'}"
        )

        # Add timing header
        response['X-Response-Time'] = f"{duration:.3f}s"

        return response