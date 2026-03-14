import DashboardLayout from "@/components/DashboardLayout";
import { LayoutDashboard } from "lucide-react";
import BusinessOverview from "@/components/dashboard/BusinessOverview";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import TaskOverview from "@/components/dashboard/TaskOverview";
import ClientSnapshot from "@/components/dashboard/ClientSnapshot";
import AutomationStatus from "@/components/dashboard/AutomationStatus";
import NotificationsCenter from "@/components/dashboard/NotificationsCenter";
import PerformanceWidgets from "@/components/dashboard/PerformanceWidgets";

const Index = () => {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6 max-w-[1600px]">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Central de comando da agência</p>
          </div>
        </div>

        {/* 1. Business Overview */}
        <BusinessOverview />

        {/* 7. Performance Widgets */}
        <PerformanceWidgets />

        {/* Middle row: Activity + Tasks + Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ActivityFeed />
          <TaskOverview />
          <NotificationsCenter />
        </div>

        {/* Bottom row: Clients + Automation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ClientSnapshot />
          <AutomationStatus />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
