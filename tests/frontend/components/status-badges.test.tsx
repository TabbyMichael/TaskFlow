import { describe, expect, it } from "vitest";
import { renderWithProviders, screen } from "../../setup/test-utils";
import {
  PriorityBadge,
  ProjectStatusBadge,
  SprintStatusBadge,
  TaskStatusBadge,
  UserStatusBadge,
} from "@/shared/components/status-badges";

describe("status badges", () => {
  it("maps task status to a readable label", () => {
    renderWithProviders(<TaskStatusBadge status="in_progress" />);
    expect(screen.getByText("In Progress")).toBeInTheDocument();
  });

  it("maps every task status without throwing", () => {
    (["backlog", "todo", "in_progress", "review", "done"] as const).forEach((s) => {
      renderWithProviders(<TaskStatusBadge status={s} />);
    });
    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  it("renders priority labels", () => {
    renderWithProviders(<PriorityBadge priority="urgent" />);
    expect(screen.getByText("Urgent")).toBeInTheDocument();
  });

  it("renders project status labels", () => {
    renderWithProviders(<ProjectStatusBadge status="on_hold" />);
    expect(screen.getByText("On Hold")).toBeInTheDocument();
  });

  it("renders sprint status labels", () => {
    renderWithProviders(<SprintStatusBadge status="planned" />);
    expect(screen.getByText("Planned")).toBeInTheDocument();
  });

  it("renders user status labels", () => {
    renderWithProviders(<UserStatusBadge status="invited" />);
    expect(screen.getByText("Invited")).toBeInTheDocument();
  });
});
