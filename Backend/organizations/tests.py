from django.test import TestCase
from django.contrib.auth import get_user_model
from django_tenants.utils import schema_context
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from organizations.models import Organization, Domain
from core.models import Member, Project

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

class MemberInviteTestCase(APITestCase):
    def setUp(self):
        _ensure_public_tenant()

        self.admin = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass123',
        )
        self.tenant = Organization.objects.create(
            schema_name='invite_test',
            name='Invite Test',
            slug='invite_test',
        )
        Domain.objects.create(
            domain='invite.localhost',
            tenant=self.tenant,
            is_primary=True,
        )

        with schema_context(self.tenant.schema_name):
            self.admin_member = Member.objects.create(
                user=self.admin,
                role='admin',
                status='active',
            )

    def _auth_headers(self):
        resp = self.client.post(
            reverse('token_obtain_pair'),
            {'username': 'admin', 'password': 'testpass123'},
            HTTP_HOST='localhost',
        )
        token = resp.data['access']
        return {'HTTP_AUTHORIZATION': f'Bearer {token}'}

    def test_admin_can_invite_new_member(self):
        headers = self._auth_headers()
        url = '/api/members/invite/'
        resp = self.client.post(
            url,
            {'email': 'newmember@test.com', 'role': 'member', 'title': 'Dev'},
            HTTP_HOST='invite.localhost',
            **headers,
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue('message' in resp.data or 'detail' in resp.data)

    def test_admin_can_invite_existing_user(self):
        existing = User.objects.create_user(
            username='existing',
            email='existing@test.com',
            password='pass',
        )
        headers = self._auth_headers()
        url = '/api/members/invite/'
        resp = self.client.post(
            url,
            {'email': 'existing@test.com', 'role': 'member'},
            HTTP_HOST='invite.localhost',
            **headers,
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_viewer_cannot_invite_member(self):
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

        url = '/api/members/invite/'
        resp = self.client.post(
            url,
            {'email': 'forbidden@test.com', 'role': 'member'},
            HTTP_HOST='invite.localhost',
            **headers,
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
