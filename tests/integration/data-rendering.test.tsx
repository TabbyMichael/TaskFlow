import { useQuery } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { renderWithProviders, screen, waitFor } from "../setup/test-utils";
import { mockFetch } from "@/shared/api/mock-client";
import { projects } from "@/shared/api/mock-data";
import { ProjectStatusBadge } from "@/shared/components/status-badges";
import type { Project } from "@/shared/types";

// Integration: mock-API transport -> TanStack Query -> real shared components.
function ProjectList() {
  const { data, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => mockFetch<Project[]>(projects, 0),
  });

  if (isLoading) return <p>Loading…</p>;
  return (
    <ul>
      {data?.map((p) => (
        <li key={p.id}>
          <span>{p.name}</span>
          <ProjectStatusBadge status={p.status} />
        </li>
      ))}
    </ul>
  );
}

describe("integration: data fetching renders through shared components", () => {
  it("shows a loading state then the fetched projects", async () => {
    renderWithProviders(<ProjectList />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByText("Web Platform Redesign")).toBeInTheDocument(),
    );
    expect(screen.getByText("Mobile App v3")).toBeInTheDocument();
    // Status badge label rendered from fetched data.
    expect(screen.getAllByText("Active").length).toBeGreaterThan(0);
  });
});
