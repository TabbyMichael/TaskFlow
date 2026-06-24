from django.test import TestCase
from django.contrib.auth import get_user_model
from django_tenants.utils import schema_context
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from django.db import connection
from organizations.models import Organization, Domain
from core.models import Member, Project
from sprints.models import Sprint
from tasks.models import Task, Comment, ActivityItem

User = get_user_model()

class MultiTenantOnboardingTestCase(APITestCase):
    def setUp(self):
        # Tenant schemas leak across test methods; reset before creating tenants.
        connection.set_schema_to_public()
        # Ensure public tenant and domain exist for onboarding
        public_tenant, _ = Organization.objects.get_or_create(
            schema_name='public',
            name='Public Schema',
            slug='public',
            plan='Enterprise'
        )
        Domain.objects.get_or_create(domain='localhost', tenant=public_tenant, is_primary=True)
        Domain.objects.get_or_create(domain='testserver', tenant=public_tenant, is_primary=False)
    def test_onboarding_creates_tenant_and_admin(self):
        url = reverse('onboarding')
        data = {
            'username': 'testadmin',
            'email': 'testadmin@example.com',
            'password': 'testpassword123',
            'firstName': 'Test',
            'lastName': 'Admin',
            'orgName': 'Test Corp',
            'orgSlug': 'testcorp'
        }
        
        response = self.client.post(url, data, format='json', HTTP_HOST='localhost')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('domain', response.data)
        self.assertEqual(response.data['domain'], 'testcorp.localhost')

        # Check tenant exists in public DB
        tenant = Organization.objects.get(slug='testcorp')
        self.assertEqual(tenant.name, 'Test Corp')

        # Check member exists in tenant schema
        with schema_context(tenant.schema_name):
            user = User.objects.get(username='testadmin')
            member = Member.objects.get(user=user)
            self.assertEqual(member.role, 'admin')
            self.assertEqual(member.status, 'active')


class SchemaIsolationAndRBACTestCase(APITestCase):
    def setUp(self):
        connection.set_schema_to_public()
        # 1. Ensure public schema
        self.public_tenant, _ = Organization.objects.get_or_create(
            schema_name='public',
            name='Public Schema',
            slug='public',
            plan='Enterprise'
        )
        Domain.objects.get_or_create(
            domain='localhost',
            tenant=self.public_tenant,
            is_primary=True
        )

        # Create global users
        self.admin_user = User.objects.create_user(username='admin', email='admin@t.com', password='password')
        self.manager_user = User.objects.create_user(username='manager', email='m@t.com', password='password')
        self.member_user = User.objects.create_user(username='member', email='mem@t.com', password='password')
        self.viewer_user = User.objects.create_user(username='viewer', email='v@t.com', password='password')

        # 2. Create Tenant A
        self.tenant_a = Organization.objects.create(
            schema_name='tenant_a',
            name='Tenant A',
            slug='tenant_a',
            plan='Enterprise'
        )
        Domain.objects.create(domain='a.localhost', tenant=self.tenant_a, is_primary=True)

        with schema_context(self.tenant_a.schema_name):
            self.member_admin = Member.objects.create(user=self.admin_user, role='admin')
            self.member_manager = Member.objects.create(user=self.manager_user, role='manager')
            self.member_mem = Member.objects.create(user=self.member_user, role='member')
            self.member_view = Member.objects.create(user=self.viewer_user, role='viewer')

            # Create project
            self.proj_a = Project.objects.create(
                key='TA',
                name='Project A',
                lead=self.member_admin
            )

        # 3. Create Tenant B (isolation check)
        self.tenant_b = Organization.objects.create(
            schema_name='tenant_b',
            name='Tenant B',
            slug='tenant_b',
            plan='Enterprise'
        )
        Domain.objects.create(domain='b.localhost', tenant=self.tenant_b, is_primary=True)

        with schema_context(self.tenant_b.schema_name):
            self.proj_b = Project.objects.create(
                key='TB',
                name='Project B'
            )

    def test_schema_isolation(self):
        # In Tenant A context, we should only see Project A
        with schema_context(self.tenant_a.schema_name):
            self.assertEqual(Project.objects.count(), 1)
            self.assertEqual(Project.objects.first().name, 'Project A')

        # In Tenant B context, we should only see Project B
        with schema_context(self.tenant_b.schema_name):
            self.assertEqual(Project.objects.count(), 1)
            self.assertEqual(Project.objects.first().name, 'Project B')

    def test_jwt_auth_and_rbac_permission_rules(self):
        # Generate token for viewer
        login_url = reverse('token_obtain_pair')
        response = self.client.post(login_url, {'username': 'viewer', 'password': 'password'}, HTTP_HOST='localhost')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        token = response.data['access']

        # Force tenant A domain
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # In Tenant A context
        with schema_context(self.tenant_a.schema_name):
            # A viewer tries to create a project
            proj_list_url = '/api/projects/'
            
            # Simulate request under tenant domain context
            # (In production, the middleware resolves request.tenant from host header 'a.localhost')
            # For the purpose of standard APITestCase, we simulate the middleware context by mocking it
            # or by calling client requests with the Host header.
            # django-tenants matches Host header!
            response = self.client.post(
                proj_list_url,
                {'key': 'FAIL', 'name': 'Fail Project'},
                HTTP_HOST='a.localhost'
            )
            # Viewer should be rejected with 403 Forbidden
            self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

            # Let's try with manager
            response_m = self.client.post(login_url, {'username': 'manager', 'password': 'password'}, HTTP_HOST='localhost')
            token_m = response_m.data['access']
            self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token_m}')

            response = self.client.post(
                proj_list_url,
                {'key': 'OK', 'name': 'Success Project'},
                HTTP_HOST='a.localhost'
            )
            # Manager should succeed
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            self.assertEqual(Project.objects.filter(key='OK').exists(), True)

    def test_signal_logging_and_activity_tracking(self):
        with schema_context(self.tenant_a.schema_name):
            # Create sprint
            sprint = Sprint.objects.create(project=self.proj_a, name='Sprint 1')

            # Create task (this will trigger post_save task signal)
            task = Task.objects.create(
                project=self.proj_a,
                title='Test Signal Task',
                reporter=self.member_admin,
                sprint=sprint,
                story_points=3
            )

            # Check ActivityItem created for task creation
            activities = ActivityItem.objects.filter(task=task)
            self.assertEqual(activities.count(), 1)
            self.assertEqual(activities.first().type, 'created')

            # Attach _actor to task and update status (this triggers pre_save status change signal)
            task._actor = self.member_manager
            task.status = 'in_progress'
            task.save()

            # Check status change activity logged
            activities = ActivityItem.objects.filter(task=task, type='status_changed')
            self.assertEqual(activities.count(), 1)
            self.assertIn("changed status", activities.first().message)
            self.assertEqual(activities.first().actor, self.member_manager)

            # Create Comment (this triggers comment signal)
            Comment.objects.create(task=task, author=self.member_mem, body="This is a test comment")
            activities = ActivityItem.objects.filter(task=task, type='commented')
            self.assertEqual(activities.count(), 1)
            self.assertEqual(activities.first().actor, self.member_mem)

            self.assertEqual(activities.count(), 1)
            self.assertEqual(activities.first().actor, self.member_mem)


class ProjectModelTestCase(TestCase):
    """
    Tests for Project model: task_counter, invalidate_cache, and progress.
    """

    def setUp(self):
        connection.set_schema_to_public()
        public_tenant, _ = Organization.objects.get_or_create(
            schema_name='public',
            name='Public Schema',
            slug='public',
            plan='Enterprise',
        )
        Domain.objects.get_or_create(
            domain='localhost',
            tenant=public_tenant,
            is_primary=True,
        )
        Domain.objects.get_or_create(
            domain='testserver',
            tenant=public_tenant,
            is_primary=False,
        )

        self.user = User.objects.create_user(
            username='projuser',
            email='proj@test.com',
            password='pass123',
        )
        self.tenant = Organization.objects.create(
            schema_name='proj_test',
            name='Proj Test',
            slug='proj_test',
            plan='Enterprise',
        )
        Domain.objects.create(
            domain='proj.localhost',
            tenant=self.tenant,
            is_primary=True,
        )

        with schema_context(self.tenant.schema_name):
            self.member = Member.objects.create(
                user=self.user,
                role='admin',
                status='active',
            )
            self.project = Project.objects.create(
                key='PJ',
                name='Project Test',
                lead=self.member,
            )

    def test_task_counter_starts_at_zero(self):
        with schema_context(self.tenant.schema_name):
            self.assertEqual(self.project.task_counter, 0)

    def test_invalidate_cache_does_not_crash(self):
        with schema_context(self.tenant.schema_name):
            # Should not raise even when cache is empty
            self.project.invalidate_cache()

    def test_progress_zero_when_no_tasks(self):
        with schema_context(self.tenant.schema_name):
            self.assertEqual(self.project.progress, 0)

    def test_progress_with_tasks(self):
        with schema_context(self.tenant.schema_name):
            from tasks.models import Task
            Task.objects.create(
                project=self.project,
                title='Done',
                status='done',
                reporter=self.member,
            )
            Task.objects.create(
                project=self.project,
                title='Todo',
                status='todo',
                reporter=self.member,
            )
            self.assertEqual(self.project.progress, 50)
