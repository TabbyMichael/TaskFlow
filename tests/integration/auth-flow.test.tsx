import { beforeEach, describe, expect, it } from "vitest";
import { screen, waitFor, renderWithRouter } from "../setup/test-utils";
import { LoginPage } from "@/features/auth/pages/login-page";
import { useAuthStore } from "@/app/store/auth-store";

// Integration: UI form -> auth store -> router navigation, end to end in jsdom.
describe("integration: login flow", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false });
    window.localStorage.clear();
  });

  it("drives the auth store and navigates on a successful login", async () => {
    const { user, router } = await renderWithRouter(LoginPage);

    expect(useAuthStore.getState().isAuthenticated).toBe(false);

    const email = screen.getByLabelText("Email");
    await user.clear(email);
    await user.type(email, "manager@acme.io");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(true));
    expect(useAuthStore.getState().user?.email).toBe("manager@acme.io");
    await waitFor(() => expect(router.state.location.pathname).toBe("/dashboard"));
  });

  it("persists the authenticated session to localStorage", async () => {
    const { user } = await renderWithRouter(LoginPage);
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(true));
    await waitFor(() => {
      const persisted = JSON.parse(window.localStorage.getItem("taskflow-auth") ?? "{}");
      expect(persisted.state?.isAuthenticated).toBe(true);
    });
  });

  it("blocks navigation when validation fails", async () => {
    const { user, router } = await renderWithRouter(LoginPage);
    const email = screen.getByLabelText("Email");
    await user.clear(email);
    await user.type(email, "bad");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Enter a valid email")).toBeInTheDocument();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(router.state.location.pathname).toBe("/");
  });
});
