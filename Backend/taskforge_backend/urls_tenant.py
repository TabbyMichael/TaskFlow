from django.urls import path, include
from rest_framework.routers import DefaultRouter
from core.views import ProjectViewSet, MemberViewSet
from sprints.views import SprintViewSet
from tasks.views import TaskViewSet, CommentViewSet, ActivityItemViewSet, AttachmentViewSet
from notifications.views import NotificationViewSet

router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'members', MemberViewSet, basename='member')
router.register(r'sprints', SprintViewSet, basename='sprint')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'comments', CommentViewSet, basename='comment')
router.register(r'activities', ActivityItemViewSet, basename='activity')
router.register(r'attachments', AttachmentViewSet, basename='attachment')
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('api/', include(router.urls)),
]
