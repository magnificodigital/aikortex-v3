import { BarChart3, Users, MessageSquare, TrendingUp, Clock, Phone, Monitor, ArrowUp, ArrowDown, Activity, Database } from "lucide-react";
import { useAppBuilder } from "@/contexts/AppBuilderContext";

interface DashboardPanelProps {
  channel?: "whatsapp" | "web";
}

const DashboardPanel = ({}: DashboardPanelProps) => {
  const { channel, dashboardMetrics, tables, isGenerating, appState } = useAppBuilder();

  const iconMap: Record<string, any> = { "Conversas Ativas": MessageSquare, "Leads Qualificados": Users, "Taxa de Resposta": Activity, "Tempo Médio": Clock, "Usuários Ativos": Users, "Pageviews": BarChart3, "Conversão": TrendingUp, "Bounce Rate": Activity };
  const appType = appState?.app_meta?.type || channel;
  const appName = appState?.app_meta?.name || "Meu App";
  const effectiveMetrics = dashboardMetrics.length > 0
    ? dashboardMetrics
    : appType === "whatsapp"
      ? [
          { label: "Usuários", value: "0", change: "placeholder", up: true },
          { label: "Conversas", value: "0", change: "placeholder", up: true },
          { label: "Sessões", value: "0", change: "placeholder", up: true },
        ]
      : [
          { label: "Usuários", value: "0", change: "placeholder", up: true },
          { label: "Sessões", value: "0", change: "placeholder", up: true },
          { label: "Conversões", value: "0", change: "placeholder", up: true },
        ];
  const effectiveTables = appState?.database?.tables?.length
    ? appState.database.tables.map((table) => ({
        name: table.name,
        columns: table.columns.map((column) => ({
          name: column.name,
          type: column.type,
          isPK: column.name === "id",
          required: column.required,
        })),
      }))
    : tables;

  if (!appState && dashboardMetrics.length === 0 && effectiveTables.length === 0) {
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
            {appName} · {appType === "whatsapp" ? "WhatsApp App" : "Web App"}
          </p>
        </div>
        <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
          appType === "whatsapp"
            ? "bg-primary/10 text-primary border-primary/20"
            : "bg-primary/10 text-primary border-primary/20"
        }`}>
          {appType === "whatsapp" ? <Phone className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
          {appType === "whatsapp" ? "WhatsApp" : "Web App"}
        </span>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {effectiveMetrics.map((m) => {
          const Icon = iconMap[m.label] || BarChart3;
          return (
            <div key={m.label} className="rounded-xl border border-border p-4 bg-card">
              <div className="flex items-center justify-between mb-2">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className={`flex items-center gap-0.5 text-[10px] font-medium ${m.up ? "text-primary" : "text-destructive"}`}>
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

      <div className="rounded-xl border border-border p-5 bg-card space-y-4">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Tabelas do Banco</h3>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {effectiveTables.map((t) => (
            <div key={t.name} className="rounded-lg border border-border bg-background/50 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-sm text-foreground">{t.name}</span>
                <span className="text-[10px] text-muted-foreground">{t.columns.length} colunas</span>
              </div>
              <div className="space-y-2">
                {t.columns.map((column) => (
                  <div key={`${t.name}-${column.name}`} className="rounded-md border border-border/70 px-3 py-2 text-xs bg-card">
                    <span className="font-mono text-foreground">{column.name}</span>
                    <span className="text-muted-foreground">:{String(column.type).toUpperCase()}{("required" in column && column.required) ? " • obrigatório" : ""}{column.isPK ? " • PK" : ""}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPanel;
