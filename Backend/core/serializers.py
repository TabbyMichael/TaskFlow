from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Member, Project

User = get_user_model()

class UserMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')


class MemberSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    email = serializers.CharField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    initials = serializers.SerializerMethodField()

    class Meta:
        model = Member
        fields = ('id', 'user', 'username', 'name', 'email', 'role', 'status', 'title', 'initials', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at', 'initials')

    def get_name(self, obj):
        full_name = f"{obj.user.first_name} {obj.user.last_name}".strip()
        return full_name if full_name else obj.user.username

    def get_initials(self, obj):
        first = obj.user.first_name[:1] if obj.user.first_name else ""
        last = obj.user.last_name[:1] if obj.user.last_name else ""
        initials = (first + last).upper()
        return initials if initials else obj.user.username[:2].upper()


class ProjectSerializer(serializers.ModelSerializer):
    progress = serializers.ReadOnlyField()
    lead_details = MemberSerializer(source='lead', read_only=True)

    class Meta:
        model = Project
        fields = ('id', 'key', 'name', 'description', 'status', 'progress', 'start_date', 'due_date', 'lead', 'lead_details', 'members', 'color', 'created_at', 'updated_at')
        read_only_fields = ('id', 'progress', 'created_at', 'updated_at')
