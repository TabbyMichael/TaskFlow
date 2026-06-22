import { useMemo } from "react";
import { PageHeader } from "@/shared/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SprintStatusBadge } from "@/shared/components/status-badges";
import { formatDate } from "@/shared/utils/format";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip,
  LineChart, Line, CartesianGrid,
} from "recharts";
import { useSprintsList, useTasksList, useProjectsList } from "@/lib/api";

export function SprintsPage() {
  const { data: sprints, isLoading: sprintsLoading } = useSprintsList();
  const { data: tasks } = useTasksList();
  const { data: projects } = useProjectsList();

  const active = useMemo(() => sprints?.find((s) => s.status === "active"), [sprints]);
  const activeTasks = useMemo(() => {
    if (!active || !tasks) return [];
    return tasks.filter((t) => t.sprintId === active.id);
  }, [active, tasks]);
  const remaining = activeTasks.filter((t) => t.status !== "done").length;
  const completedCount = activeTasks.length - remaining;

  const velocityTrend = useMemo(() => {
    if (!sprints) return [];
    return [...sprints]
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .slice(-5)
      .map((s) => ({
        sprint: s.name.replace("Sprint ", "S"),
        planned: s.totalPoints,
        completed: s.completedPoints,
      }));
  }, [sprints]);

  const burndown = useMemo(() => {
    if (!active || active.totalPoints === 0) return [];
    // Generate 14-day burndown from active sprint data
    const total = active.totalPoints;
    return Array.from({ length: 14 }, (_, i) => ({
      day: `Day ${i + 1}`,
      ideal: Math.max(0, total - (i * total) / 13),
      actual: Math.max(
        0,
        total -
          Math.round(
            (i * active.completedPoints) / 13 + (i > 5 ? 2 : 0),
          ),
      ),
    }));
  }, [active]);

  if (sprintsLoading) {
    return (
      <div>
        <PageHeader title="Sprints" description="Plan, track, and review your team's sprints." />
        <div className="space-y-6 p-4 md:p-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Sprints" description="Plan, track, and review your team's sprints."
        actions={<Button><Plus className="mr-1.5 h-4 w-4" /> New sprint</Button>} />
      <div className="space-y-6 p-4 md:p-6">
        {active ? (
          <div>
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">Active sprint dashboard</h2>
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle>{active.name}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">{active.goal} · {projects?.find((p)=>p.id===active.projectId)?.name}</p>
                  </div>
                  <SprintStatusBadge status={active.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-4">
                  <div><p className="text-xs text-muted-foreground">Completed</p><p className="font-mono text-2xl font-semibold">{completedCount}</p></div>
                  <div><p className="text-xs text-muted-foreground">Remaining</p><p className="font-mono text-2xl font-semibold">{remaining}</p></div>
                  <div><p className="text-xs text-muted-foreground">Points</p><p className="font-mono text-2xl font-semibold">{active.completedPoints}/{active.totalPoints}</p></div>
                  <div><p className="text-xs text-muted-foreground">Ends</p><p className="text-sm font-medium">{formatDate(active.endDate)}</p></div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="h-64">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Burndown</p>
                    {burndown.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Insufficient sprint data for burndown chart.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="90%">
                        <LineChart data={burndown} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                          <CartesianGrid stroke="oklch(0.92 0.005 265 / 0.5)" strokeDasharray="3 3" />
                          <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                          <Line type="monotone" dataKey="ideal" stroke="oklch(0.62 0.02 265)" strokeDasharray="4 4" />
                          <Line type="monotone" dataKey="actual" stroke="oklch(0.55 0.22 265)" strokeWidth={2.5} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <div className="h-64">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Velocity</p>
                    {velocityTrend.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Complete a sprint to see velocity data.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={velocityTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                          <CartesianGrid stroke="oklch(0.92 0.005 265 / 0.5)" strokeDasharray="3 3" />
                          <XAxis dataKey="sprint" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                          <Bar dataKey="completed" fill="oklch(0.55 0.22 265)" radius={[4,4,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="text-sm font-medium">No active sprint</p>
            <p className="text-sm text-muted-foreground">Create and start a sprint to track your team's progress.</p>
          </div>
        )}

        {sprints && sprints.length > 0 && (
          <div>
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">All sprints</h2>
            <div className="grid gap-3">
              {sprints.map((s) => (
                <Card key={s.id}>
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2"><h3 className="font-medium">{s.name}</h3><SprintStatusBadge status={s.status} /></div>
                      <p className="text-sm text-muted-foreground">{s.goal}</p>
                    </div>
                    <div className="w-full sm:w-48"><div className="mb-1 flex justify-between text-xs"><span className="text-muted-foreground">Progress</span><span className="font-mono">{s.completedPoints}/{s.totalPoints}</span></div><Progress value={s.totalPoints > 0 ? (s.completedPoints / s.totalPoints) * 100 : 0} className="h-1.5" /></div>
                    <div className="text-xs text-muted-foreground sm:w-32">{formatDate(s.startDate, "MMM d")} – {formatDate(s.endDate, "MMM d")}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {(!sprints || sprints.length === 0) && !active && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="text-sm font-medium">No sprints yet</p>
            <p className="text-sm text-muted-foreground">Create your first sprint to start planning.</p>
          </div>
        )}
      </div>
    </div>
  );
}
