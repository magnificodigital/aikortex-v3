import { ReactNode, useEffect, useState } from "react";
import { Menu } from "lucide-react";
import AppSidebar from "./AppSidebar";
import { RightPanelProvider } from "./RightPanel";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const isMobile = useIsMobile();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isMobile) {
      setMobileSidebarOpen(false);
    }
  }, [isMobile]);

  return (
    <RightPanelProvider>
      <div className="flex min-h-screen w-full overflow-hidden">
        <AppSidebar
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />
        <main className="relative flex-1 min-w-0 overflow-y-auto overflow-x-hidden bg-background">
          {isMobile && (
            <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur md:hidden">
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={() => setMobileSidebarOpen(true)}
              >
                <Menu className="h-4 w-4" />
                <span className="sr-only">Abrir menu</span>
              </Button>
              <span className="text-sm font-medium text-foreground">Menu</span>
            </div>
          )}

          <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
            <div className="absolute -top-[10%] -right-[5%] h-[500px] w-[500px] animate-[mesh-move_20s_ease-in-out_infinite] rounded-full bg-[radial-gradient(circle,hsl(var(--primary)/0.4),transparent_70%)] opacity-[0.08] blur-[120px] dark:opacity-[0.15]" />
            <div className="absolute -bottom-[5%] -left-[5%] h-[400px] w-[400px] animate-[mesh-move-alt_25s_ease-in-out_infinite] rounded-full bg-[radial-gradient(circle,hsl(var(--info)/0.3),transparent_70%)] opacity-[0.06] blur-[100px] dark:opacity-[0.12]" />
            <div className="absolute top-[40%] left-[50%] -ml-[150px] h-[300px] w-[300px] animate-[mesh-move-slow_30s_ease-in-out_infinite] rounded-full bg-[radial-gradient(circle,hsl(var(--primary)/0.2),transparent_70%)] opacity-[0.05] blur-[100px] dark:opacity-[0.10]" />
          </div>

          <div className="space-stars" />
          <div className="space-stars-layer2" />
          <div className="space-stars-layer3" />

          <div className="relative z-10">{children}</div>
        </main>
      </div>
    </RightPanelProvider>
  );
};

export default DashboardLayout;
