import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional().default(""),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Min 8 characters"),
  orgName: z.string().min(2, "Organization name is required"),
  orgSlug: z
    .string()
    .min(2, "Workspace URL is required")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Only lowercase letters, numbers, and hyphens allowed",
    ),
});
// Input differs from output because `lastName` has a default; the form is typed
// with the input shape and resolves to the output shape on submit.
export type RegisterFormValues = z.input<typeof registerSchema>;
export type RegisterInput = z.output<typeof registerSchema>;

export const forgotSchema = z.object({ email: z.string().email("Enter a valid email") });
export type ForgotInput = z.infer<typeof forgotSchema>;

export const resetSchema = z
  .object({
    password: z.string().min(8, "Min 8 characters"),
    confirm: z.string().min(8),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  });
export type ResetInput = z.infer<typeof resetSchema>;
