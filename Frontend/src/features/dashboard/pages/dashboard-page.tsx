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
import { tasks, projects, sprints, velocityTrend, workload, users } from "@/shared/api/mock-data";
import { formatDate, relativeTime } from "@/shared/utils/format";
import { ROUTES } from "@/shared/constants/routes";

const STATUS_COLORS = ["oklch(0.55 0.22 265)", "oklch(0.62 0.16 155)", "oklch(0.72 0.16 75)", "oklch(0.62 0.15 230)", "oklch(0.6 0.22 320)"];

export function DashboardPage() {
  const open = tasks.filter((t) => t.status !== "done").length;
  const done = tasks.filter((t) => t.status === "done").length;
  const activeProjects = projects.filter((p) => p.status === "active").length;
  const activeSprint = sprints.find((s) => s.status === "active");
  const velocity = activeSprint ? Math.round((activeSprint.completedPoints / activeSprint.totalPoints) * 100) : 0;

  const byStatus = ["backlog","todo","in_progress","review","done"].map((s) => ({
    name: s.replace("_"," "),
    value: tasks.filter((t) => t.status === s).length,
  }));

  const upcoming = [...projects]
    .filter((p) => p.status === "active" || p.status === "planning")
    .sort((a,b) => +new Date(a.dueDate) - +new Date(b.dueDate))
    .slice(0, 5);

  const recentActivity = tasks
    .flatMap((t) => t.activity.map((a) => ({ ...a, taskKey: t.key, taskTitle: t.title })))
    .sort((a,b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 8);

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Dashboard"
        description="Executive overview across projects, sprints, and team workload."
      />
      <div className="space-y-6 p-4 md:p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Open Tasks" value={open} delta="+12% vs last week" icon={ListTodo} trend="up" />
          <KpiCard label="Completed Tasks" value={done} delta="+5 this week" icon={CheckCircle2} trend="up" />
          <KpiCard label="Active Projects" value={activeProjects} delta="2 launching soon" icon={FolderKanban} trend="neutral" />
          <KpiCard label="Sprint Velocity" value={`${velocity}%`} delta={`${activeSprint?.completedPoints}/${activeSprint?.totalPoints} pts`} icon={TrendingUp} trend="up" />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Sprint velocity trend</CardTitle>
              <Badge variant="secondary">Last 5 sprints</Badge>
            </CardHeader>
            <CardContent className="h-72">
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Tasks by status</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={48} outerRadius={80} paddingAngle={2}>
                    {byStatus.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />)}
                  </Pie>
                  <RTooltip contentStyle={{ background: "oklch(1 0 0)", border: "1px solid oklch(0.92 0.005 265)", borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="-mt-4 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {byStatus.map((s, i) => (
                  <span key={s.name} className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-sm" style={{ background: STATUS_COLORS[i % STATUS_COLORS.length] }} />
                    {s.name}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-sm font-medium">Team workload</CardTitle></CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workload} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke="oklch(0.92 0.005 265 / 0.5)" strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="oklch(0.52 0.02 265)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="oklch(0.52 0.02 265)" />
                  <RTooltip contentStyle={{ background: "oklch(1 0 0)", border: "1px solid oklch(0.92 0.005 265)", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="tasks" fill="oklch(0.55 0.22 265)" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Upcoming deadlines</CardTitle>
              <Button asChild variant="ghost" size="sm"><Link to={ROUTES.projects}>View all <ArrowRight className="ml-1 h-3 w-3" /></Link></Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcoming.map((p) => (
                <Link key={p.id} to={ROUTES.project(p.id)} className="flex items-center justify-between gap-3 rounded-md p-2 hover:bg-accent">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{p.key} · {p.progress}% complete</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatDate(p.dueDate)}</span>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Recent activity</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.map((a) => {
              const actor = users.find((u) => u.id === a.actorId);
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
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
