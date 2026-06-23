from rest_framework import serializers
from .models import Sprint

class SprintSerializer(serializers.ModelSerializer):
    total_points = serializers.ReadOnlyField()
    completed_points = serializers.ReadOnlyField()

    class Meta:
        model = Sprint
        fields = ('id', 'project', 'name', 'goal', 'status', 'start_date', 'end_date', 'total_points', 'completed_points', 'created_at', 'updated_at')
        read_only_fields = ('id', 'total_points', 'completed_points', 'created_at', 'updated_at')
