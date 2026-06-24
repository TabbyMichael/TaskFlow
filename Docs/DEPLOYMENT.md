# TaskFlow Deployment Guide

## Prerequisites
- Docker & Docker Compose
- Python 3.12+ (for local development)
- Node.js 22+ (for frontend development)
- PostgreSQL 18 (or use Docker)
- Redis 7 (or use Docker)

## Environment Variables

### Backend (.env)
```env
# Django Core
SECRET_KEY=your-secret-key-here-use-openssl-rand-base64-64
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,your-domain.com

# Database
DB_NAME=taskforge_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432

# Redis
REDIS_URL=redis://localhost:6379/0

# CORS
CORS_ALLOWED_ORIGINS=https://your-domain.com,https://app.your-domain.com

# Email (optional - for notifications)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=your-sendgrid-api-key
DEFAULT_FROM_EMAIL=noreply@your-domain.com

# Sentry (optional - for error tracking)
SENTRY_DSN=https://your-sentry-dsn
ENVIRONMENT=production

# Media
MEDIA_ROOT=/app/media
```

### Frontend (.env)
```env
VITE_API_URL=https://api.your-domain.com
```

## Local Development

### 1. Clone Repository
```bash
git clone https://github.com/your-org/TaskFlow.git
cd TaskFlow
```

### 2. Start Infrastructure
```bash
docker-compose up -d db redis
```

### 3. Setup Backend
```bash
cd Backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### 4. Setup Frontend
```bash
cd Frontend
npm install
npm run dev
```

### 5. Access Application
- Frontend: http://localhost:8080
- Backend API: http://localhost:8000/api/
- API Docs: http://localhost:8000/api/docs/
- Health Check: http://localhost:8000/health/

## Production Deployment

### Option 1: Docker Compose (Single Server)

1. **Clone and configure**
```bash
git clone https://github.com/your-org/TaskFlow.git
cd TaskFlow
cp Backend/.env.example Backend/.env
cp Frontend/.env.example Frontend/.env
# Edit .env files with production values
```

2. **Deploy**
```bash
docker-compose up -d --build
```

3. **Run migrations**
```bash
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
```

### Option 2: Kubernetes (Multi-Server)

See `k8s/` directory for manifests (to be created).

## Database Migrations

### Create New Migration
```bash
cd Backend
python manage.py makemigrations
python manage.py migrate
```

### Apply Migrations in Production
```bash
docker-compose exec backend python manage.py migrate
```

## Backup & Restore

### Backup PostgreSQL
```bash
docker-compose exec db pg_dump -U postgres taskforge_db > backup.sql
```

### Restore PostgreSQL
```bash
docker-compose exec -T db psql -U postgres taskforge_db < backup.sql
```

## Monitoring

### Health Check
```bash
curl http://localhost:8000/health/
```

Expected response:
```json
{
  "status": "ok",
  "database": "ok",
  "redis": "ok",
  "service": "taskflow-backend"
}
```

### Logs
```bash
# Backend logs
docker-compose logs -f backend

# Frontend logs
docker-compose logs -f frontend

# Database logs
docker-compose logs -f db
```

## Security Checklist

- [ ] Change `SECRET_KEY` in production
- [ ] Set `DEBUG=False`
- [ ] Configure `ALLOWED_HOSTS`
- [ ] Use HTTPS (configure reverse proxy)
- [ ] Set strong database password
- [ ] Enable Sentry for error tracking
- [ ] Configure CORS origins
- [ ] Set up email backend
- [ ] Regular security updates
- [ ] Database backups automated

## Performance Tuning

### Database
- Connection pooling enabled (CONN_MAX_AGE: 600)
- Redis caching for computed properties
- Indexes on frequently queried fields

### Application
- Gzip compression (nginx)
- Static asset caching (1 year)
- Database query optimization with select_related/prefetch_related

### Scaling
- Horizontal: Add more backend instances behind load balancer
- Vertical: Increase CPU/RAM for database
- Database: Consider read replicas for heavy read workloads

## Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps db

# Check PostgreSQL logs
docker-compose logs db

# Test connection
docker-compose exec db psql -U postgres -c "SELECT 1"
```

### Redis Connection Issues
```bash
# Check if Redis is running
docker-compose ps redis

# Test connection
docker-compose exec redis redis-cli ping
```

### Migration Issues
```bash
# Fake migrations if needed
python manage.py migrate --fake

# Reset migrations (WARNING: data loss)
python manage.py migrate --run-syncdb
```

## Support

For issues and questions:
- GitHub Issues: https://github.com/your-org/TaskFlow/issues
- Documentation: See README.md