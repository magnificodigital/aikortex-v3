import { useMemo, useState, useRef, useEffect, KeyboardEvent } from "react";
import { Phone, Bot, Send, BarChart3, Settings, Users, Calendar, MessageSquare, Home, ShoppingCart, FileText, Bell, Search, Globe, Zap, Plus, Trash2, Edit, Eye } from "lucide-react";
import { useAppBuilder } from "@/contexts/AppBuilderContext";
import { Button } from "@/components/ui/button";

/* ── Helpers ── */

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

/* ── Simulated bot responses ── */

function generateBotResponse(userMsg: string, stages: string[], greeting: string): string {
  const lower = userMsg.toLowerCase();
  if (lower.includes("preço") || lower.includes("valor") || lower.includes("custo"))
    return "Nossos planos começam a partir de R$ 99/mês. Deseja conhecer os detalhes de cada plano? 📋";
  if (lower.includes("agenda") || lower.includes("horário") || lower.includes("marcar"))
    return "Temos horários disponíveis amanhã a partir das 9h. Qual horário prefere? 🗓️";
  if (lower.includes("oi") || lower.includes("olá") || lower.includes("hello"))
    return greeting;
  if (lower.includes("obrigad"))
    return "Por nada! Estou aqui para ajudar. Precisa de mais alguma coisa? 😊";
  if (lower.includes("sim") || lower.includes("quero"))
    return "Ótimo! Vou te encaminhar para o próximo passo. Por favor, me informe seu nome completo.";
  if (lower.includes("não") || lower.includes("nao"))
    return "Sem problemas! Se precisar de algo, é só me chamar. 👋";
  return `Entendi! Posso te ajudar com: ${stages.slice(0, 3).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(", ")}. O que prefere?`;
}

/* ── Page content generators for Web preview ── */

interface TableRow { id: number; name: string; status: string; date: string }

function generatePageContent(pageName: string): { title: string; description: string; tableData: TableRow[] } {
  const pages: Record<string, { title: string; description: string; tableData: TableRow[] }> = {
    Dashboard: {
      title: "Dashboard",
      description: "Visão geral do sistema com métricas em tempo real.",
      tableData: [],
    },
    Clientes: {
      title: "Clientes",
      description: "Gerencie sua base de clientes.",
      tableData: [
        { id: 1, name: "Maria Silva", status: "Ativo", date: "2024-01-15" },
        { id: 2, name: "João Santos", status: "Ativo", date: "2024-02-20" },
        { id: 3, name: "Ana Costa", status: "Inativo", date: "2024-03-10" },
      ],
    },
    Agenda: {
      title: "Agenda",
      description: "Gerencie seus compromissos.",
      tableData: [
        { id: 1, name: "Reunião equipe", status: "Confirmado", date: "2024-03-28" },
        { id: 2, name: "Call com cliente", status: "Pendente", date: "2024-03-29" },
      ],
    },
    Mensagens: {
      title: "Mensagens",
      description: "Central de comunicação.",
      tableData: [
        { id: 1, name: "Suporte #1042", status: "Aberto", date: "2024-03-27" },
        { id: 2, name: "Feedback produto", status: "Respondido", date: "2024-03-26" },
      ],
    },
    Configurações: {
      title: "Configurações",
      description: "Ajuste as preferências do sistema.",
      tableData: [],
    },
  };
  return pages[pageName] || { title: pageName, description: `Página ${pageName}`, tableData: [] };
}

/* ── WhatsApp Preview (Interactive) ── */

interface ChatMessage {
  id: number;
  text: string;
  from: "user" | "bot";
  time: string;
}

const WhatsAppPreview = () => {
  const { files, appName, isGenerating } = useAppBuilder();
  const hasContent = files.length > 0;

  const greeting = useMemo(() => extractGreeting(files), [files]);
  const quickReplies = useMemo(() => extractQuickReplies(files), [files]);
  const botName = useMemo(() => extractBotName(files, appName), [files, appName]);
  const stages = useMemo(() => extractStages(files), [files]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [botTyping, setBotTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const msgIdRef = useRef(0);

  // Initialize with greeting when files appear
  useEffect(() => {
    if (hasContent && messages.length === 0) {
      setMessages([{
        id: ++msgIdRef.current,
        text: greeting,
        from: "bot",
        time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      }]);
    }
  }, [hasContent, greeting]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, botTyping]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const now = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    const userMsg: ChatMessage = { id: ++msgIdRef.current, text: text.trim(), from: "user", time: now };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setBotTyping(true);

    setTimeout(() => {
      const response = generateBotResponse(text, stages, greeting);
      const botMsg: ChatMessage = {
        id: ++msgIdRef.current,
        text: response,
        from: "bot",
        time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages(prev => [...prev, botMsg]);
      setBotTyping(false);
    }, 800 + Math.random() * 700);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") sendMessage(input);
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-muted/10 p-6">
      <div className="w-[360px] rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-green-600 dark:bg-green-700 px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{botName}</p>
            <p className="text-[10px] text-white/70">{botTyping || isGenerating ? "digitando..." : "online"}</p>
          </div>
          <Phone className="w-4 h-4 text-white ml-auto" />
        </div>

        {/* Messages */}
        <div className="bg-[#ece5dd] dark:bg-[#0b141a] p-4 space-y-2 h-[340px] overflow-y-auto">
          {hasContent ? (
            <>
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.from === "user" ? "justify-end" : "gap-2"} animate-in fade-in duration-200`}>
                  <div className={`rounded-xl px-3 py-2 max-w-[80%] shadow-sm ${
                    msg.from === "user"
                      ? "bg-[#dcf8c6] dark:bg-[#005c4b] rounded-tr-sm"
                      : "bg-white dark:bg-[#202c33] rounded-tl-sm"
                  }`}>
                    <p className="text-xs text-foreground whitespace-pre-wrap">{msg.text}</p>
                    <p className="text-[9px] text-muted-foreground text-right mt-1">{msg.time}</p>
                  </div>
                </div>
              ))}

              {/* Quick replies (show only at start) */}
              {messages.length <= 1 && (
                <div className="flex gap-1.5 flex-wrap">
                  {quickReplies.map((opt) => (
                    <button key={opt} onClick={() => sendMessage(opt)}
                      className="px-3 py-1.5 rounded-full border border-green-600/30 text-[10px] font-medium text-green-700 dark:text-green-400 bg-white dark:bg-[#202c33] cursor-pointer hover:bg-green-50 dark:hover:bg-[#2a3942] transition-colors">
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {botTyping && (
                <div className="flex gap-2">
                  <div className="bg-white dark:bg-[#202c33] rounded-xl rounded-tl-sm px-4 py-3 shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
              {isGenerating ? (
                <div className="flex flex-col items-center gap-2">
                  <Zap className="w-5 h-5 animate-pulse text-primary" />
                  <span>Gerando preview...</span>
                </div>
              ) : "Envie uma mensagem no Studio para gerar o preview"}
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="bg-[#f0f0f0] dark:bg-[#202c33] px-3 py-2 flex items-center gap-2 border-t border-border">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={hasContent ? "Digite uma mensagem..." : "Aguardando geração..."}
            disabled={!hasContent}
            className="flex-1 bg-white dark:bg-[#2a3942] rounded-full px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!hasContent || !input.trim()}
            className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center disabled:opacity-50 hover:bg-green-700 transition-colors"
          >
            <Send className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Web Preview (Interactive) ── */

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

  const [activePage, setActivePage] = useState<string>("Dashboard");
  const [localData, setLocalData] = useState<Record<string, TableRow[]>>({});

  // Initialize local data from page templates
  useEffect(() => {
    const data: Record<string, TableRow[]> = {};
    navItems.forEach(item => {
      const page = generatePageContent(item.label);
      if (page.tableData.length > 0) data[item.label] = page.tableData;
    });
    setLocalData(data);
  }, [navItems]);

  const pageContent = generatePageContent(activePage);
  const currentTableData = localData[activePage] || pageContent.tableData;

  const handleAddItem = () => {
    const newItem: TableRow = {
      id: Date.now(),
      name: `Novo item ${(currentTableData.length || 0) + 1}`,
      status: "Ativo",
      date: new Date().toISOString().split("T")[0],
    };
    setLocalData(prev => ({
      ...prev,
      [activePage]: [...(prev[activePage] || []), newItem],
    }));
  };

  const handleDeleteItem = (id: number) => {
    setLocalData(prev => ({
      ...prev,
      [activePage]: (prev[activePage] || []).filter(r => r.id !== id),
    }));
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-muted/10 p-6">
      <div className="w-full max-w-[750px] rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Browser chrome */}
        <div className="bg-muted/50 px-3 py-2 flex items-center gap-2 border-b border-border">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 mx-8">
            <div className="bg-background rounded-md px-3 py-1 text-[10px] text-muted-foreground text-center">
              {appName.toLowerCase().replace(/\s+/g, "")}.aikortex.com/{activePage.toLowerCase()}
            </div>
          </div>
        </div>

        {hasContent ? (
          <div className="flex h-[400px]">
            {/* Sidebar - clickable */}
            <div className="w-[160px] border-r border-border bg-card/50 p-3 space-y-1">
              <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">Menu</p>
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => setActivePage(item.label)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[10px] transition-all ${
                    activePage === item.label
                      ? "bg-primary/10 text-primary font-medium shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <item.icon className="w-3 h-3" />
                  {item.label}
                </button>
              ))}
            </div>

            {/* Main content */}
            <div className="flex-1 p-4 space-y-3 overflow-y-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">{pageContent.title}</h2>
                  <p className="text-[9px] text-muted-foreground">{pageContent.description}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {isGenerating && (
                    <div className="flex items-center gap-1 text-[9px] text-primary animate-pulse">
                      <Zap className="w-3 h-3" />
                      Atualizando...
                    </div>
                  )}
                </div>
              </div>

              {/* Dashboard view */}
              {activePage === "Dashboard" && (
                <>
                  <div className={`grid gap-2 ${metrics.length <= 3 ? "grid-cols-3" : "grid-cols-4"}`}>
                    {metrics.map((m) => (
                      <div key={m.label} className="rounded-lg border border-border p-2.5 bg-card hover:shadow-md transition-shadow cursor-default">
                        <p className="text-[9px] text-muted-foreground">{m.label}</p>
                        <p className="text-sm font-bold text-foreground">{m.value}</p>
                        {"change" in m && <span className="text-[9px] text-muted-foreground">{(m as any).change}</span>}
                      </div>
                    ))}
                  </div>

                  <div className="rounded-lg border border-border p-3 bg-card">
                    <p className="text-[10px] font-medium text-foreground mb-2">Dados em tempo real</p>
                    <div className="flex items-end gap-1.5 h-[80px]">
                      {[40, 65, 45, 80, 55, 90, 70, 95, 60, 85, 75, 100].map((h, i) => (
                        <div key={i} className="flex-1 bg-primary/20 rounded-sm" style={{ height: `${h}%` }}>
                          <div className="w-full bg-primary rounded-sm" style={{ height: `${Math.min(h + 10, 100)}%` }} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    {files.length} arquivo(s) no projeto
                  </div>
                </>
              )}

              {/* Table pages */}
              {activePage !== "Dashboard" && activePage !== "Configurações" && (
                <>
                  <div className="flex justify-end">
                    <button onClick={handleAddItem}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary text-primary-foreground text-[10px] font-medium hover:bg-primary/90 transition-colors">
                      <Plus className="w-3 h-3" /> Adicionar
                    </button>
                  </div>

                  {currentTableData.length > 0 ? (
                    <div className="rounded-lg border border-border overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-muted/30 border-b border-border">
                            <th className="text-[9px] font-medium text-muted-foreground text-left px-3 py-1.5">Nome</th>
                            <th className="text-[9px] font-medium text-muted-foreground text-left px-3 py-1.5">Status</th>
                            <th className="text-[9px] font-medium text-muted-foreground text-left px-3 py-1.5">Data</th>
                            <th className="text-[9px] font-medium text-muted-foreground text-right px-3 py-1.5">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentTableData.map(row => (
                            <tr key={row.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                              <td className="text-[10px] text-foreground px-3 py-2">{row.name}</td>
                              <td className="px-3 py-2">
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                                  row.status === "Ativo" || row.status === "Confirmado" || row.status === "Respondido"
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                    : row.status === "Pendente" || row.status === "Aberto"
                                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                    : "bg-muted text-muted-foreground"
                                }`}>{row.status}</span>
                              </td>
                              <td className="text-[10px] text-muted-foreground px-3 py-2">{row.date}</td>
                              <td className="px-3 py-2 text-right">
                                <button className="p-1 hover:bg-muted rounded transition-colors" title="Ver">
                                  <Eye className="w-3 h-3 text-muted-foreground" />
                                </button>
                                <button onClick={() => handleDeleteItem(row.id)} className="p-1 hover:bg-destructive/10 rounded transition-colors" title="Excluir">
                                  <Trash2 className="w-3 h-3 text-destructive" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-[10px] text-muted-foreground">
                      Nenhum item. Clique em "Adicionar" para criar.
                    </div>
                  )}
                </>
              )}

              {/* Settings page */}
              {activePage === "Configurações" && (
                <div className="space-y-3">
                  {[
                    { label: "Nome do App", value: appName },
                    { label: "Notificações", value: "Ativadas" },
                    { label: "Tema", value: "Automático" },
                    { label: "Idioma", value: "Português (BR)" },
                  ].map(setting => (
                    <div key={setting.label} className="flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-card">
                      <span className="text-[10px] text-foreground">{setting.label}</span>
                      <span className="text-[10px] text-muted-foreground">{setting.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-[400px] flex items-center justify-center text-sm text-muted-foreground">
            {isGenerating ? (
              <div className="flex flex-col items-center gap-3">
                <Zap className="w-6 h-6 animate-pulse text-primary" />
                <span>Gerando preview...</span>
              </div>
            ) : "Envie uma mensagem no Studio para gerar o preview"}
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
