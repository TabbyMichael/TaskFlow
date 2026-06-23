from django.urls import path, include
from rest_framework.routers import DefaultRouter
from core.views import ProjectViewSet, MemberViewSet
from sprints.views import SprintViewSet
from tasks.views import TaskViewSet, CommentViewSet, ActivityItemViewSet

router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'members', MemberViewSet, basename='member')
router.register(r'sprints', SprintViewSet, basename='sprint')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'comments', CommentViewSet, basename='comment')
router.register(r'activities', ActivityItemViewSet, basename='activity')

urlpatterns = [
    path('api/', include(router.urls)),
]
