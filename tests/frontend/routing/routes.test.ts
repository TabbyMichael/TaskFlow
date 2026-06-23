import { describe, expect, it } from "vitest";
import { ROUTES } from "@/shared/constants/routes";

describe("ROUTES", () => {
  it("exposes absolute paths for every static route", () => {
    const staticRoutes = Object.entries(ROUTES).filter(
      ([, v]) => typeof v === "string",
    ) as [string, string][];
    expect(staticRoutes.length).toBeGreaterThan(0);
    for (const [, path] of staticRoutes) {
      expect(path.startsWith("/")).toBe(true);
    }
  });

  it("builds a project detail path from an id", () => {
    expect(ROUTES.project("p1")).toBe("/projects/p1");
    expect(ROUTES.project("abc")).toBe("/projects/abc");
  });

  it("points key destinations at the expected paths", () => {
    expect(ROUTES.login).toBe("/login");
    expect(ROUTES.dashboard).toBe("/dashboard");
    expect(ROUTES.kanban).toBe("/kanban");
    expect(ROUTES.admin).toBe("/admin");
  });
});
