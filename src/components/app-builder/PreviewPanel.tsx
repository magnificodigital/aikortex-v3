import { useMemo } from "react";
import { Phone, Bot, Send, BarChart3, Settings, Users, Calendar, MessageSquare, Home, ShoppingCart, FileText, Bell, Search, Menu, Globe, Zap } from "lucide-react";
import { useAppBuilder } from "@/contexts/AppBuilderContext";

/* ── Helpers to extract dynamic data from generated files ── */

function extractGreeting(files: { content: string }[]): string {
  for (const f of files) {
    const match = f.content.match(/(?:greeting|saudação|olá|hello|bem.?vindo)[^"'`]*["'`]([^"'`]{5,80})["'`]/i);
    if (match) return match[1];
    const match2 = f.content.match(/sendMessage\([^,]+,\s*\{?\s*(?:text|body)\s*:\s*["'`]([^"'`]{5,80})["'`]/i);
    if (match2) return match2[1];
  }
  return "Olá! 👋 Como posso ajudar você hoje?";
}

function extractQuickReplies(files: { content: string }[]): string[] {
  for (const f of files) {
    const match = f.content.match(/(?:quick_replies|buttons|options|opções)\s*[=:]\s*\[([^\]]{5,200})\]/i);
    if (match) {
      const items = match[1].match(/["'`]([^"'`]+)["'`]/g);
      if (items) return items.slice(0, 4).map(s => s.replace(/["'`]/g, ""));
    }
    const match2 = f.content.match(/questions\s*=\s*\[([^\]]{5,300})\]/i);
    if (match2) {
      const items = match2[1].match(/["'`]([^"'`]+)["'`]/g);
      if (items) return items.slice(0, 3).map(s => s.replace(/["'`]/g, "").slice(0, 30));
    }
  }
  return ["Agendar", "Preços", "Horários"];
}

function extractNavItems(files: { content: string }[]): { label: string; icon: typeof BarChart3 }[] {
  const iconMap: Record<string, typeof BarChart3> = {
    dashboard: BarChart3, home: Home, cliente: Users, usuario: Users, user: Users,
    agenda: Calendar, calendar: Calendar, mensagem: MessageSquare, message: MessageSquare,
    config: Settings, setting: Settings, produto: ShoppingCart, product: ShoppingCart,
    pedido: FileText, order: FileText, notif: Bell, busca: Search, search: Search,
  };

  for (const f of files) {
    const routeMatches = f.content.match(/(?:Route|path|href|to)\s*[=:]\s*["'`]\/(\w+)["'`]/gi);
    if (routeMatches && routeMatches.length >= 2) {
      const seen = new Set<string>();
      const items: { label: string; icon: typeof BarChart3 }[] = [];
      for (const rm of routeMatches) {
        const m = rm.match(/["'`]\/(\w+)["'`]/);
        if (!m) continue;
        const name = m[1].toLowerCase();
        if (seen.has(name)) continue;
        seen.add(name);
        const iconKey = Object.keys(iconMap).find(k => name.includes(k));
        items.push({ label: name.charAt(0).toUpperCase() + name.slice(1), icon: iconMap[iconKey || ""] || Globe });
      }
      if (items.length >= 2) return items.slice(0, 6);
    }
  }

  return [
    { label: "Dashboard", icon: BarChart3 },
    { label: "Clientes", icon: Users },
    { label: "Agenda", icon: Calendar },
    { label: "Mensagens", icon: MessageSquare },
    { label: "Configurações", icon: Settings },
  ];
}

function extractMetrics(files: { content: string }[]): { label: string; value: string }[] {
  for (const f of files) {
    const match = f.content.match(/(?:title|label|nome)\s*[=:]\s*["'`]([^"'`]+)["'`]\s*[,\n]\s*(?:value|valor)\s*[=:]\s*["'`]([^"'`]+)["'`]/gi);
    if (match && match.length >= 2) {
      return match.slice(0, 4).map(m => {
        const parts = m.match(/["'`]([^"'`]+)["'`]/g) || [];
        return {
          label: (parts[0] || "").replace(/["'`]/g, ""),
          value: (parts[1] || "0").replace(/["'`]/g, ""),
        };
      });
    }
  }
  return [
    { label: "Usuários", value: "0" },
    { label: "Receita", value: "R$ 0" },
    { label: "Conversão", value: "0%" },
  ];
}

function extractBotName(files: { content: string }[], appName: string): string {
  for (const f of files) {
    const match = f.content.match(/(?:bot_name|agent_name|nome)\s*[=:]\s*["'`]([^"'`]{2,30})["'`]/i);
    if (match) return match[1];
  }
  return appName;
}

function extractStages(files: { content: string }[]): string[] {
  for (const f of files) {
    const match = f.content.match(/stages?\s*[=:]\s*\[([^\]]{5,200})\]/i);
    if (match) {
      const items = match[1].match(/["'`]([^"'`]+)["'`]/g);
      if (items) return items.map(s => s.replace(/["'`]/g, ""));
    }
  }
  return ["greeting", "qualification", "scheduling"];
}

/* ── WhatsApp Preview ── */

const WhatsAppPreview = () => {
  const { files, appName, isGenerating } = useAppBuilder();
  const hasContent = files.length > 0;

  const greeting = useMemo(() => extractGreeting(files), [files]);
  const quickReplies = useMemo(() => extractQuickReplies(files), [files]);
  const botName = useMemo(() => extractBotName(files, appName), [files, appName]);
  const stages = useMemo(() => extractStages(files), [files]);

  return (
    <div className="flex-1 flex items-center justify-center bg-muted/10 p-6">
      <div className="w-[360px] rounded-2xl border border-border bg-card shadow-2xl overflow-hidden transition-all duration-500">
        {/* Header */}
        <div className="bg-green-600 dark:bg-green-700 px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{botName}</p>
            <p className="text-[10px] text-white/70">{isGenerating ? "digitando..." : "online"}</p>
          </div>
          <Phone className="w-4 h-4 text-white ml-auto" />
        </div>

        {/* Messages */}
        <div className="bg-[#ece5dd] dark:bg-[#0b141a] p-4 space-y-3 min-h-[320px] max-h-[400px] overflow-y-auto">
          {hasContent ? (
            <>
              {/* Bot greeting */}
              <div className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                <div className="bg-white dark:bg-[#202c33] rounded-xl rounded-tl-sm px-3 py-2 max-w-[80%] shadow-sm">
                  <p className="text-xs text-foreground">{greeting}</p>
                  <p className="text-[9px] text-muted-foreground text-right mt-1">10:30</p>
                </div>
              </div>

              {/* User reply */}
              <div className="flex justify-end animate-in fade-in slide-in-from-right-2 duration-300 delay-100">
                <div className="bg-[#dcf8c6] dark:bg-[#005c4b] rounded-xl rounded-tr-sm px-3 py-2 max-w-[80%] shadow-sm">
                  <p className="text-xs text-foreground">Gostaria de saber mais</p>
                  <p className="text-[9px] text-muted-foreground text-right mt-1">10:31</p>
                </div>
              </div>

              {/* Bot follow-up with stages info */}
              <div className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-300 delay-200">
                <div className="bg-white dark:bg-[#202c33] rounded-xl rounded-tl-sm px-3 py-2 max-w-[80%] shadow-sm">
                  <p className="text-xs text-foreground">Claro! Vou te guiar pelo processo:</p>
                  {stages.slice(0, 3).map((stage, i) => (
                    <p key={stage} className="text-xs text-foreground mt-0.5">
                      {i + 1}. {stage.charAt(0).toUpperCase() + stage.slice(1)}
                    </p>
                  ))}
                  <p className="text-[9px] text-muted-foreground text-right mt-1">10:31</p>
                </div>
              </div>

              {/* Quick replies */}
              <div className="flex gap-1.5 flex-wrap animate-in fade-in duration-300 delay-300">
                {quickReplies.map((opt) => (
                  <span key={opt} className="px-3 py-1.5 rounded-full border border-green-600/30 text-[10px] font-medium text-green-700 dark:text-green-400 bg-white dark:bg-[#202c33] cursor-pointer hover:bg-green-50 dark:hover:bg-[#2a3942] transition-colors">
                    {opt}
                  </span>
                ))}
              </div>

              {/* Typing indicator when generating */}
              {isGenerating && (
                <div className="flex gap-2 animate-in fade-in duration-200">
                  <div className="bg-white dark:bg-[#202c33] rounded-xl rounded-tl-sm px-4 py-3 shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
              {isGenerating ? (
                <div className="flex flex-col items-center gap-2">
                  <Zap className="w-5 h-5 animate-pulse text-primary" />
                  <span>Gerando preview...</span>
                </div>
              ) : "Envie uma mensagem para gerar o preview"}
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="bg-[#f0f0f0] dark:bg-[#202c33] px-3 py-2 flex items-center gap-2 border-t border-border">
          <div className="flex-1 bg-white dark:bg-[#2a3942] rounded-full px-3 py-1.5 text-xs text-muted-foreground">
            Digite uma mensagem...
          </div>
          <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
            <Send className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Web Preview ── */

const WebPreview = () => {
  const { files, appName, isGenerating, dashboardMetrics } = useAppBuilder();
  const hasContent = files.length > 0;

  const navItems = useMemo(() => extractNavItems(files), [files]);
  const metrics = useMemo(() => {
    if (dashboardMetrics.length > 0) {
      return dashboardMetrics.slice(0, 4).map(m => ({ label: m.label, value: m.value, change: m.change }));
    }
    return extractMetrics(files);
  }, [files, dashboardMetrics]);

  const activeNav = navItems[0]?.label || "Dashboard";

  return (
    <div className="flex-1 flex items-center justify-center bg-muted/10 p-6">
      <div className="w-full max-w-[700px] rounded-xl border border-border bg-card shadow-2xl overflow-hidden transition-all duration-500">
        {/* Browser chrome */}
        <div className="bg-muted/50 px-3 py-2 flex items-center gap-2 border-b border-border">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 mx-8">
            <div className="bg-background rounded-md px-3 py-1 text-[10px] text-muted-foreground text-center">
              {appName.toLowerCase().replace(/\s+/g, "")}.aikortex.com
            </div>
          </div>
        </div>

        {hasContent ? (
          <div className="flex h-[380px]">
            {/* Sidebar */}
            <div className="w-[160px] border-r border-border bg-card/50 p-3 space-y-1">
              {navItems.map((item, idx) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[10px] transition-colors ${
                    idx === 0 ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"
                  }`}
                >
                  <item.icon className="w-3 h-3" />
                  {item.label}
                </div>
              ))}
            </div>

            {/* Main content */}
            <div className="flex-1 p-4 space-y-4 overflow-hidden">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">{activeNav}</h2>
                {isGenerating && (
                  <div className="flex items-center gap-1.5 text-[10px] text-primary animate-pulse">
                    <Zap className="w-3 h-3" />
                    Atualizando...
                  </div>
                )}
              </div>

              {/* Metrics grid */}
              <div className={`grid gap-2 ${metrics.length <= 3 ? "grid-cols-3" : "grid-cols-4"}`}>
                {metrics.map((m) => (
                  <div key={m.label} className="rounded-lg border border-border p-2.5 bg-card animate-in fade-in duration-300">
                    <p className="text-[9px] text-muted-foreground">{m.label}</p>
                    <p className="text-sm font-bold text-foreground">{m.value}</p>
                    {"change" in m && (
                      <span className="text-[9px] text-muted-foreground">{(m as any).change}</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Chart */}
              <div className="rounded-lg border border-border p-3 bg-card">
                <p className="text-[10px] font-medium text-foreground mb-2">Dados em tempo real</p>
                <div className="flex items-end gap-1.5 h-[80px]">
                  {[40, 65, 45, 80, 55, 90, 70, 95, 60, 85, 75, 100].map((h, i) => (
                    <div key={i} className="flex-1 bg-primary/20 rounded-sm transition-all duration-500" style={{ height: `${h}%` }}>
                      <div className="w-full bg-primary rounded-sm transition-all duration-500" style={{ height: `${Math.min(h + 10, 100)}%` }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* File count indicator */}
              <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                {files.length} arquivo(s) no projeto
              </div>
            </div>
          </div>
        ) : (
          <div className="h-[380px] flex items-center justify-center text-sm text-muted-foreground">
            {isGenerating ? (
              <div className="flex flex-col items-center gap-3">
                <Zap className="w-6 h-6 animate-pulse text-primary" />
                <span>Gerando preview...</span>
              </div>
            ) : "Envie uma mensagem para gerar o preview"}
          </div>
        )}
      </div>
    </div>
  );
};

interface PreviewPanelProps {
  channel?: "whatsapp" | "web";
}

const PreviewPanel = ({}: PreviewPanelProps) => {
  const { channel } = useAppBuilder();
  return channel === "whatsapp" ? <WhatsAppPreview /> : <WebPreview />;
};

export default PreviewPanel;
