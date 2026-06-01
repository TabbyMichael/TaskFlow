import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark";

interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebar: (v: boolean) => void;
  mobileNavOpen: boolean;
  setMobileNav: (v: boolean) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebar: (v) => set({ sidebarCollapsed: v }),
      mobileNavOpen: false,
      setMobileNav: (v) => set({ mobileNavOpen: v }),
      theme: "light",
      setTheme: (theme) => set({ theme }),
    }),
    { name: "taskflow-ui", partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed, theme: s.theme }) },
  ),
);
