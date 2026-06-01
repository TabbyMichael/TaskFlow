import { PageHeader } from "@/shared/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/shared/components/kpi-card";
import { tasks, velocityTrend, workload } from "@/shared/api/mock-data";
import { CheckCircle2, Clock, TrendingUp, Users as UsersIcon, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line, CartesianGrid } from "recharts";

export function ReportsPage() {
  const completed = tasks.filter((t) => t.status === "done").length;
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
          <KpiCard label="Tasks completed" value={completed} delta="+8% MoM" icon={CheckCircle2} trend="up" />
          <KpiCard label="Avg. completion time" value="2.4 days" delta="-0.3 days" icon={Clock} trend="up" />
          <KpiCard label="Team velocity" value="38 pts" delta="+12% vs last sprint" icon={TrendingUp} trend="up" />
          <KpiCard label="Active contributors" value={workload.length} delta="Stable" icon={UsersIcon} trend="neutral" />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-sm">Velocity over time</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={velocityTrend} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke="oklch(0.92 0.005 265 / 0.5)" strokeDasharray="3 3" />
                  <XAxis dataKey="sprint" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Line type="monotone" dataKey="planned" stroke="oklch(0.62 0.02 265)" />
                  <Line type="monotone" dataKey="completed" stroke="oklch(0.55 0.22 265)" strokeWidth={2.5} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Workload distribution</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workload} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke="oklch(0.92 0.005 265 / 0.5)" strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="tasks" fill="oklch(0.62 0.16 155)" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
