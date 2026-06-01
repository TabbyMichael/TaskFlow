import type {
  User, Project, Task, Sprint, Notification, Organization,
  ActivityItem, Comment, TaskStatus, TaskPriority,
} from "@/shared/types";

const now = Date.now();
const daysAgo = (n: number) => new Date(now - n * 86400000).toISOString();
const daysAhead = (n: number) => new Date(now + n * 86400000).toISOString();

export const organizations: Organization[] = [
  { id: "org_1", name: "Acme Corp", plan: "Enterprise" },
  { id: "org_2", name: "Northwind Labs", plan: "Pro" },
];

export const users: User[] = [
  { id: "u1", name: "Alex Morgan", email: "alex@acme.io", role: "admin", status: "active", title: "Head of Product", initials: "AM" },
  { id: "u2", name: "Priya Shah", email: "priya@acme.io", role: "manager", status: "active", title: "Engineering Manager", initials: "PS" },
  { id: "u3", name: "Diego Ramos", email: "diego@acme.io", role: "member", status: "active", title: "Senior Engineer", initials: "DR" },
  { id: "u4", name: "Yuki Tanaka", email: "yuki@acme.io", role: "member", status: "active", title: "Designer", initials: "YT" },
  { id: "u5", name: "Sam O'Connor", email: "sam@acme.io", role: "member", status: "active", title: "Frontend Engineer", initials: "SO" },
  { id: "u6", name: "Lina Petrova", email: "lina@acme.io", role: "member", status: "invited", title: "QA Engineer", initials: "LP" },
  { id: "u7", name: "Marcus Bell", email: "marcus@acme.io", role: "viewer", status: "active", title: "Stakeholder", initials: "MB" },
  { id: "u8", name: "Hana Kim", email: "hana@acme.io", role: "member", status: "active", title: "Backend Engineer", initials: "HK" },
];

export const currentUser: User = users[0];

export const projects: Project[] = [
  { id: "p1", key: "WEB", name: "Web Platform Redesign", description: "Modernize the customer-facing web platform with a new design system.", status: "active", progress: 64, dueDate: daysAhead(28), startDate: daysAgo(60), leadId: "u2", memberIds: ["u2","u3","u4","u5"], color: "oklch(0.55 0.22 265)" },
  { id: "p2", key: "MOB", name: "Mobile App v3", description: "Native iOS and Android refresh with offline support.", status: "active", progress: 41, dueDate: daysAhead(45), startDate: daysAgo(30), leadId: "u3", memberIds: ["u3","u5","u8"], color: "oklch(0.62 0.16 155)" },
  { id: "p3", key: "API", name: "Public API v2", description: "GraphQL gateway and developer documentation portal.", status: "planning", progress: 12, dueDate: daysAhead(75), startDate: daysAgo(5), leadId: "u8", memberIds: ["u8","u3"], color: "oklch(0.62 0.15 230)" },
  { id: "p4", key: "OPS", name: "Internal Tooling", description: "Operational dashboards for support and finance.", status: "on_hold", progress: 88, dueDate: daysAhead(10), startDate: daysAgo(90), leadId: "u2", memberIds: ["u2","u8"], color: "oklch(0.72 0.16 75)" },
  { id: "p5", key: "BRD", name: "Brand Refresh", description: "New brand identity and marketing site rollout.", status: "completed", progress: 100, dueDate: daysAgo(7), startDate: daysAgo(120), leadId: "u4", memberIds: ["u4","u1"], color: "oklch(0.6 0.22 320)" },
  { id: "p6", key: "DATA", name: "Data Warehouse", description: "Migrate analytics to dbt + Snowflake.", status: "active", progress: 30, dueDate: daysAhead(60), startDate: daysAgo(20), leadId: "u8", memberIds: ["u8","u2"], color: "oklch(0.55 0.18 200)" },
];

export const sprints: Sprint[] = [
  { id: "s1", name: "Sprint 24 — Foundations", goal: "Ship design system v1 and auth flow", status: "active", projectId: "p1", startDate: daysAgo(7), endDate: daysAhead(7), completedPoints: 24, totalPoints: 42 },
  { id: "s2", name: "Sprint 23 — Discovery", goal: "User research synthesis", status: "completed", projectId: "p1", startDate: daysAgo(21), endDate: daysAgo(7), completedPoints: 38, totalPoints: 40 },
  { id: "s3", name: "Sprint 12 — Offline", goal: "Local-first sync engine", status: "active", projectId: "p2", startDate: daysAgo(4), endDate: daysAhead(10), completedPoints: 11, totalPoints: 34 },
  { id: "s4", name: "Sprint 4 — Schema", goal: "GraphQL schema lockdown", status: "planned", projectId: "p3", startDate: daysAhead(3), endDate: daysAhead(17), completedPoints: 0, totalPoints: 28 },
];

const statuses: TaskStatus[] = ["backlog","todo","in_progress","review","done"];
const priorities: TaskPriority[] = ["low","medium","high","urgent"];
const labelPool = ["frontend","backend","design","bug","tech-debt","docs","infra","perf"];

const titles = [
  "Refactor navigation primitives", "Implement command palette", "Audit color contrast tokens",
  "Add empty states to project list", "Wire telemetry to dashboard KPIs", "Replace legacy modal stack",
  "Fix scroll restoration on detail pages", "Add bulk task actions", "Spec sprint burndown math",
  "Triage SEV-2 from on-call rotation", "Cache invalidation on assignment", "Add keyboard shortcuts to board",
  "Migrate forms to react-hook-form", "Author RFC for permissions model", "Add CSV export for reports",
  "Polish notification center hover states", "Reduce bundle on /tasks", "Implement webhook receiver",
  "Add MFA to security settings", "Schema for activity feed", "Test plan for offline sync",
  "Optimistic updates on kanban drag", "Pagination on team page", "Onboarding tour for new orgs",
];

export const tasks: Task[] = titles.map((title, i) => {
  const projectId = projects[i % 4].id;
  const project = projects.find(p => p.id === projectId)!;
  const status = statuses[i % statuses.length];
  const priority = priorities[i % priorities.length];
  const assigneeId = users[(i + 1) % users.length].id;
  return {
    id: `t${i+1}`,
    key: `${project.key}-${100 + i}`,
    title,
    description: "Detailed scope and acceptance criteria for this work item. Includes design specs, edge cases, and rollout plan.",
    status, priority,
    assigneeId,
    reporterId: "u1",
    projectId,
    sprintId: i < 8 ? "s1" : i < 14 ? "s3" : null,
    storyPoints: [1,2,3,5,8][i % 5],
    dueDate: i % 3 === 0 ? daysAhead((i % 14) + 1) : null,
    createdAt: daysAgo(20 - (i % 18)),
    updatedAt: daysAgo(i % 5),
    labels: [labelPool[i % labelPool.length], labelPool[(i+3) % labelPool.length]],
    checklist: [
      { id: `c${i}a`, text: "Spec reviewed", done: true },
      { id: `c${i}b`, text: "Implementation complete", done: i % 2 === 0 },
      { id: `c${i}c`, text: "QA signed off", done: status === "done" },
    ],
    comments: [
      { id: `cm${i}a`, authorId: "u2", body: "Looks good — let's also cover the empty state.", createdAt: daysAgo(2) },
      { id: `cm${i}b`, authorId: assigneeId, body: "Pushed an update, ready for review.", createdAt: daysAgo(1) },
    ],
    activity: [
      { id: `a${i}a`, actorId: "u1", type: "created", message: "created this task", createdAt: daysAgo(10) },
      { id: `a${i}b`, actorId: "u2", type: "assigned", message: `assigned to ${users.find(u=>u.id===assigneeId)?.name}`, createdAt: daysAgo(8) },
      { id: `a${i}c`, actorId: assigneeId, type: "status_changed", message: `moved to ${status.replace("_"," ")}`, createdAt: daysAgo(3) },
    ] satisfies ActivityItem[],
    attachments: i % 4 === 0 ? [{ id: `f${i}`, name: "design-spec.pdf", size: 482300 }] : [],
  };
});

export const notifications: Notification[] = [
  { id: "n1", type: "mention", title: "Priya mentioned you", body: "in 'Refactor navigation primitives'", read: false, createdAt: daysAgo(0), actorId: "u2" },
  { id: "n2", type: "assignment", title: "New assignment", body: "WEB-103 'Audit color contrast tokens'", read: false, createdAt: daysAgo(0), actorId: "u2" },
  { id: "n3", type: "sprint", title: "Sprint 24 started", body: "Foundations sprint is now active", read: true, createdAt: daysAgo(7) },
  { id: "n4", type: "project", title: "Mobile App v3 updated", body: "Diego changed the milestone", read: true, createdAt: daysAgo(2), actorId: "u3" },
  { id: "n5", type: "mention", title: "Yuki replied", body: "in 'Polish notification center hover states'", read: true, createdAt: daysAgo(3), actorId: "u4" },
];

// Synthetic chart data
export const velocityTrend = [
  { sprint: "S20", planned: 32, completed: 28 },
  { sprint: "S21", planned: 36, completed: 34 },
  { sprint: "S22", planned: 40, completed: 31 },
  { sprint: "S23", planned: 40, completed: 38 },
  { sprint: "S24", planned: 42, completed: 24 },
];

export const burndown = Array.from({ length: 14 }, (_, i) => ({
  day: `Day ${i+1}`,
  ideal: Math.max(0, 42 - i * 3),
  actual: Math.max(0, 42 - Math.round(i * 2.7 + (i > 5 ? 4 : 0))),
}));

export const workload = users.slice(0, 6).map((u, i) => ({
  name: u.name.split(" ")[0],
  tasks: 4 + ((i * 3) % 9),
}));
