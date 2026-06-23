import { beforeEach, describe, expect, it } from "vitest";
import { screen, waitFor, renderWithRouter } from "../../setup/test-utils";
import { LoginPage } from "@/features/auth/pages/login-page";
import { useAuthStore } from "@/app/store/auth-store";

describe("LoginPage (form + validation + navigation)", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false });
  });

  it("renders the email, password fields and submit button", async () => {
    await renderWithRouter(LoginPage);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  it("shows a validation error and does not authenticate on a bad email", async () => {
    const { user } = await renderWithRouter(LoginPage);
    const email = screen.getByLabelText("Email");
    await user.clear(email);
    await user.type(email, "not-an-email");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Enter a valid email")).toBeInTheDocument();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it("authenticates and navigates to the dashboard on valid submit", async () => {
    const { user, router } = await renderWithRouter(LoginPage);
    // Default values are valid demo credentials.
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(true));
    await waitFor(() =>
      expect(router.state.location.pathname).toBe("/dashboard"),
    );
    expect(useAuthStore.getState().user?.email).toBe("alex@acme.io");
  });
});
