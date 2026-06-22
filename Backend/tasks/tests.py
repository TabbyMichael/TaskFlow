from django.test import TestCase
from django.contrib.auth import get_user_model
from django_tenants.utils import schema_context
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from organizations.models import Organization, Domain
from core.models import Member, Project
from sprints.models import Sprint
from .models import Task, Comment, ActivityItem

User = get_user_model()


def _ensure_public_tenant():
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
n

class TaskAPITestCase(APITestCase):
    def setUp(self):
        _ensure_public_tenant()

        self.user = User.objects.create_user(
            username='taskuser',
            email='task@test.com',
            password='testpass123',
        )
        self.tenant = Organization.objects.create(
            schema_name='task_test',
            name='Task Test',
            slug='task_test',
        )
        Domain.objects.create(
            domain='task.localhost',
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
                key='TT',
                name='Task Project',
                lead=self.member,
            )
            self.sprint = Sprint.objects.create(
                project=self.project,
                name='Sprint 1',
                status='active',
            )

    def _auth_headers(self):
        resp = self.client.post(
            reverse('token_obtain_pair'),
            {'username': 'taskuser', 'password': 'testpass123'},
            HTTP_HOST='localhost',
        )
        token = resp.data['access']
        return {'HTTP_AUTHORIZATION': f'Bearer {token}'}

    def test_create_task_auto_generates_key(self):
        headers = self._auth_headers()
        url = reverse('task-list')
        resp = self.client.post(
            url,
            {
                'title': 'New task',
                'project': self.project.id,
                'status': 'todo',
                'priority': 'medium',
            },
            HTTP_HOST='task.localhost',
            **headers,
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Task.objects.count(), 1)
        task = Task.objects.first()
        self.assertEqual(task.key, 'TT-1')

    def test_second_task_increments_key(self):
        Task.objects.create(
            project=self.project,
            title='First',
            key='TT-1',
            status='todo',
            priority='medium',
        )
        headers = self._auth_headers()
        url = reverse('task-list')
        resp = self.client.post(
            url,
            {
                'title': 'Second',
                'project': self.project.id,
                'status': 'todo',
                'priority': 'medium',
            },
            HTTP_HOST='task.localhost',
            **headers,
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        task2 = Task.objects.filter(title='Second').first()
        self.assertEqual(task2.key, 'TT-2')

    def test_filter_tasks_by_project(self):
        Task.objects.create(
            project=self.project,
            title='Project task',
            key='TT-1',
            status='todo',
            priority='medium',
        )
        url = f"/api/tasks/?projectId={self.project.id}"
        resp = self.client.get(
            url,
            HTTP_HOST='task.localhost',
            **self._auth_headers(),
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(resp.data.get('results', resp.data)), 1)

    def test_update_task_status(self):
        task = Task.objects.create(
            project=self.project,
            title='Updatable',
            key='TT-1',
            status='todo',
            priority='medium',
        )
        url = f"/api/tasks/{task.id}/"
        resp = self.client.patch(
            url,
            {'status': 'in_progress'},
            content_type='application/json',
            HTTP_HOST='task.localhost',
            **self._auth_headers(),
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        task.refresh_from_db()
        self.assertEqual(task.status, 'in_progress')

    def test_delete_task(self):
        task = Task.objects.create(
            project=self.project,
            title='Deletable',
            key='TT-1',
            status='todo',
            priority='medium',
        )
        url = f"/api/tasks/{task.id}/"
        resp = self.client.delete(
            url,
            HTTP_HOST='task.localhost',
            **self._auth_headers(),
        )
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Task.objects.filter(id=task.id).count(), 0)

    def test_create_comment_logs_activity(self):
        task = Task.objects.create(
            project=self.project,
            title='Commented',
            key='TT-1',
            status='todo',
            priority='medium',
            reporter=self.member,
        )
        url = reverse('comment-list')
        resp = self.client.post(
            url,
            {'task': task.id, 'body': 'Nice work!'},
            HTTP_HOST='task.localhost',
            **self._auth_headers(),
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Comment.objects.count(), 1)
        self.assertEqual(ActivityItem.objects.filter(type='commented').count(), 1)

    def test_rbac_viewer_cannot_create_task(self):
        viewer = User.objects.create_user(
            username='viewer',
            email='viewer@test.com',
            password='testpass123',
        )
        with schema_context(self.tenant.schema_name):
            Member.objects.create(user=viewer, role='viewer', status='active')

        resp = self.client.post(
            reverse('token_obtain_pair'),
            {'username': 'viewer', 'password': 'testpass123'},
            HTTP_HOST='localhost',
        )
        token = resp.data['access']
        headers = {'HTTP_AUTHORIZATION': f'Bearer {token}'}

        url = reverse('task-list')
        resp = self.client.post(
            url,
            {
                'title': 'Forbidden',
                'project': self.project.id,
                'status': 'todo',
                'priority': 'medium',
            },
            HTTP_HOST='task.localhost',
            **headers,
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
