import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch } from './client';
import type { Notification } from '@/shared/types';

// ─── Query key factory ───────────────────────────────────────────────────────

export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => ['notifications', 'list'] as const,
  list: (filters?: Record<string, string | undefined>) =>
    ['notifications', 'list', filters] as const,
};

// ─── Hooks ──────────────────────────────────────────────────────────────────

/**
 * Fetch notifications for the current user.
 */
export function useNotificationsList() {
  return useQuery<Notification[]>({
    queryKey: notificationKeys.lists(),
    queryFn: async () => {
      const data = await apiGet<Record<string, unknown>[]>('/api/notifications/');
      if (Array.isArray(data)) return data as unknown as Notification[];
      const results = (data as Record<string, unknown>).results as Record<string, unknown>[];
      return (results ?? []) as unknown as Notification[];
    },
    staleTime: 30_000,
  });
}

/**
 * Mark a single notification as read.
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const payload = { read: true };
      await apiPatch(`/api/notifications/${id}/`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

/**
 * Mark all notifications as read.
 */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      await apiPost('/api/notifications/mark_all_read/', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
