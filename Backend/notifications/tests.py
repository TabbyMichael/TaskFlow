"""
Tests for the notifications app: models, signals, and viewset.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django_tenants.utils import schema_context
from django.db import connection
from rest_framework.test import APITestCase
from rest_framework import status
from organizations.models import Organization, Domain
from core.models import Member, Project
from sprints.models import Sprint
from tasks.models import Task, Comment
from notifications.models import Notification

User = get_user_model()


class NotificationModelTestCase(TestCase):
    def setUp(self):
        connection.set_schema_to_public()
        self.public_tenant, _ = Organization.objects.get_or_create(
            schema_name='public', name='Public', slug='public', plan='Enterprise'
        )
        Domain.objects.get_or_create(domain='localhost', tenant=self.public_tenant, is_primary=True)
        self.tenant = Organization.objects.create(
            schema_name='ntest', name='NTest', slug='ntest', plan='Enterprise'
        )
        Domain.objects.create(domain='ntest.localhost', tenant=self.tenant, is_primary=True)

        with schema_context(self.tenant.schema_name):
            self.user = User.objects.create_user(username='nuser', password='pass')
            self.member = Member.objects.create(user=self.user, role='admin', status='active')

    def test_notification_creation_and_defaults(self):
        with schema_context(self.tenant.schema_name):
            notif = Notification.objects.create(
                recipient=self.member,
                type='assignment',
                title='Test notification',
                body='Test body',
            )
            self.assertFalse(notif.read)
            self.assertIsNotNone(notif.created_at)
            self.assertIsNotNone(notif.updated_at)
            self.assertEqual(str(notif), f"nuser → Test notification (False)")

    def test_notification_ordering(self):
        with schema_context(self.tenant.schema_name):
            n1 = Notification.objects.create(recipient=self.member, type='assignment', title='First')
            n2 = Notification.objects.create(recipient=self.member, type='mention', title='Second')
            qs = Notification.objects.all()
            self.assertEqual(qs[0], n2)
            self.assertEqual(qs[1], n1)


class NotificationSignalTestCase(APITestCase):
    def setUp(self):
        connection.set_schema_to_public()
        self.public_tenant, _ = Organization.objects.get_or_create(
            schema_name='public', name='Public', slug='public', plan='Enterprise'
        )
        Domain.objects.get_or_create(domain='localhost', tenant=self.public_tenant, is_primary=True)
        self.tenant = Organization.objects.create(
            schema_name='nsigtest', name='NSigTest', slug='nsigtest', plan='Enterprise'
        )
        Domain.objects.create(domain='nsigtest.localhost', tenant=self.tenant, is_primary=True)

        with schema_context(self.tenant.schema_name):
            self.admin_user = User.objects.create_user(username='admin', password='pass')
            self.member_user = User.objects.create_user(username='member', password='pass')
            self.admin_member = Member.objects.create(user=self.admin_user, role='admin', status='active')
            self.member = Member.objects.create(user=self.member_user, role='member', status='active')
            self.project = Project.objects.create(key='P1', name='Test Project', lead=self.admin_member)
            self.project.members.add(self.admin_member, self.member)
            self.sprint = Sprint.objects.create(project=self.project, name='Sprint 1')

    def test_notification_on_task_creation(self):
        with schema_context(self.tenant.schema_name):
            Task.objects.create(
                project=self.project,
                title='Test Task',
                reporter=self.admin_member,
            )
            notifications = Notification.objects.filter(type='assignment')
            # Should notify the other member (not the reporter)
            self.assertEqual(notifications.count(), 1)
            self.assertEqual(notifications.first().recipient, self.member)

    def test_notification_on_comment(self):
        with schema_context(self.tenant.schema_name):
            task = Task.objects.create(
                project=self.project,
                title='Test',
                reporter=self.admin_member,
                assignee=self.member,
            )
            # Clear creation notifications
            Notification.objects.all().delete()

            Comment.objects.create(task=task, author=self.admin_member, body='Nice work!')
            notifications = Notification.objects.filter(type='comment')
            # Assignee should get notified (reporter is author so excluded)
            self.assertEqual(notifications.count(), 1)
            self.assertEqual(notifications.first().recipient, self.member)


class NotificationAPITestCase(APITestCase):
    def setUp(self):
        connection.set_schema_to_public()
        self.public_tenant, _ = Organization.objects.get_or_create(
            schema_name='public', name='Public', slug='public', plan='Enterprise'
        )
        Domain.objects.get_or_create(domain='localhost', tenant=self.public_tenant, is_primary=True)
        self.tenant = Organization.objects.create(
            schema_name='napitest', name='NAPITest', slug='napitest', plan='Enterprise'
        )
        Domain.objects.create(domain='napitest.localhost', tenant=self.tenant, is_primary=True)

        with schema_context(self.tenant.schema_name):
            self.user = User.objects.create_user(username='apiuser', password='pass')
            self.member = Member.objects.create(user=self.user, role='admin', status='active')
            # Clear any notifications created by signals during setup
            Notification.objects.all().delete()

    def test_list_notifications(self):
        with schema_context(self.tenant.schema_name):
            Notification.objects.create(recipient=self.member, type='assignment', title='N1')
            Notification.objects.create(recipient=self.member, type='mention', title='N2')

        # Obtain JWT token
        response = self.client.post(
            '/api/auth/token/', {'username': 'apiuser', 'password': 'pass'},
            HTTP_HOST='localhost'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        token = response.data['access']

        response = self.client.get(
            '/api/notifications/',
            HTTP_AUTHORIZATION=f'Bearer {token}',
            HTTP_HOST='napitest.localhost'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 2)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 2)

    def test_mark_all_read(self):
        with schema_context(self.tenant.schema_name):
            Notification.objects.create(recipient=self.member, type='assignment', title='N1')
            Notification.objects.create(recipient=self.member, type='mention', title='N2')

        # Obtain JWT token
        response = self.client.post(
            '/api/auth/token/', {'username': 'apiuser', 'password': 'pass'},
            HTTP_HOST='localhost'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        token = response.data['access']

        response = self.client.post(
            '/api/notifications/mark_all_read/',
            HTTP_AUTHORIZATION=f'Bearer {token}',
            HTTP_HOST='napitest.localhost'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        with schema_context(self.tenant.schema_name):
            unread = Notification.objects.filter(recipient=self.member, read=False).count()
            self.assertEqual(unread, 0)
