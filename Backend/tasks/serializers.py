from rest_framework import serializers
from core.models import Member, Project
from sprints.models import Sprint
from .models import Task, Comment, ActivityItem, Attachment

class CommentSerializer(serializers.ModelSerializer):
    # author is assigned from the authenticated member in the viewset.
    authorId = serializers.PrimaryKeyRelatedField(
        source='author', queryset=Member.objects.all(), required=False
    )
    task = serializers.PrimaryKeyRelatedField(queryset=Task.objects.all())
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Comment
        fields = ('id', 'task', 'authorId', 'body', 'createdAt')
        read_only_fields = ('id', 'createdAt')


class ActivityItemSerializer(serializers.ModelSerializer):
    actorId = serializers.PrimaryKeyRelatedField(source='actor', queryset=Member.objects.all())
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = ActivityItem
        fields = ('id', 'actorId', 'type', 'message', 'createdAt')
        read_only_fields = ('id', 'createdAt')


class AttachmentSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = Attachment
        fields = ('id', 'name', 'size', 'url', 'created_at')
        read_only_fields = ('id', 'url', 'created_at')

    def get_url(self, obj):
        if obj.file:
            return obj.file.url
        return None


class TaskSerializer(serializers.ModelSerializer):
    assigneeId = serializers.PrimaryKeyRelatedField(source='assignee', queryset=Member.objects.all(), allow_null=True, required=False)
    reporterId = serializers.PrimaryKeyRelatedField(source='reporter', queryset=Member.objects.all())
    projectId = serializers.PrimaryKeyRelatedField(source='project', queryset=Project.objects.all())
    sprintId = serializers.PrimaryKeyRelatedField(source='sprint', queryset=Sprint.objects.all(), allow_null=True, required=False)
    storyPoints = serializers.IntegerField(source='story_points', default=0)
    dueDate = serializers.DateField(source='due_date', allow_null=True, required=False)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)
    
    comments = CommentSerializer(many=True, read_only=True)
    activity = ActivityItemSerializer(source='activities', many=True, read_only=True)
    attachments = AttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = Task
        fields = (
            'id', 'key', 'title', 'description', 'status', 'priority', 
            'assigneeId', 'reporterId', 'projectId', 'sprintId', 
            'storyPoints', 'dueDate', 'createdAt', 'updatedAt', 
            'labels', 'checklist', 'comments', 'activity', 'attachments'
        )
        read_only_fields = ('id', 'key', 'createdAt', 'updatedAt', 'comments', 'activity', 'attachments')

    def create(self, validated_data):
        # Retrieve the current request user to assign as the actor
        request = self.context.get('request')
        task = super().create(validated_data)
        if request and request.user:
            try:
                member = Member.objects.get(user=request.user)
                task._actor = member
            except Member.DoesNotExist:
                pass
        return task

    def update(self, instance, validated_data):
        # Retrieve the current request user to assign as the actor
        request = self.context.get('request')
        if request and request.user:
            try:
                member = Member.objects.get(user=request.user)
                instance._actor = member
            except Member.DoesNotExist:
                pass
        return super().update(instance, validated_data)
