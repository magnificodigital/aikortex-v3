import { ReactNode } from "react";
import AppSidebar from "./AppSidebar";
import { RightPanelProvider } from "./RightPanel";

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  return (
    <RightPanelProvider>
      <div className="flex h-screen overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
    </RightPanelProvider>
  );
};

export default DashboardLayout;
