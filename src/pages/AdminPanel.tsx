import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Users, CreditCard, BarChart3, Settings, Award } from "lucide-react";
import AdminUsersTab from "@/components/admin/AdminUsersTab";
import AdminPlansTab from "@/components/admin/AdminPlansTab";
import AdminSubscriptionsTab from "@/components/admin/AdminSubscriptionsTab";
import AdminPaymentTab from "@/components/admin/AdminPaymentTab";
import AdminPartnersTab from "@/components/admin/AdminPartnersTab";

const AdminPanel = () => {
  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Painel Administrativo</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie usuários, planos, assinaturas, pagamentos e parceiros</p>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="bg-muted/50 p-1 flex-wrap">
            <TabsTrigger value="users" className="text-xs gap-1.5">
              <Users className="w-3.5 h-3.5" /> Usuários
            </TabsTrigger>
            <TabsTrigger value="plans" className="text-xs gap-1.5">
              <CreditCard className="w-3.5 h-3.5" /> Planos
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="text-xs gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" /> Assinaturas
            </TabsTrigger>
            <TabsTrigger value="payment" className="text-xs gap-1.5">
              <Settings className="w-3.5 h-3.5" /> Pagamento
            </TabsTrigger>
            <TabsTrigger value="partners" className="text-xs gap-1.5">
              <Award className="w-3.5 h-3.5" /> Parceiros
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users"><AdminUsersTab /></TabsContent>
          <TabsContent value="plans"><AdminPlansTab /></TabsContent>
          <TabsContent value="subscriptions"><AdminSubscriptionsTab /></TabsContent>
          <TabsContent value="payment"><AdminPaymentTab /></TabsContent>
          <TabsContent value="partners"><AdminPartnersTab /></TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminPanel;
