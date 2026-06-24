import { useState } from "react";
import { PageHeader } from "@/shared/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/shared/components/user-avatar";
import { useNotificationsList, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/lib/api";
import { useMembersList } from "@/lib/api";
import { relativeTime } from "@/shared/utils/format";
import { AtSign, UserPlus, FolderKanban, Goal, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap = { mention: AtSign, assignment: UserPlus, project: FolderKanban, sprint: Goal } as const;

export function NotificationsPage() {
  const { data: notifications = [] } = useNotificationsList();
  const { data: members = [] } = useMembersList();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div>
      <PageHeader
        title="Notifications"
        description={`${unread} unread`}
        actions={
          <Button variant="outline" onClick={() => markAllRead.mutate()}>
            <Check className="mr-1.5 h-4 w-4" /> Mark all read
          </Button>
        }
      />
      <div className="p-4 md:p-6">
        <Card>
          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">No notifications.</div>
            ) : (
              <ul className="divide-y">
                {notifications.map((n) => {
                  const Icon = iconMap[n.type as keyof typeof iconMap] ?? AtSign;
                  const actor = members.find((u) => u.id === String(n.actorId ?? ''));
                  return (
                    <li key={n.id} className={cn("flex items-start gap-3 p-4 hover:bg-muted/40", !n.read && "bg-primary/5")}>
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{n.title}</p>
                          {!n.read && <Badge variant="default" className="h-4 px-1.5 text-[10px]">New</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{n.body}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{relativeTime(n.createdAt)}</p>
                      </div>
                      {actor && <UserAvatar user={actor} size="sm" />}
                      {!n.read && (
                        <Button variant="ghost" size="sm" onClick={() => markRead.mutate(n.id!)}>
                          Mark read
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
