from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Member, Project
from .serializers import MemberSerializer, ProjectSerializer
from .permissions import IsTenantMember, IsTenantAdmin, IsTenantWriteMember


class MemberViewSet(viewsets.ModelViewSet):
    serializer_class = MemberSerializer

    def get_queryset(self):
        return Member.objects.select_related('user').all()

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy', 'invite']:
            return [IsTenantAdmin()]
        return [IsTenantMember()]

    @action(detail=False, methods=['post'], permission_classes=[IsTenantAdmin])
    def invite(self, request):
        """Invite a user to this tenant workspace. Creates user if not found."""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        username = request.data.get('username')
        email = request.data.get('email')
        role = request.data.get('role', 'member')
        title = request.data.get('title', '')

        if not username or not email:
            return Response(
                {'error': 'username and email are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user, created = User.objects.get_or_create(
            username=username, defaults={'email': email}
        )
        if not created and Member.objects.filter(user=user).exists():
            return Response(
                {'error': 'User is already a member of this workspace.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        member = Member.objects.create(
            user=user,
            role=role,
            status='invited' if created else 'active',
            title=title
        )
        return Response(MemberSerializer(member).data, status=status.HTTP_201_CREATED)


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [IsTenantWriteMember]

    def get_queryset(self):
        return Project.objects.select_related(
            'lead__user'
        ).prefetch_related('members__user').all()

    def perform_create(self, serializer):
        try:
            member = Member.objects.get(user=self.request.user)
            serializer.save(lead=member)
        except Member.DoesNotExist:
            serializer.save()
