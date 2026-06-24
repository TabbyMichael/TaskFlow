from rest_framework import viewsets, permissions, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank
from core.models import Member
from core.permissions import IsTenantMember, IsTenantWriteMember
from .models import Task, Comment, ActivityItem, Attachment
from .serializers import TaskSerializer, CommentSerializer, ActivityItemSerializer, AttachmentSerializer


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

    @action(detail=False, methods=['get'])
    def search(self, request):
        """Full-text search across task title and description."""
        query = request.query_params.get('q', '').strip()
        if not query:
            return Response({'results': []})

        search_query = SearchQuery(query)
        search_vector = SearchVector('title', weight='A') + SearchVector('description', weight='B')
        queryset = Task.objects.annotate(
            rank=SearchRank(search_vector, search_query)
        ).filter(rank__gte=0.1).order_by('-rank')

        # Apply additional filters
        project_id = request.query_params.get('projectId')
        if project_id:
            queryset = queryset.filter(project_id=project_id)

        serializer = self.get_serializer(queryset[:20], many=True)
        return Response({'results': serializer.data})


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


class AttachmentViewSet(viewsets.ModelViewSet):
    serializer_class = AttachmentSerializer
    permission_classes = [IsTenantWriteMember]

    def get_queryset(self):
        task_id = self.request.query_params.get('taskId')
        qs = Attachment.objects.select_related('task')
        if task_id:
            return qs.filter(task_id=task_id)
        return qs.all()

    def perform_create(self, serializer):
        task_id = self.request.data.get('taskId')
        if not task_id:
            raise serializers.ValidationError("taskId is required.")
        try:
            task = Task.objects.get(id=task_id)
        except Task.DoesNotExist:
            raise serializers.ValidationError("Task not found.")
        serializer.save(task=task)
