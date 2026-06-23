import { describe, expect, it } from "vitest";
import { Inbox } from "lucide-react";
import { renderWithProviders, screen } from "../../setup/test-utils";
import { EmptyState } from "@/shared/components/empty-state";

describe("EmptyState", () => {
  it("renders the title", () => {
    renderWithProviders(<EmptyState icon={Inbox} title="Nothing here" />);
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });

  it("renders the optional description and action", () => {
    renderWithProviders(
      <EmptyState
        icon={Inbox}
        title="No tasks"
        description="Create your first task"
        action={<button type="button">Add task</button>}
      />,
    );
    expect(screen.getByText("Create your first task")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add task" })).toBeInTheDocument();
  });

  it("omits the description when not provided", () => {
    renderWithProviders(<EmptyState icon={Inbox} title="Empty" />);
    expect(screen.queryByText("Create your first task")).not.toBeInTheDocument();
  });
});
