import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, Plus } from "lucide-react";
import { PageHeader } from "@/shared/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProjectStatusBadge, TaskStatusBadge, PriorityBadge } from "@/shared/components/status-badges";
import { UserAvatar, AvatarStack } from "@/shared/components/user-avatar";
import { EmptyState } from "@/shared/components/empty-state";
import { projects, tasks, users } from "@/shared/api/mock-data";
import { formatDate, relativeTime, formatBytes } from "@/shared/utils/format";
import { ROUTES } from "@/shared/constants/routes";
import { FileText } from "lucide-react";

export function ProjectDetailsPage() {
  const { id } = useParams({ from: "/_authenticated/projects/$id" });
  const project = projects.find((p) => p.id === id);
  if (!project) {
    return (
      <div className="p-6">
        <EmptyState icon={FileText} title="Project not found" description="It may have been archived or moved." action={<Button asChild variant="outline"><Link to={ROUTES.projects}>Back to projects</Link></Button>} />
      </div>
    );
  }
  const projectTasks = tasks.filter((t) => t.projectId === id);
  const lead = users.find((u) => u.id === project.leadId);
  const recent = projectTasks.flatMap((t) => t.activity.map((a) => ({ ...a, taskKey: t.key }))).sort((a,b)=>+new Date(b.createdAt)-+new Date(a.createdAt)).slice(0, 8);

  return (
    <div>
      <PageHeader
        title={project.name}
        description={project.description}
        actions={
          <>
            <Button asChild variant="ghost" size="sm"><Link to={ROUTES.projects}><ArrowLeft className="mr-1.5 h-4 w-4" /> All projects</Link></Button>
            <ProjectStatusBadge status={project.status} />
          </>
        }
      />
      <div className="p-4 md:p-6">
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Progress</p><div className="mt-2 flex items-center gap-2"><Progress value={project.progress} className="h-1.5" /><span className="font-mono text-sm font-medium">{project.progress}%</span></div></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Due date</p><p className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium"><CalendarDays className="h-4 w-4 text-muted-foreground" />{formatDate(project.dueDate)}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Lead</p><div className="mt-2 flex items-center gap-2"><UserAvatar user={lead} size="sm" /><span className="text-sm font-medium">{lead?.name}</span></div></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Team</p><div className="mt-2"><AvatarStack ids={project.memberIds} max={5} /></div></CardContent></Card>
        </div>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Tasks ({projectTasks.length})</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2"><CardHeader><CardTitle className="text-sm">Summary</CardTitle></CardHeader><CardContent className="space-y-2 text-sm text-muted-foreground"><p>{project.description}</p><p>Started {formatDate(project.startDate)} · Targeting {formatDate(project.dueDate)}.</p></CardContent></Card>
            <Card><CardHeader><CardTitle className="text-sm">Recent activity</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
              {recent.slice(0,5).map((a) => (
                <div key={a.id} className="text-xs text-muted-foreground"><span className="font-mono">{a.taskKey}</span> — {a.message} · {relativeTime(a.createdAt)}</div>
              ))}
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="tasks" className="mt-4">
            <Card>
              <Table>
                <TableHeader><TableRow><TableHead>Key</TableHead><TableHead>Title</TableHead><TableHead>Status</TableHead><TableHead>Priority</TableHead><TableHead>Assignee</TableHead></TableRow></TableHeader>
                <TableBody>
                  {projectTasks.map((t) => {
                    const a = users.find((u) => u.id === t.assigneeId);
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="font-mono text-xs">{t.key}</TableCell>
                        <TableCell className="font-medium">{t.title}</TableCell>
                        <TableCell><TaskStatusBadge status={t.status} /></TableCell>
                        <TableCell><PriorityBadge priority={t.priority} /></TableCell>
                        <TableCell><div className="flex items-center gap-2"><UserAvatar user={a} size="xs" /><span className="text-sm">{a?.name}</span></div></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="mt-4">
            <Card><CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Member</TableHead><TableHead>Role</TableHead><TableHead>Email</TableHead></TableRow></TableHeader>
                <TableBody>
                  {project.memberIds.map((id) => {
                    const u = users.find((u) => u.id === id);
                    return u ? (
                      <TableRow key={id}>
                        <TableCell><div className="flex items-center gap-2"><UserAvatar user={u} size="sm" /><span className="font-medium">{u.name}</span></div></TableCell>
                        <TableCell className="capitalize">{u.role}</TableCell>
                        <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      </TableRow>
                    ) : null;
                  })}
                </TableBody>
              </Table>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="files" className="mt-4">
            <Card><CardContent className="p-4 space-y-2">
              {projectTasks.flatMap((t) => t.attachments).slice(0, 6).map((f) => (
                <div key={f.id} className="flex items-center justify-between rounded-md border p-3">
                  <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-medium">{f.name}</span></div>
                  <span className="text-xs text-muted-foreground">{formatBytes(f.size)}</span>
                </div>
              ))}
              <Button variant="outline" size="sm" className="mt-2"><Plus className="mr-1.5 h-4 w-4" /> Upload file</Button>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            <Card><CardContent className="space-y-3 p-4">
              {recent.map((a) => {
                const actor = users.find((u) => u.id === a.actorId);
                return (
                  <div key={a.id} className="flex items-start gap-3 text-sm">
                    <UserAvatar user={actor} size="sm" />
                    <div><p><span className="font-medium">{actor?.name}</span> <span className="text-muted-foreground">{a.message} on</span> <span className="font-mono text-xs">{a.taskKey}</span></p><p className="text-xs text-muted-foreground">{relativeTime(a.createdAt)}</p></div>
                  </div>
                );
              })}
            </CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
