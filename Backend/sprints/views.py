from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from core.permissions import IsTenantWriteMember
from .models import Sprint
from .serializers import SprintSerializer

class SprintViewSet(viewsets.ModelViewSet):
    queryset = Sprint.objects.all()
    serializer_class = SprintSerializer
    permission_classes = [IsTenantWriteMember]

    def get_queryset(self):
        project_id = self.request.query_params.get('projectId')
        if project_id:
            return Sprint.objects.filter(project_id=project_id)
        return Sprint.objects.all()

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        sprint = self.get_object()
        # Verify if there is another active sprint in this project
        if Sprint.objects.filter(project=sprint.project, status='active').exists():
            return Response({'error': 'There is already an active sprint in this project.'}, status=status.HTTP_400_BAD_REQUEST)
        
        sprint.status = 'active'
        sprint.save()
        return Response(SprintSerializer(sprint).data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        sprint = self.get_object()
        sprint.status = 'completed'
        sprint.save()

        # Move incomplete tasks back to backlog
        incomplete_tasks = sprint.tasks.exclude(status='done')
        for task in incomplete_tasks:
            task.sprint = None
            task.save()

        return Response({
            'message': 'Sprint completed successfully. Incomplete tasks moved to backlog.',
            'sprint': SprintSerializer(sprint).data
        })
