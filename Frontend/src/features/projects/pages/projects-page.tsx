import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search, Grid3x3, List, Plus, CalendarDays } from "lucide-react";
import { PageHeader } from "@/shared/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProjectStatusBadge } from "@/shared/components/status-badges";
import { AvatarStack } from "@/shared/components/user-avatar";
import { projects } from "@/shared/api/mock-data";
import { ROUTES } from "@/shared/constants/routes";
import { formatDate } from "@/shared/utils/format";
import { useDebounce } from "@/shared/hooks/use-debounce";

export function ProjectsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [sort, setSort] = useState<string>("dueDate");
  const [view, setView] = useState<"grid" | "list">("grid");
  const debounced = useDebounce(query, 200);

  const filtered = useMemo(() => {
    let list = projects.filter((p) => {
      if (status !== "all" && p.status !== status) return false;
      if (debounced && !`${p.name} ${p.key}`.toLowerCase().includes(debounced.toLowerCase())) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "progress") return b.progress - a.progress;
      return +new Date(a.dueDate) - +new Date(b.dueDate);
    });
    return list;
  }, [debounced, status, sort]);

  return (
    <div>
      <PageHeader
        title="Projects"
        description="All projects across your organization."
        actions={<Button><Plus className="mr-1.5 h-4 w-4" /> New project</Button>}
      />
      <div className="space-y-4 p-4 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search projects…" className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Sort" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="dueDate">Due date</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="progress">Progress</SelectItem>
            </SelectContent>
          </Select>
          <Tabs value={view} onValueChange={(v) => setView(v as "grid" | "list")}>
            <TabsList>
              <TabsTrigger value="grid"><Grid3x3 className="h-4 w-4" /></TabsTrigger>
              <TabsTrigger value="list"><List className="h-4 w-4" /></TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {view === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <Link key={p.id} to={ROUTES.project(p.id)}>
                <Card className="group h-full transition-all hover:border-primary/50 hover:shadow-sm">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-1 rounded-full" style={{ background: p.color }} />
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{p.key}</p>
                          <h3 className="font-semibold leading-tight">{p.name}</h3>
                        </div>
                      </div>
                      <ProjectStatusBadge status={p.status} />
                    </div>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                    <div>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-mono font-medium">{p.progress}%</span>
                      </div>
                      <Progress value={p.progress} className="h-1.5" />
                    </div>
                    <div className="flex items-center justify-between">
                      <AvatarStack ids={p.memberIds} />
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarDays className="h-3 w-3" /> {formatDate(p.dueDate, "MMM d")}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-40">Progress</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Due date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id} className="cursor-pointer">
                    <TableCell>
                      <Link to={ROUTES.project(p.id)} className="flex items-center gap-3">
                        <div className="h-6 w-1 rounded-full" style={{ background: p.color }} />
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{p.key}</p>
                          <p className="font-medium">{p.name}</p>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell><ProjectStatusBadge status={p.status} /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2"><Progress value={p.progress} className="h-1.5" /><span className="font-mono text-xs">{p.progress}%</span></div>
                    </TableCell>
                    <TableCell><AvatarStack ids={p.memberIds} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(p.dueDate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
}
