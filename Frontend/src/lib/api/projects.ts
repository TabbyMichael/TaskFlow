import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete } from './client';
import { mapProject, paginatedResponse } from './mappers';
import type { Project } from '@/shared/types';

// ─── Query key factory ───────────────────────────────────────────────────────
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => ['projects', 'list'] as const,
  list: (filters?: Record<string, string | undefined>) =>
    ['projects', 'list', filters] as const,
  details: () => ['projects', 'detail'] as const,
  detail: (id: string) => ['projects', 'detail', id] as const,
};

// ─── Response types ──────────────────────────────────────────────────────────

interface PaginatedResponse<T> {
  results: T[];
  count: number;
  page: number;
  pageSize: number;
}

interface UseProjectsListOptions {
  enabled?: boolean;
}

/**
 * Fetch the list of projects for the current tenant.
 */
export function useProjectsList(options?: UseProjectsListOptions) {
  return useQuery<Project[]>({
    queryKey: projectKeys.lists(),
    queryFn: async () => {
      const data = await apiGet<Record<string, unknown>[]>('/api/projects/');
      // Handle both array responses and paginated { results: [...] } responses
      if (Array.isArray(data)) {
        return data.map(mapProject);
      }
      const paginated = paginatedResponse(
        data as unknown as Record<string, unknown>,
        mapProject,
      );
      return paginated.results;
    },
    enabled: options?.enabled,
    staleTime: 30_000,
  });
}

interface UseProjectOptions {
  enabled?: boolean;
}

/**
 * Fetch a single project by its ID.
 */
export function useProject(id: string, options?: UseProjectOptions) {
  return useQuery<Project>({
    queryKey: projectKeys.detail(id),
    queryFn: async () => {
      const data = await apiGet<Record<string, unknown>>(`/api/projects/${id}/`);
      return mapProject(data);
    },
    enabled: options?.enabled !== false && !!id,
    staleTime: 30_000,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

interface CreateProjectPayload {
  name: string;
  key: string;
  description?: string;
  start_date?: string;
  due_date?: string;
  color?: string;
  lead?: string | number;
}

/**
 * Create a new project.
 */
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation<Project, Error, CreateProjectPayload>({
    mutationFn: async (payload) => {
      const data = await apiPost<Record<string, unknown>>(
        '/api/projects/',
        payload,
      );
      return mapProject(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

interface UpdateProjectPayload {
  id: string;
  data: Partial<{
    name: string;
    description: string;
    status: string;
    start_date: string;
    due_date: string;
    color: string;
    lead: string | number;
  }>;
}

/**
 * Update an existing project (partial update via PATCH).
 */
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation<Project, Error, UpdateProjectPayload>({
    mutationFn: async ({ id, data }) => {
      const result = await apiPatch<Record<string, unknown>>(
        `/api/projects/${id}/`,
        data,
      );
      return mapProject(result);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: projectKeys.detail(variables.id),
      });
    },
  });
}

/**
 * Delete a project.
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await apiDelete<void>(`/api/projects/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}
