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

  it("rejects an empty password", () => {
    const r = loginSchema.safeParse({ email: "a@b.io", password: "" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].message).toBe("Password is required");
    }
  });
});

describe("registerSchema", () => {
  const valid = {
    firstName: "Jo",
    lastName: "Doe",
    email: "a@b.io",
    password: "longenough",
    orgName: "Acme",
    orgSlug: "acme",
  };

  it("accepts valid input", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("requires a first name", () => {
    const r = registerSchema.safeParse({ ...valid, firstName: "" });
    expect(r.success).toBe(false);
  });

  it("requires an 8+ char password", () => {
    const r = registerSchema.safeParse({ ...valid, password: "short" });
    expect(r.success).toBe(false);
  });

  it("requires a valid lowercase workspace slug", () => {
    expect(registerSchema.safeParse({ ...valid, orgSlug: "Bad Slug" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, orgSlug: "good-slug" }).success).toBe(true);
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
