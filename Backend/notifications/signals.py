"""
Signal handlers for automatic notification creation.
Wired in notifications.apps.NotificationsConfig.ready()
"""
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Notification
from tasks.models import Task, Comment
from sprints.models import Sprint
from core.models import Member


def _create_notification(recipient, notification_type, title, body, actor=None, related_task=None, related_project=None):
    """Helper to create a notification."""
    Notification.objects.create(
        recipient=recipient,
        type=notification_type,
        title=title,
        body=body,
        actor=actor,
        related_task_id=related_task.id if related_task else None,
        related_project_id=related_project.id if related_project else None,
    )


@receiver(post_save, sender=Task)
def notify_task_created(sender, instance, created, **kwargs):
    """Notify project members when a new task is created."""
    if not created:
        return

    project = instance.project
    actor = instance.reporter

    # Notify all project members except the reporter
    members = Member.objects.filter(
        projects=project,
        status='active'
    ).exclude(pk=actor.pk)

    for member in members:
        _create_notification(
            recipient=member,
            notification_type='assignment',
            title=f"New task: {instance.key}",
            body=f"{actor.user.username} created task '{instance.title}' in project {project.name}.",
            actor=actor,
            related_task=instance,
            related_project=project,
        )


@receiver(post_save, sender=Task)
def notify_task_assigned(sender, instance, created, **kwargs):
    """Notify assignee when a task is assigned to them."""
    if created:
        return  # Assignment notifications handled on update

    # Check if assignee was just set
    if instance.assignee:
        # This is a simplification; in production, track previous value
        actor = getattr(instance, '_actor', None)
        if actor and instance.assignee != actor:
            _create_notification(
                recipient=instance.assignee,
                notification_type='assignment',
                title=f"Task assigned: {instance.key}",
                body=f"{actor.user.username} assigned you to task '{instance.title}'.",
                actor=actor,
                related_task=instance,
                related_project=instance.project,
            )


@receiver(post_save, sender=Comment)
def notify_comment_added(sender, instance, created, **kwargs):
    """Notify task reporter and assignee when a comment is added."""
    if not created:
        return

    task = instance.task
    author = instance.author
    recipients = set()

    # Add task reporter
    if task.reporter and task.reporter != author:
        recipients.add(task.reporter)

    # Add task assignee
    if task.assignee and task.assignee != author and task.assignee != task.reporter:
        recipients.add(task.assignee)

    for recipient in recipients:
        _create_notification(
            recipient=recipient,
            notification_type='comment',
            title=f"New comment on {task.key}",
            body=f"{author.user.username} commented: '{instance.body[:100]}{'...' if len(instance.body) > 100 else ''}'",
            actor=author,
            related_task=task,
            related_project=task.project,
        )


@receiver(post_save, sender=Sprint)
def notify_sprint_status_changed(sender, instance, created, **kwargs):
    """Notify project members when a sprint is started or completed."""
    if created:
        return

    # Check if status changed (simplified; in production, compare with previous value)
    actor = getattr(instance, '_actor', None)
    if not actor:
        return

    project = instance.project
    members = Member.objects.filter(
        projects=project,
        status='active'
    ).exclude(pk=actor.pk)

    notification_type = 'sprint'
    if instance.status == 'active':
        title = f"Sprint started: {instance.name}"
        body = f"{actor.user.username} started sprint '{instance.name}'."
    elif instance.status == 'completed':
        title = f"Sprint completed: {instance.name}"
        body = f"{actor.user.username} completed sprint '{instance.name}'."
    else:
        return

    for member in members:
        _create_notification(
            recipient=member,
            notification_type=notification_type,
            title=title,
            body=body,
            actor=actor,
            related_project=project,
        )