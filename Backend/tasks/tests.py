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
from .models import Task, Comment, ActivityItem

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
                'projectId': self.project.id,
                'reporterId': self.member.id,
                'status': 'todo',
                'priority': 'medium',
            },
            HTTP_HOST='task.localhost',
            **headers,
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        with schema_context(self.tenant.schema_name):
            self.assertEqual(Task.objects.count(), 1)
            task = Task.objects.first()
        self.assertEqual(task.key, 'TT-1')

    def test_second_task_increments_key(self):
        headers = self._auth_headers()
        url = reverse('task-list')
        # Create first task via API so counter is properly incremented
        resp1 = self.client.post(
            url,
            {
                'title': 'First',
                'projectId': self.project.id,
                'reporterId': self.member.id,
                'status': 'todo',
                'priority': 'medium',
            },
            HTTP_HOST='task.localhost',
            **headers,
        )
        self.assertEqual(resp1.status_code, status.HTTP_201_CREATED)
        # Create second task
        resp2 = self.client.post(
            url,
            {
                'title': 'Second',
                'projectId': self.project.id,
                'reporterId': self.member.id,
                'status': 'todo',
                'priority': 'medium',
            },
            HTTP_HOST='task.localhost',
            **headers,
        )
        self.assertEqual(resp2.status_code, status.HTTP_201_CREATED)
        with schema_context(self.tenant.schema_name):
            self.assertEqual(Task.objects.count(), 2)
            task2 = Task.objects.filter(title='Second').first()
        self.assertEqual(task2.key, 'TT-2')

    def test_filter_tasks_by_project(self):
        headers = self._auth_headers()
        url = reverse('task-list')
        self.client.post(
            url,
            {
                'title': 'Project task',
                'projectId': self.project.id,
                'reporterId': self.member.id,
                'status': 'todo',
                'priority': 'medium',
            },
            HTTP_HOST='task.localhost',
            **headers,
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
        headers = self._auth_headers()
        url = reverse('task-list')
        resp = self.client.post(
            url,
            {
                'title': 'Updatable',
                'projectId': self.project.id,
                'reporterId': self.member.id,
                'status': 'todo',
                'priority': 'medium',
            },
            HTTP_HOST='task.localhost',
            **headers,
        )
        task_id = resp.data['id']
        url = f"/api/tasks/{task_id}/"
        resp = self.client.patch(
            url,
            {'status': 'in_progress'},
            content_type='application/json',
            HTTP_HOST='task.localhost',
            **self._auth_headers(),
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_delete_task(self):
        headers = self._auth_headers()
        url = reverse('task-list')
        resp = self.client.post(
            url,
            {
                'title': 'Deletable',
                'projectId': self.project.id,
                'reporterId': self.member.id,
                'status': 'todo',
                'priority': 'medium',
            },
            HTTP_HOST='task.localhost',
            **headers,
        )
        task_id = resp.data['id']
        url = f"/api/tasks/{task_id}/"
        resp = self.client.delete(
            url,
            HTTP_HOST='task.localhost',
            **self._auth_headers(),
        )
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)
        with schema_context(self.tenant.schema_name):
            self.assertEqual(Task.objects.filter(id=task_id).count(), 0)

    def test_create_comment_logs_activity(self):
        headers = self._auth_headers()
        url = reverse('task-list')
        resp = self.client.post(
            url,
            {
                'title': 'Commented',
                'projectId': self.project.id,
                'reporterId': self.member.id,
                'status': 'todo',
                'priority': 'medium',
            },
            HTTP_HOST='task.localhost',
            **headers,
        )
        task_id = resp.data['id']
        url = reverse('comment-list')
        resp = self.client.post(
            url,
            {'task': task_id, 'body': 'Nice work!'},
            HTTP_HOST='task.localhost',
            **self._auth_headers(),
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        with schema_context(self.tenant.schema_name):
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


class TaskModelValidationTestCase(TestCase):
    """
    Tests for Task.clean() — labels and checklist JSON validation.
    """

    def setUp(self):
        _ensure_public_tenant()

        self.user = User.objects.create_user(
            username='validuser',
            email='valid@test.com',
            password='testpass123',
        )
        self.tenant = Organization.objects.create(
            schema_name='valid_test',
            name='Valid Test',
            slug='valid_test',
        )
        Domain.objects.create(
            domain='valid.localhost',
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
                key='VL',
                name='Validation Project',
                lead=self.member,
            )

    def test_valid_labels_accepts_string_list(self):
        with schema_context(self.tenant.schema_name):
            task = Task(
                project=self.project,
                title='Labeled',
                status='todo',
                reporter=self.member,
                labels=['frontend', 'bug'],
            )
            task.clean()  # Should not raise

    def test_invalid_labels_dict_raises_error(self):
        with schema_context(self.tenant.schema_name):
            task = Task(
                project=self.project,
                title='Bad labels',
                status='todo',
                reporter=self.member,
                labels={'not': 'a list'},
            )
            with self.assertRaises(Exception):
                task.clean()

    def test_invalid_label_non_string_raises_error(self):
        with schema_context(self.tenant.schema_name):
            task = Task(
                project=self.project,
                title='Bad label item',
                status='todo',
                reporter=self.member,
                labels=[123, 'valid'],
            )
            with self.assertRaises(Exception):
                task.clean()

    def test_invalid_checklist_dict_raises_error(self):
        with schema_context(self.tenant.schema_name):
            task = Task(
                project=self.project,
                title='Bad checklist',
                status='todo',
                reporter=self.member,
                checklist='not-a-list',
            )
            with self.assertRaises(Exception):
                task.clean()

    def test_checklist_missing_keys_raises_error(self):
        with schema_context(self.tenant.schema_name):
            task = Task(
                project=self.project,
                title='Missing keys',
                status='todo',
                reporter=self.member,
                checklist=[{'name': 'Only name'}],
            )
            with self.assertRaises(Exception):
                task.clean()

    def test_checklist_done_not_bool_raises_error(self):
        with schema_context(self.tenant.schema_name):
            task = Task(
                project=self.project,
                title='Bad done type',
                status='todo',
                reporter=self.member,
                checklist=[{'name': 'X', 'done': 'yes'}],
            )
            with self.assertRaises(Exception):
                task.clean()


    def test_valid_checklist_accepts_objects(self):
        with schema_context(self.tenant.schema_name):
            task = Task(
                project=self.project,
                title='Checklisted',
                status='todo',
                reporter=self.member,
                checklist=[{'name': 'Step 1', 'done': False}, {'name': 'Step 2', 'done': True}],
            )
            task.clean()  # Should not raise


class TaskSearchAPITestCase(APITestCase):
    """Tests for the full-text search endpoint at /api/tasks/search/."""

    def setUp(self):
        _ensure_public_tenant()

        self.user = User.objects.create_user(
            username='searchuser',
            email='search@test.com',
            password='testpass123',
        )
        self.tenant = Organization.objects.create(
            schema_name='search_test',
            name='Search Test',
            slug='search_test',
        )
        Domain.objects.create(
            domain='search.localhost',
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
                key='SR',
                name='Search Project',
                lead=self.member,
            )

    def _auth_headers(self):
        resp = self.client.post(
            reverse('token_obtain_pair'),
            {'username': 'searchuser', 'password': 'testpass123'},
            HTTP_HOST='localhost',
        )
        token = resp.data['access']
        return {'HTTP_AUTHORIZATION': f'Bearer {token}'}

    def _create_task(self, title, description=''):
        headers = self._auth_headers()
        url = reverse('task-list')
        return self.client.post(
            url,
            {
                'title': title,
                'description': description,
                'projectId': self.project.id,
                'reporterId': self.member.id,
                'status': 'todo',
                'priority': 'medium',
            },
            HTTP_HOST='search.localhost',
            **headers,
        )

    def test_search_returns_matching_tasks(self):
        self._create_task('Fix login bug', 'Users cannot log in with SSO')
        self._create_task('Add dashboard', 'New analytics dashboard')
        headers = self._auth_headers()
        resp = self.client.get(
            '/api/tasks/search/?q=login',
            HTTP_HOST='search.localhost',
            **headers,
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        results = resp.data.get('results', [])
        self.assertGreaterEqual(len(results), 1)
        titles = [r['title'] for r in results]
        self.assertIn('Fix login bug', titles)

    def test_search_empty_query_returns_empty(self):
        self._create_task('Some task')
        headers = self._auth_headers()
        resp = self.client.get(
            '/api/tasks/search/?q=',
            HTTP_HOST='search.localhost',
            **headers,
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data.get('results', []), [])

    def test_search_requires_auth(self):
        resp = self.client.get(
            '/api/tasks/search/?q=bug',
            HTTP_HOST='search.localhost',
        )
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)


class AttachmentAPITestCase(APITestCase):
    """Tests for the AttachmentViewSet."""

    def setUp(self):
        _ensure_public_tenant()

        self.user = User.objects.create_user(
            username='attachuser',
            email='attach@test.com',
            password='testpass123',
        )
        self.tenant = Organization.objects.create(
            schema_name='attach_test',
            name='Attachment Test',
            slug='attach_test',
        )
        Domain.objects.create(
            domain='attach.localhost',
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
                key='AT',
                name='Attach Project',
                lead=self.member,
            )

    def _auth_headers(self):
        resp = self.client.post(
            reverse('token_obtain_pair'),
            {'username': 'attachuser', 'password': 'testpass123'},
            HTTP_HOST='localhost',
        )
        token = resp.data['access']
        return {'HTTP_AUTHORIZATION': f'Bearer {token}'}

    def _create_task(self):
        headers = self._auth_headers()
        url = reverse('task-list')
        resp = self.client.post(
            url,
            {
                'title': 'Attachable task',
                'projectId': self.project.id,
                'reporterId': self.member.id,
                'status': 'todo',
                'priority': 'medium',
            },
            HTTP_HOST='attach.localhost',
            **headers,
        )
        return resp.data['id']

    def test_create_attachment(self):
        task_id = self._create_task()
        headers = self._auth_headers()
        url = reverse('attachment-list')
        resp = self.client.post(
            url,
            {'taskId': task_id, 'name': 'Screenshot.png', 'size': 102400},
            HTTP_HOST='attach.localhost',
            **headers,
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data['name'], 'Screenshot.png')

    def test_list_attachments_by_task(self):
        task_id = self._create_task()
        headers = self._auth_headers()
        url = reverse('attachment-list')

        self.client.post(
            url,
            {'taskId': task_id, 'name': 'File1.pdf', 'size': 51200},
            HTTP_HOST='attach.localhost',
            **headers,
        )
        self.client.post(
            url,
            {'taskId': task_id, 'name': 'File2.pdf', 'size': 25600},
            HTTP_HOST='attach.localhost',
            **headers,
        )

        resp = self.client.get(
            f'/api/attachments/?taskId={task_id}',
            HTTP_HOST='attach.localhost',
            **headers,
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        results = resp.data.get('results', resp.data) if isinstance(resp.data, dict) else resp.data
        self.assertEqual(len(results), 2)

    def test_create_attachment_requires_task_id(self):
        headers = self._auth_headers()
        url = reverse('attachment-list')
        resp = self.client.post(
            url,
            {'name': 'Orphan.png', 'size': 100},
            HTTP_HOST='attach.localhost',
            **headers,
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_viewer_cannot_create_attachment(self):
        viewer_user = User.objects.create_user(
            username='attachviewer',
            email='attachviewer@test.com',
            password='testpass123',
        )
        with schema_context(self.tenant.schema_name):
            Member.objects.create(user=viewer_user, role='viewer', status='active')

        resp = self.client.post(
            reverse('token_obtain_pair'),
            {'username': 'attachviewer', 'password': 'testpass123'},
            HTTP_HOST='localhost',
        )
        token = resp.data['access']
        headers = {'HTTP_AUTHORIZATION': f'Bearer {token}'}

        url = reverse('attachment-list')
        resp = self.client.post(
            url,
            {'taskId': 1, 'name': 'Blocked.png', 'size': 100},
            HTTP_HOST='attach.localhost',
            **headers,
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
