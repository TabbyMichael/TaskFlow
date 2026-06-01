import { useState } from "react";
import { PageHeader } from "@/shared/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserAvatar } from "@/shared/components/user-avatar";
import { UserStatusBadge } from "@/shared/components/status-badges";
import { Plus, MoreHorizontal } from "lucide-react";
import { users, projects } from "@/shared/api/mock-data";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function TeamPage() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <PageHeader title="Team" description="Manage members, roles, and access."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-1.5 h-4 w-4" /> Invite member</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Invite team member</DialogTitle></DialogHeader>
              <div className="space-y-3"><Input placeholder="name@company.com" /><Input placeholder="Role (member, manager, viewer)" /></div>
              <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => setOpen(false)}>Send invite</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="p-4 md:p-6">
        <Card>
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead>Email</TableHead><TableHead>Projects</TableHead><TableHead>Status</TableHead><TableHead className="w-12" /></TableRow></TableHeader>
            <TableBody>
              {users.map((u) => {
                const projCount = projects.filter((p) => p.memberIds.includes(u.id)).length;
                return (
                  <TableRow key={u.id}>
                    <TableCell><div className="flex items-center gap-3"><UserAvatar user={u} size="sm" /><div><p className="font-medium">{u.name}</p><p className="text-xs text-muted-foreground">{u.title}</p></div></div></TableCell>
                    <TableCell className="capitalize">{u.role}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell className="font-mono text-sm">{projCount}</TableCell>
                    <TableCell><UserStatusBadge status={u.status} /></TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end"><DropdownMenuItem>Edit user</DropdownMenuItem><DropdownMenuItem>Reset password</DropdownMenuItem><DropdownMenuItem className="text-destructive">Remove user</DropdownMenuItem></DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
