export type ID = string;

export type Role = "admin" | "manager" | "member" | "viewer";
export type UserStatus = "active" | "invited" | "suspended";

export interface User {
  id: ID;
  name: string;
  email: string;
  avatarUrl?: string;
  role: Role;
  status: UserStatus;
  title?: string;
  initials: string;
}

export type ProjectStatus = "planning" | "active" | "on_hold" | "completed";

export interface Project {
  id: ID;
  key: string;
  name: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  dueDate: string;
  startDate: string;
  leadId: ID;
  memberIds: ID[];
  color: string;
}

export type TaskStatus = "backlog" | "todo" | "in_progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: ID;
  key: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: ID | null;
  reporterId: ID;
  projectId: ID;
  sprintId: ID | null;
  storyPoints: number;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  labels: string[];
  checklist: { id: ID; text: string; done: boolean }[];
  comments: Comment[];
  activity: ActivityItem[];
  attachments: { id: ID; name: string; size: number }[];
}

export interface Comment {
  id: ID;
  authorId: ID;
  body: string;
  createdAt: string;
}

export interface ActivityItem {
  id: ID;
  actorId: ID;
  type: "created" | "updated" | "commented" | "assigned" | "status_changed" | "sprint_changed";
  message: string;
  createdAt: string;
}

export type SprintStatus = "planned" | "active" | "completed";

export interface Sprint {
  id: ID;
  name: string;
  goal: string;
  status: SprintStatus;
  projectId: ID;
  startDate: string;
  endDate: string;
  completedPoints: number;
  totalPoints: number;
}

export interface Notification {
  id: ID;
  type: "mention" | "assignment" | "project" | "sprint";
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  actorId?: ID;
}

export interface Organization {
  id: ID;
  name: string;
  plan: "Free" | "Pro" | "Enterprise";
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
}
