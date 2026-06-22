import { useMemo } from "react";
import { CheckCircle2, ListTodo, FolderKanban, TrendingUp, ArrowRight } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip as RTooltip,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from "recharts";
import { Link } from "@tanstack/react-router";
import { KpiCard } from "@/shared/components/kpi-card";
import { PageHeader } from "@/shared/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/shared/components/user-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, relativeTime } from "@/shared/utils/format";
import { ROUTES } from "@/shared/constants/routes";
import { useTasksList, useProjectsList, useSprintsList, useMembersList } from "@/lib/api";

const STATUS_COLORS = ["oklch(0.55 0.22 265)", "oklch(0.62 0.16 155)", "oklch(0.72 0.16 75)", "oklch(0.62 0.15 230)", "oklch(0.6 0.22 320)"];
const STATUS_ORDER = ["backlog","todo","in_progress","review","done"] as const;

export function DashboardPage() {
  const { data: tasks, isLoading: tasksLoading } = useTasksList();
  const { data: projects, isLoading: projectsLoading } = useProjectsList();
  const { data: sprints, isLoading: sprintsLoading } = useSprintsList();
  const { data: members } = useMembersList();

  const isLoading = tasksLoading || projectsLoading || sprintsLoading;

  const open = useMemo(() => tasks?.filter((t) => t.status !== "done").length ?? 0, [tasks]);
  const done = useMemo(() => tasks?.filter((t) => t.status === "done").length ?? 0, [tasks]);
  const activeProjects = useMemo(() => projects?.filter((p) => p.status === "active").length ?? 0, [projects]);
  const activeSprint = useMemo(() => sprints?.find((s) => s.status === "active"), [sprints]);
  const velocity = activeSprint && activeSprint.totalPoints > 0
    ? Math.round((activeSprint.completedPoints / activeSprint.totalPoints) * 100)
    : 0;

  const byStatus = useMemo(() => {
    if (!tasks) return [];
    return STATUS_ORDER.map((s) => ({
      name: s.replace("_", " "),
      value: tasks.filter((t) => t.status === s).length,
    }));
  }, [tasks]);

  const velocityTrend = useMemo(() => {
    if (!sprints || sprints.length === 0) return [];
    return [...sprints]
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .slice(-5)
      .map((s) => ({
        sprint: s.name.replace("Sprint ", "S"),
        planned: s.totalPoints,
        completed: s.completedPoints,
      }));
  }, [sprints]);

  const workload = useMemo(() => {
    if (!tasks || !members) return [];
    const counts: Record<string, number> = {};
    tasks.forEach((t) => {
      if (t.assigneeId) {
        counts[t.assigneeId] = (counts[t.assigneeId] ?? 0) + 1;
      }
    });
    return members.slice(0, 6).map((m) => ({
      name: m.name.split(" ")[0],
      tasks: counts[m.id] ?? 0,
    }));
  }, [tasks, members]);

  const upcoming = useMemo(() => {
    if (!projects) return [];
    return [...projects]
      .filter((p) => p.status === "active" || p.status === "planning")
      .sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate))
      .slice(0, 5);
  }, [projects]);

  const recentActivity = useMemo(() => {
    if (!tasks) return [];
    return tasks
      .flatMap((t) => (t.activity ?? []).map((a) => ({ ...a, taskKey: t.key, taskTitle: t.title })))
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 8);
  }, [tasks]);

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <PageHeader title="Dashboard" description="Executive overview across projects, sprints, and team workload." />
        <div className="space-y-6 p-4 md:p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}><CardContent className="p-5"><Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-8 w-16" /></CardContent></Card>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2"><CardContent className="p-5"><Skeleton className="h-64 w-full" /></CardContent></Card>
            <Card><CardContent className="p-5"><Skeleton className="h-64 w-full" /></CardContent></Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Dashboard"
        description="Executive overview across projects, sprints, and team workload."
      />
      <div className="space-y-6 p-4 md:p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Open Tasks" value={open} delta="Active work items" icon={ListTodo} trend="neutral" />
          <KpiCard label="Completed Tasks" value={done} delta="Total done" icon={CheckCircle2} trend="up" />
          <KpiCard label="Active Projects" value={activeProjects} delta="In progress" icon={FolderKanban} trend="neutral" />
          <KpiCard label="Sprint Velocity" value={`${velocity}%`} delta={activeSprint ? `${activeSprint.completedPoints}/${activeSprint.totalPoints} pts` : "No active sprint"} icon={TrendingUp} trend={velocity > 50 ? "up" : "down"} />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Sprint velocity trend</CardTitle>
              <Badge variant="secondary">Last {velocityTrend.length} sprints</Badge>
            </CardHeader>
            <CardContent className="h-72">
              {velocityTrend.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Complete a sprint to see velocity data.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={velocityTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid stroke="oklch(0.92 0.005 265 / 0.5)" strokeDasharray="3 3" />
                    <XAxis dataKey="sprint" tick={{ fontSize: 12 }} stroke="oklch(0.52 0.02 265)" />
                    <YAxis tick={{ fontSize: 12 }} stroke="oklch(0.52 0.02 265)" />
                    <RTooltip contentStyle={{ background: "oklch(1 0 0)", border: "1px solid oklch(0.92 0.005 265)", borderRadius: 8, fontSize: 12 }} />
                    <Line type="monotone" dataKey="planned" stroke="oklch(0.62 0.02 265)" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="completed" stroke="oklch(0.55 0.22 265)" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Tasks by status</CardTitle></CardHeader>
            <CardContent className="h-72">
              {byStatus.every((s) => s.value === 0) ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No tasks yet.</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height="60%">
                    <PieChart>
                      <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={48} outerRadius={80} paddingAngle={2}>
                        {byStatus.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />)}
                      </Pie>
                      <RTooltip contentStyle={{ background: "oklch(1 0 0)", border: "1px solid oklch(0.92 0.005 265)", borderRadius: 8, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {byStatus.map((s, i) => (
                      <span key={s.name} className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-sm" style={{ background: STATUS_COLORS[i % STATUS_COLORS.length] }} />
                        {s.name}: {s.value}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-sm font-medium">Team workload</CardTitle></CardHeader>
            <CardContent className="h-64">
              {workload.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No task assignments yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={workload} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid stroke="oklch(0.92 0.005 265 / 0.5)" strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="oklch(0.52 0.02 265)" />
                    <YAxis tick={{ fontSize: 12 }} stroke="oklch(0.52 0.02 265)" />
                    <RTooltip contentStyle={{ background: "oklch(1 0 0)", border: "1px solid oklch(0.92 0.005 265)", borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="tasks" fill="oklch(0.55 0.22 265)" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Upcoming deadlines</CardTitle>
              <Button asChild variant="ghost" size="sm"><Link to={ROUTES.projects}>View all <ArrowRight className="ml-1 h-3 w-3" /></Link></Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcoming.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No upcoming deadlines.</p>
              ) : (
                upcoming.map((p) => (
                  <Link key={p.id} to={ROUTES.project(p.id)} className="flex items-center justify-between gap-3 rounded-md p-2 hover:bg-accent">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{p.key} · {p.progress}% complete</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatDate(p.dueDate)}</span>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Recent activity</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No activity yet. Create a task to get started.</p>
            ) : (
              recentActivity.map((a) => {
                const actor = members?.find((u) => u.id === a.actorId);
                return (
                  <div key={a.id} className="flex items-start gap-3">
                    <UserAvatar user={actor} size="sm" />
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="leading-snug">
                        <span className="font-medium">{actor?.name}</span>{" "}
                        <span className="text-muted-foreground">{a.message} on</span>{" "}
                        <span className="font-mono text-xs">{a.taskKey}</span>{" "}
                        <span className="text-muted-foreground">— {a.taskTitle}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{relativeTime(a.createdAt)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
