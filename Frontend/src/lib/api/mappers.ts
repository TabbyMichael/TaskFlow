import type {
  User,
  Project,
  Sprint,
  Task,
  Comment,
  ActivityItem,
  ID,
} from '@/shared/types';

/**
 * Map a backend member object (snake_case) to the frontend User type.
 */
export function mapMemberToUser(member: Record<string, unknown>): User {
  return {
    id: String(member.id ?? '') as ID,
    name: (member.name as string) ?? '',
    email: (member.email as string) ?? '',
    avatarUrl: (member.avatar_url as string) ?? member.avatarUrl as string | undefined,
    role: (member.role as User['role']) ?? 'member',
    status: (member.status as User['status']) ?? 'active',
    title: member.title as string | undefined,
    initials: (member.initials as string) ?? '',
  };
}

/**
 * Map a backend project object (snake_case) to the frontend Project type.
 */
export function mapProject(project: Record<string, unknown>): Project {
  return {
    id: String(project.id ?? '') as ID,
    key: (project.key as string) ?? '',
    name: (project.name as string) ?? '',
    description: (project.description as string) ?? '',
    status: (project.status as Project['status']) ?? 'planning',
    progress: (project.progress as number) ?? 0,
    startDate: (project.start_date as string) ?? (project.startDate as string) ?? '',
    dueDate: (project.due_date as string) ?? (project.dueDate as string) ?? '',
    leadId: String(
      (project.lead as ID | undefined) ??
        (project.lead_details as Record<string, unknown> | undefined)?.id ??
        (project.leadId as string) ??
        '',
    ) as ID,
    memberIds: ((project.member_ids as unknown[]) ?? (project.memberIds as unknown[]) ?? []).map(
      (id) => String(id) as ID,
    ),
    color: (project.color as string) ?? '',
  };
}

/**
 * Map a backend sprint object (snake_case) to the frontend Sprint type.
 */
export function mapSprint(sprint: Record<string, unknown>): Sprint {
  return {
    id: String(sprint.id ?? '') as ID,
    name: (sprint.name as string) ?? '',
    goal: (sprint.goal as string) ?? '',
    status: (sprint.status as Sprint['status']) ?? 'planned',
    projectId: String(sprint.project ?? sprint.projectId ?? '') as ID,
    startDate: (sprint.start_date as string) ?? (sprint.startDate as string) ?? '',
    endDate: (sprint.end_date as string) ?? (sprint.endDate as string) ?? '',
    totalPoints: (sprint.total_points as number) ?? (sprint.totalPoints as number) ?? 0,
    completedPoints:
      (sprint.completed_points as number) ?? (sprint.completedPoints as number) ?? 0,
  };
}

/**
 * Map a backend task object to the frontend Task type.
 * Task serializer already uses camelCase, but we ensure nested objects are mapped.
 */
export function mapTask(task: Record<string, unknown>): Task {
  return {
    id: String(task.id ?? '') as ID,
    key: (task.key as string) ?? '',
    title: (task.title as string) ?? '',
    description: (task.description as string) ?? '',
    status: (task.status as Task['status']) ?? 'backlog',
    priority: (task.priority as Task['priority']) ?? 'medium',
    assigneeId: task.assigneeId != null ? (String(task.assigneeId) as ID) : null,
    reporterId: String(task.reporterId ?? '') as ID,
    projectId: String(task.projectId ?? '') as ID,
    sprintId: task.sprintId != null ? (String(task.sprintId) as ID) : null,
    storyPoints: (task.storyPoints as number) ?? 0,
    dueDate: (task.dueDate as string | null) ?? null,
    createdAt: (task.createdAt as string) ?? '',
    updatedAt: (task.updatedAt as string) ?? '',
    labels: (task.labels as string[]) ?? [],
    checklist: ((task.checklist as Record<string, unknown>[]) ?? []).map((item) => ({
      id: String(item.id ?? '') as ID,
      text: (item.text as string) ?? '',
      done: Boolean(item.done),
    })),
    comments: ((task.comments as Record<string, unknown>[]) ?? []).map(mapComment),
    activity: ((task.activity as Record<string, unknown>[]) ?? []).map(mapActivityItem),
    attachments: ((task.attachments as Record<string, unknown>[]) ?? []).map((a) => ({
      id: String(a.id ?? '') as ID,
      name: (a.name as string) ?? '',
      size: (a.size as number) ?? 0,
    })),
  };
}

function mapComment(comment: Record<string, unknown>): Comment {
  return {
    id: String(comment.id ?? '') as ID,
    authorId: String(comment.authorId ?? comment.author_id ?? '') as ID,
    body: (comment.body as string) ?? '',
    createdAt: (comment.createdAt as string) ?? (comment.created_at as string) ?? '',
  };
}

function mapActivityItem(item: Record<string, unknown>): ActivityItem {
  return {
    id: String(item.id ?? '') as ID,
    actorId: String(item.actorId ?? item.actor_id ?? '') as ID,
    type: (item.type as ActivityItem['type']) ?? 'updated',
    message: (item.message as string) ?? '',
    createdAt: (item.createdAt as string) ?? (item.created_at as string) ?? '',
  };
}

/**
 * Helper to build a paginated response with results mapped through a mapper function.
 */
export function paginatedResponse<T>(
  response: Record<string, unknown>,
  mapper: (item: Record<string, unknown>) => T,
): { results: T[]; count: number; page: number; pageSize: number } {
  const results = ((response.results as Record<string, unknown>[]) ?? []).map(mapper);
  return {
    results,
    count: (response.count as number) ?? results.length,
    page: (response.page as number) ?? 1,
    pageSize: (response.page_size as number) ?? (response.pageSize as number) ?? results.length,
  };
}
