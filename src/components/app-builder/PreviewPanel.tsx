import { useMemo, useState } from "react";
import { Phone, Bot, Send, BarChart3, Settings, Users, Calendar, MessageSquare, Home, ShoppingCart, FileText, Bell, Search, Globe, Zap, Monitor, Smartphone, List, Image, ArrowRight } from "lucide-react";
import { useAppBuilder } from "@/contexts/AppBuilderContext";

/* ── Helpers ── */

function extractGreeting(files: { content: string }[]): string {
  for (const f of files) {
    // Only match explicit key-value assignments like greeting_message = "..."
    const match = f.content.match(/(?:greeting_message|saudacao|welcome_message|greeting_text)\s*[=:]\s*["'`]([^"'`]{5,120})["'`]/i);
    if (match) return match[1];
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
  }
  return ["Agendar", "Preços", "Suporte"];
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
  return ["Saudação", "Qualificação", "Agendamento"];
}

/* ── WhatsApp Preview ── */

const MOCK_BOT_RESPONSES: Record<string, string> = {
  default: "Entendi! Posso te ajudar com isso. O que mais gostaria de saber?",
  oi: "Olá! Que bom ter você aqui! Como posso ajudar?",
  olá: "Oi! Tudo bem? Me conta como posso te ajudar 😊",
  preço: "Nossos planos são bem flexíveis! Posso agendar uma conversa com nosso especialista para encontrar o melhor para você.",
  agendar: "Claro! Vou verificar os horários disponíveis. Qual dia seria melhor para você?",
  suporte: "Sem problemas! Me descreva o que está acontecendo e vou te ajudar a resolver.",
  funciona: "É super simples! Nosso sistema é intuitivo e fácil de usar. Quer que eu te mostre o passo a passo?",
};

function getBotResponse(userMsg: string): string {
  const lower = userMsg.toLowerCase();
  const key = Object.keys(MOCK_BOT_RESPONSES).find(k => k !== "default" && lower.includes(k));
  return MOCK_BOT_RESPONSES[key || "default"];
}

const WhatsAppPreview = () => {
  const { files, appName, isGenerating } = useAppBuilder();
  const hasContent = files.length > 0;

  const greeting = useMemo(() => extractGreeting(files), [files]);
  const quickReplies = useMemo(() => extractQuickReplies(files), [files]);
  const botName = useMemo(() => extractBotName(files, appName), [files, appName]);
  const stages = useMemo(() => extractStages(files), [files]);

  const [chatMessages, setChatMessages] = useState<{ role: "user" | "bot"; text: string; time: string }[]>([]);
  const [testInput, setTestInput] = useState("");
  const [botTyping, setBotTyping] = useState(false);

  const now = () => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  const handleSendTest = (text?: string) => {
    const msg = (text || testInput).trim();
    if (!msg) return;
    setTestInput("");
    setChatMessages(prev => [...prev, { role: "user", text: msg, time: now() }]);
    setBotTyping(true);
    setTimeout(() => {
      setBotTyping(false);
      setChatMessages(prev => [...prev, { role: "bot", text: getBotResponse(msg), time: now() }]);
    }, 800 + Math.random() * 600);
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-muted/5 p-8">
      <div className="relative">
        <div className="w-[380px] rounded-[2.5rem] border-[3px] border-muted/30 bg-card shadow-2xl overflow-hidden">
          <div className="h-7 bg-[#075e54] dark:bg-[#1f2c34] flex items-center justify-center">
            <div className="w-20 h-4 rounded-full bg-black/20" />
          </div>

          <div className="bg-[#075e54] dark:bg-[#1f2c34] px-4 py-2.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">{botName}</p>
              <p className="text-[10px] text-white/60">{isGenerating || botTyping ? "digitando..." : "online"}</p>
            </div>
            <Phone className="w-4 h-4 text-white/70" />
          </div>

          <div className="bg-[#ece5dd] dark:bg-[#0b141a] p-4 space-y-3 min-h-[400px] max-h-[460px] overflow-y-auto">
            {hasContent ? (
              <>
                {/* Initial greeting */}
                <div className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                  <div className="bg-white dark:bg-[#202c33] rounded-xl rounded-tl-sm px-3 py-2 max-w-[80%] shadow-sm">
                    <p className="text-xs text-foreground">{greeting}</p>
                    <p className="text-[9px] text-muted-foreground text-right mt-1">10:30</p>
                  </div>
                </div>

                {/* Quick reply buttons */}
                {chatMessages.length === 0 && (
                  <div className="flex gap-1.5 flex-wrap animate-in fade-in duration-300 delay-300">
                    {quickReplies.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => handleSendTest(opt)}
                        className="px-3 py-1.5 rounded-full border border-green-600/30 text-[10px] font-medium text-green-700 dark:text-green-400 bg-white dark:bg-[#202c33] shadow-sm cursor-pointer hover:bg-green-50 dark:hover:bg-[#2a3942] transition-colors"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {/* User test messages */}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "gap-2"} animate-in fade-in duration-200`}>
                    <div className={`rounded-xl px-3 py-2 max-w-[80%] shadow-sm ${
                      msg.role === "user"
                        ? "bg-[#dcf8c6] dark:bg-[#005c4b] rounded-tr-sm"
                        : "bg-white dark:bg-[#202c33] rounded-tl-sm"
                    }`}>
                      <p className="text-xs text-foreground">{msg.text}</p>
                      <p className="text-[9px] text-muted-foreground text-right mt-1">{msg.time}</p>
                    </div>
                  </div>
                ))}

                {(isGenerating || botTyping) && (
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
              <div className="flex items-center justify-center h-full min-h-[300px] text-xs text-muted-foreground">
                {isGenerating ? (
                  <div className="flex flex-col items-center gap-3">
                    <Zap className="w-6 h-6 animate-pulse text-green-500" />
                    <span>Gerando preview...</span>
                  </div>
                ) : (
                  <div className="text-center">
                    <Smartphone className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                    <p>Envie uma mensagem no Studio<br/>para ver o preview aqui</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Interactive input bar */}
          <div className="bg-[#f0f0f0] dark:bg-[#202c33] px-3 py-2.5 flex items-center gap-2 border-t border-border/30">
            <input
              type="text"
              value={testInput}
              onChange={e => setTestInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSendTest()}
              placeholder="Teste seu agente..."
              className="flex-1 bg-white dark:bg-[#2a3942] rounded-full px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none"
            />
            <button
              onClick={() => handleSendTest()}
              disabled={!testInput.trim() || botTyping}
              className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center shadow-sm hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </div>

          <div className="h-5 bg-[#f0f0f0] dark:bg-[#202c33] flex items-center justify-center">
            <div className="w-24 h-1 rounded-full bg-muted-foreground/20" />
          </div>
        </div>

        {hasContent && (
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-card border border-border rounded-full px-3 py-1 shadow-lg">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              {files.length} arquivo(s) • {stages.length} etapas
            </span>
          </div>
        )}
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
    <div className="flex-1 flex items-center justify-center bg-muted/5 p-8">
      <div className="w-full max-w-[820px] rounded-xl border border-border bg-card shadow-2xl overflow-hidden transition-all duration-500">
        {/* Browser chrome */}
        <div className="bg-muted/40 px-3 py-2 flex items-center gap-2 border-b border-border">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
          </div>
          <div className="flex-1 mx-8">
            <div className="bg-background rounded-md px-3 py-1 text-[10px] text-muted-foreground text-center border border-border/50">
              🔒 {appName.toLowerCase().replace(/\s+/g, "")}.aikortex.com
            </div>
          </div>
        </div>

        {hasContent ? (
          <div className="flex h-[440px]">
            {/* Sidebar */}
            <div className="w-[170px] border-r border-border bg-card/80 p-3 space-y-1">
              <div className="px-2 py-2 mb-2">
                <p className="text-xs font-semibold text-foreground">{appName}</p>
                <p className="text-[9px] text-muted-foreground">Painel de Gestão</p>
              </div>
              {navItems.map((item, idx) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11px] transition-colors ${
                    idx === 0 ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted/30"
                  }`}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                </div>
              ))}
            </div>

            {/* Main content */}
            <div className="flex-1 p-5 space-y-4 overflow-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">{activeNav}</h2>
                  <p className="text-[10px] text-muted-foreground">Visão geral do sistema</p>
                </div>
                {isGenerating && (
                  <div className="flex items-center gap-1.5 text-[10px] text-primary animate-pulse">
                    <Zap className="w-3 h-3" />
                    Atualizando...
                  </div>
                )}
              </div>

              {/* Metrics */}
              <div className={`grid gap-3 ${metrics.length <= 3 ? "grid-cols-3" : "grid-cols-4"}`}>
                {metrics.map((m) => (
                  <div key={m.label} className="rounded-xl border border-border p-3 bg-card/50 animate-in fade-in duration-300">
                    <p className="text-[9px] text-muted-foreground mb-0.5">{m.label}</p>
                    <p className="text-base font-bold text-foreground">{m.value}</p>
                    {"change" in m && m.change && (
                      <span className="text-[9px] text-muted-foreground">{(m as any).change}</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Chart */}
              <div className="rounded-xl border border-border p-4 bg-card/50">
                <p className="text-[10px] font-medium text-foreground mb-3">Atividade recente</p>
                <div className="flex items-end gap-1.5 h-[90px]">
                  {[40, 65, 45, 80, 55, 90, 70, 95, 60, 85, 75, 100].map((h, i) => (
                    <div key={i} className="flex-1 rounded-sm transition-all duration-500 overflow-hidden" style={{ height: `${h}%` }}>
                      <div className="w-full h-full bg-gradient-to-t from-primary/60 to-primary/20 rounded-sm" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Table preview */}
              <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
                  <p className="text-[10px] font-medium text-foreground">Registros recentes</p>
                  <Search className="w-3 h-3 text-muted-foreground" />
                </div>
                <div className="px-4 py-3 space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-muted/50" />
                      <div className="flex-1">
                        <div className="h-2.5 bg-muted/40 rounded w-24" />
                        <div className="h-2 bg-muted/20 rounded w-16 mt-1" />
                      </div>
                      <div className="h-2 bg-muted/30 rounded w-12" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-[440px] flex items-center justify-center text-sm text-muted-foreground">
            {isGenerating ? (
              <div className="flex flex-col items-center gap-3">
                <Zap className="w-6 h-6 animate-pulse text-primary" />
                <span>Gerando preview...</span>
              </div>
            ) : (
              <div className="text-center">
                <Monitor className="w-10 h-10 mx-auto mb-3 text-muted-foreground/20" />
                <p className="text-xs">Envie uma mensagem no Studio<br/>para ver o preview aqui</p>
              </div>
            )}
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
