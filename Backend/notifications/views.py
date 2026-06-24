from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from core.permissions import IsTenantMember
from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsTenantMember]

    def get_queryset(self):
        member = self.request.member
        return Notification.objects.select_related('actor__user', 'recipient__user').filter(recipient=member)

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        member = request.member
        Notification.objects.filter(recipient=member, read=False).update(read=True)
        return Response({'message': 'All notifications marked as read.'})
