import { describe, expect, it } from "vitest";
import {
  forgotSchema,
  loginSchema,
  registerSchema,
  resetSchema,
} from "@/features/auth/schemas/auth-schema";

describe("loginSchema", () => {
  it("accepts a valid email + password", () => {
    const r = loginSchema.safeParse({ email: "a@b.io", password: "secret" });
    expect(r.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const r = loginSchema.safeParse({ email: "nope", password: "secret" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].message).toBe("Enter a valid email");
    }
  });

  it("rejects passwords shorter than 6 chars", () => {
    const r = loginSchema.safeParse({ email: "a@b.io", password: "123" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].message).toBe("Min 6 characters");
    }
  });
});

describe("registerSchema", () => {
  it("accepts valid input", () => {
    expect(
      registerSchema.safeParse({
        name: "Jo",
        email: "a@b.io",
        password: "longenough",
      }).success,
    ).toBe(true);
  });

  it("requires a name of at least 2 chars", () => {
    const r = registerSchema.safeParse({ name: "J", email: "a@b.io", password: "longenough" });
    expect(r.success).toBe(false);
  });

  it("requires an 8+ char password", () => {
    const r = registerSchema.safeParse({ name: "Jo", email: "a@b.io", password: "short" });
    expect(r.success).toBe(false);
  });
});

describe("forgotSchema", () => {
  it("validates the email field", () => {
    expect(forgotSchema.safeParse({ email: "a@b.io" }).success).toBe(true);
    expect(forgotSchema.safeParse({ email: "bad" }).success).toBe(false);
  });
});

describe("resetSchema", () => {
  it("accepts matching passwords", () => {
    expect(
      resetSchema.safeParse({ password: "password1", confirm: "password1" }).success,
    ).toBe(true);
  });

  it("rejects mismatched passwords with a path on confirm", () => {
    const r = resetSchema.safeParse({ password: "password1", confirm: "password2" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const issue = r.error.issues.find((i) => i.path.includes("confirm"));
      expect(issue?.message).toBe("Passwords don't match");
    }
  });
});
