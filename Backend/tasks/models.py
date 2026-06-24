from django.db import models
from django.db.models import F
from django.core.exceptions import ValidationError
from core.models import Member, Project
from sprints.models import Sprint

class Task(models.Model):
    STATUS_CHOICES = (
        ('backlog', 'Backlog'),
        ('todo', 'To Do'),
        ('in_progress', 'In Progress'),
        ('review', 'Review'),
        ('done', 'Done'),
    )

    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    )

    key = models.CharField(max_length=20, unique=True)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='backlog')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    assignee = models.ForeignKey(
        Member,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tasks'
    )
    reporter = models.ForeignKey(
        Member,
        on_delete=models.CASCADE,
        related_name='reported_tasks'
    )
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='tasks'
    )
    sprint = models.ForeignKey(
        Sprint,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tasks'
    )
    story_points = models.IntegerField(default=0)
    due_date = models.DateField(blank=True, null=True)
    labels = models.JSONField(default=list, blank=True)
    checklist = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        """Validate labels and checklist JSON structure."""
        super().clean()
        if self.labels and not isinstance(self.labels, list):
            raise ValidationError({'labels': 'Must be a list of strings.'})
        if self.labels:
            for label in self.labels:
                if not isinstance(label, str):
                    raise ValidationError({'labels': 'Each label must be a string.'})
        if self.checklist and not isinstance(self.checklist, list):
            raise ValidationError({'checklist': 'Must be a list of objects with "name" and "done" keys.'})
        if self.checklist:
            for item in self.checklist:
                if not isinstance(item, dict):
                    raise ValidationError({'checklist': 'Each checklist item must be an object.'})
                if 'name' not in item or 'done' not in item:
                    raise ValidationError({'checklist': 'Each item must have "name" and "done" keys.'})
                if not isinstance(item['done'], bool):
                    raise ValidationError({'checklist': '"done" must be a boolean.'})

    def save(self, *args, **kwargs):
        # Auto-generate key if not set, using project's task_counter for atomic increment
        if not self.key:
            # Atomically increment the project's task_counter
            Project.objects.filter(pk=self.project.pk).update(task_counter=F('task_counter') + 1)
            # Refresh from DB to get the new counter value
            self.project.refresh_from_db()
            self.key = f"{self.project.key}-{self.project.task_counter}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.key}: {self.title}"


class Comment(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='comments')
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Comment by {self.author.user.username} on {self.task.key}"


class ActivityItem(models.Model):
    TYPE_CHOICES = (
        ('created', 'Created'),
        ('updated', 'Updated'),
        ('commented', 'Commented'),
        ('assigned', 'Assigned'),
        ('status_changed', 'Status Changed'),
        ('sprint_changed', 'Sprint Changed'),
    )

    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='activities')
    actor = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='activities')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.actor.user.username} {self.type} on {self.task.key}"


class Attachment(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='attachments')
    name = models.CharField(max_length=255)
    file = models.FileField(upload_to='attachments/', null=True, blank=True)
    size = models.IntegerField(default=0)  # in bytes
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
