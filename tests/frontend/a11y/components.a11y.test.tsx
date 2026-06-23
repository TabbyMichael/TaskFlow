import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Activity, Inbox } from "lucide-react";
import { renderWithProviders } from "../../setup/test-utils";
import { KpiCard } from "@/shared/components/kpi-card";
import { EmptyState } from "@/shared/components/empty-state";
import { PageHeader } from "@/shared/components/page-header";
import { TaskStatusBadge } from "@/shared/components/status-badges";

describe("accessibility", () => {
  it("PageHeader has no detectable a11y violations", async () => {
    const { container } = renderWithProviders(
      <PageHeader title="Dashboard" description="Overview" />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("KpiCard has no detectable a11y violations", async () => {
    const { container } = renderWithProviders(
      <KpiCard label="Open Tasks" value={20} delta="+12%" icon={Activity} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("EmptyState with an action has no detectable a11y violations", async () => {
    const { container } = renderWithProviders(
      <EmptyState
        icon={Inbox}
        title="No tasks"
        description="Create your first task"
        action={<button type="button">Add task</button>}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("TaskStatusBadge has no detectable a11y violations", async () => {
    const { container } = renderWithProviders(<TaskStatusBadge status="done" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
