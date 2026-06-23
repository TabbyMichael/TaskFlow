import { useMemo } from "react";
import { PageHeader } from "@/shared/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/shared/components/kpi-card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Clock, TrendingUp, Users as UsersIcon, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line, CartesianGrid } from "recharts";
import { useTasksList, useSprintsList, useMembersList } from "@/lib/api";

export function ReportsPage() {
  const { data: tasks, isLoading: tasksLoading } = useTasksList();
  const { data: sprints, isLoading: sprintsLoading } = useSprintsList();
  const { data: members } = useMembersList();

  const completed = useMemo(() => tasks?.filter((t) => t.status === "done").length ?? 0, [tasks]);

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

  const loading = tasksLoading || sprintsLoading;

  if (loading) {
    return (
      <div>
        <PageHeader title="Reports" description="Productivity analytics across your organization." />
        <div className="space-y-6 p-4 md:p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}><CardContent className="p-5"><Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-8 w-16" /></CardContent></Card>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i}><CardContent className="p-5"><Skeleton className="h-64 w-full" /></CardContent></Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Reports" description="Productivity analytics across your organization."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm"><Download className="mr-1.5 h-4 w-4" /> CSV</Button>
            <Button variant="outline" size="sm"><Download className="mr-1.5 h-4 w-4" /> Excel</Button>
            <Button variant="outline" size="sm"><Download className="mr-1.5 h-4 w-4" /> PDF</Button>
          </div>
        } />
      <div className="space-y-6 p-4 md:p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Tasks completed" value={completed} delta="All time" icon={CheckCircle2} trend="up" />
          <KpiCard label="Avg. completion time" value="2.4 days" delta="From mock data" icon={Clock} trend="up" />
          <KpiCard label="Team velocity" value={velocityTrend.length > 0 ? `${velocityTrend[velocityTrend.length-1].completed} pts` : "0 pts"} delta="Latest sprint" icon={TrendingUp} trend="neutral" />
          <KpiCard label="Active contributors" value={members?.length ?? 0} delta="Team size" icon={UsersIcon} trend="neutral" />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-sm">Velocity over time</CardTitle></CardHeader>
            <CardContent className="h-72">
              {velocityTrend.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Complete a sprint to see velocity data.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={velocityTrend} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid stroke="oklch(0.92 0.005 265 / 0.5)" strokeDasharray="3 3" />
                    <XAxis dataKey="sprint" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Line type="monotone" dataKey="planned" stroke="oklch(0.62 0.02 265)" />
                    <Line type="monotone" dataKey="completed" stroke="oklch(0.55 0.22 265)" strokeWidth={2.5} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Workload distribution</CardTitle></CardHeader>
            <CardContent className="h-72">
              {workload.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No task assignments yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={workload} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid stroke="oklch(0.92 0.005 265 / 0.5)" strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Bar dataKey="tasks" fill="oklch(0.62 0.16 155)" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
