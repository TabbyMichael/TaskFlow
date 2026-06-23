from rest_framework import serializers
from django.contrib.auth import get_user_model
from django_tenants.utils import schema_context
from django.db import transaction
from .models import Organization, Domain
from core.models import Member

User = get_user_model()

class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ('id', 'name', 'slug', 'plan', 'status', 'created_at')
        read_only_fields = ('id', 'created_at')


class OnboardingSerializer(serializers.Serializer):
    # User fields
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    firstName = serializers.CharField(source='first_name', max_length=150, required=False, default='')
    lastName = serializers.CharField(source='last_name', max_length=150, required=False, default='')

    # Organization fields
    orgName = serializers.CharField(max_length=100)
    orgSlug = serializers.SlugField()

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username is already taken.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email is already registered.")
        return value

    def validate_orgSlug(self, value):
        if Organization.objects.filter(slug=value).exists():
            raise serializers.ValidationError("Organization slug is already taken.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        # 1. Create the user in the public schema
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )

        # 2. Create the Organization (tenant) in the public schema
        org_name = validated_data['orgName']
        org_slug = validated_data['orgSlug']
        tenant = Organization.objects.create(
            name=org_name,
            slug=org_slug,
            schema_name=org_slug.replace('-', '_'), # schema name cannot have hyphens
            plan='Enterprise'
        )

        # 3. Create the Domain for subdomain routing in the public schema
        # E.g., if subdomain is 'demo', domain is 'demo.localhost'
        domain_name = f"{org_slug}.localhost"
        Domain.objects.create(
            domain=domain_name,
            tenant=tenant,
            is_primary=True
        )

        # 4. Initialize the Member profile as 'admin' in the tenant schema
        with schema_context(tenant.schema_name):
            Member.objects.create(
                user=user,
                role='admin',
                status='active',
                title='Workspace Creator'
            )

        return {
            'user': user,
            'organization': tenant,
            'domain': domain_name
        }
