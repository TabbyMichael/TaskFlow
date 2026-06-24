# TaskFlow — Local CI Makefile
# Run these commands to verify your changes before pushing.
# Requires: Docker, Python 3.12+, Node.js 22+
#
# Usage:
#   make ci              # Run all CI steps in sequence
#   make lint-backend    # Backend lint only
#   make lint-frontend   # Frontend lint only
#   make test-backend    # Backend tests only (requires docker compose up -d db)
#   make test-frontend   # Frontend tests only
#   make build           # Build Docker images

.PHONY: ci lint-backend lint-frontend test-backend test-frontend build setup clean

# ── Full CI pipeline ─────────────────────────────────────────────────────────
ci: lint-backend lint-frontend test-backend test-frontend build

# ── Setup ────────────────────────────────────────────────────────────────────
setup:
	cd Backend && pip install -q -r requirements.txt
	cd Frontend && npm ci --no-audit --no-fund

# ── Backend lint ─────────────────────────────────────────────────────────────
lint-backend:
	cd Backend && pip install -q flake8 black
	cd Backend && flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
	cd Backend && flake8 . --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics
	cd Backend && black --check .

# ── Frontend lint ────────────────────────────────────────────────────────────
lint-frontend:
	cd Frontend && npx prettier --check .
	cd Frontend && npm run lint

# ── Backend tests ────────────────────────────────────────────────────────────
test-backend:
	cd Backend && ../venv/bin/python manage.py test \
		core.tests organizations.tests sprints.tests tasks.tests notifications.tests health.tests \
		--settings=tests.setup.test_settings \
		--verbosity=2

# ── Frontend tests ───────────────────────────────────────────────────────────
test-frontend:
	cd Frontend && npx vitest run --reporter=verbose

# ── Build Docker images ──────────────────────────────────────────────────────
build:
	docker build -t taskflow-backend:latest ./Backend
	docker build -t taskflow-frontend:latest ./Frontend

# ── Cleanup ──────────────────────────────────────────────────────────────────
clean:
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name node_modules -exec rm -rf {} + 2>/dev/null || true