import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { TaskStatusBadge, PriorityBadge } from "@/shared/components/status-badges";
import { UserAvatar } from "@/shared/components/user-avatar";
import { users } from "@/shared/api/mock-data";
import { relativeTime, formatBytes, formatDate } from "@/shared/utils/format";
import type { Task } from "@/shared/types";
import { Paperclip, Send } from "lucide-react";

export function TaskDrawer({ task, onClose }: { task: Task | null; onClose: () => void }) {
  if (!task) return null;
  const assignee = users.find((u) => u.id === task.assigneeId);
  const reporter = users.find((u) => u.id === task.reporterId);

  return (
    <Sheet open={!!task} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-2xl">
        <SheetHeader className="border-b p-6 pb-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{task.key}</span>
            <TaskStatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
          </div>
          <SheetTitle className="text-xl">{task.title}</SheetTitle>
          <SheetDescription className="sr-only">Task details</SheetDescription>
        </SheetHeader>

        <div className="grid gap-6 p-6 md:grid-cols-3">
          <div className="space-y-5 md:col-span-2">
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">Description</p>
              <p className="text-sm text-foreground/90">{task.description}</p>
            </div>

            <Tabs defaultValue="comments">
              <TabsList>
                <TabsTrigger value="comments">Comments ({task.comments.length})</TabsTrigger>
                <TabsTrigger value="checklist">Checklist</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="files">Files ({task.attachments.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="comments" className="mt-4 space-y-4">
                {task.comments.map((c) => {
                  const author = users.find((u) => u.id === c.authorId);
                  return (
                    <div key={c.id} className="flex gap-3">
                      <UserAvatar user={author} size="sm" />
                      <div className="flex-1 rounded-md border bg-muted/30 p-3">
                        <div className="mb-1 flex items-center justify-between"><span className="text-sm font-medium">{author?.name}</span><span className="text-xs text-muted-foreground">{relativeTime(c.createdAt)}</span></div>
                        <p className="text-sm">{c.body}</p>
                      </div>
                    </div>
                  );
                })}
                <div className="flex gap-2"><Textarea placeholder="Add a comment…" rows={2} /><Button size="icon" className="h-auto"><Send className="h-4 w-4" /></Button></div>
              </TabsContent>

              <TabsContent value="checklist" className="mt-4 space-y-2">
                {task.checklist.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 rounded-md p-2 hover:bg-muted/50">
                    <Checkbox checked={c.done} />
                    <span className={c.done ? "text-muted-foreground line-through" : ""}>{c.text}</span>
                  </label>
                ))}
                <div className="flex gap-2 pt-2"><Input placeholder="Add a checklist item" /><Button variant="outline">Add</Button></div>
              </TabsContent>

              <TabsContent value="activity" className="mt-4 space-y-3">
                {task.activity.map((a) => {
                  const actor = users.find((u) => u.id === a.actorId);
                  return (
                    <div key={a.id} className="flex items-start gap-3 text-sm">
                      <UserAvatar user={actor} size="xs" />
                      <div><p><span className="font-medium">{actor?.name}</span> <span className="text-muted-foreground">{a.message}</span></p><p className="text-xs text-muted-foreground">{relativeTime(a.createdAt)}</p></div>
                    </div>
                  );
                })}
              </TabsContent>

              <TabsContent value="files" className="mt-4 space-y-2">
                {task.attachments.length === 0 && <p className="text-sm text-muted-foreground">No attachments yet.</p>}
                {task.attachments.map((f) => (
                  <div key={f.id} className="flex items-center justify-between rounded-md border p-3">
                    <div className="flex items-center gap-2"><Paperclip className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-medium">{f.name}</span></div>
                    <span className="text-xs text-muted-foreground">{formatBytes(f.size)}</span>
                  </div>
                ))}
                <Button variant="outline" size="sm"><Paperclip className="mr-1.5 h-4 w-4" /> Attach file</Button>
              </TabsContent>
            </Tabs>
          </div>

          <aside className="space-y-4 text-sm">
            <div><p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Assignee</p><div className="flex items-center gap-2"><UserAvatar user={assignee} size="sm" /><span>{assignee?.name ?? "Unassigned"}</span></div></div>
            <div><p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Reporter</p><div className="flex items-center gap-2"><UserAvatar user={reporter} size="sm" /><span>{reporter?.name}</span></div></div>
            <Separator />
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Story points</p><p className="mt-1 font-mono font-medium">{task.storyPoints}</p></div>
              <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Due date</p><p className="mt-1">{formatDate(task.dueDate)}</p></div>
            </div>
            <div><p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Labels</p><div className="flex flex-wrap gap-1">{task.labels.map((l) => <span key={l} className="rounded bg-muted px-2 py-0.5 text-xs">{l}</span>)}</div></div>
          </aside>
        </div>
      </SheetContent>
    </Sheet>
  );
}
