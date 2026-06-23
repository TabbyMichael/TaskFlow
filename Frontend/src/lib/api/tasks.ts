import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete } from './client';
import { mapTask } from './mappers';
import type { Task } from '@/shared/types';

// ─── Query key factory ───────────────────────────────────────────────────────
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => ['tasks', 'list'] as const,
  list: (filters?: Record<string, string | undefined | null>) =>
    ['tasks', 'list', filters] as const,
  details: () => ['tasks', 'detail'] as const,
  detail: (id: string) => ['tasks', 'detail', id] as const,
};

// ─── Query options type ──────────────────────────────────────────────────────

interface UseTasksListOptions {
  enabled?: boolean;
}

interface TasksFilters {
  projectId?: string;
  sprintId?: string | null;
  status?: string;
}

/**
 * Build query params string from filters, skipping null/undefined values.
 */
function buildQueryString(filters?: TasksFilters): string {
  if (!filters) return '';

  const params = new URLSearchParams();

  if (filters.projectId) params.set('projectId', filters.projectId);
  if (filters.sprintId != null) params.set('sprintId', filters.sprintId);
  if (filters.status) params.set('status', filters.status);

  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/**
 * Fetch the list of tasks, optionally filtered by project, sprint, or status.
 */
export function useTasksList(
  filters?: TasksFilters,
  options?: UseTasksListOptions,
) {
  return useQuery<Task[]>({
    queryKey: taskKeys.list({
      projectId: filters?.projectId,
      sprintId: filters?.sprintId,
      status: filters?.status,
    }),
    queryFn: async () => {
      const qs = buildQueryString(filters);
      const data = await apiGet<Record<string, unknown>[]>(`/api/tasks/${qs}`);

      // Handle both array responses and paginated { results: [...] } responses
      if (Array.isArray(data)) {
        return data.map(mapTask);
      }
      const results = (
        data as unknown as Record<string, unknown>
      ).results as Record<string, unknown>[];
      return (results ?? []).map(mapTask);
    },
    enabled: options?.enabled,
    staleTime: 15_000,
  });
}

interface UseTaskOptions {
  enabled?: boolean;
}

/**
 * Fetch a single task by its ID.
 */
export function useTask(id: string, options?: UseTaskOptions) {
  return useQuery<Task>({
    queryKey: taskKeys.detail(id),
    queryFn: async () => {
      const data = await apiGet<Record<string, unknown>>(`/api/tasks/${id}/`);
      return mapTask(data);
    },
    enabled: options?.enabled !== false && !!id,
    staleTime: 15_000,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

interface CreateTaskPayload {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  assigneeId?: string | number | null;
  reporterId: string | number;
  projectId: string | number;
  sprintId?: string | number | null;
  storyPoints?: number;
  dueDate?: string | null;
  labels?: string[];
}

/**
 * Create a new task.
 */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation<Task, Error, CreateTaskPayload>({
    mutationFn: async (payload) => {
      const data = await apiPost<Record<string, unknown>>(
        '/api/tasks/',
        payload,
      );
      return mapTask(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

interface UpdateTaskPayload {
  id: string;
  data: Partial<{
    title: string;
    description: string;
    status: string;
    priority: string;
    assigneeId: string | number | null;
    sprintId: string | number | null;
    storyPoints: number;
    dueDate: string | null;
    labels: string[];
  }>;
}

/**
 * Update an existing task (partial update via PATCH).
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation<Task, Error, UpdateTaskPayload>({
    mutationFn: async ({ id, data }) => {
      const result = await apiPatch<Record<string, unknown>>(
        `/api/tasks/${id}/`,
        data,
      );
      return mapTask(result);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: taskKeys.detail(variables.id),
      });
    },
  });
}

/**
 * Delete a task.
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await apiDelete<void>(`/api/tasks/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}
