import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TaskPriority, TaskStatus, ProjectStatus, SprintStatus, UserStatus } from "@/shared/types";

const taskStatusMap: Record<TaskStatus, { label: string; cls: string }> = {
  backlog: { label: "Backlog", cls: "bg-muted text-muted-foreground border-transparent" },
  todo: { label: "To Do", cls: "bg-secondary text-secondary-foreground border-transparent" },
  in_progress: { label: "In Progress", cls: "bg-info/15 text-info border-info/30" },
  review: { label: "In Review", cls: "bg-warning/15 text-warning border-warning/30" },
  done: { label: "Done", cls: "bg-success/15 text-success border-success/30" },
};

const priorityMap: Record<TaskPriority, { label: string; cls: string; dot: string }> = {
  low: { label: "Low", cls: "text-muted-foreground border-border", dot: "bg-muted-foreground" },
  medium: { label: "Medium", cls: "text-info border-info/40", dot: "bg-info" },
  high: { label: "High", cls: "text-warning border-warning/40", dot: "bg-warning" },
  urgent: { label: "Urgent", cls: "text-destructive border-destructive/40", dot: "bg-destructive" },
};

const projectStatusMap: Record<ProjectStatus, { label: string; cls: string }> = {
  planning: { label: "Planning", cls: "bg-muted text-muted-foreground border-transparent" },
  active: { label: "Active", cls: "bg-success/15 text-success border-success/30" },
  on_hold: { label: "On Hold", cls: "bg-warning/15 text-warning border-warning/30" },
  completed: { label: "Completed", cls: "bg-info/15 text-info border-info/30" },
};

const sprintStatusMap: Record<SprintStatus, { label: string; cls: string }> = {
  planned: { label: "Planned", cls: "bg-muted text-muted-foreground border-transparent" },
  active: { label: "Active", cls: "bg-success/15 text-success border-success/30" },
  completed: { label: "Completed", cls: "bg-info/15 text-info border-info/30" },
};

const userStatusMap: Record<UserStatus, { label: string; cls: string }> = {
  active: { label: "Active", cls: "bg-success/15 text-success border-success/30" },
  invited: { label: "Invited", cls: "bg-warning/15 text-warning border-warning/30" },
  suspended: { label: "Suspended", cls: "bg-destructive/15 text-destructive border-destructive/30" },
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const m = taskStatusMap[status];
  return <Badge variant="outline" className={cn("font-medium", m.cls)}>{m.label}</Badge>;
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const m = priorityMap[priority];
  return (
    <Badge variant="outline" className={cn("gap-1.5 font-medium", m.cls)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} />
      {m.label}
    </Badge>
  );
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const m = projectStatusMap[status];
  return <Badge variant="outline" className={cn("font-medium", m.cls)}>{m.label}</Badge>;
}

export function SprintStatusBadge({ status }: { status: SprintStatus }) {
  const m = sprintStatusMap[status];
  return <Badge variant="outline" className={cn("font-medium", m.cls)}>{m.label}</Badge>;
}

export function UserStatusBadge({ status }: { status: UserStatus }) {
  const m = userStatusMap[status];
  return <Badge variant="outline" className={cn("font-medium", m.cls)}>{m.label}</Badge>;
}
