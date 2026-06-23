import { describe, expect, it } from "vitest";
import {
  notifications,
  organizations,
  projects,
  sprints,
  tasks,
  users,
} from "@/shared/api/mock-data";
import type {
  ProjectStatus,
  Role,
  SprintStatus,
  TaskPriority,
  TaskStatus,
  UserStatus,
} from "@/shared/types";

const userIds = new Set(users.map((u) => u.id));
const projectIds = new Set(projects.map((p) => p.id));
const sprintIds = new Set(sprints.map((s) => s.id));

const TASK_STATUSES: TaskStatus[] = ["backlog", "todo", "in_progress", "review", "done"];
const TASK_PRIORITIES: TaskPriority[] = ["low", "medium", "high", "urgent"];
const PROJECT_STATUSES: ProjectStatus[] = ["planning", "active", "on_hold", "completed"];
const SPRINT_STATUSES: SprintStatus[] = ["planned", "active", "completed"];
const ROLES: Role[] = ["admin", "manager", "member", "viewer"];
const USER_STATUSES: UserStatus[] = ["active", "invited", "suspended"];

function expectUnique(ids: string[]) {
  expect(new Set(ids).size).toBe(ids.length);
}

describe("primary key uniqueness", () => {
  it("each collection has unique ids", () => {
    expectUnique(users.map((u) => u.id));
    expectUnique(projects.map((p) => p.id));
    expectUnique(tasks.map((t) => t.id));
    expectUnique(sprints.map((s) => s.id));
    expectUnique(notifications.map((n) => n.id));
    expectUnique(organizations.map((o) => o.id));
  });

  it("task keys are unique and well-formed", () => {
    expectUnique(tasks.map((t) => t.key));
    for (const t of tasks) expect(t.key).toMatch(/^[A-Z]+-\d+$/);
  });
});

describe("referential integrity", () => {
  it("projects reference real leads and members", () => {
    for (const p of projects) {
      expect(userIds.has(p.leadId)).toBe(true);
      for (const m of p.memberIds) expect(userIds.has(m)).toBe(true);
    }
  });

  it("tasks reference real projects, users and sprints", () => {
    for (const t of tasks) {
      expect(projectIds.has(t.projectId)).toBe(true);
      expect(userIds.has(t.reporterId)).toBe(true);
      if (t.assigneeId !== null) expect(userIds.has(t.assigneeId)).toBe(true);
      if (t.sprintId !== null) expect(sprintIds.has(t.sprintId)).toBe(true);
      for (const c of t.comments) expect(userIds.has(c.authorId)).toBe(true);
      for (const a of t.activity) expect(userIds.has(a.actorId)).toBe(true);
    }
  });

  it("sprints reference real projects", () => {
    for (const s of sprints) expect(projectIds.has(s.projectId)).toBe(true);
  });

  it("notification actors, when present, reference real users", () => {
    for (const n of notifications) {
      if (n.actorId) expect(userIds.has(n.actorId)).toBe(true);
    }
  });
});

describe("enum / check constraints", () => {
  it("users have valid roles and statuses", () => {
    for (const u of users) {
      expect(ROLES).toContain(u.role);
      expect(USER_STATUSES).toContain(u.status);
    }
  });

  it("tasks have valid status and priority", () => {
    for (const t of tasks) {
      expect(TASK_STATUSES).toContain(t.status);
      expect(TASK_PRIORITIES).toContain(t.priority);
    }
  });

  it("projects and sprints have valid statuses", () => {
    for (const p of projects) expect(PROJECT_STATUSES).toContain(p.status);
    for (const s of sprints) expect(SPRINT_STATUSES).toContain(s.status);
  });
});

describe("value constraints", () => {
  it("project progress is between 0 and 100", () => {
    for (const p of projects) {
      expect(p.progress).toBeGreaterThanOrEqual(0);
      expect(p.progress).toBeLessThanOrEqual(100);
    }
  });

  it("task story points are positive", () => {
    for (const t of tasks) expect(t.storyPoints).toBeGreaterThan(0);
  });

  it("sprint completed points never exceed total points", () => {
    for (const s of sprints) {
      expect(s.totalPoints).toBeGreaterThan(0);
      expect(s.completedPoints).toBeGreaterThanOrEqual(0);
      expect(s.completedPoints).toBeLessThanOrEqual(s.totalPoints);
    }
  });
});
