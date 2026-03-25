import { ReactNode } from "react";
import AppSidebar from "./AppSidebar";
import { RightPanelProvider } from "./RightPanel";

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  return (
    <RightPanelProvider>
      <div className="flex h-screen overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto bg-background relative overflow-x-hidden">
          {/* Animated background orbs */}
          <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
            <div className="absolute -top-[10%] -right-[5%] w-[500px] h-[500px] rounded-full opacity-[0.08] dark:opacity-[0.15] blur-[120px] bg-[radial-gradient(circle,hsl(var(--primary)/0.4),transparent_70%)] animate-[mesh-move_20s_ease-in-out_infinite]" />
            <div className="absolute -bottom-[5%] -left-[5%] w-[400px] h-[400px] rounded-full opacity-[0.06] dark:opacity-[0.12] blur-[100px] bg-[radial-gradient(circle,hsl(var(--info)/0.3),transparent_70%)] animate-[mesh-move-alt_25s_ease-in-out_infinite]" />
            <div className="absolute top-[40%] left-[50%] -ml-[150px] w-[300px] h-[300px] rounded-full opacity-[0.05] dark:opacity-[0.10] blur-[100px] bg-[radial-gradient(circle,hsl(var(--primary)/0.2),transparent_70%)] animate-[mesh-move-slow_30s_ease-in-out_infinite]" />
          </div>
          <div className="relative z-10">
            {children}
          </div>
        </main>
      </div>
    </RightPanelProvider>
  );
};

export default DashboardLayout;
