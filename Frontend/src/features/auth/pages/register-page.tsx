import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/app/store/auth-store";
import {
  registerSchema,
  type RegisterInput,
} from "../schemas/auth-schema";
import { ROUTES } from "@/shared/constants/routes";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function RegisterPage() {
  const {
    register: f,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      orgSlug: "",
    },
  });
  const reg = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);
  const navigate = useNavigate();
  const [slugPreview, setSlugPreview] = useState("");

  const onSubmit = async (data: RegisterInput) => {
    try {
      await reg(data);
      navigate({ to: ROUTES.dashboard });
    } catch {
      // Error is set in the store
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Create your workspace
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Start in seconds — no card required.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" onClick={clearError}>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>First name</Label>
            <Input {...f("firstName")} />
            {errors.firstName && (
              <p className="text-xs text-destructive">
                {errors.firstName.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Last name</Label>
            <Input {...f("lastName")} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Work email</Label>
          <Input type="email" {...f("email")} />
          {errors.email && (
            <p className="text-xs text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Password</Label>
          <Input type="password" {...f("password")} />
          {errors.password && (
            <p className="text-xs text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Organization name</Label>
          <Input
            {...f("orgName", {
              onChange: (e) => {
                f("orgName").onChange(e);
                setSlugPreview(
                  e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-|-$/g, "")
                );
              },
            })}
          />
          {errors.orgName && (
            <p className="text-xs text-destructive">
              {errors.orgName.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label>
            Workspace URL{" "}
            <span className="font-normal text-muted-foreground">
              (your-org.taskflow.app)
            </span>
          </Label>
          <div className="flex items-center gap-1 rounded-md border bg-muted/30 px-3 text-sm text-muted-foreground">
            <span className="text-xs">/</span>
            <Input
              {...f("orgSlug")}
              placeholder={slugPreview || "your-org"}
              className="border-0 bg-transparent px-0 focus-visible:ring-0"
            />
          </div>
          {errors.orgSlug && (
            <p className="text-xs text-destructive">
              {errors.orgSlug.message}
            </p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Creating…" : "Create account"}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Already have one?{" "}
        <Link
          to={ROUTES.login}
          className="font-medium text-primary hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
