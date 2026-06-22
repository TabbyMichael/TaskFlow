import { useQuery } from '@tanstack/react-query';
import { apiGet } from './client';
import { mapMemberToUser } from './mappers';
import type { User } from '@/shared/types';

// ─── Query key factory ───────────────────────────────────────────────────────
export const memberKeys = {
  all: ['members'] as const,
  lists: () => ['members', 'list'] as const,
};

// ─── Query options type ──────────────────────────────────────────────────────

interface UseMembersListOptions {
  enabled?: boolean;
}

/**
 * Fetch all members of the current tenant.
 */
export function useMembersList(options?: UseMembersListOptions) {
  return useQuery<User[]>({
    queryKey: memberKeys.lists(),
    queryFn: async () => {
      const data = await apiGet<Record<string, unknown>[]>('/api/members/');

      // Handle both array responses and paginated { results: [...] }
      if (Array.isArray(data)) {
        return data.map(mapMemberToUser);
      }
      const results = (
        data as unknown as Record<string, unknown>
      ).results as Record<string, unknown>[];
      return (results ?? []).map(mapMemberToUser);
    },
    enabled: options?.enabled,
    staleTime: 60_000,
  });
}
