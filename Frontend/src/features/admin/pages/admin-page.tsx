import { PageHeader } from "@/shared/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserAvatar } from "@/shared/components/user-avatar";
import { UserStatusBadge } from "@/shared/components/status-badges";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMembersList } from "@/lib/api";
import { useAuthStore } from "@/app/store/auth-store";

export function AdminPage() {
  const { data: members, isLoading } = useMembersList();
  const orgName = useAuthStore((s) => s.user?.email?.split("@")[1] ?? "TaskFlow");

  return (
    <div>
      <PageHeader title="Admin" description="Manage users, roles, and organization settings." />
      <div className="p-4 md:p-6">
        <Tabs defaultValue="users">
          <TabsList><TabsTrigger value="users">User management</TabsTrigger><TabsTrigger value="org">Organization</TabsTrigger><TabsTrigger value="permissions">Permissions</TabsTrigger></TabsList>

          <TabsContent value="users" className="mt-4">
            <Card><Table>
              <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-8 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-14" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  members?.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell><div className="flex items-center gap-3"><UserAvatar user={u} size="sm" /><div><p className="font-medium">{u.name}</p><p className="text-xs text-muted-foreground">{u.email}</p></div></div></TableCell>
                      <TableCell>
                        <Select defaultValue={u.role}><SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="manager">Manager</SelectItem><SelectItem value="member">Member</SelectItem><SelectItem value="viewer">Viewer</SelectItem></SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell><UserStatusBadge status={u.status} /></TableCell>
                      <TableCell className="text-right"><Button variant="ghost" size="sm">Manage</Button></TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table></Card>
          </TabsContent>

          <TabsContent value="org" className="mt-4 space-y-4">
            <Card><CardHeader><CardTitle className="text-sm">Organization details</CardTitle></CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label>Organization name</Label><Input defaultValue={orgName} /></div>
                <div className="space-y-2"><Label>Plan</Label><div className="flex items-center gap-2"><Badge>Enterprise</Badge><Button variant="outline" size="sm">Manage billing</Button></div></div>
                <div className="sm:col-span-2 flex justify-end"><Button>Save</Button></div>
              </CardContent></Card>

            <Card><CardHeader><CardTitle className="text-sm">Billing</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Seats used</span><span className="font-mono">{members?.length ?? 0} / 50</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Next invoice</span><span className="font-mono">$2,499 on Jan 1</span></div>
                <Button variant="outline" size="sm">Update payment method</Button>
              </CardContent></Card>
          </TabsContent>

          <TabsContent value="permissions" className="mt-4">
            <Card><CardHeader><CardTitle className="text-sm">Role permissions</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {["Create projects","Delete projects","Manage members","Export reports","Manage billing"].map((p) => (
                  <div key={p} className="flex items-center justify-between rounded-md border p-3"><div><p className="font-medium">{p}</p><p className="text-xs text-muted-foreground">Allow members with manager role and above.</p></div><Switch defaultChecked /></div>
                ))}
              </CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
