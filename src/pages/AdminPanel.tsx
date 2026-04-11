import { useState, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useSearchParams } from "react-router-dom";
import { ShieldCheck, ChevronRight } from "lucide-react";
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

const TAB_LABELS: Record<string, string> = {
  overview: "Visão Geral",
  agencies: "Agências",
  clients: "Clientes",
  users: "Usuários",
  plans: "Planos",
  templates: "Templates",
  financeiro: "Financeiro",
  "api-keys": "Chaves de API",
  support: "Suporte",
  tutorials: "Tutoriais",
};

const AdminPanel = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isPlatformOwner } = useAuth();
  const activeTab = searchParams.get("tab") || "overview";

  // Cross-tab navigation state
  const [agencyTierFilter, setAgencyTierFilter] = useState<string | undefined>();
  const [agencyIdFilter, setAgencyIdFilter] = useState<string | undefined>();
  const [clientAgencyFilter, setClientAgencyFilter] = useState<string | undefined>();
  const [clientIdFilter, setClientIdFilter] = useState<string | undefined>();
  const [breadcrumbExtra, setBreadcrumbExtra] = useState<string | null>(null);

  const navigateToTab = useCallback((tab: string, params?: Record<string, string>) => {
    setSearchParams({ tab });
    setBreadcrumbExtra(null);

    // Reset filters
    setAgencyTierFilter(undefined);
    setAgencyIdFilter(undefined);
    setClientAgencyFilter(undefined);
    setClientIdFilter(undefined);

    if (params?.tier) setAgencyTierFilter(params.tier);
    if (params?.agencyId) {
      if (tab === "agencies") setAgencyIdFilter(params.agencyId);
    }
    if (params?.clientId) {
      if (tab === "clients") setClientIdFilter(params.clientId);
    }
  }, [setSearchParams]);

  const handleNavigateToAgency = useCallback((agencyId: string) => {
    setSearchParams({ tab: "agencies" });
    setAgencyIdFilter(agencyId);
    setAgencyTierFilter(undefined);
    setClientAgencyFilter(undefined);
    setClientIdFilter(undefined);
  }, [setSearchParams]);

  const handleOpenClientFromAgency = useCallback((clientId: string) => {
    setSearchParams({ tab: "clients" });
    setClientIdFilter(clientId);
    setAgencyTierFilter(undefined);
    setAgencyIdFilter(undefined);
    setClientAgencyFilter(undefined);
  }, [setSearchParams]);

  const handleNavigateToClient = useCallback((clientId: string) => {
    setSearchParams({ tab: "clients" });
    setClientIdFilter(clientId);
  }, [setSearchParams]);

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
        {/* Header */}
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

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <span
            className="hover:text-foreground cursor-pointer"
            onClick={() => navigateToTab("overview")}
          >
            Admin
          </span>
          {activeTab !== "overview" && (
            <>
              <ChevronRight className="w-3 h-3" />
              <span className="text-foreground font-medium">{TAB_LABELS[activeTab] || activeTab}</span>
            </>
          )}
          {breadcrumbExtra && (
            <>
              <ChevronRight className="w-3 h-3" />
              <span className="text-foreground font-medium">{breadcrumbExtra}</span>
            </>
          )}
        </nav>

        {/* Tabs */}
        <Tabs value={activeTab} className="space-y-4">
          <TabsContent value="overview">
            <AdminOverviewTab onNavigate={navigateToTab} />
          </TabsContent>
          <TabsContent value="agencies">
            <AdminAgenciesTab
              initialTierFilter={agencyTierFilter}
              initialAgencyId={agencyIdFilter}
              onOpenClient={handleOpenClientFromAgency}
            />
          </TabsContent>
          <TabsContent value="clients">
            <AdminClientsTab
              initialAgencyFilter={clientAgencyFilter}
              initialClientId={clientIdFilter}
              onNavigateToAgency={handleNavigateToAgency}
            />
          </TabsContent>
          <TabsContent value="users">
            <AdminUsersTab
              onNavigateToAgency={handleNavigateToAgency}
              onNavigateToClient={handleNavigateToClient}
            />
          </TabsContent>
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
