import { useMemo, useState } from "react";
import { Search, Plus, ArrowUpDown } from "lucide-react";
import { PageHeader } from "@/shared/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TaskStatusBadge, PriorityBadge } from "@/shared/components/status-badges";
import { UserAvatar } from "@/shared/components/user-avatar";
import { tasks as allTasks, users, projects } from "@/shared/api/mock-data";
import { formatDate } from "@/shared/utils/format";
import { useDebounce } from "@/shared/hooks/use-debounce";
import { TaskDrawer } from "../components/task-drawer";
import type { Task } from "@/shared/types";

const PAGE_SIZE = 12;

export function TasksPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [project, setProject] = useState("all");
  const [sort, setSort] = useState<{ key: keyof Task; dir: "asc" | "desc" }>({ key: "updatedAt", dir: "desc" });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openTask, setOpenTask] = useState<Task | null>(null);
  const debounced = useDebounce(query, 200);

  const filtered = useMemo(() => {
    let list = allTasks.filter((t) => {
      if (status !== "all" && t.status !== status) return false;
      if (priority !== "all" && t.priority !== priority) return false;
      if (project !== "all" && t.projectId !== project) return false;
      if (debounced && !`${t.title} ${t.key}`.toLowerCase().includes(debounced.toLowerCase())) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      const va = a[sort.key]; const vb = b[sort.key];
      const r = (va ?? "") > (vb ?? "") ? 1 : (va ?? "") < (vb ?? "") ? -1 : 0;
      return sort.dir === "asc" ? r : -r;
    });
    return list;
  }, [debounced, status, priority, project, sort]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const toggleSort = (key: keyof Task) => setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }));
  const toggleAll = (checked: boolean) => setSelected(checked ? new Set(paged.map((t) => t.id)) : new Set());

  return (
    <div>
      <PageHeader
        title="Tasks"
        description={`${filtered.length} tasks across ${projects.length} projects`}
        actions={<Button><Plus className="mr-1.5 h-4 w-4" /> New task</Button>}
      />
      <div className="space-y-4 p-4 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search tasks…" className="pl-9" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
          </div>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="backlog">Backlog</SelectItem><SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem><SelectItem value="review">In Review</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priority} onValueChange={(v) => { setPriority(v); setPage(1); }}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priority</SelectItem>
              <SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem><SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
          <Select value={project} onValueChange={(v) => { setProject(v); setPage(1); }}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Project" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All projects</SelectItem>
              {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {selected.size > 0 && (
          <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
            <span className="font-medium">{selected.size} selected</span>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm">Assign…</Button>
              <Button variant="outline" size="sm">Change status…</Button>
              <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>Clear</Button>
            </div>
          </div>
        )}

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"><Checkbox checked={paged.length > 0 && paged.every((t) => selected.has(t.id))} onCheckedChange={(c) => toggleAll(!!c)} /></TableHead>
                <TableHead className="w-24"><button className="inline-flex items-center gap-1 font-medium" onClick={() => toggleSort("key")}>Key <ArrowUpDown className="h-3 w-3" /></button></TableHead>
                <TableHead><button className="inline-flex items-center gap-1 font-medium" onClick={() => toggleSort("title")}>Title <ArrowUpDown className="h-3 w-3" /></button></TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead><button className="inline-flex items-center gap-1 font-medium" onClick={() => toggleSort("dueDate")}>Due date <ArrowUpDown className="h-3 w-3" /></button></TableHead>
                <TableHead className="text-right"><button className="inline-flex items-center gap-1 font-medium" onClick={() => toggleSort("storyPoints")}>Points <ArrowUpDown className="h-3 w-3" /></button></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((t) => {
                const a = users.find((u) => u.id === t.assigneeId);
                return (
                  <TableRow key={t.id} className="cursor-pointer" onClick={() => setOpenTask(t)}>
                    <TableCell onClick={(e) => e.stopPropagation()}><Checkbox checked={selected.has(t.id)} onCheckedChange={(c) => { const n = new Set(selected); c ? n.add(t.id) : n.delete(t.id); setSelected(n); }} /></TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{t.key}</TableCell>
                    <TableCell className="max-w-md truncate font-medium">{t.title}</TableCell>
                    <TableCell><PriorityBadge priority={t.priority} /></TableCell>
                    <TableCell><TaskStatusBadge status={t.status} /></TableCell>
                    <TableCell><div className="flex items-center gap-2"><UserAvatar user={a} size="xs" /><span className="text-sm">{a?.name}</span></div></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(t.dueDate, "MMM d")}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{t.storyPoints}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {page} of {pages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page === pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      </div>

      <TaskDrawer task={openTask} onClose={() => setOpenTask(null)} />
    </div>
  );
}
