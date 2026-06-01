import { PageHeader } from "@/shared/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore } from "@/app/store/auth-store";
import { useUIStore } from "@/app/store/ui-store";
import { Separator } from "@/components/ui/separator";

export function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);

  return (
    <div>
      <PageHeader title="Settings" description="Manage your profile, security, and preferences." />
      <div className="p-4 md:p-6">
        <Tabs defaultValue="profile">
          <TabsList><TabsTrigger value="profile">Profile</TabsTrigger><TabsTrigger value="security">Security</TabsTrigger><TabsTrigger value="preferences">Preferences</TabsTrigger></TabsList>

          <TabsContent value="profile" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Profile</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16"><AvatarFallback className="bg-primary/15 text-primary text-xl font-semibold">{user?.initials ?? "U"}</AvatarFallback></Avatar>
                  <div className="space-y-2"><Button variant="outline" size="sm">Upload new photo</Button><p className="text-xs text-muted-foreground">PNG or JPG, up to 2MB.</p></div>
                </div>
                <Separator />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="name">Name</Label><Input id="name" defaultValue={user?.name} /></div>
                  <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" defaultValue={user?.email} /></div>
                  <div className="space-y-2"><Label htmlFor="title">Job title</Label><Input id="title" defaultValue={user?.title} /></div>
                </div>
                <div className="flex justify-end"><Button>Save changes</Button></div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-4 space-y-4">
            <Card><CardHeader><CardTitle className="text-sm">Change password</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-2"><Label>Current</Label><Input type="password" /></div>
              <div className="space-y-2"><Label>New</Label><Input type="password" /></div>
              <div className="space-y-2"><Label>Confirm</Label><Input type="password" /></div>
              <div className="sm:col-span-3 flex justify-end"><Button>Update password</Button></div>
            </CardContent></Card>
            <Card><CardHeader><CardTitle className="text-sm">Two-factor authentication</CardTitle></CardHeader>
              <CardContent className="flex items-center justify-between"><div><p className="font-medium">Authenticator app</p><p className="text-sm text-muted-foreground">Use an app like 1Password or Authy.</p></div><Switch /></CardContent>
            </Card>
            <Card><CardHeader><CardTitle className="text-sm">Active sessions</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {["MacBook Pro · Chrome · San Francisco", "iPhone 15 · Safari · San Francisco"].map((s) => (
                  <div key={s} className="flex items-center justify-between rounded-md border p-3 text-sm"><span>{s}</span><Button variant="ghost" size="sm">Revoke</Button></div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="mt-4">
            <Card><CardHeader><CardTitle className="text-sm">Preferences</CardTitle></CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2"><Label>Theme</Label>
                  <Select value={theme} onValueChange={(v) => setTheme(v as "light" | "dark")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="light">Light</SelectItem><SelectItem value="dark">Dark</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Timezone</Label>
                  <Select defaultValue="pst"><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="pst">Pacific (PST)</SelectItem><SelectItem value="est">Eastern (EST)</SelectItem><SelectItem value="utc">UTC</SelectItem><SelectItem value="cet">Central European</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Language</Label>
                  <Select defaultValue="en"><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="es">Español</SelectItem><SelectItem value="fr">Français</SelectItem><SelectItem value="ja">日本語</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-3 flex justify-end"><Button>Save preferences</Button></div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
