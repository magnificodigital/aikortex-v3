import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Bot, AppWindow, Workflow, Search, Star, ArrowRight } from "lucide-react";

import avatar1 from "@/assets/avatars/avatar-1.png";
import avatar2 from "@/assets/avatars/avatar-2.png";
import avatar3 from "@/assets/avatars/avatar-3.png";
import avatar8 from "@/assets/avatars/avatar-8.png";

const agentTemplates = [
  { id: "sdr", name: "Agente SDR", description: "Qualifica leads inbound, responde em segundos e agenda reuniões 24/7.", avatar: avatar1, tags: ["Vendas", "Inbound"] },
  { id: "bdr", name: "Agente BDR", description: "Prospecta leads outbound e gera oportunidades via abordagem personalizada.", avatar: avatar2, tags: ["Vendas", "Outbound"] },
  { id: "sac", name: "Agente SAC", description: "Atende clientes automaticamente e resolve dúvidas com suporte inteligente.", avatar: avatar3, tags: ["Suporte", "Atendimento"] },
  { id: "social", name: "Social Media Manager", description: "Planeja conteúdo, escreve na sua voz e acompanha métricas.", avatar: avatar8, tags: ["Marketing", "Social"] },
  { id: "onboarding", name: "Agente de Onboarding", description: "Guia novos clientes no processo de ativação do produto.", avatar: avatar1, tags: ["CS", "Onboarding"] },
  { id: "cobranca", name: "Agente de Cobranças", description: "Automatiza lembretes de pagamento e negociação de dívidas.", avatar: avatar2, tags: ["Financeiro", "Cobrança"] },
];

const appTemplates = [
  { id: "form-builder", name: "Construtor de Formulários", description: "Crie formulários dinâmicos com validação e lógica condicional.", icon: "📝", tags: ["Produtividade"] },
  { id: "sales-dash", name: "Dashboard de Vendas", description: "Painel completo com métricas de vendas, funil e performance.", icon: "📊", tags: ["Vendas", "Analytics"] },
  { id: "landing", name: "Landing Page", description: "Página de captura otimizada para conversão com formulário.", icon: "🚀", tags: ["Marketing"] },
  { id: "ecommerce", name: "E-commerce Simples", description: "Loja virtual com catálogo, carrinho e checkout integrado.", icon: "🛒", tags: ["Vendas", "E-commerce"] },
  { id: "portal", name: "Portal de Clientes", description: "Área do cliente com tickets, documentos e histórico.", icon: "👤", tags: ["Suporte", "Portal"] },
  { id: "blog", name: "Blog com IA", description: "Blog com geração automática de conteúdo via inteligência artificial.", icon: "✍️", tags: ["Marketing", "IA"] },
];

const flowTemplates = [
  { id: "onboarding-flow", name: "Fluxo de Onboarding", description: "Sequência automatizada de boas-vindas para novos clientes.", icon: "🎯", tags: ["CS", "Automação"] },
  { id: "email-nurture", name: "Nutrição de Leads", description: "Cadência de e-mails inteligente para qualificação de leads.", icon: "📧", tags: ["Marketing", "E-mail"] },
  { id: "sales-pipeline", name: "Pipeline de Vendas", description: "Automação completa do funil de vendas com alertas.", icon: "💰", tags: ["Vendas", "Pipeline"] },
  { id: "post-sale", name: "Fluxo Pós-Compra", description: "Acompanhamento automático após fechamento do negócio.", icon: "✅", tags: ["CS", "Pós-venda"] },
  { id: "approval", name: "Workflow de Aprovação", description: "Fluxo de aprovação multinível para orçamentos e propostas.", icon: "📋", tags: ["Gestão", "Aprovação"] },
  { id: "followup", name: "Sequência Follow-up", description: "Cadência de follow-up inteligente para leads frios.", icon: "🔄", tags: ["Vendas", "Follow-up"] },
];

const Templates = () => {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filterBySearch = <T extends { name: string; description: string }>(items: T[]) =>
    items.filter((i) => `${i.name} ${i.description}`.toLowerCase().includes(search.toLowerCase()));

  const handleUseAgent = (id: string) => {
    navigate("/aikortex/agents", { state: { templateId: id } });
  };

  const handleUseApp = (id: string) => {
    navigate("/app-builder", { state: { templateId: id } });
  };

  const handleUseFlow = (id: string) => {
    navigate("/aikortex/automations", { state: { templateId: id } });
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">Templates</h1>
          <p className="text-sm text-muted-foreground">
            Comece rapidamente com templates pré-configurados para agentes, apps e fluxos.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="agentes" className="space-y-6">
          <TabsList className="bg-muted">
            <TabsTrigger value="agentes" className="gap-2">
              <Bot className="w-4 h-4" /> Agentes
            </TabsTrigger>
            <TabsTrigger value="apps" className="gap-2">
              <AppWindow className="w-4 h-4" /> Apps
            </TabsTrigger>
            <TabsTrigger value="flows" className="gap-2">
              <Workflow className="w-4 h-4" /> Flows
            </TabsTrigger>
          </TabsList>

          {/* Agentes */}
          <TabsContent value="agentes">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterBySearch(agentTemplates).map((t) => (
                <div
                  key={t.id}
                  className="group rounded-xl border border-border bg-card p-5 space-y-4 hover:border-primary/40 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <img src={t.avatar} alt={t.name} className="w-11 h-11 rounded-full object-cover" />
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-foreground">{t.name}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-1 line-clamp-2">{t.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1.5">
                      {t.tags.map((tag) => (
                        <span key={tag} className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{tag}</span>
                      ))}
                    </div>
                    <button
                      onClick={() => handleUseAgent(t.id)}
                      className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Usar <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Apps */}
          <TabsContent value="apps">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterBySearch(appTemplates).map((t) => (
                <div
                  key={t.id}
                  className="group rounded-xl border border-border bg-card p-5 space-y-4 hover:border-primary/40 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-lg bg-muted flex items-center justify-center text-xl">{t.icon}</div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-foreground">{t.name}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-1 line-clamp-2">{t.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1.5">
                      {t.tags.map((tag) => (
                        <span key={tag} className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{tag}</span>
                      ))}
                    </div>
                    <button
                      onClick={() => handleUseApp(t.id)}
                      className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Usar <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Flows */}
          <TabsContent value="flows">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterBySearch(flowTemplates).map((t) => (
                <div
                  key={t.id}
                  className="group rounded-xl border border-border bg-card p-5 space-y-4 hover:border-primary/40 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-lg bg-muted flex items-center justify-center text-xl">{t.icon}</div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-foreground">{t.name}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-1 line-clamp-2">{t.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1.5">
                      {t.tags.map((tag) => (
                        <span key={tag} className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{tag}</span>
                      ))}
                    </div>
                    <button
                      onClick={() => handleUseFlow(t.id)}
                      className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Usar <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Templates;
