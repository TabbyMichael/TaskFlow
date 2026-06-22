from django.db import models
from django.db.models import Sum
from core.models import Project


class Sprint(models.Model):
    STATUS_CHOICES = (
        ('planned', 'Planned'),
        ('active', 'Active'),
        ('completed', 'Completed'),
    )

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='sprints'
    )
    name = models.CharField(max_length=100)
    goal = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='planned')
    start_date = models.DateField(blank=True, null=True)
    end_date = models.DateField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def total_points(self):
        """Total story points for all tasks in this sprint (single DB query)."""
        return self.tasks.aggregate(total=Sum('story_points'))['total'] or 0

    @property
    def completed_points(self):
        """Story points completed (status='done') in this sprint (single DB query)."""
        return self.tasks.filter(status='done').aggregate(
            total=Sum('story_points')
        )['total'] or 0

    def __str__(self):
        return f"{self.name} ({self.status})"
