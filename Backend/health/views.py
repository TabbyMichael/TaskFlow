import django_tenants
from django.db import connection
from django.http import JsonResponse
from django.views import View
from django.core.cache import cache


class HealthView(View):
    def get(self, request, *args, **kwargs):
        checks = {
            'database': 'ok',
            'redis': 'ok',
            'service': 'taskflow-backend',
        }
        status_code = 200

        # Check database
        try:
            with connection.cursor() as cursor:
                cursor.execute('SELECT 1')
        except Exception as e:
            checks['database'] = f'error: {str(e)}'
            status_code = 503

        # Check Redis
        try:
            cache.set('health_check', 'ok', 1)
            cache.get('health_check')
        except Exception as e:
            checks['redis'] = f'error: {str(e)}'
            status_code = 503

        checks['status'] = 'ok' if status_code == 200 else 'error'
        return JsonResponse(checks, status=status_code)
