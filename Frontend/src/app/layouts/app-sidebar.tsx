import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, FolderKanban, ListChecks, KanbanSquare, Goal,
  Users, BarChart3, Bell, Settings, Shield, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useUIStore } from "@/app/store/ui-store";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/lib/utils";

const items = [
  { to: ROUTES.dashboard, label: "Dashboard", icon: LayoutDashboard },
  { to: ROUTES.projects, label: "Projects", icon: FolderKanban },
  { to: ROUTES.tasks, label: "Tasks", icon: ListChecks },
  { to: ROUTES.kanban, label: "Kanban Board", icon: KanbanSquare },
  { to: ROUTES.sprints, label: "Sprints", icon: Goal },
  { to: ROUTES.team, label: "Team", icon: Users },
  { to: ROUTES.reports, label: "Reports", icon: BarChart3 },
  { to: ROUTES.notifications, label: "Notifications", icon: Bell },
  { to: ROUTES.settings, label: "Settings", icon: Settings },
  { to: ROUTES.admin, label: "Admin", icon: Shield },
];

export function AppSidebar({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const collapsed = useUIStore((s) => s.sidebarCollapsed) && !mobile;
  const toggle = useUIStore((s) => s.toggleSidebar);
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200",
        collapsed ? "w-16" : "w-64",
        mobile && "w-full",
      )}
    >
      <div className={cn("flex h-14 items-center gap-2 border-b border-sidebar-border px-4", collapsed && "justify-center px-0")}>
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground font-bold">T</div>
        {!collapsed && (
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">TaskFlow</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Enterprise</span>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-0.5">
          {items.map((item) => {
            const active = pathname === item.to || (item.to !== "/dashboard" && pathname.startsWith(item.to));
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={onNavigate}
                  className={cn(
                    "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    active && "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
                    collapsed && "justify-center px-0",
                  )}
                  aria-current={active ? "page" : undefined}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", active && "text-sidebar-primary")} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {!mobile && (
        <button
          onClick={toggle}
          className="flex items-center justify-center gap-2 border-t border-sidebar-border p-3 text-xs text-muted-foreground hover:bg-sidebar-accent"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /> Collapse</>}
        </button>
      )}
    </aside>
  );
}
