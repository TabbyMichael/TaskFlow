import { beforeEach, describe, expect, it } from "vitest";
import { useAuthStore } from "@/app/store/auth-store";

describe("useAuthStore", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false });
  });

  it("starts unauthenticated", () => {
    const s = useAuthStore.getState();
    expect(s.user).toBeNull();
    expect(s.isAuthenticated).toBe(false);
  });

  it("logs in and overrides the email", async () => {
    await useAuthStore.getState().login("custom@acme.io");
    const s = useAuthStore.getState();
    expect(s.isAuthenticated).toBe(true);
    expect(s.user?.email).toBe("custom@acme.io");
    expect(s.user?.name).toBeTruthy();
  });

  it("registers with a name and email", async () => {
    await useAuthStore.getState().register("New Person", "new@acme.io");
    const s = useAuthStore.getState();
    expect(s.isAuthenticated).toBe(true);
    expect(s.user?.name).toBe("New Person");
    expect(s.user?.email).toBe("new@acme.io");
  });

  it("logs out and clears the user", async () => {
    await useAuthStore.getState().login("a@b.io");
    useAuthStore.getState().logout();
    const s = useAuthStore.getState();
    expect(s.user).toBeNull();
    expect(s.isAuthenticated).toBe(false);
  });
});
