import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetSchema, type ResetInput } from "../schemas/auth-schema";
import { ROUTES } from "@/shared/constants/routes";

export function ResetPasswordPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<ResetInput>({ resolver: zodResolver(resetSchema) });
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1><p className="mt-1 text-sm text-muted-foreground">Make it at least 8 characters.</p></div>
      <form onSubmit={handleSubmit(() => navigate({ to: ROUTES.login }))} className="space-y-4">
        <div className="space-y-2"><Label>New password</Label><Input type="password" {...register("password")} />{errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}</div>
        <div className="space-y-2"><Label>Confirm</Label><Input type="password" {...register("confirm")} />{errors.confirm && <p className="text-xs text-destructive">{errors.confirm.message}</p>}</div>
        <Button type="submit" className="w-full">Update password</Button>
      </form>
      <p className="text-center text-sm text-muted-foreground"><Link to={ROUTES.login} className="text-primary hover:underline">Back to sign in</Link></p>
    </div>
  );
}
