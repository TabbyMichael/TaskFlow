"""
Tenant-aware test runner for TaskFlow.

Creates the test database and migrates tenant schemas so that
``schema_context``-based queries don't fail with "relation does not exist".
"""
from django.test.runner import DiscoverRunner
from django.db import connection
from django_tenants.utils import schema_context, get_public_schema_name
from django.conf import settings


class TenantTestRunner(DiscoverRunner):
    """Test runner that ensures tenant schemas are migrated during test setup."""

    def setup_databases(self, **kwargs):
        result = super().setup_databases(**kwargs)

        # Migrate tenant schemas listed in TEST_TENANT_SCHEMAS
        tenant_schemas = getattr(settings, "TEST_TENANT_SCHEMAS", [])
        for schema_name in tenant_schemas:
            self._migrate_schema(schema_name)

        return result

    def _migrate_schema(self, schema_name: str) -> None:
        """Run migrations on a specific schema."""
        with schema_context(schema_name):
            from django.core.management import call_command
            call_command("migrate", "--noinput", verbosity=0)

    @staticmethod
    def setup_tenant(schema_name: str) -> None:
        """Helper to create and migrate a tenant schema on the fly.

        Call this inside test ``setUp`` when a test creates a new tenant
        after the initial test DB setup.
        """
        from django.core.management import call_command
        from django_tenants.utils import schema_context

        # Create schema in PostgreSQL
        with connection.cursor() as cursor:
            cursor.execute(
                f"CREATE SCHEMA IF NOT EXISTS {schema_name}"
            )

        # Run migrations in that schema
        with schema_context(schema_name):
            call_command("migrate", "--noinput", verbosity=0)