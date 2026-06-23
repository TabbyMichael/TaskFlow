import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotSchema, type ForgotInput } from "../schemas/auth-schema";
import { ROUTES } from "@/shared/constants/routes";

export function ForgotPasswordPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotInput>({ resolver: zodResolver(forgotSchema) });
  const [sent, setSent] = useState(false);
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1><p className="mt-1 text-sm text-muted-foreground">We'll email you a reset link.</p></div>
      {sent ? (
        <div className="rounded-md border border-success/40 bg-success/10 p-4 text-sm text-success">Check your inbox for the reset link.</div>
      ) : (
        <form onSubmit={handleSubmit(() => setSent(true))} noValidate className="space-y-4">
          <div className="space-y-2"><Label>Email</Label><Input type="email" {...register("email")} />{errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}</div>
          <Button type="submit" className="w-full">Send reset link</Button>
        </form>
      )}
      <p className="text-center text-sm text-muted-foreground"><Link to={ROUTES.login} className="text-primary hover:underline">Back to sign in</Link></p>
    </div>
  );
}
