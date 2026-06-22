from rest_framework import permissions
from core.models import Member

class IsTenantMember(permissions.BasePermission):
    """
    Allows access only to active members of the current tenant organization.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        try:
            member = Member.objects.get(user=request.user)
            if member.status != 'active':
                return False
            request.member = member  # Cache the tenant member on the request
            return True
        except Member.DoesNotExist:
            return False


class IsTenantAdmin(IsTenantMember):
    """
    Allows access only to organization Admins.
    """
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return request.member.role == 'admin'


class IsTenantManager(IsTenantMember):
    """
    Allows access to Admins and Managers.
    """
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return request.member.role in ['admin', 'manager']


class IsTenantWriteMember(IsTenantMember):
    """
    Allows read access to all active members, but write access (POST, PUT, PATCH, DELETE)
    only to Admins, Managers, and Members (excluding Viewers).
    """
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        
        if request.method in permissions.SAFE_METHODS:
            return True
            
        return request.member.role in ['admin', 'manager', 'member']
