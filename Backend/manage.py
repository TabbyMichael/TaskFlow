#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys

# Both the repo root (for tasks/) and the Backend/ dir (for core/, sprints/, organizations/)
# need to be on sys.path.
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))  # .../TaskFlow/Backend
REPO_ROOT = os.path.dirname(BACKEND_DIR)                   # .../TaskFlow

for path in [BACKEND_DIR, REPO_ROOT]:
    if path not in sys.path:
        sys.path.insert(0, path)


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'taskforge_backend.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
