import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete } from './client';
import { mapSprint } from './mappers';
import type { Sprint } from '@/shared/types';

// ─── Query key factory ───────────────────────────────────────────────────────
export const sprintKeys = {
  all: ['sprints'] as const,
  lists: () => ['sprints', 'list'] as const,
  list: (filters?: Record<string, string | undefined>) =>
    ['sprints', 'list', filters] as const,
  details: () => ['sprints', 'detail'] as const,
  detail: (id: string) => ['sprints', 'detail', id] as const,
};

// ─── Query options type ──────────────────────────────────────────────────────

interface UseSprintsListOptions {
  enabled?: boolean;
}

/**
 * Fetch the list of sprints, optionally filtered by project.
 */
export function useSprintsList(
  projectId?: string,
  options?: UseSprintsListOptions,
) {
  return useQuery<Sprint[]>({
    queryKey: sprintKeys.list({ projectId }),
    queryFn: async () => {
      const qs = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
      const data = await apiGet<Record<string, unknown>[]>(`/api/sprints/${qs}`);

      // Handle both array responses and paginated { results: [...] }
      if (Array.isArray(data)) {
        return data.map(mapSprint);
      }
      const results = (
        data as unknown as Record<string, unknown>
      ).results as Record<string, unknown>[];
      return (results ?? []).map(mapSprint);
    },
    enabled: options?.enabled,
    staleTime: 30_000,
  });
}

interface UseSprintOptions {
  enabled?: boolean;
}

/**
 * Fetch a single sprint by its ID.
 */
export function useSprint(id: string, options?: UseSprintOptions) {
  return useQuery<Sprint>({
    queryKey: sprintKeys.detail(id),
    queryFn: async () => {
      const data = await apiGet<Record<string, unknown>>(`/api/sprints/${id}/`);
      return mapSprint(data);
    },
    enabled: options?.enabled !== false && !!id,
    staleTime: 30_000,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

interface CreateSprintPayload {
  name: string;
  goal?: string;
  project: string | number;
  start_date?: string;
  end_date?: string;
}

/**
 * Create a new sprint.
 */
export function useCreateSprint() {
  const queryClient = useQueryClient();

  return useMutation<Sprint, Error, CreateSprintPayload>({
    mutationFn: async (payload) => {
      const data = await apiPost<Record<string, unknown>>(
        '/api/sprints/',
        payload,
      );
      return mapSprint(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sprintKeys.lists() });
    },
  });
}

interface UpdateSprintPayload {
  id: string;
  data: Partial<{
    name: string;
    goal: string;
    start_date: string;
    end_date: string;
    project: string | number;
  }>;
}

/**
 * Update an existing sprint (partial update via PATCH).
 */
export function useUpdateSprint() {
  const queryClient = useQueryClient();

  return useMutation<Sprint, Error, UpdateSprintPayload>({
    mutationFn: async ({ id, data }) => {
      const result = await apiPatch<Record<string, unknown>>(
        `/api/sprints/${id}/`,
        data,
      );
      return mapSprint(result);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: sprintKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: sprintKeys.detail(variables.id),
      });
    },
  });
}

/**
 * Delete a sprint.
 */
export function useDeleteSprint() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await apiDelete<void>(`/api/sprints/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sprintKeys.lists() });
    },
  });
}

/**
 * Start a sprint (transition to active).
 * POST /api/sprints/{id}/start/
 */
export function useStartSprint() {
  const queryClient = useQueryClient();

  return useMutation<Sprint, Error, string>({
    mutationFn: async (id) => {
      const data = await apiPost<Record<string, unknown>>(
        `/api/sprints/${id}/start/`,
      );
      return mapSprint(data);
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: sprintKeys.lists() });
      queryClient.invalidateQueries({ queryKey: sprintKeys.detail(id) });
    },
  });
}

/**
 * Complete a sprint (transition to completed).
 * POST /api/sprints/{id}/complete/
 */
export function useCompleteSprint() {
  const queryClient = useQueryClient();

  return useMutation<Sprint, Error, string>({
    mutationFn: async (id) => {
      const data = await apiPost<Record<string, unknown>>(
        `/api/sprints/${id}/complete/`,
      );
      return mapSprint(data);
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: sprintKeys.lists() });
      queryClient.invalidateQueries({ queryKey: sprintKeys.detail(id) });
    },
  });
}
