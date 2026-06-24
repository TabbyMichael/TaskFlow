from rest_framework import serializers
from core.models import Member
from .models import Notification
from core.serializers import UserMiniSerializer


class NotificationSerializer(serializers.ModelSerializer):
    actorId = serializers.PrimaryKeyRelatedField(source='actor', queryset=Member.objects.all(), allow_null=True, required=False)
    actor = UserMiniSerializer(read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Notification
        fields = (
            'id', 'recipient', 'type', 'title', 'body',
            'read', 'actorId', 'actor',
            'related_task_id', 'related_project_id',
            'createdAt',
        )
        read_only_fields = ('id', 'createdAt', 'actor')
