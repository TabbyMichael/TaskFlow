import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { User } from "@/shared/types";

export function UserAvatar({ user, size = "sm", className }: { user?: User | null; size?: "xs" | "sm" | "md"; className?: string }) {
  const sizes = { xs: "h-5 w-5 text-[10px]", sm: "h-7 w-7 text-xs", md: "h-9 w-9 text-sm" };
  if (!user) {
    return <Avatar className={cn(sizes[size], className)}><AvatarFallback className="bg-muted text-muted-foreground">?</AvatarFallback></Avatar>;
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Avatar className={cn(sizes[size], className)}>
          <AvatarFallback className="bg-primary/15 text-primary font-medium">{user.initials}</AvatarFallback>
        </Avatar>
      </TooltipTrigger>
      <TooltipContent>{user.name}</TooltipContent>
    </Tooltip>
  );
}

export function AvatarStack({ ids, users, max = 4, size = "sm" }: { ids: string[]; users: User[]; max?: number; size?: "xs" | "sm" | "md" }) {
  const visible = ids.slice(0, max);
  const overflow = ids.length - visible.length;
  return (
    <div className="flex -space-x-1.5">
      {visible.map((id) => {
        const u = users.find((u) => u.id === id);
        return <UserAvatar key={id} user={u} size={size} className="ring-2 ring-background" />;
      })}
      {overflow > 0 && (
        <div className={cn("grid place-items-center rounded-full bg-muted text-muted-foreground ring-2 ring-background",
          size === "xs" ? "h-5 w-5 text-[10px]" : size === "md" ? "h-9 w-9 text-xs" : "h-7 w-7 text-[10px]")}>
          +{overflow}
        </div>
      )}
    </div>
  );
}
