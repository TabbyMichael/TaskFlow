from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    name = 'notifications'

    def ready(self):
        # Import signal handlers to register them
        import notifications.signals  # noqa: F401
