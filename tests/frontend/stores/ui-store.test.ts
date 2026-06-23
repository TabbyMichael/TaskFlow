import { beforeEach, describe, expect, it } from "vitest";
import { useUIStore } from "@/app/store/ui-store";

describe("useUIStore", () => {
  beforeEach(() => {
    useUIStore.setState({
      sidebarCollapsed: false,
      mobileNavOpen: false,
      theme: "light",
    });
  });

  it("toggles the sidebar", () => {
    expect(useUIStore.getState().sidebarCollapsed).toBe(false);
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarCollapsed).toBe(true);
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarCollapsed).toBe(false);
  });

  it("sets the sidebar state explicitly", () => {
    useUIStore.getState().setSidebar(true);
    expect(useUIStore.getState().sidebarCollapsed).toBe(true);
  });

  it("controls the mobile nav", () => {
    useUIStore.getState().setMobileNav(true);
    expect(useUIStore.getState().mobileNavOpen).toBe(true);
  });

  it("switches theme", () => {
    useUIStore.getState().setTheme("dark");
    expect(useUIStore.getState().theme).toBe("dark");
  });

  it("persists only the whitelisted fields (sidebar + theme)", () => {
    useUIStore.getState().setTheme("dark");
    useUIStore.getState().setSidebar(true);
    useUIStore.getState().setMobileNav(true);

    const persisted = JSON.parse(window.localStorage.getItem("taskflow-ui") ?? "{}");
    expect(persisted.state).toMatchObject({ theme: "dark", sidebarCollapsed: true });
    expect(persisted.state).not.toHaveProperty("mobileNavOpen");
  });
});
