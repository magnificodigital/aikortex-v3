import AdminLayout from "@/components/admin/AdminLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Users, CreditCard, BarChart3, Settings, Award, Shield, Coins, BookOpen, MessageSquare, Key } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import AdminUsersTab from "@/components/admin/AdminUsersTab";
import AdminPlansTab from "@/components/admin/AdminPlansTab";
import AdminSubscriptionsTab from "@/components/admin/AdminSubscriptionsTab";
import AdminPaymentTab from "@/components/admin/AdminPaymentTab";
import AdminPartnersTab from "@/components/admin/AdminPartnersTab";
import TierAccessManager from "@/components/admin/TierAccessManager";
import AdminCreditsTab from "@/components/admin/AdminCreditsTab";
import AdminTutorialsTab from "@/components/admin/AdminTutorialsTab";
import AdminSupportTab from "@/components/admin/AdminSupportTab";
import AdminConfigTab from "@/components/admin/AdminConfigTab";
import { useSearchParams } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const AdminPanel = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isPlatformOwner } = useAuth();
  const activeTab = searchParams.get("tab") || "users";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

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
              Gerencie todas as agências, planos e configurações da plataforma.
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
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
            <TabsTrigger value="permissions" className="text-xs gap-1.5">
              <Shield className="w-3.5 h-3.5" /> Permissões & Features
            </TabsTrigger>
            <TabsTrigger value="credits" className="text-xs gap-1.5">
              <Coins className="w-3.5 h-3.5" /> Créditos
            </TabsTrigger>
            <TabsTrigger value="tutorials" className="text-xs gap-1.5">
              <BookOpen className="w-3.5 h-3.5" /> Tutoriais
            </TabsTrigger>
            <TabsTrigger value="support" className="text-xs gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" /> Suporte
            </TabsTrigger>
            <TabsTrigger value="config" className="text-xs gap-1.5">
              <Settings className="w-3.5 h-3.5" /> Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users"><AdminUsersTab /></TabsContent>
          <TabsContent value="plans"><AdminPlansTab /></TabsContent>
          <TabsContent value="subscriptions"><AdminSubscriptionsTab /></TabsContent>
          <TabsContent value="payment"><AdminPaymentTab /></TabsContent>
          <TabsContent value="partners"><AdminPartnersTab /></TabsContent>
          <TabsContent value="permissions"><TierAccessManager /></TabsContent>
          <TabsContent value="credits"><AdminCreditsTab /></TabsContent>
          <TabsContent value="tutorials"><AdminTutorialsTab /></TabsContent>
          <TabsContent value="support"><AdminSupportTab /></TabsContent>
          <TabsContent value="config"><AdminConfigTab /></TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminPanel;
