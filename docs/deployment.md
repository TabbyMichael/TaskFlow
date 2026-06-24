# Deployment Documentation

This document describes how to build, deploy, and operate TaskFlow in production, including Docker images, environment variables, CI/CD pipelines, and rollback procedures.

---

## 1. Deployment Overview

TaskFlow is deployed as a containerized application:

- **Frontend:** Multi-stage Docker build producing an nginx + static asset image
- **Backend:** Django application served via Gunicorn (or `runserver` in dev)
- **Data:** PostgreSQL 17 with schema-per-tenant multi-tenancy
- **Cache/Queue:** Redis 7 for computed property caching, rate limiting, and session store

---

## 2. Build Process

### Backend Docker Image

```dockerfile
# Backend/Dockerfile (existing)
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
```

Build command:
```bash
docker build -t taskflow-backend:latest ./Backend
```

### Frontend Docker Image (Multi-stage)

```dockerfile
# Frontend/Dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

Build command:
```bash
docker build -t taskflow-frontend:latest ./Frontend
```

### Build via Make

```bash
make build
```

---

## 3. Environment Variables

### Backend (`Backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SECRET_KEY` | **Yes** | `django-insecure-dev-key-change-in-production` | Django secret key |
| `DEBUG` | No | `False` | Enable debug mode |
| `ALLOWED_HOSTS` | No | `localhost,127.0.0.1` | Comma-separated allowed hosts |
| `DB_NAME` | **Yes** | `taskforge_db` | PostgreSQL database name |
| `DB_USER` | **Yes** | `postgres` | PostgreSQL username |
| `DB_PASSWORD` | **Yes** | `password` | PostgreSQL password |
| `DB_HOST` | **Yes** | `localhost` | PostgreSQL host |
| `DB_PORT` | No | `5433` | PostgreSQL port |
| `REDIS_URL` | No | `redis://localhost:6379/0` | Redis connection URL |
| `CORS_ALLOWED_ORIGINS` | **Yes** | `http://localhost:8080,http://localhost:3000` | CORS origins |
| `SENTRY_DSN` | No | `` | Sentry error tracking DSN |
| `ENVIRONMENT` | No | `development` | Environment label for Sentry |
| `EMAIL_BACKEND` | No | `django.core.mail.backends.console.EmailBackend` | Email backend |
| `DEFAULT_FROM_EMAIL` | No | `noreply@taskflow.local` | From address for emails |

### Frontend (`.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | **Yes** | `http://localhost:8000` | Backend API base URL |

---

## 4. Docker Compose (Local/Production)

`docker-compose.yml` defines four services:

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| `db` | `postgres:17` | `5433:5432` | PostgreSQL database |
| `redis` | `redis:7-alpine` | `6379:6379` | Cache and rate limit store |
| `backend` | Local build (`./Backend`) | `8000:8000` | Django API server |
| `frontend` | Local build (`./Frontend`) | `8080:8080` | nginx + SPA static assets |

### Service Dependencies

```yaml
depends_on:
  db:
    condition: service_healthy
  redis:
    condition: service_healthy
```

Each service includes a healthcheck:

| Service | Healthcheck |
|---------|-------------|
| `db` | `pg_isready -U postgres` |
| `redis` | `redis-cli ping` |
| `backend` | `curl -f http://localhost:8000/health/` |
| `frontend` | `wget --spider http://localhost:8080` |

### Healthcheck Timing

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8000/health/"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

---

## 5. Local Development Deployment

```bash
# 1. Clone

git clone https://github.com/your-org/TaskFlow.git
cd TaskFlow

# 2. Start infrastructure

docker compose up -d db redis

# 3. Backend

cd Backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# 4. Frontend (new terminal)

cd Frontend
npm install
npm run dev

# 5. Verify
curl http://localhost:8000/health/
```

Access points:
- Frontend: `http://localhost:8080`
- Backend API: `http://localhost:8000/api/`
- API Docs: `http://localhost:8000/api/docs/`
- Health: `http://localhost:8000/health/`

---

## 6. Production Deployment

### Prerequisites

- Docker and Docker Compose installed on the host
- A PostgreSQL database (managed or self-hosted)
- A Redis instance (managed or self-hosted)
- A domain name with DNS pointing to your server

### Option A: Docker Compose (Single Server)

1. Clone and configure:
```bash
git clone https://github.com/your-org/TaskFlow.git
cd TaskFlow
cp Backend/.env.example Backend/.env
cp Frontend/.env.example Frontend/.env
# Edit .env files with production values
```

2. Deploy:
```bash
docker compose up -d --build
```

3. Run migrations:
```bash
docker compose exec backend python manage.py migrate --noinput
docker compose exec backend python manage.py createsuperuser
```

### Option B: Kubernetes

Kubernetes manifests are not included in the current repository. The application can be deployed using standard Django + React patterns:

- Deploy PostgreSQL and Redis as managed services (or use Helm charts)
- Create `Deployment` resources for backend and frontend
- Use a `Service` and `Ingress` for external access
- Store secrets in a `Secret` resource

---

## 7. Database Migrations

### Create a New Migration

```bash
cd Backend
python manage.py makemigrations
# For multi-tenant schemas, apply to all schemas:
python manage.py migrate_schemas --shared
```

### Apply Migrations in Production

```bash
docker compose exec backend python manage.py migrate --noinput
```

### Zero-Downtime Migrations

For non-destructive schema changes, use Django's standard migration workflow. For destructive changes, consider a blue-green or rolling deployment strategy.

---

## 8. CI/CD Pipeline

### GitHub Actions

`.github/workflows/ci.yml` defines the following jobs:

| Job | Trigger | Purpose |
|-----|---------|---------|
| `lint-backend` | push, PR | flake8 + black checks |
| `lint-frontend` | push, PR | ESLint + Prettier checks |
| `test-backend` | push, PR | Django test suite with Postgres + Redis services |
| `build-frontend` | push, PR | TypeScript type check + build |
| `build-docker-images` | push to main/develop | Build and tag Docker images |

### Woodpecker CI (Free Self-Hosted Alternative)

`.woodpecker.yml` provides a free alternative without GitHub Actions billing:

- Same trigger branches (`main`, `develop`)
- PostgreSQL 17 + Redis 7 as sidecar services for tests
- Docker-in-Docker for image builds
- Runs the full backend test suite

---

## 9. Monitoring

### Health Check

```bash
curl http://localhost:8000/health/
```

Expected response when healthy:
```json
{
  "database": "ok",
  "redis": "ok",
  "service": "taskflow-backend",
  "status": "ok"
}
```

If unhealthy, the response has `status: "error"` and details in the failing component field.

### Logs

```bash
# Backend logs (Docker Compose)
docker compose logs -f backend

# Frontend logs
docker compose logs -f frontend

# Database logs
docker compose logs -f db

# Streaming backend logs directly (if running locally)
cd Backend
../venv/bin/python manage.py runserver
```

Structured request logging is provided by `RequestLoggingMiddleware`, which logs method, path, tenant, user, status code, and duration for every request.

---

## 10. Backup & Restore

### Backup PostgreSQL

```bash
# Dump all schemas
docker compose exec db pg_dump -U postgres -d taskforge_db -F c -f /tmp/backup.dump
# Copy out
docker compose cp db:/tmp/backup.dump ./backup.dump
```

### Restore PostgreSQL

```bash
docker compose cp ./backup.dump db:/tmp/backup.dump
docker compose exec db pg_restore -U postgres -d taskforge_db /tmp/backup.dump
```

**Warning:** Schema-per-tenant databases require special handling for cross-schema restores. Test restores in a staging environment first.

---

## 11. Rollback Strategy

### Application Rollback

```bash
# Roll back Docker image tag
docker compose down
docker compose up -d --no-build
```

### Database Rollback

```bash
cd Backend
# List migrations
python manage.py showmigrations

# Roll back a specific app
python manage.py migrate <app_name> <previous_migration_name>
```

### Zero-Downtime Deployment

1. Build and push new Docker image with a unique tag (e.g., commit SHA)
2. Start new container alongside old one
3. Run health checks
4. Switch traffic (update nginx upstream or Kubernetes service)
5. Stop old container

---

## 12. Production Checklist

- [ ] `SECRET_KEY` is set to a strong random value
- [ ] `DEBUG=False`
- [ ] `ALLOWED_HOSTS` includes your domain
- [ ] `CORS_ALLOWED_ORIGINS` restricts to production frontend origins
- [ ] HTTPS is configured (via reverse proxy or load balancer)
- [ ] Database backups are automated and tested
- [ ] `SENTRY_DSN` is configured for error tracking
- [ ] Redis is secured (password-protected in production)
- [ ] Docker images are scanned for vulnerabilities
- [ ] Health checks are monitored and alerting is configured
- [ ] CI/CD pipeline is running and green before merging
- [ ] Frontend `VITE_API_URL` points to the production API

---

## 13. Troubleshooting

### Database Connection Issues

Check that the PostgreSQL container is healthy:
```bash
docker compose ps db
docker compose logs db
# Test connection
ocker compose exec db pg_isready -U postgres
```

### Redis Connection Issues

```bash
docker compose ps redis
docker compose logs redis
docker compose exec redis redis-cli ping
```

### Migration Issues

```bash
# Check migration status
cd Backend
python manage.py showmigrations

# Re-run migrations
python manage.py migrate --noinput

# If schema is out of sync, use run_syncdb sparingly
python manage.py migrate --run-syncdb
```

### Frontend Not Loading API

Common causes:
1. `VITE_API_URL` is not set or points to the wrong host
2. CORS is not configured for the production origin
3. Backend is not running or not reachable on the expected port

---

## 14. Scaling Considerations

| Concern | Strategy |
|---------|----------|
| **Read-heavy workloads** | Redis caching for computed properties; `select_related` on viewsets |
| **Database load** | Schema-per-tenant keeps tables small; connection pooling (`CONN_MAX_AGE=600`) |
| **API scaling** | Stateless backend (JWT auth) — scale horizontally behind a load balancer |
| **Frontend scaling** | Static assets served by nginx; can be offloaded to CDN |
| **Search** | PostgreSQL full-text search handles moderate load; consider Elasticsearch for large datasets |

