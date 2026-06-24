from django.contrib import admin
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('recipient', 'type', 'title', 'read', 'created_at')
    list_filter = ('type', 'read', 'created_at')
    search_fields = ('title', 'body', 'recipient__user__username')
    autocomplete_fields = ('recipient', 'actor')
