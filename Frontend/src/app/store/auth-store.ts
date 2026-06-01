import { create } from "zustand";
import { persist } from "zustand/middleware";
import { currentUser } from "@/shared/api/mock-data";
import type { User } from "@/shared/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: async (email) => {
        await new Promise((r) => setTimeout(r, 400));
        set({ user: { ...currentUser, email }, isAuthenticated: true });
      },
      register: async (name, email) => {
        await new Promise((r) => setTimeout(r, 400));
        set({ user: { ...currentUser, name, email }, isAuthenticated: true });
      },
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: "taskflow-auth" },
  ),
);
