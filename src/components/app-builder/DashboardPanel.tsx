import { BarChart3, Users, MessageSquare, TrendingUp, Clock, Phone, Monitor, ArrowUp, ArrowDown, Activity } from "lucide-react";
import { useAppBuilder } from "@/contexts/AppBuilderContext";

interface DashboardPanelProps {
  channel?: "whatsapp" | "web";
}

const DashboardPanel = ({}: DashboardPanelProps) => {
  const { channel, dashboardMetrics, tables, files, isGenerating } = useAppBuilder();

  const iconMap: Record<string, any> = { "Conversas Ativas": MessageSquare, "Leads Qualificados": Users, "Taxa de Resposta": Activity, "Tempo Médio": Clock, "Usuários Ativos": Users, "Pageviews": BarChart3, "Conversão": TrendingUp, "Bounce Rate": Activity };

  if (dashboardMetrics.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        {isGenerating ? (
          <div className="flex items-center gap-2 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            {channel === "whatsapp" ? "Gerando dashboard de conversas..." : "Gerando dashboard do app..."}
          </div>
        ) : (
          channel === "whatsapp"
            ? "Envie uma mensagem no Studio para gerar o dashboard de conversas"
            : "Envie uma mensagem no Studio para gerar o dashboard do app"
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Painel de Gestão</h2>
          <p className="text-xs text-muted-foreground">
            {channel === "whatsapp" ? "WhatsApp App" : "Web App"} — Gerado automaticamente
          </p>
        </div>
        <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
          channel === "whatsapp"
            ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
            : "bg-primary/10 text-primary border-primary/20"
        }`}>
          {channel === "whatsapp" ? <Phone className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
          {channel === "whatsapp" ? "WhatsApp" : "Web App"}
        </span>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4">
        {dashboardMetrics.map((m) => {
          const Icon = iconMap[m.label] || BarChart3;
          return (
            <div key={m.label} className="rounded-xl border border-border p-4 bg-card">
              <div className="flex items-center justify-between mb-2">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className={`flex items-center gap-0.5 text-[10px] font-medium ${m.up ? "text-green-500" : "text-red-500"}`}>
                  {m.up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                  {m.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-foreground">{m.value}</p>
              <p className="text-[11px] text-muted-foreground">{m.label}</p>
            </div>
          );
        })}
      </div>

      {/* Project summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-border p-5 bg-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Arquivos do Projeto</h3>
          <div className="space-y-2">
            {files.slice(0, 6).map((f) => (
              <div key={f.name} className="flex items-center justify-between text-xs">
                <span className="font-mono text-foreground">{f.name}</span>
                <span className="text-muted-foreground">{f.content.split("\n").length} linhas</span>
              </div>
            ))}
            {files.length > 6 && <p className="text-[10px] text-muted-foreground">+{files.length - 6} mais</p>}
          </div>
        </div>

        <div className="rounded-xl border border-border p-5 bg-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Tabelas do Banco</h3>
          <div className="space-y-2">
            {tables.map((t) => (
              <div key={t.name} className="flex items-center justify-between text-xs">
                <span className="font-mono text-foreground">{t.name}</span>
                <span className="text-muted-foreground">{t.columns.length} colunas</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPanel;
