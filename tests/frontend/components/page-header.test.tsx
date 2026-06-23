import { describe, expect, it } from "vitest";
import { renderWithProviders, screen } from "../../setup/test-utils";
import { PageHeader } from "@/shared/components/page-header";

describe("PageHeader", () => {
  it("renders the title as a level-1 heading", () => {
    renderWithProviders(<PageHeader title="Dashboard" />);
    expect(screen.getByRole("heading", { level: 1, name: "Dashboard" })).toBeInTheDocument();
  });

  it("renders description and actions", () => {
    renderWithProviders(
      <PageHeader
        title="Projects"
        description="All your work"
        actions={<button type="button">New project</button>}
      />,
    );
    expect(screen.getByText("All your work")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New project" })).toBeInTheDocument();
  });
});
