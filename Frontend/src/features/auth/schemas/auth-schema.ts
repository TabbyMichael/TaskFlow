import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Min 6 characters"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Min 8 characters"),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotSchema = z.object({ email: z.string().email("Enter a valid email") });
export type ForgotInput = z.infer<typeof forgotSchema>;

export const resetSchema = z.object({
  password: z.string().min(8, "Min 8 characters"),
  confirm: z.string().min(8),
}).refine((d) => d.password === d.confirm, { message: "Passwords don't match", path: ["confirm"] });
export type ResetInput = z.infer<typeof resetSchema>;
