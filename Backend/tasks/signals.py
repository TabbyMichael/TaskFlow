from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Task, Comment, ActivityItem

@receiver(post_save, sender=Comment)
def log_comment_activity(sender, instance, created, **kwargs):
    if created:
        ActivityItem.objects.create(
            task=instance.task,
            actor=instance.author,
            type='commented',
            message=f"added a comment: \"{instance.body[:50]}...\""
        )

@receiver(pre_save, sender=Task)
def track_task_changes(sender, instance, **kwargs):
    # Retrieve actor if set on the instance (passed from the viewset/serializer)
    actor = getattr(instance, '_actor', None)
    if not actor:
        # Fallback to reporter if actor is not explicitly attached
        actor = instance.reporter

    # If it is a new task creation
    if not instance.pk:
        # We handle this in post_save to ensure task ID/key is fully saved
        return

    try:
        old_task = Task.objects.get(pk=instance.pk)
    except Task.DoesNotExist:
        return

    # Track status change
    if old_task.status != instance.status:
        ActivityItem.objects.create(
            task=instance,
            actor=actor,
            type='status_changed',
            message=f"changed status from '{old_task.get_status_display()}' to '{instance.get_status_display()}'"
        )

    # Track sprint change
    if old_task.sprint != instance.sprint:
        old_sprint_name = old_task.sprint.name if old_task.sprint else "Backlog"
        new_sprint_name = instance.sprint.name if instance.sprint else "Backlog"
        ActivityItem.objects.create(
            task=instance,
            actor=actor,
            type='sprint_changed',
            message=f"moved task from '{old_sprint_name}' to '{new_sprint_name}'"
        )

    # Track assignee change
    if old_task.assignee != instance.assignee:
        old_assignee_name = old_task.assignee.user.username if old_task.assignee else "Unassigned"
        new_assignee_name = instance.assignee.user.username if instance.assignee else "Unassigned"
        ActivityItem.objects.create(
            task=instance,
            actor=actor,
            type='assigned',
            message=f"changed assignee from '{old_assignee_name}' to '{new_assignee_name}'"
        )


@receiver(post_save, sender=Task)
def log_task_creation(sender, instance, created, **kwargs):
    if created:
        actor = getattr(instance, '_actor', None) or instance.reporter
        ActivityItem.objects.create(
            task=instance,
            actor=actor,
            type='created',
            message=f"created task '{instance.title}'"
        )
