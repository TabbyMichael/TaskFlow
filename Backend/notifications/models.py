from django.db import models
from core.models import Member


class Notification(models.Model):
    TYPE_CHOICES = (
        ('mention', 'Mention'),
        ('assignment', 'Assignment'),
        ('project', 'Project'),
        ('sprint', 'Sprint'),
        ('comment', 'Comment'),
    )

    recipient = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    title = models.CharField(max_length=200)
    body = models.TextField(blank=True)
    read = models.BooleanField(default=False)
    actor = models.ForeignKey(
        Member, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='notifications_as_actor'
    )
    related_task_id = models.PositiveIntegerField(null=True, blank=True)
    related_project_id = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.recipient.user.username} → {self.title} ({self.read})"
