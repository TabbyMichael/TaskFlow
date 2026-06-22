import { useMemo, useState } from "react";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  closestCorners, type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/shared/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PriorityBadge } from "@/shared/components/status-badges";
import { UserAvatar } from "@/shared/components/user-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/shared/utils/format";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTasksList, useUpdateTask, useMembersList, taskKeys } from "@/lib/api";
import type { Task, TaskStatus } from "@/shared/types";

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: "backlog", label: "Backlog" },
  { id: "todo", label: "To Do" },
  { id: "in_progress", label: "In Progress" },
  { id: "review", label: "Review" },
  { id: "done", label: "Done" },
];

function TaskCardItem({ task, dragging = false }: { task: Task; dragging?: boolean }) {
  return (
    <Card className={cn("space-y-2 p-3 transition-shadow", dragging ? "shadow-lg rotate-2" : "hover:shadow-sm")}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] text-muted-foreground">{task.key}</span>
        <PriorityBadge priority={task.priority} />
      </div>
      <p className="text-sm font-medium leading-snug">{task.title}</p>
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {task.dueDate && <><CalendarDays className="h-3 w-3" />{formatDate(task.dueDate, "MMM d")}</>}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono text-[10px]">{task.storyPoints}</Badge>
        </div>
      </div>
    </Card>
  );
}

function DraggableTask({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className={cn("cursor-grab active:cursor-grabbing", isDragging && "opacity-30")}>
      <TaskCardItem task={task} />
    </div>
  );
}

function Column({ col, tasks }: { col: { id: TaskStatus; label: string }; tasks: Task[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });
  return (
    <div ref={setNodeRef} className={cn("flex h-full w-72 shrink-0 flex-col rounded-lg border bg-muted/30 p-2 transition-colors", isOver && "bg-primary/5 border-primary/40")}>
      <div className="mb-2 flex items-center justify-between px-2 py-1">
        <h3 className="text-sm font-semibold">{col.label}</h3>
        <Badge variant="secondary" className="font-mono">{tasks.length}</Badge>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto">
        {tasks.map((t) => <DraggableTask key={t.id} task={t} />)}
      </div>
    </div>
  );
}

export function KanbanPage() {
  const { data: tasks, isLoading } = useTasksList();
  const { data: members } = useMembersList();
  const updateTask = useUpdateTask();
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const grouped = useMemo(() => {
    if (!tasks) return {} as Record<TaskStatus, Task[]>;
    return Object.fromEntries(COLUMNS.map((c) => [c.id, tasks.filter((t) => t.status === c.id)])) as Record<TaskStatus, Task[]>;
  }, [tasks]);

  const activeTask = activeId && tasks ? tasks.find((t) => t.id === activeId) : null;

  const onDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string);

  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const overId = e.over?.id as TaskStatus | undefined;
    if (!overId || !COLUMNS.some((c) => c.id === overId)) return;

    const taskId = e.active.id as string;
    // Optimistic update
    queryClient.setQueryData<Task[]>(taskKeys.lists(), (old) =>
      old?.map((t) => (t.id === taskId ? { ...t, status: overId } : t)),
    );
    // Server sync
    updateTask.mutate({ id: taskId, data: { status: overId } });
  };

  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <PageHeader title="Kanban Board" description="Drag cards across columns to update status." />
        <div className="flex gap-3 p-4 md:p-6 overflow-x-auto">
          {COLUMNS.map((col) => (
            <div key={col.id} className="flex h-full w-72 shrink-0 flex-col rounded-lg border bg-muted/30 p-2">
              <Skeleton className="h-5 w-24 mb-2" />
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full mb-2" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Kanban Board" description="Drag cards across columns to update status." />
      <div className="flex-1 overflow-x-auto p-4 md:p-6">
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="flex h-[calc(100vh-12rem)] gap-3">
            {COLUMNS.map((c) => <Column key={c.id} col={c} tasks={grouped[c.id] ?? []} />)}
          </div>
          <DragOverlay>{activeTask ? <div className="w-72"><TaskCardItem task={activeTask} dragging /></div> : null}</DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
