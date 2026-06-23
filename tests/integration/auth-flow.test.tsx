import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, renderWithRouter } from "../setup/test-utils";
import { LoginPage } from "@/features/auth/pages/login-page";
import { useAuthStore } from "@/app/store/auth-store";
import { getCurrentMember, loginApi } from "@/lib/api";
import { makeUser } from "../fixtures/factories";

vi.mock("@/lib/api", () => ({
  loginApi: vi.fn().mockResolvedValue(undefined),
  registerApi: vi.fn().mockResolvedValue(undefined),
  getCurrentMember: vi.fn(),
  clearTokens: vi.fn(),
}));

const mockGetCurrentMember = vi.mocked(getCurrentMember);
const mockLoginApi = vi.mocked(loginApi);

// Integration: UI form -> auth store -> router navigation, end to end in jsdom.
describe("integration: login flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoginApi.mockResolvedValue(undefined);
    useAuthStore.setState({ user: null, isAuthenticated: false, error: null });
    window.localStorage.clear();
  });

  it("drives the auth store and navigates on a successful login", async () => {
    mockGetCurrentMember.mockResolvedValue(makeUser({ email: "manager@acme.io" }));
    const { user, router } = await renderWithRouter(LoginPage);

    expect(useAuthStore.getState().isAuthenticated).toBe(false);

    await user.type(screen.getByLabelText("Email"), "manager@acme.io");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(true));
    expect(mockLoginApi).toHaveBeenCalledWith("manager@acme.io", "password123");
    expect(useAuthStore.getState().user?.email).toBe("manager@acme.io");
    await waitFor(() => expect(router.state.location.pathname).toBe("/dashboard"));
  });

  it("persists the authenticated session to localStorage", async () => {
    mockGetCurrentMember.mockResolvedValue(makeUser({ email: "alex@acme.io" }));
    const { user } = await renderWithRouter(LoginPage);

    await user.type(screen.getByLabelText("Email"), "alex@acme.io");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(true));
    await waitFor(() => {
      const persisted = JSON.parse(window.localStorage.getItem("taskflow-auth") ?? "{}");
      expect(persisted.state?.isAuthenticated).toBe(true);
    });
  });

  it("blocks navigation when validation fails", async () => {
    const { user, router } = await renderWithRouter(LoginPage);
    await user.type(screen.getByLabelText("Email"), "bad");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Enter a valid email")).toBeInTheDocument();
    expect(mockLoginApi).not.toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(router.state.location.pathname).toBe("/");
  });
});
