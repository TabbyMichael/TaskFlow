import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'taskforge_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from django_tenants.utils import schema_context
from organizations.models import Organization, Domain
from core.models import Member, Project
from sprints.models import Sprint
from tasks.models import Task, Comment

User = get_user_model()

def bootstrap():
    print("=== Bootstrapping TaskFlow Multi-Tenant Database ===")

    # 1. Create Public Tenant
    if not Organization.objects.filter(schema_name='public').exists():
        print("Creating public tenant...")
        public_tenant = Organization.objects.create(
            schema_name='public',
            name='Public Schema',
            slug='public',
            plan='Enterprise'
        )
        Domain.objects.create(
            domain='localhost',
            tenant=public_tenant,
            is_primary=True
        )
        print("Public tenant created successfully.")
    else:
        print("Public tenant already exists.")

    # 2. Create Global Users
    print("Creating global users...")
    admin_user, created = User.objects.get_or_create(
        username='admin',
        defaults={'email': 'admin@taskflow.com', 'first_name': 'System', 'last_name': 'Admin'}
    )
    if created:
        admin_user.set_password('password')
        admin_user.save()
        print("Admin user created (username: admin, password: password).")
    else:
        print("Admin user already exists.")

    member_user, created = User.objects.get_or_create(
        username='john',
        defaults={'email': 'john@taskflow.com', 'first_name': 'John', 'last_name': 'Doe'}
    )
    if created:
        member_user.set_password('password')
        member_user.save()

    manager_user, created = User.objects.get_or_create(
        username='alice',
        defaults={'email': 'alice@taskflow.com', 'first_name': 'Alice', 'last_name': 'Smith'}
    )
    if created:
        manager_user.set_password('password')
        manager_user.save()

    # 3. Create Demo Tenant
    if not Organization.objects.filter(slug='demo').exists():
        print("Creating demo tenant 'demo.localhost'...")
        demo_tenant = Organization.objects.create(
            schema_name='demo',
            name='Demo Organization',
            slug='demo',
            plan='Enterprise'
        )
        Domain.objects.create(
            domain='demo.localhost',
            tenant=demo_tenant,
            is_primary=True
        )
        print("Demo tenant created.")
    else:
        demo_tenant = Organization.objects.get(slug='demo')
        print("Demo tenant already exists.")

    # 4. Populate Demo Tenant Schema Data
    print("Populating data inside 'demo' schema...")
    with schema_context(demo_tenant.schema_name):
        # Create Members
        admin_member, _ = Member.objects.get_or_create(
            user=admin_user,
            defaults={'role': 'admin', 'status': 'active', 'title': 'Project Administrator'}
        )
        john_member, _ = Member.objects.get_or_create(
            user=member_user,
            defaults={'role': 'member', 'status': 'active', 'title': 'Software Engineer'}
        )
        alice_member, _ = Member.objects.get_or_create(
            user=manager_user,
            defaults={'role': 'manager', 'status': 'active', 'title': 'Engineering Manager'}
        )

        # Create Project
        project, created = Project.objects.get_or_create(
            key='TF',
            defaults={
                'name': 'TaskFlow Platform Development',
                'description': 'Main product development lifecycle tracking core features and infra.',
                'status': 'active',
                'lead': alice_member,
                'color': '#4f46e5'
            }
        )
        if created:
            project.members.add(admin_member, john_member, alice_member)
            print("Demo project 'TaskFlow Platform Development' created.")

        # Create Sprint
        sprint, created = Sprint.objects.get_or_create(
            project=project,
            name='Sprint 1 - Foundation & Routing',
            defaults={
                'goal': 'Configure and finalize core backend models, router, and simplejwt integration.',
                'status': 'active',
                'start_date': '2026-06-15',
                'end_date': '2026-06-29'
            }
        )
        if created:
            print("Sprint 1 created.")

        # Create Tasks
        task1, created = Task.objects.get_or_create(
            project=project,
            title='Define Django-Tenants shared and tenant apps schema',
            defaults={
                'description': 'Configure settings.py and organize files for models to map correctly to search path.',
                'status': 'done',
                'priority': 'high',
                'assignee': alice_member,
                'reporter': admin_member,
                'sprint': sprint,
                'story_points': 5,
                'labels': ['backend', 'infra']
            }
        )
        if created:
            Comment.objects.create(
                task=task1,
                author=alice_member,
                body="Completed the shared and tenant app models setup."
            )

        task2, created = Task.objects.get_or_create(
            project=project,
            title='Implement REST endpoints for Projects, Tasks, and Sprints',
            defaults={
                'description': 'Create views and serializers mapping exactly to the frontend camelCase model schemas.',
                'status': 'in_progress',
                'priority': 'high',
                'assignee': john_member,
                'reporter': alice_member,
                'sprint': sprint,
                'story_points': 8,
                'labels': ['backend', 'api'],
                'checklist': [
                    {'id': '1', 'text': 'Write serializers', 'done': True},
                    {'id': '2', 'text': 'Build views/viewsets', 'done': True},
                    {'id': '3', 'text': 'Test permission constraints', 'done': False}
                ]
            }
        )

        task3, created = Task.objects.get_or_create(
            project=project,
            title='Set up SimpleJWT token generation and verification tests',
            defaults={
                'description': 'Validate login endpoint yields valid tokens and authorization headers protect endpoints.',
                'status': 'todo',
                'priority': 'medium',
                'assignee': john_member,
                'reporter': alice_member,
                'sprint': sprint,
                'story_points': 3,
                'labels': ['backend', 'security']
            }
        )

    print("=== Database Bootstrapping Completed ===")

if __name__ == '__main__':
    bootstrap()
