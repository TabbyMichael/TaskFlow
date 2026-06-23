import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, renderWithRouter } from "../../setup/test-utils";
import { LoginPage } from "@/features/auth/pages/login-page";
import { useAuthStore } from "@/app/store/auth-store";
import { getCurrentMember, loginApi } from "@/lib/api";
import { makeUser } from "../../fixtures/factories";

vi.mock("@/lib/api", () => ({
  loginApi: vi.fn().mockResolvedValue(undefined),
  registerApi: vi.fn().mockResolvedValue(undefined),
  getCurrentMember: vi.fn(),
  clearTokens: vi.fn(),
}));

const mockGetCurrentMember = vi.mocked(getCurrentMember);
const mockLoginApi = vi.mocked(loginApi);

describe("LoginPage (form + validation + navigation)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoginApi.mockResolvedValue(undefined);
    useAuthStore.setState({ user: null, isAuthenticated: false, error: null });
    window.localStorage.clear();
  });

  it("renders the email, password fields and submit button", async () => {
    await renderWithRouter(LoginPage);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  it("shows a validation error and does not authenticate on a bad email", async () => {
    const { user } = await renderWithRouter(LoginPage);
    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Enter a valid email")).toBeInTheDocument();
    expect(mockLoginApi).not.toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it("authenticates and navigates to the dashboard on valid submit", async () => {
    mockGetCurrentMember.mockResolvedValue(makeUser({ email: "alex@acme.io" }));
    const { user, router } = await renderWithRouter(LoginPage);

    await user.type(screen.getByLabelText("Email"), "alex@acme.io");
    await user.type(screen.getByLabelText("Password"), "demo1234");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(true));
    await waitFor(() =>
      expect(router.state.location.pathname).toBe("/dashboard"),
    );
    expect(useAuthStore.getState().user?.email).toBe("alex@acme.io");
  });
});
