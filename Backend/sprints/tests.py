from django.test import TestCase
from django.contrib.auth import get_user_model
from django_tenants.utils import schema_context
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from django.db import connection
from organizations.models import Organization, Domain
from core.models import Member, Project
from .models import Sprint
from tasks.models import Task

User = get_user_model()


def _ensure_public_tenant():
    # Tenant schemas leak across test methods; tenant creation requires the
    # connection to be on the public schema.
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
    return public_tenant

class SprintAPITestCase(APITestCase):
    def setUp(self):
        _ensure_public_tenant()

        self.user = User.objects.create_user(
            username='sprintuser',
            email='sprint@test.com',
            password='testpass123',
        )
        self.tenant = Organization.objects.create(
            schema_name='sprint_test',
            name='Sprint Test',
            slug='sprint_test',
        )
        Domain.objects.create(
            domain='sprint.localhost',
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
                key='SP',
                name='Sprint Project',
                lead=self.member,
            )
            self.sprint = Sprint.objects.create(
                project=self.project,
                name='Sprint 1',
                status='planned',
            )

    def _auth_headers(self):
        resp = self.client.post(
            reverse('token_obtain_pair'),
            {'username': 'sprintuser', 'password': 'testpass123'},
            HTTP_HOST='localhost',
        )
        token = resp.data['access']
        return {'HTTP_AUTHORIZATION': f'Bearer {token}'}

    def test_create_sprint(self):
        headers = self._auth_headers()
        url = reverse('sprint-list')
        resp = self.client.post(
            url,
            {'project': self.project.id, 'name': 'Sprint 2', 'status': 'planned'},
            HTTP_HOST='sprint.localhost',
            **headers,
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Sprint.objects.filter(name='Sprint 2').count(), 1)

    def test_start_sprint(self):
        headers = self._auth_headers()
        url = f"/api/sprints/{self.sprint.id}/start/"
        resp = self.client.post(
            url,
            HTTP_HOST='sprint.localhost',
            **headers,
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.sprint.refresh_from_db()
        self.assertEqual(self.sprint.status, 'active')

    def test_cannot_start_duplicate_active_sprint(self):
        headers = self._auth_headers()
        with schema_context(self.tenant.schema_name):
            Sprint.objects.create(
                project=self.project,
                name='Sprint Duplicate',
                status='active',
            )
        url = f"/api/sprints/{self.sprint.id}/start/"
        resp = self.client.post(
            url,
            HTTP_HOST='sprint.localhost',
            **headers,
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.sprint.refresh_from_db()
        self.assertEqual(self.sprint.status, 'planned')

    def test_complete_sprint_moves_incomplete_tasks_to_backlog(self):
        headers = self._auth_headers()
        with schema_context(self.tenant.schema_name):
            task_done = Task.objects.create(
                project=self.project,
                title='Done task',
                status='done',
                priority='medium',
                sprint=self.sprint,
                reporter=self.member,
            )
            task_open = Task.objects.create(
                project=self.project,
                title='Open task',
                status='todo',
                priority='medium',
                sprint=self.sprint,
                reporter=self.member,
            )

        url = f"/api/sprints/{self.sprint.id}/complete/"
        resp = self.client.post(
            url,
            HTTP_HOST='sprint.localhost',
            **headers,
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.sprint.refresh_from_db()
        self.assertEqual(self.sprint.status, 'completed')

        with schema_context(self.tenant.schema_name):
            task_open.refresh_from_db()
            self.assertIsNone(task_open.sprint)
            task_done.refresh_from_db()
            self.assertEqual(task_done.sprint, self.sprint)
