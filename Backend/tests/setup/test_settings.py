"""
Test settings for TaskFlow.

Imported from the production settings and overridden for a fast, hermetic
test environment. Activated via:

    DJANGO_SETTINGS_MODULE=tests.setup.test_settings

Key behaviours provided here (the difference between a red and a green suite):

  * ``TEST_RUNNER`` points at :class:`TenantTestRunner`, which builds the test
    database AND migrates a set of seed tenant schemas up front. This is the
    fix for the classic django-tenants failure mode where ``schema_context``
    queries blow up with "relation ... does not exist" because the tenant
    schemas were never migrated inside the test transaction.
  * Security middleware that would force SSL / HSTS is disabled.
  * Redis cache is swapped for an in-process LRU cache so tests never touch a
    real Redis and never leak state between runs.
  * Rate limiting is disabled so the test client isn't throttled mid-suite.
  * Password validation is disabled to keep fixtures fast.
"""
from taskforge_backend.settings import *  # noqa: F401,F403
from taskforge_backend.settings import DATABASES, INSTALLED_APPS  # noqa: F401

# ---------------------------------------------------------------------------
# Test runner: migrates seed tenant schemas after the test DB is created.
# ---------------------------------------------------------------------------
TEST_RUNNER = "tests.setup.tenant_test_runner.TenantTestRunner"

# ---------------------------------------------------------------------------
# Security / transport: never enforce in tests.
# ---------------------------------------------------------------------------
DEBUG = False
SECURE_SSL_REDIRECT = False
SECURE_HSTS_SECONDS = 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False
SECURE_BROWSER_XSS_FILTER = False
SECURE_CONTENT_TYPE_NOSNIFF = False

# ---------------------------------------------------------------------------
# Cache: in-process, never touches Redis. Default + stub.
# django-ratelimit requires a shared cache; we use LocMemCache for tests
# but silence its system check errors.
# ---------------------------------------------------------------------------
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "taskflow-tests",
    }
}
SILENCED_SYSTEM_CHECKS = [
    "django_ratelimit.E003",
    "django_ratelimit.W001",
]

# ---------------------------------------------------------------------------
# Rate limit: disabled so the test client can hammer endpoints freely.
# ---------------------------------------------------------------------------
RATELIMIT_ENABLE = False

# ---------------------------------------------------------------------------
# Password validators: skip in tests (fixtures create users directly).
# ---------------------------------------------------------------------------
AUTH_PASSWORD_VALIDATORS = []

# ---------------------------------------------------------------------------
# Faster password hashing for tests (affects test runtime noticeably).
# ---------------------------------------------------------------------------
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

# ---------------------------------------------------------------------------
# Test database: Postgres, migrated by the tenant test runner.
# Django prepends ``test_`` to NAME when ``NAME`` is not explicitly overridden.
# ---------------------------------------------------------------------------
DATABASES["default"]["CONN_MAX_AGE"] = 0  # no persistent connections during tests

# ---------------------------------------------------------------------------
# Seed tenant schemas created & migrated up front by TenantTestRunner.
# Existing per-app tests create their own tenants on the fly (e.g. ``tenant_a``,
# ``task_test``); those are still migrated on demand by the runner hook
# (see ``setup_tenant`` / ``TenantTestRunner._create_tenant_schema``).
# ---------------------------------------------------------------------------
TEST_TENANT_SCHEMAS: list[str] = []
