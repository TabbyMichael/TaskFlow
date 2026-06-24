"""
Tests for the health check endpoint.
"""
from django.test import TestCase
from django.db import connection
from rest_framework import status
from organizations.models import Organization, Domain


class HealthViewTestCase(TestCase):
    def setUp(self):
        # Ensure the public tenant exists so the health check URL resolves
        connection.set_schema_to_public()
        Organization.objects.get_or_create(
            schema_name='public',
            name='Public Schema',
            slug='public',
            plan='Enterprise',
        )
        public = Organization.objects.get(schema_name='public')
        Domain.objects.get_or_create(
            domain='localhost',
            tenant=public,
            is_primary=True,
        )
        # The test client sends requests with host "testserver" by default
        Domain.objects.get_or_create(
            domain='testserver',
            tenant=public,
            is_primary=False,
        )

    def test_health_endpoint_returns_200(self):
        resp = self.client.get('/health/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_health_endpoint_returns_expected_keys(self):
        resp = self.client.get('/health/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        data = resp.json()
        self.assertIn('database', data)
        self.assertIn('redis', data)
        self.assertIn('status', data)
        self.assertIn('service', data)
        self.assertEqual(data['service'], 'taskflow-backend')

    def test_health_endpoint_reports_ok_status(self):
        resp = self.client.get('/health/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        data = resp.json()
        self.assertEqual(data['status'], 'ok')
        self.assertEqual(data['database'], 'ok')
        # Redis may be unavailable in test; that's acceptable
        self.assertIn(data['redis'], ('ok', 'error'))
