import type {
  Comment,
  Notification,
  Project,
  Sprint,
  Task,
  User,
} from "@/shared/types";

// Deterministic factories. Every builder returns a fully-valid entity and lets
// tests override any field. No randomness => no flaky tests.

let seq = 0;
const nextId = (prefix: string) => `${prefix}_${++seq}`;
export const resetFactorySeq = () => {
  seq = 0;
};

const iso = (offsetDays = 0) =>
  new Date(Date.UTC(2025, 0, 1) + offsetDays * 86400000).toISOString();

export function makeUser(overrides: Partial<User> = {}): User {
  const id = overrides.id ?? nextId("u");
  return {
    id,
    name: "Test User",
    email: `${id}@example.com`,
    role: "member",
    status: "active",
    title: "Engineer",
    initials: "TU",
    ...overrides,
  };
}

export function makeProject(overrides: Partial<Project> = {}): Project {
  const id = overrides.id ?? nextId("p");
  return {
    id,
    key: "TST",
    name: "Test Project",
    description: "A project used in tests.",
    status: "active",
    progress: 50,
    dueDate: iso(30),
    startDate: iso(-30),
    leadId: "u1",
    memberIds: ["u1"],
    color: "oklch(0.55 0.22 265)",
    ...overrides,
  };
}

export function makeComment(overrides: Partial<Comment> = {}): Comment {
  return {
    id: overrides.id ?? nextId("cm"),
    authorId: "u1",
    body: "A comment",
    createdAt: iso(-1),
    ...overrides,
  };
}

export function makeTask(overrides: Partial<Task> = {}): Task {
  const id = overrides.id ?? nextId("t");
  return {
    id,
    key: `TST-${id}`,
    title: "Test Task",
    description: "A task used in tests.",
    status: "todo",
    priority: "medium",
    assigneeId: "u1",
    reporterId: "u1",
    projectId: "p1",
    sprintId: null,
    storyPoints: 3,
    dueDate: null,
    createdAt: iso(-5),
    updatedAt: iso(-1),
    labels: ["frontend"],
    checklist: [{ id: "c1", text: "Do the thing", done: false }],
    comments: [],
    activity: [],
    attachments: [],
    ...overrides,
  };
}

export function makeSprint(overrides: Partial<Sprint> = {}): Sprint {
  const id = overrides.id ?? nextId("s");
  return {
    id,
    name: "Test Sprint",
    goal: "Ship it",
    status: "active",
    projectId: "p1",
    startDate: iso(-7),
    endDate: iso(7),
    completedPoints: 10,
    totalPoints: 20,
    ...overrides,
  };
}

export function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: overrides.id ?? nextId("n"),
    type: "mention",
    title: "You were mentioned",
    body: "in a task",
    read: false,
    createdAt: iso(0),
    actorId: "u2",
    ...overrides,
  };
}
