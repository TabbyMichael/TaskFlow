import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/app/store/auth-store";
import { registerSchema, type RegisterInput } from "../schemas/auth-schema";
import { ROUTES } from "@/shared/constants/routes";

export function RegisterPage() {
  const { register: f, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });
  const reg = useAuthStore((s) => s.register);
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold tracking-tight">Create your workspace</h1><p className="mt-1 text-sm text-muted-foreground">Start in seconds — no card required.</p></div>
      <form onSubmit={handleSubmit(async (d) => { await reg(d.name, d.email); navigate({ to: ROUTES.dashboard }); })} className="space-y-4">
        <div className="space-y-2"><Label>Full name</Label><Input {...f("name")} />{errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}</div>
        <div className="space-y-2"><Label>Work email</Label><Input type="email" {...f("email")} />{errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}</div>
        <div className="space-y-2"><Label>Password</Label><Input type="password" {...f("password")} />{errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}</div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? "Creating…" : "Create account"}</Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">Already have one? <Link to={ROUTES.login} className="font-medium text-primary hover:underline">Sign in</Link></p>
    </div>
  );
}
