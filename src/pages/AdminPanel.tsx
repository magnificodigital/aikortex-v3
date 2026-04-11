import AdminLayout from "@/components/admin/AdminLayout";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useSearchParams } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

import AdminOverviewTab from "@/components/admin/AdminOverviewTab";
import AdminAgenciesTab from "@/components/admin/AdminAgenciesTab";
import AdminClientsTab from "@/components/admin/AdminClientsTab";
import AdminUsersTab from "@/components/admin/AdminUsersTab";
import AdminPlansTab from "@/components/admin/AdminPlansTab";
import AdminTemplatesTab from "@/components/admin/AdminTemplatesTab";
import AdminFinanceiroTab from "@/components/admin/AdminFinanceiroTab";
import AdminConfigTab from "@/components/admin/AdminConfigTab";
import AdminSupportTab from "@/components/admin/AdminSupportTab";
import AdminTutorialsTab from "@/components/admin/AdminTutorialsTab";

const AdminPanel = () => {
  const [searchParams] = useSearchParams();
  const { isPlatformOwner } = useAuth();
  const activeTab = searchParams.get("tab") || "overview";

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">Painel Aikortex</h1>
              <Badge className="bg-primary/10 text-primary border-0 text-[10px]">Admin</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Gerencie agências, planos e configurações da plataforma.
            </p>
          </div>
        </div>

        <Tabs value={activeTab} className="space-y-4">
          <TabsContent value="overview"><AdminOverviewTab /></TabsContent>
          <TabsContent value="agencies"><AdminAgenciesTab /></TabsContent>
          <TabsContent value="clients"><AdminClientsTab /></TabsContent>
          <TabsContent value="users"><AdminUsersTab /></TabsContent>
          <TabsContent value="plans"><AdminPlansTab /></TabsContent>
          <TabsContent value="templates"><AdminTemplatesTab /></TabsContent>
          <TabsContent value="financeiro"><AdminFinanceiroTab /></TabsContent>
          {isPlatformOwner && (
            <TabsContent value="api-keys"><AdminConfigTab /></TabsContent>
          )}
          <TabsContent value="support"><AdminSupportTab /></TabsContent>
          <TabsContent value="tutorials"><AdminTutorialsTab /></TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminPanel;
