import { describe, expect, it } from "vitest";
import { mockFetch } from "@/shared/api/mock-client";
import {
  currentUser,
  notifications,
  projects,
  sprints,
  tasks,
  users,
} from "@/shared/api/mock-data";
import type { TaskStatus } from "@/shared/types";

// The mock data module is the app's de-facto "backend": the service layer reads
// from these collections. These tests exercise the query patterns the UI relies
// on (find-by-id, filter-by-foreign-key, aggregation), served through the same
// async mockFetch transport the app uses.

describe("data-access: collections", () => {
  it("seeds the expected number of records", () => {
    expect(users.length).toBe(8);
    expect(projects.length).toBe(6);
    expect(sprints.length).toBe(4);
    expect(tasks.length).toBeGreaterThan(0);
    expect(notifications.length).toBeGreaterThan(0);
  });

  it("currentUser is the first seeded user", () => {
    expect(currentUser).toEqual(users[0]);
  });
});

describe("data-access: queries served over the async transport", () => {
  it("fetches a user by id", async () => {
    const all = await mockFetch(users, 0);
    const found = all.find((u) => u.id === "u3");
    expect(found?.name).toBe("Diego Ramos");
  });

  it("filters tasks by project (foreign key)", async () => {
    const all = await mockFetch(tasks, 0);
    const projectId = projects[0].id;
    const subset = all.filter((t) => t.projectId === projectId);
    expect(subset.length).toBeGreaterThan(0);
    expect(subset.every((t) => t.projectId === projectId)).toBe(true);
  });

  it("filters tasks by status", async () => {
    const all = await mockFetch(tasks, 0);
    const status: TaskStatus = "done";
    const done = all.filter((t) => t.status === status);
    expect(done.every((t) => t.status === "done")).toBe(true);
  });

  it("groups tasks by sprint", async () => {
    const all = await mockFetch(tasks, 0);
    const inSprint1 = all.filter((t) => t.sprintId === "s1");
    const backlog = all.filter((t) => t.sprintId === null);
    expect(inSprint1.length).toBeGreaterThan(0);
    expect(inSprint1.length + backlog.length).toBeLessThanOrEqual(all.length);
  });

  it("computes unread notification count", async () => {
    const all = await mockFetch(notifications, 0);
    const unread = all.filter((n) => !n.read).length;
    expect(unread).toBe(notifications.filter((n) => !n.read).length);
    expect(unread).toBeGreaterThan(0);
  });

  it("resolves a sprint's parent project", async () => {
    const sprint = sprints[0];
    const project = projects.find((p) => p.id === sprint.projectId);
    expect(project).toBeDefined();
  });
});
