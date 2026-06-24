# Testing Documentation

This document describes the testing infrastructure for TaskFlow, including frameworks, test structure, how to run tests, and coverage strategy.

---

## 1. Testing Frameworks

| Layer | Framework | Location |
|-------|-----------|----------|
| Backend unit/integration | Django Test Runner (`manage.py test`) | `Backend/<app>/tests.py` |
| Frontend unit | Vitest + Testing Library | `tests/frontend/` |
| Backend data layer | Vitest | `tests/backend/`, `tests/database/` |
| Integration | Vitest + MSW | `tests/integration/` |
| End-to-end | Playwright | `tests/e2e/` |

---

## 2. Backend Test Infrastructure

### Custom Test Runner

TaskFlow uses a custom test runner (`TenantTestRunner`) that extends Django's `DiscoverRunner` to handle multi-tenant schema migrations during test setup.

```python
# Backend/tests/setup/tenant_test_runner.py
class TenantTestRunner(DiscoverRunner):
    def setup_databases(self, **kwargs):
        result = super().setup_databases(**kwargs)
        tenant_schemas = getattr(settings, "TEST_TENANT_SCHEMAS", [])
        for schema_name in tenant_schemas:
            self._migrate_schema(schema_name)
        return result
```

### Test Settings

The `tests.setup.test_settings` module overrides production settings for fast, hermetic tests:

| Setting | Override | Reason |
|---------|----------|--------|
| `TEST_RUNNER` | `TenantTestRunner` | Migrates tenant schemas after test DB creation |
| `SECURE_SSL_REDIRECT` | `False` | Disable HTTPS enforcement in test environment |
| `CACHES` | `LocMemCache` | In-process cache — no Redis required for tests |
| `RATELIMIT_ENABLE` | `False` | Test client can hammer endpoints freely |
| `PASSWORD_HASHERS` | `MD5PasswordHasher` | Faster hashing for test runtime |

---

## 3. Backend Test Structure

Each Django app contains a `tests.py` with test cases.

### App Test Files

| File | Tests |
|------|-------|
| `core/tests.py` | Multi-tenant onboarding, schema isolation, RBAC rules, signal/activity tracking, Project model |
| `organizations/tests.py` | Member invite, viewer permission denial |
| `sprints/tests.py` | Sprint CRUD, start/complete actions, cache invalidation |
| `tasks/tests.py` | Task CRUD, key generation, model validation (labels/checklist), search API, attachment API |
| `notifications/tests.py` | Notification creation, signal-driven notifications, list/mark_all_read API |
| `health/tests.py` | Health endpoint status and keys |

**Total: 50 backend tests** as of the uncommitted changes.

---

## 4. Running Backend Tests

### Full suite

```bash
cd Backend
DB_HOST=localhost DB_PORT=5433 DB_USER=postgres DB_PASSWORD=password \
  SECRET_KEY=test-secret-key REDIS_URL='' \
  ../venv/bin/python manage.py test \
    core.tests organizations.tests sprints.tests tasks.tests notifications.tests health.tests \
    --settings=tests.setup.test_settings --verbosity=2
```
```

### Single app

```bash
cd Backend
../venv/bin/python manage.py test tasks.tests --settings=tests.setup.test_settings -v 2
```

### Single test method

```bash
cd Backend
../venv/bin/python manage.py test \
  tasks.tests.TaskAPITestCase.test_create_task_auto_generates_key \
  --settings=tests.setup.test_settings -v 3
```

### Via Make

```bash
make test-backend
```

---

## 5. Frontend Test Infrastructure

Frontend tests use Vitest with the React preset and jsdom environment. Configuration lives in `Frontend/vitest.config.ts`.

### Test Directory Structure

```
tests/
├── frontend/
│   ├── components/
│   ├── forms/
│   ├── hooks/
│   ├── routing/
│   ├── stores/
│   └── utils/
├── backend/
├── database/
├── integration/
└── e2e/
    ├── auth.spec.ts
    ├── navigation.spec.ts
    └── helpers.ts
```

### Running Frontend Tests

```bash
cd Frontend
npx vitest run --reporter=verbose
```

---

## 6. E2E Tests (Playwright)

Playwright tests drive a real browser against the running application. These are in `tests/e2e/`.

---

## 7. Test Patterns

### Tenant-Aware API Tests

Backend API tests follow this pattern:

```python
class TaskAPITestCase(APITestCase):
    def setUp(self):
        _ensure_public_tenant()
        self.user = User.objects.create_user(...)
        self.tenant = Organization.objects.create(schema_name='xxx', ...)
        Domain.objects.create(domain='xxx.localhost', tenant=self.tenant)
        with schema_context(self.tenant.schema_name):
            self.member = Member.objects.create(user=self.user, role='admin')
            self.project = Project.objects.create(key='XX', ...)

    def _auth_headers(self):
        resp = self.client.post(reverse('token_obtain_pair'), {...}, HTTP_HOST='localhost')
        return {'HTTP_AUTHORIZATION': f'Bearer {resp.data["access"]}'}
```

Key points:
- Always call `_ensure_public_tenant()` in `setUp` to reset schema context
- Use `HTTP_HOST='localhost'` for public endpoints (auth)
- Use `HTTP_HOST='xxx.localhost'` for tenant-scoped endpoints to trigger schema resolution

### Model Validation Tests

```python
class TaskModelValidationTestCase(TestCase):
    def test_valid_labels_accepts_string_list(self):
        task = Task(project=self.project, labels=['frontend', 'bug'])
        task.clean()  # Should not raise

    def test_invalid_labels_dict_raises_error(self):
        task = Task(project=self.project, labels={'not': 'a list'})
        with self.assertRaises(Exception):
            task.clean()
```

---

## 8. Test Naming Conventions

| Pattern | Example |
|---------|---------|
| Positive case | `test_create_task_auto_generates_key` |
| Negative case | `test_rbac_viewer_cannot_create_task` |
| Edge case | `test_second_task_increments_key` |
| Invalid input | `test_invalid_labels_dict_raises_error` |
| Authorization | `test_viewer_cannot_create_attachment` |

---

## 9. CI/CD Test Execution

### GitHub Actions (`.github/workflows/ci.yml`)

- Runs on: `push` and `pull_request` to `main` / `develop`
- Services: PostgreSQL 18 + Redis 7
- Jobs: lint-backend, lint-frontend, test-backend, build-frontend, build-docker-images

### Woodpecker CI (`.woodpecker.yml`)

- Same trigger branches
- Step-level services for test-backend: `postgres:17` + `redis:7-alpine`
- Uses `--noinput` flag to prevent interactive prompts
- Runs the full 50-test suite

---

## 10. Code Coverage

Target: **80%+** on backend apps.

Current coverage is determined by the test suite's breadth:
- All CRUD operations are tested
- RBAC rules are tested per role (admin, manager, member, viewer)
- Signal side effects are tested (activity logging, notifications)
- Model validation is tested for both valid and invalid inputs
- Cache behavior is tested (invalidation, zero-state)
