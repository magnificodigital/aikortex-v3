import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Users, CreditCard, BarChart3, Settings } from "lucide-react";
import AdminUsersTab from "@/components/admin/AdminUsersTab";
import AdminPlansTab from "@/components/admin/AdminPlansTab";
import AdminSubscriptionsTab from "@/components/admin/AdminSubscriptionsTab";
import AdminPaymentTab from "@/components/admin/AdminPaymentTab";

const AdminPanel = () => {
  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Painel Administrativo</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie usuários, planos, assinaturas e pagamentos</p>
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
          </TabsList>

          <TabsContent value="users"><AdminUsersTab /></TabsContent>
          <TabsContent value="plans"><AdminPlansTab /></TabsContent>
          <TabsContent value="subscriptions"><AdminSubscriptionsTab /></TabsContent>
          <TabsContent value="payment"><AdminPaymentTab /></TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminPanel;
