import { Bell, Menu, Moon, Search, Sun, Building2, LogOut, User as UserIcon, Settings } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useUIStore } from "@/app/store/ui-store";
import { useAuthStore } from "@/app/store/auth-store";
import { useNotificationsList } from "@/lib/api";
import { ROUTES } from "@/shared/constants/routes";

export function TopBar() {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const setMobileNav = useUIStore((s) => s.setMobileNav);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const { data: notifications = [] } = useNotificationsList();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur md:px-4">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileNav(true)} aria-label="Open navigation">
        <Menu className="h-5 w-5" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="hidden gap-2 sm:inline-flex">
            <Building2 className="h-4 w-4" />
            <span className="text-sm font-medium">{user?.email?.split("@")[1] ?? "TaskFlow"}</span>
            <Badge variant="secondary" className="hidden text-[10px] md:inline-flex">Enterprise</Badge>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Organizations</DropdownMenuLabel>
          <DropdownMenuItem>{user?.email?.split("@")[1] ?? "TaskFlow"} <Badge variant="outline" className="ml-auto text-[10px]">Enterprise</Badge></DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="relative ml-auto w-full max-w-md md:ml-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search tasks, projects, people…" className="h-9 pl-9" aria-label="Global search" />
        <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 select-none rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground md:inline-block">⌘K</kbd>
      </div>

      <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle theme">
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>

      <Button asChild variant="ghost" size="icon" aria-label="Notifications" className="relative">
        <Link to={ROUTES.notifications}>
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
              {unread}
            </span>
          )}
        </Link>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Account menu">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">{user?.initials ?? "AM"}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="text-sm">{user?.name ?? "Guest"}</span>
              <span className="text-xs font-normal text-muted-foreground">{user?.email ?? ""}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild><Link to={ROUTES.settings}><UserIcon className="mr-2 h-4 w-4" /> Profile</Link></DropdownMenuItem>
          <DropdownMenuItem asChild><Link to={ROUTES.settings}><Settings className="mr-2 h-4 w-4" /> Settings</Link></DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => { logout(); navigate({ to: ROUTES.login }); }}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
