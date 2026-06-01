import { Outlet, Link } from "@tanstack/react-router";

export function AuthLayout() {
  return (
    <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-2">
      <div className="flex flex-col justify-between p-8 lg:p-12">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground font-bold">T</div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">TaskFlow</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Enterprise</div>
          </div>
        </Link>
        <div className="mx-auto w-full max-w-sm"><Outlet /></div>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} TaskFlow Enterprise</p>
      </div>
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background lg:block">
        <div className="absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,oklch(0.55_0.22_265/_0.15)_1px,transparent_0)] [background-size:24px_24px]" />
        <div className="relative flex h-full flex-col justify-end p-12">
          <blockquote className="max-w-md text-2xl font-medium leading-snug tracking-tight">
            "TaskFlow replaced four tools and shipped our roadmap a quarter ahead."
          </blockquote>
          <div className="mt-4 text-sm text-muted-foreground">— VP Engineering, Fortune 500</div>
        </div>
      </div>
    </div>
  );
}
