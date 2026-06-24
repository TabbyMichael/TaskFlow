# API Reference

This document describes every REST API endpoint in TaskFlow. The API is built with Django REST Framework and is JWT-authenticated.

- **Base URL (local):** `http://localhost:8000`
- **Interactive docs:** `http://localhost:8000/api/docs/` (Swagger UI)
- **OpenAPI schema:** `http://localhost:8000/api/schema/`

---

## Authentication

TaskFlow uses **JWT (JSON Web Tokens)** via SimpleJWT.

| Property | Value |
|----------|-------|
| Access token lifetime | 1 hour |
| Refresh token lifetime | 7 days |
| Token rotation | Enabled |
| Blacklist after rotation | Enabled |
| Auth header | `Authorization: Bearer <access_token>` |

### Token Storage (Frontend)

| Key | Storage | Purpose |
|-----|---------|---------|
| `taskflow-access-token` | localStorage | Current access token |
| `taskflow-refresh-token` | localStorage | Refresh token |

When a request returns 401, the client automatically attempts a refresh and retries.

---

## Request/Response Conventions

- **Content-Type:** `application/json` for all request bodies
- **Tenant routing:** Tenant-scoped endpoints require the `Host` header to match a registered domain (e.g., `demo.localhost`). The backend resolves the tenant schema from this header.
- **Field naming:** The backend uses a mix of snake_case (DB fields) and camelCase (serializer aliases). The frontend `mappers.ts` normalizes everything to camelCase.
- **Pagination:** Page-based, 50 items per page (`PageNumberPagination`). Responses include `count`, `next`, `previous`, `results`.
- **Timestamps:** ISO 8601 UTC strings.

---

## Permission Classes

| Class | Who can access | Used by |
|-------|---------------|---------|
| `AllowAny` | Anyone | Onboarding, health, auth |
| `IsTenantMember` | Any active tenant member | Read endpoints |
| `IsTenantWriteMember` | admin, manager, member (not viewer) | Write endpoints |
| `IsTenantAdmin` | admin only | Member management |
| `IsTenantManager` | admin, manager | (available, not widely used) |

---

## Endpoints

### Health

#### `GET /health/`

Returns service health status. No authentication required.

**Response (200):**
```json
{
  "database": "ok",
  "redis": "ok",
  "service": "taskflow-backend",
  "status": "ok"
}
```

**Response (503):** Same shape, with `status: "error"` and error details in the failing component.

---

### Onboarding

#### `POST /api/onboard/`

Creates a new organization (tenant), admin user, domain, and member. No authentication required.

**Request body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe",
  "orgName": "Acme Corp",
  "orgSlug": "acme"
}
```

**Response (201):**
```json
{
  "message": "Workspace provisioned successfully.",
  "domain": "acme.localhost",
  "username": "johndoe",
  "organization": "Acme Corp"
}
```

**Response (400):** Validation errors (duplicate username/email/slug).

**Validation rules:**
- `username`: unique, max 150 chars
- `email`: valid email, unique
- `password`: write-only
- `orgSlug`: must be a valid slug, unique

---

### Authentication

#### `POST /api/auth/token/`

Obtain a JWT pair. Rate-limited to 5 requests per minute per IP.

**Request body:**
```json
{
  "username": "alice@taskflow.com",
  "password": "password"
}
```

> The `username` field accepts either a username or email (via `EmailOrUsernameBackend`).

**Response (200):**
```json
{
  "access": "eyJhbGciOiJIUzI1NiIs...",
  "refresh": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (401):** `{"detail": "No active account found with the given credentials"}`

---

#### `POST /api/auth/token/refresh/`

Refresh an expired access token. Rate-limited to 30 requests per minute per IP.

**Request body:**
```json
{
  "refresh": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "access": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### Projects

*Requires: `IsTenantWriteMember` (write) / active tenant membership (read)*

#### `GET /api/projects/`

List all projects in the current tenant.

**Query parameters:** Standard DRF search/ordering filters.

**Response (200):**
```json
{
  "count": 1,
  "results": [
    {
      "id": 1,
      "key": "TF",
      "name": "TaskFlow Platform Development",
      "description": "Main product development...",
      "status": "active",
      "progress": 33,
      "start_date": null,
      "due_date": null,
      "lead": 1,
      "lead_details": { "id": 1, "name": "Alice Smith", "email": "...", "role": "manager", "initials": "AS" },
      "members": [1, 2, 3],
      "color": "#4f46e5",
      "created_at": "2026-06-22T12:00:00Z",
      "updated_at": "2026-06-22T12:00:00Z"
    }
  ]
}
```

#### `POST /api/projects/`

Create a project. The `lead` is automatically set to the requesting member.

**Request body:**
```json
{
  "key": "NEW",
  "name": "New Project",
  "description": "Project description",
  "status": "planning",
  "color": "#6366f1"
}
```

**Response (201):** The created project object.

#### `GET /api/projects/{id}/`

Retrieve a single project.

#### `PATCH /api/projects/{id}/`

Partially update a project.

#### `DELETE /api/projects/{id}/`

Delete a project.

---

### Tasks

*Requires: `IsTenantWriteMember` (write) / active tenant membership (read)*

#### `GET /api/tasks/`

List tasks. Supports filtering.

**Query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | int | Filter by project |
| `sprintId` | int | Filter by sprint |
| `status` | string | Filter by status (backlog, todo, in_progress, review, done) |

**Response (200):** Paginated list of task objects (see below for shape).

#### `POST /api/tasks/`

Create a task. The key is auto-generated atomically (e.g., `TF-1`).

**Request body:**
```json
{
  "title": "Implement dark mode",
  "projectId": 1,
  "reporterId": 1,
  "assigneeId": 2,
  "sprintId": 1,
  "status": "todo",
  "priority": "high",
  "storyPoints": 5,
  "dueDate": "2026-07-01",
  "labels": ["frontend", "ui"]
}
```

**Response (201):**
```json
{
  "id": 5,
  "key": "TF-5",
  "title": "Implement dark mode",
  "description": null,
  "status": "todo",
  "priority": "high",
  "assigneeId": 2,
  "reporterId": 1,
  "projectId": 1,
  "sprintId": 1,
  "storyPoints": 5,
  "dueDate": "2026-07-01",
  "createdAt": "2026-06-22T12:00:00Z",
  "updatedAt": "2026-06-22T12:00:00Z",
  "labels": ["frontend", "ui"],
  "checklist": [],
  "comments": [],
  "activity": [
    { "id": 1, "actorId": 1, "type": "created", "message": "created task 'Implement dark mode'", "createdAt": "..." }
  ],
  "attachments": []
}
```

> Creating a task triggers: activity logging (`type: created`) and notifications to project members.

#### `GET /api/tasks/{id}/`

Retrieve a single task with nested comments, activity, and attachments.

#### `PATCH /api/tasks/{id}/`

Partially update a task. Changing status, sprint, or assignee triggers activity logging signals.

**Example:** Change status
```json
{ "status": "in_progress" }
```

#### `DELETE /api/tasks/{id}/`

Delete a task.

#### `GET /api/tasks/search/?q={query}`

Full-text search across task titles (weight A) and descriptions (weight B).

**Query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Search query (required) |
| `projectId` | int | Optional project filter |

**Response (200):**
```json
{
  "results": [ /* up to 20 matching task objects */ ]
}
```

**Behavior:**
- Blank query returns `{"results": []}`
- Uses PostgreSQL `SearchVector` + `SearchRank` with a minimum rank threshold of 0.1
- Returns top 20 results ordered by relevance

---

### Sprints

*Requires: `IsTenantWriteMember` (write) / active tenant membership (read)*

#### `GET /api/sprints/`

List sprints.

**Query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | int | Filter by project |

**Response fields:** Includes `total_points` and `completed_points` (Redis-cached).

#### `POST /api/sprints/`

**Request body:**
```json
{
  "project": 1,
  "name": "Sprint 2 - Authentication",
  "goal": "Implement OAuth and session management",
  "status": "planned",
  "start_date": "2026-07-01",
  "end_date": "2026-07-15"
}
```

#### `POST /api/sprints/{id}/start/`

Start a sprint. Returns 400 if another sprint in the same project is already active.

**Response (200):** The updated sprint object with `status: "active"`.

**Response (400):** `{"error": "There is already an active sprint in this project."}`

#### `POST /api/sprints/{id}/complete/`

Complete a sprint. Automatically moves incomplete tasks (status != done) back to the backlog (sets `sprint = null`).

**Response (200):**
```json
{
  "message": "Sprint completed successfully. Incomplete tasks moved to backlog.",
  "sprint": { /* updated sprint object */ }
}
```

---

### Comments

*Requires: `IsTenantWriteMember` (write) / active tenant membership (read)*

#### `GET /api/comments/?taskId={id}`

List comments, optionally filtered by task.

#### `POST /api/comments/`

**Request body:**
```json
{
  "task": 5,
  "body": "Looks good to me!"
}
```

> The `author` is set automatically from the requesting member. Creating a comment triggers a notification to the task's reporter and assignee.

**Response (201):**
```json
{
  "id": 3,
  "task": 5,
  "authorId": 1,
  "body": "Looks good to me!",
  "createdAt": "2026-06-22T12:00:00Z"
}
```

---

### Activities

*Requires: active tenant membership (read-only)*

#### `GET /api/activities/?taskId={id}`

List activity items, optionally filtered by task.

**Response (200):**
```json
{
  "count": 2,
  "results": [
    {
      "id": 1,
      "actorId": 1,
      "type": "created",
      "message": "created task 'Implement OAuth'",
      "createdAt": "2026-06-22T12:00:00Z"
    },
    {
      "id": 2,
      "actorId": 2,
      "type": "status_changed",
      "message": "changed status from 'To Do' to 'In Progress'",
      "createdAt": "2026-06-22T12:05:00Z"
    }
  ]
}
```

---

### Attachments

*Requires: `IsTenantWriteMember`*

#### `GET /api/attachments/?taskId={id}`

List attachments for a task.

#### `POST /api/attachments/`

Upload an attachment. `taskId` is required.

**Request body:**
```json
{
  "taskId": 5,
  "name": "screenshot.png",
  "size": 102400
}
```

#### `DELETE /api/attachments/{id}/`

Delete an attachment.

---

### Notifications

*Requires: `IsTenantMember` (scoped to the requesting member)*

#### `GET /api/notifications/`

List notifications for the authenticated member only. The queryset is scoped via `request.member`.

**Response (200):**
```json
{
  "count": 3,
  "results": [
    {
      "id": 1,
      "recipient": 2,
      "type": "assignment",
      "title": "New task: TF-5",
      "body": "alice created task 'Implement dark mode' in project TaskFlow Platform Development.",
      "read": false,
      "actorId": 1,
      "actor": { "id": 1, "username": "alice", "email": "alice@taskflow.com", "first_name": "Alice", "last_name": "Smith" },
      "related_task_id": 5,
      "related_project_id": 1,
      "createdAt": "2026-06-22T12:00:00Z"
    }
  ]
}
```

#### `PATCH /api/notifications/{id}/`

Mark a single notification as read.

**Request body:**
```json
{ "read": true }
```

#### `POST /api/notifications/mark_all_read/`

Mark all of the member's unread notifications as read.

**Response (200):**
```json
{ "message": "All notifications marked as read." }
```

---

### Members

*Requires: `IsTenantMember` (read) / `IsTenantAdmin` (write, invite)*

#### `GET /api/members/`

List all members in the current tenant.

**Response (200):**
```json
{
  "count": 3,
  "results": [
    {
      "id": 1,
      "user": 1,
      "username": "alice",
      "name": "Alice Smith",
      "email": "alice@taskflow.com",
      "role": "manager",
      "status": "active",
      "title": "Engineering Manager",
      "initials": "AS",
      "created_at": "2026-06-22T12:00:00Z",
      "updated_at": "2026-06-22T12:00:00Z"
    }
  ]
}
```

#### `POST /api/members/invite/`

Invite a user to the tenant workspace (admin only).

**Request body:**
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "role": "member",
  "title": "Designer"
}
```

**Response (201):** The created member object.

---

## Error Responses

All errors follow DRF conventions:

```json
{
  "detail": "Error message",
  "code": "error_code"
}
```

### Common Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 204 | No Content (delete) |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient role) |
| 404 | Not Found |
| 429 | Too Many Requests (rate limited) |
| 503 | Service Unavailable (health check failure) |

---

## Rate Limiting

Auth endpoints are rate-limited via `django-ratelimit`:

| Endpoint | Limit | Key |
|----------|-------|-----|
| `POST /api/auth/token/` | 5 requests/minute | IP address |
| `POST /api/auth/token/refresh/` | 30 requests/minute | IP address |

Rate limiting is **disabled when `DEBUG=True`** (via `RATELIMIT_ENABLE = not DEBUG`).

---

## OpenAPI / Swagger

Auto-generated documentation is available at runtime:

| URL | Format |
|-----|--------|
| `/api/schema/` | OpenAPI 3 YAML |
| `/api/docs/` | Swagger UI (interactive) |

Generated by DRF Spectacular with `deepLinking` and `persistAuthorization` enabled.
