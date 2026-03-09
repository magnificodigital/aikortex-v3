import DashboardLayout from "@/components/DashboardLayout";
import MetricCard from "@/components/MetricCard";
import ProjectRow from "@/components/ProjectRow";
import ClientCard from "@/components/ClientCard";
import { Users, FolderKanban, DollarSign, TrendingUp, Plus } from "lucide-react";

const projects = [
  { name: "Chatbot Atendimento", client: "TechCorp", status: "active" as const, progress: 72, dueDate: "15 Mar" },
  { name: "Automação de Vendas", client: "SalesUp", status: "active" as const, progress: 45, dueDate: "22 Mar" },
  { name: "Análise Preditiva", client: "DataViz", status: "completed" as const, progress: 100, dueDate: "01 Mar" },
  { name: "Assistente Virtual", client: "HealthPlus", status: "paused" as const, progress: 30, dueDate: "10 Abr" },
  { name: "Pipeline ML", client: "FinanceAI", status: "active" as const, progress: 88, dueDate: "08 Mar" },
];

const clients = [
  { name: "Carlos Mendes", company: "TechCorp", activeProjects: 2, avatarInitials: "CM" },
  { name: "Ana Beatriz", company: "SalesUp", activeProjects: 1, avatarInitials: "AB" },
  { name: "Ricardo Lima", company: "DataViz", activeProjects: 3, avatarInitials: "RL" },
  { name: "Fernanda Costa", company: "HealthPlus", activeProjects: 1, avatarInitials: "FC" },
];

const Index = () => {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Visão geral das operações da agência
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors glow-primary">
            <Plus className="w-4 h-4" />
            Novo Projeto
          </button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Clientes Ativos"
            value="24"
            change="+3 este mês"
            changeType="positive"
            icon={Users}
          />
          <MetricCard
            title="Projetos em Andamento"
            value="12"
            change="2 próximos do prazo"
            changeType="neutral"
            icon={FolderKanban}
          />
          <MetricCard
            title="Receita Mensal"
            value="R$ 87.4k"
            change="+12% vs mês anterior"
            changeType="positive"
            icon={DollarSign}
          />
          <MetricCard
            title="Taxa de Crescimento"
            value="23%"
            change="+5pp trimestral"
            changeType="positive"
            icon={TrendingUp}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Projects */}
          <div className="lg:col-span-2 glass-card rounded-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
              <h2 className="text-sm font-semibold text-foreground">Projetos Recentes</h2>
              <span className="text-xs text-muted-foreground">{projects.length} projetos</span>
            </div>
            <div className="p-2 space-y-0.5">
              {projects.map((project) => (
                <ProjectRow key={project.name} {...project} />
              ))}
            </div>
          </div>

          {/* Clients */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Clientes Destaque</h2>
              <span className="text-xs text-primary cursor-pointer hover:underline">Ver todos</span>
            </div>
            <div className="space-y-2">
              {clients.map((client) => (
                <ClientCard key={client.name} {...client} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
