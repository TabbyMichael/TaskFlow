# Developer Guide

This guide explains how to extend TaskFlow: adding backend endpoints, frontend features, components, and tests. It also covers coding conventions and common workflows.

---

## 1. Development Environment Setup

```bash
# Clone
git clone https://github.com/your-org/TaskFlow.git
cd TaskFlow

# Start infrastructure
docker compose up -d db redis

# Backend
cd Backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Frontend (new terminal)
cd Frontend
npm install
npm run dev
```

---

## 2. Coding Conventions

### Backend (Python/Django)

- **Formatting:** `black` (line length 88 by default, CI checks 127)
- **Linting:** `flake8` (selects E9, F63, F7, F82 for errors; max complexity 10)
- **Style:** PEP 8 with type hints where helpful
- **Models:** Define `__str__`, use meaningful `related_name` on all ForeignKeys
- **Serializers:** Use camelCase aliases for fields consumed by the frontend (e.g., `assigneeId = PrimaryKeyRelatedField(source='assignee')`)
- **Views:** Prefer `ModelViewSet` with `get_queryset()` and `get_permissions()` overrides

### Frontend (TypeScript/React)

- **Formatting:** Prettier
- **Linting:** ESLint (flat config in `eslint.config.js`)
- **TypeScript:** Strict mode enabled, no implicit `any`
- **Components:** Functional components with hooks; no class components
- **Imports:** Use the `@/` alias for `src/` (configured in `tsconfig.json` and `vite.config.ts`)
- **State:** TanStack Query for server state; Zustand for client state
- **Naming:** `useXxx` for hooks, `XxxPage` for route pages, `XxxCard`/`XxxBadge` for components

---

## 3. Adding a New Backend Endpoint

This example shows how to add a new "labels" resource.

### Step 1: Create the model

```python
# Backend/tasks/models.py
class Label(models.Model):
    name = models.CharField(max_length=50, unique=True)
    color = models.CharField(max_length=20, default='#6366f1')

    def __str__(self):
        return self.name
```

### Step 2: Create and apply the migration

```bash
cd Backend
python manage.py makemigrations
python manage.py migrate_schemas
```

### Step 3: Create the serializer

```python
# Backend/tasks/serializers.py
class LabelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Label
        fields = ('id', 'name', 'color')
```

### Step 4: Create the viewset

```python
# Backend/tasks/views.py
class LabelViewSet(viewsets.ModelViewSet):
    queryset = Label.objects.all()
    serializer_class = LabelSerializer
    permission_classes = [IsTenantWriteMember]
```

### Step 5: Register the route

```python
# Backend/taskforge_backend/urls_tenant.py
from tasks.views import LabelViewSet

router.register(r'labels', LabelViewSet, basename='label')
```

### Step 6: Add tests

Create or extend `Backend/tasks/tests.py` following the existing pattern (see [Testing Guide](testing.md)).

---

## 4. Adding a New Frontend Feature

This example shows how to add a new "labels" feature page.

### Step 4.1: Define the type

```typescript
// Frontend/src/shared/types/index.ts
export interface Label {
  id: ID;
  name: string;
  color: string;
}
```

### Step 4.2: Create the API hooks

Follow the pattern in `src/lib/api/tasks.ts`:

```typescript
// Frontend/src/lib/api/labels.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from './client';
import type { Label } from '@/shared/types';

export const labelKeys = {
  all: ['labels'] as const,
  lists: () => ['labels', 'list'] as const,
};

export function useLabelsList() {
  return useQuery<Label[]>({
    queryKey: labelKeys.lists(),
    queryFn: async () => {
      const data = await apiGet<Record<string, unknown>[]>('/api/labels/');
      if (Array.isArray(data)) return data as unknown as Label[];
      return ((data as any).results ?? []) as Label[];
    },
  });
}
```

Export it from the barrel:

```typescript
// Frontend/src/lib/api/index.ts
export { labelKeys, useLabelsList } from './labels';
```

### Step 4.3: Create the page component

```tsx
// Frontend/src/features/labels/pages/labels-page.tsx
import { PageHeader } from "@/shared/components/page-header";
import { useLabelsList } from "@/lib/api";

export function LabelsPage() {
  const { data: labels = [], isLoading } = useLabelsList();

  return (
    <div>
      <PageHeader title="Labels" description="Manage your task labels" />
      {isLoading ? (
        <p>Loading…</p>
      ) : (
        <ul>
          {labels.map((l) => (
            <li key={l.id}>{l.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Step 4.4: Create the route

TanStack Router uses file-based routing. Create a file in `src/routes/_authenticated/`:

```tsx
// Frontend/src/routes/_authenticated.labels.tsx
import { createFileRoute } from "@tanstack/react-router";
import { LabelsPage } from "@/features/labels/pages/labels-page";

export const Route = createFileRoute("/_authenticated/labels")({
  component: LabelsPage,
});
```

### Step 4.5: Add to navigation

Update `src/app/layouts/app-sidebar.tsx` to add a nav link. Use the `ROUTES` constant:

```typescript
// Frontend/src/shared/constants/routes.ts
export const ROUTES = {
  // ...existing
  labels: "/labels",
} as const;
```

---

## 5. Adding a Reusable UI Component

TaskFlow uses **Shadcn UI** primitives in `src/components/ui/`. These are copied into the project (not imported from a package), so you can customize them.

To add a new component:

```bash
cd Frontend
npx shadcn@latest add <component-name>
```

For custom shared components (used across features), place them in `src/shared/components/`:

```
src/shared/components/
├── empty-state.tsx
├── kpi-card.tsx
├── page-header.tsx
├── status-badges.tsx
└── user-avatar.tsx
```

### Component conventions

```tsx
import { cn } from "@/lib/utils";

interface MyComponentProps {
  className?: string;
  variant?: "default" | "compact";
}

export function MyComponent({ className, variant = "default" }: MyComponentProps) {
  return (
    <div className={cn("base-classes", variant === "compact" && "compact-classes", className)}>
      {/* ... */}
    </div>
  );
}
```

---

## 6. Working with Multi-Tenancy

### Key rules

1. **Models in `TENANT_APPS`** are only visible inside a tenant schema. Never query them from the public schema context.
2. **Models in `SHARED_APPS`** are visible everywhere (public + all tenant schemas via search path).
3. **Users are global** (public schema). `Member` profiles are per-tenant.

### Switching schema context in code

```python
from django_tenants.utils import schema_context

with schema_context('demo'):
    # All queries here run against the 'demo' schema
    tasks = Task.objects.all()
```

### Switching to public schema

```python
from django.db import connection
connection.set_schema_to_public()
# Queries here run against the 'public' schema
```

### Creating a new tenant programmatically

```python
from organizations.models import Organization, Domain

tenant = Organization.objects.create(
    name='New Org',
    slug='new-org',
    schema_name='new_org',  # no hyphens allowed
    plan='Enterprise'
)
Domain.objects.create(
    domain='new-org.localhost',
    tenant=tenant,
    is_primary=True
)
# django-tenants auto-creates and migrates the schema
```

---

## 7. Adding RBAC Permissions

To create a new permission rule, extend the existing classes in `core/permissions.py`:

```python
class IsTenantEditor(IsTenantMember):
    """Allows access only to members who can edit content."""
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return request.member.role in ['admin', 'manager', 'member']
```

Apply it to a viewset:

```python
class TaskViewSet(viewsets.ModelViewSet):
    permission_classes = [IsTenantEditor]
```

---

## 8. Adding Signal Handlers

Signals are used for side effects (activity logging, notifications). Register them in the app's `apps.py` `ready()` method.

```python
# Backend/myapp/apps.py
class MyAppConfig(AppConfig):
    name = 'myapp'

    def ready(self):
        import myapp.signals  # noqa: F401
```

```python
# Backend/myapp/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import MyModel

@receiver(post_save, sender=MyModel)
def my_handler(sender, instance, created, **kwargs):
    if created:
        # Side effect: create activity, notification, etc.
        pass
```

> **Important:** Always guard against `RelatedObjectDoesNotExist` when accessing FK fields in signals, as they may not be set during partial saves.

---

## 9. Folder Conventions

### Backend

```
Backend/<app>/
├── __init__.py
├── apps.py          # AppConfig + signal registration
├── models.py        # Django models
├── serializers.py   # DRF serializers
├── views.py         # DRF viewsets
├── signals.py       # Signal handlers (optional)
├── admin.py         # Django admin (optional)
├── tests.py         # App-level tests
└── migrations/
    ├── __init__.py
    └── 0001_initial.py
```

### Frontend

```
Frontend/src/
├── routes/              # File-based routes (TanStack Router)
│   ├── _auth/           # Unauthenticated routes
│   └── _authenticated/  # Authenticated routes
├── features/            # Feature modules
│   └── <domain>/
│       ├── components/  # Feature-specific components
│       └── pages/       # Feature pages
├── shared/              # Cross-cutting code
│   ├── components/      # Reusable UI components
│   ├── hooks/           # Custom hooks
│   ├── utils/           # Utility functions
│   ├── constants/       # Constants (routes, etc.)
│   ├── types/           # TypeScript types
│   └── api/             # Mock data + client (dev)
├── lib/api/             # Real API layer (hooks + mappers)
├── app/
│   ├── layouts/         # Layout components
│   ├── store/           # Zustand stores
│   └── providers/       # Context providers
└── components/ui/       # Shadcn UI primitives
```

---

## 10. Common Workflows

### Workflow: Add a field to an existing model

1. Add the field to the model in `models.py`
2. Run `python manage.py makemigrations`
3. Run `python manage.py migrate_schemas`
4. Add the field to the serializer's `fields` tuple
5. Update the frontend type in `shared/types/index.ts`
6. Update the mapper in `lib/api/mappers.ts` if needed
7. Add/update tests

### Workflow: Debug a tenant issue

1. Check the `Host` header is correct (e.g., `demo.localhost`)
2. Verify the `Domain` row exists in the public schema:
   ```python
   Domain.objects.filter(domain='demo.localhost').exists()
   ```
3. Check the schema was created:
   ```sql
   SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'demo';
   ```
4. Ensure migrations ran on the schema:
   ```bash
   python manage.py migrate_schemas
   ```

### Workflow: Run a quick manual test

```bash
# Get a token
curl -X POST http://localhost:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"alice@taskflow.com","password":"password"}'

# List tasks (note tenant Host header)
curl http://demo.localhost:8000/api/tasks/ \
  -H "Authorization: Bearer <token>"
```

---

## 11. Debugging Tips

### Backend

- **Logs:** Structured logging via `RequestLoggingMiddleware` shows method, path, tenant, user, status, and duration for every request.
- **Django shell:** `python manage.py shell` — use `schema_context('demo')` to query tenant data.
- **Health check:** `curl http://localhost:8000/health/` verifies DB + Redis connectivity.
- **Swagger UI:** `http://localhost:8000/api/docs/` for interactive API exploration.

### Frontend

- **React DevTools:** Inspect component tree and props.
- **TanStack Query DevTools:** Available in development to inspect query cache.
- **Zustand state:** Inspect via `useAuthStore.getState()` in the console.
- **Network tab:** All API calls go to `VITE_API_URL` with `Authorization` header.

---

## 12. Git Workflow

```bash
# Create a feature branch
git checkout -b feat/my-feature

# Make changes, commit with a clear message
git add -A
git commit -m "feat: add label management endpoint and page"

# Run tests before pushing
make ci

# Push and create a PR
git push origin feat/my-feature
```

### Commit message convention

- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation
- `refactor:` code restructuring
- `test:` adding tests
- `chore:` maintenance
