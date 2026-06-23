import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/shared/types";
import { loginApi, registerApi, getCurrentMember, clearTokens } from "@/lib/api";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    orgName: string;
    orgSlug: string;
  }) => Promise<void>;
  logout: () => void;
  initAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          // Backend EmailOrUsernameBackend accepts email as username
          await loginApi(email, password);
          const user = await getCurrentMember();
          if (!user) {
            throw new Error("Could not find your user profile.");
          }
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (err: unknown) {
          const message =
            err instanceof Error
              ? err.message
              : "Login failed. Please check your credentials.";
          set({ error: message, isLoading: false });
          throw err;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          await registerApi({
            username: data.email.split("@")[0],
            email: data.email,
            password: data.password,
            firstName: data.firstName,
            lastName: data.lastName,
            orgName: data.orgName,
            orgSlug: data.orgSlug,
          });
          // Auto-login after successful registration
          await loginApi(data.email, data.password);
          const user = await getCurrentMember();
          if (!user) {
            throw new Error("Could not find your user profile after registration.");
          }
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (err: unknown) {
          const message =
            err instanceof Error
              ? err.message
              : "Registration failed. Please try again.";
          set({ error: message, isLoading: false });
          throw err;
        }
      },

      logout: () => {
        clearTokens();
        set({ user: null, isAuthenticated: false, error: null });
      },

      initAuth: async () => {
        // Check if we have a stored token and try to restore session
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("taskflow-access-token")
            : null;
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }
        try {
          const user = await getCurrentMember();
          if (user) {
            set({ user, isAuthenticated: true });
          } else {
            clearTokens();
            set({ isAuthenticated: false, user: null });
          }
        } catch {
          clearTokens();
          set({ isAuthenticated: false, user: null });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "taskflow-auth",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
