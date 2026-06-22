from rest_framework import viewsets, permissions, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from core.models import Member
from core.permissions import IsTenantMember, IsTenantWriteMember
from .models import Task, Comment, ActivityItem, Attachment
from .serializers import TaskSerializer, CommentSerializer, ActivityItemSerializer


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsTenantWriteMember]

    def get_queryset(self):
        queryset = Task.objects.select_related(
            'assignee__user', 'reporter__user', 'project', 'sprint'
        ).prefetch_related('comments', 'activities', 'attachments')

        project_id = self.request.query_params.get('projectId')
        sprint_id = self.request.query_params.get('sprintId')
        status_param = self.request.query_params.get('status')

        if project_id:
            queryset = queryset.filter(project_id=project_id)
        if sprint_id:
            if sprint_id.lower() == 'null':
                queryset = queryset.filter(sprint__isnull=True)
            else:
                queryset = queryset.filter(sprint_id=sprint_id)
        if status_param:
            queryset = queryset.filter(status=status_param)

        return queryset

    def perform_create(self, serializer):
        try:
            member = Member.objects.get(user=self.request.user)
            serializer.save(reporter=member)
        except Member.DoesNotExist:
            raise serializers.ValidationError("User is not a member of this tenant.")


class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [IsTenantWriteMember]

    def get_queryset(self):
        task_id = self.request.query_params.get('taskId')
        qs = Comment.objects.select_related('author__user', 'task')
        if task_id:
            return qs.filter(task_id=task_id)
        return qs.all()

    def perform_create(self, serializer):
        try:
            member = Member.objects.get(user=self.request.user)
            serializer.save(author=member)
        except Member.DoesNotExist:
            raise serializers.ValidationError("User is not a member of this tenant.")


class ActivityItemViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ActivityItemSerializer
    permission_classes = [IsTenantMember]

    def get_queryset(self):
        queryset = ActivityItem.objects.select_related(
            'actor__user', 'task'
        ).order_by('-created_at')
        task_id = self.request.query_params.get('taskId')
        if task_id:
            queryset = queryset.filter(task_id=task_id)
        return queryset
