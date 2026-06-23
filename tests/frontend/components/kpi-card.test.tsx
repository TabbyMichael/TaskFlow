import { describe, expect, it } from "vitest";
import { Activity } from "lucide-react";
import { renderWithProviders, screen } from "../../setup/test-utils";
import { KpiCard } from "@/shared/components/kpi-card";

describe("KpiCard", () => {
  it("renders the label and value", () => {
    renderWithProviders(<KpiCard label="Open Tasks" value={20} icon={Activity} />);
    expect(screen.getByText("Open Tasks")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
  });

  it("renders a delta when provided", () => {
    renderWithProviders(
      <KpiCard label="Velocity" value="57%" delta="+12% vs last week" icon={Activity} trend="up" />,
    );
    expect(screen.getByText("+12% vs last week")).toBeInTheDocument();
  });

  it("omits the delta block when not provided", () => {
    renderWithProviders(<KpiCard label="Projects" value={3} icon={Activity} />);
    expect(screen.queryByText(/vs last week/)).not.toBeInTheDocument();
  });
});
