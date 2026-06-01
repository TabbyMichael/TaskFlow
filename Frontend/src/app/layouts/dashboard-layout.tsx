import { Outlet } from "@tanstack/react-router";
import { TopBar } from "./top-bar";
import { AppSidebar } from "./app-sidebar";
import { useUIStore } from "@/app/store/ui-store";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export function DashboardLayout() {
  const mobileNavOpen = useUIStore((s) => s.mobileNavOpen);
  const setMobileNav = useUIStore((s) => s.setMobileNav);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <div className="hidden md:flex"><AppSidebar /></div>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNav}>
        <SheetContent side="left" className="w-72 p-0">
          <AppSidebar mobile onNavigate={() => setMobileNav(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
