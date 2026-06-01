import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { DashboardLayout } from "@/app/layouts/dashboard-layout";
import { useAuthStore } from "@/app/store/auth-store";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
  component: () => <DashboardLayout />,
});

// Outlet referenced via DashboardLayout
void Outlet;
