import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/app/store/auth-store";
import { getCurrentMember, loginApi, registerApi } from "@/lib/api";
import { makeUser } from "../../fixtures/factories";

vi.mock("@/lib/api", () => ({
  loginApi: vi.fn().mockResolvedValue(undefined),
  registerApi: vi.fn().mockResolvedValue(undefined),
  getCurrentMember: vi.fn(),
  clearTokens: vi.fn(),
}));

const mockGetCurrentMember = vi.mocked(getCurrentMember);
const mockLoginApi = vi.mocked(loginApi);
const mockRegisterApi = vi.mocked(registerApi);

describe("useAuthStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoginApi.mockResolvedValue(undefined);
    mockRegisterApi.mockResolvedValue(undefined);
    useAuthStore.setState({ user: null, isAuthenticated: false, error: null });
    window.localStorage.clear();
  });

  it("starts unauthenticated", () => {
    const s = useAuthStore.getState();
    expect(s.user).toBeNull();
    expect(s.isAuthenticated).toBe(false);
  });

  it("logs in and stores the authenticated user", async () => {
    mockGetCurrentMember.mockResolvedValue(
      makeUser({ email: "custom@acme.io", name: "Custom Person" }),
    );

    await useAuthStore.getState().login("custom@acme.io", "password123");

    expect(mockLoginApi).toHaveBeenCalledWith("custom@acme.io", "password123");
    const s = useAuthStore.getState();
    expect(s.isAuthenticated).toBe(true);
    expect(s.user?.email).toBe("custom@acme.io");
    expect(s.user?.name).toBeTruthy();
  });

  it("surfaces an error and stays unauthenticated when login fails", async () => {
    mockLoginApi.mockRejectedValue(new Error("Invalid credentials"));

    await expect(
      useAuthStore.getState().login("bad@acme.io", "nope"),
    ).rejects.toThrow();

    const s = useAuthStore.getState();
    expect(s.isAuthenticated).toBe(false);
    expect(s.error).toBe("Invalid credentials");
  });

  it("registers and authenticates the new user", async () => {
    mockGetCurrentMember.mockResolvedValue(
      makeUser({ name: "New Person", email: "new@acme.io" }),
    );

    await useAuthStore.getState().register({
      firstName: "New",
      lastName: "Person",
      email: "new@acme.io",
      password: "longenough",
      orgName: "Acme",
      orgSlug: "acme",
    });

    expect(mockRegisterApi).toHaveBeenCalled();
    const s = useAuthStore.getState();
    expect(s.isAuthenticated).toBe(true);
    expect(s.user?.name).toBe("New Person");
    expect(s.user?.email).toBe("new@acme.io");
  });

  it("logs out and clears the user", async () => {
    mockGetCurrentMember.mockResolvedValue(makeUser({ email: "a@b.io" }));
    await useAuthStore.getState().login("a@b.io", "password123");

    useAuthStore.getState().logout();
    const s = useAuthStore.getState();
    expect(s.user).toBeNull();
    expect(s.isAuthenticated).toBe(false);
  });
});
