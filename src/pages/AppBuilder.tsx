import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowUp, Bot, User, RefreshCw, Code2, Eye, Database,
  ChevronLeft, Wrench, ChevronDown, Mic, ExternalLink, RotateCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/app-chat`;

async function streamChat({
  messages, onDelta, onDone,
}: { messages: Msg[]; onDelta: (t: string) => void; onDone: () => void }) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages }),
  });
  if (resp.status === 429) { toast.error("Limite de requisições excedido."); onDone(); return; }
  if (resp.status === 402) { toast.error("Créditos insuficientes."); onDone(); return; }
  if (!resp.ok || !resp.body) throw new Error("Falha ao conectar com IA");

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let done = false;
  while (!done) {
    const { done: d, value } = await reader.read();
    if (d) break;
    buf += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { done = true; break; }
      try {
        const c = JSON.parse(json).choices?.[0]?.delta?.content;
        if (c) onDelta(c);
      } catch { buf = line + "\n" + buf; break; }
    }
  }
  onDone();
}

const AppBuilder = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialPrompt = (location.state as any)?.initialPrompt || "";
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "code" | "database">("preview");
  const [toolsUsed, setToolsUsed] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentInitial = useRef(false);

  useEffect(() => {
    if (initialPrompt && !sentInitial.current) {
      sentInitial.current = true;
      sendMessage(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setIsLoading(true);
    setToolsUsed((p) => p + 1);

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant")
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamChat({ messages: [...messages, userMsg], onDelta: upsert, onDone: () => setIsLoading(false) });
    } catch {
      toast.error("Erro ao se comunicar com a IA");
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const tabs = [
    { id: "preview" as const, label: "Visualizar", icon: Eye },
    { id: "code" as const, label: "Código", icon: Code2 },
    { id: "database" as const, label: "Banco de Dados", icon: Database },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* ========== LEFT PANEL — CHAT ========== */}
      <div className="w-[520px] min-w-[380px] max-w-[520px] border-r border-border flex flex-col bg-background">
        {/* Header — project name row */}
        <div className="h-11 border-b border-border flex items-center justify-between px-3 shrink-0">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate("/home")}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-semibold tracking-tight">Studio AI</span>
          </div>
        </div>

        {/* Avatar + name */}
        <div className="px-4 pt-4 pb-2 flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">S</div>
          <span className="text-sm font-medium">Studio</span>
        </div>

        {/* Tools used collapsible */}
        {toolsUsed > 0 && (
          <div className="px-4 pb-2">
            <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors bg-muted/40 rounded-md px-2.5 py-1.5 w-full">
              <Wrench className="w-3 h-3" />
              <span>Usou ferramentas {toolsUsed} vezes</span>
              <ChevronDown className="w-3 h-3 ml-auto" />
            </button>
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
          {messages.map((m, i) => (
            <div key={i}>
              {m.role === "user" ? (
                <div className="flex justify-end">
                  <div className="bg-muted rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[90%] text-sm">
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              ) : (
                <div className="text-sm leading-relaxed text-foreground">
                  <div className="prose prose-sm dark:prose-invert max-w-none
                    [&_p]:mb-2.5 [&_ul]:mb-2 [&_ol]:mb-2 [&_li]:mb-0.5
                    [&_strong]:text-foreground
                    [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono
                    [&_pre]:bg-muted [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:text-xs
                    [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="text-sm text-muted-foreground animate-pulse flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Pensando...
            </div>
          )}
        </div>

        {/* Credits bar */}
        <div className="px-4 py-2 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>⚡</span>
            <span>Créditos gratuitos disponíveis</span>
          </div>
          <Button variant="default" size="sm" className="h-7 text-xs rounded-full px-3 bg-primary hover:bg-primary/90">
            Upgrade
          </Button>
        </div>

        {/* Input */}
        <div className="p-3 border-t border-border">
          <div className="rounded-xl border border-border bg-card p-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Peça ao Studio para construir..."
              rows={1}
              className="w-full bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground px-3 py-2 min-h-[36px] max-h-[120px]"
            />
            <div className="flex items-center justify-between px-2 pb-1">
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Bot className="w-3.5 h-3.5" />
                  <span>Agente</span>
                </button>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <Mic className="w-3.5 h-3.5" />
                </button>
              </div>
              <Button
                size="icon"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className="h-8 w-8 rounded-full bg-primary hover:bg-primary/90"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ========== RIGHT PANEL — PREVIEW ========== */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        {/* Top toolbar */}
        <div className="h-11 border-b border-border flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <RotateCw className="w-3.5 h-3.5" />
            </Button>
            <span className="text-xs text-muted-foreground">/</span>
          </div>

          {/* Center tabs */}
          <div className="flex items-center gap-0.5 bg-muted/50 rounded-lg p-0.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex items-center justify-center">
          {messages.length === 0 ? (
            <div className="text-center space-y-6 max-w-2xl px-8">
              {/* Announcement pill */}
              <div className="flex justify-center">
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-xs text-primary font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  NOVO: Studio AI — Construa mais rápido do que nunca
                </span>
              </div>

              {/* Hero headline */}
              <h1 className="text-5xl lg:text-6xl font-bold text-foreground leading-[1.1] tracking-tight">
                Construa software<br />com IA
              </h1>

              {/* Sub */}
              <p className="text-base text-muted-foreground leading-relaxed max-w-lg mx-auto">
                Descreva seu app em linguagem natural e o Studio constrói para você.
                React, TypeScript e Tailwind prontos para produção em segundos.
              </p>

              {/* Fake input + CTA */}
              <div className="flex items-center gap-2 max-w-lg mx-auto mt-4">
                <div className="flex-1 flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3">
                  <Code2 className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground">Crie um dashboard moderno de CRM com analytics...</span>
                </div>
                <Button
                  onClick={() => {
                    setInput("Crie um dashboard moderno de CRM com analytics");
                  }}
                  className="shrink-0 h-12 px-6 bg-foreground text-background hover:bg-foreground/90 rounded-xl text-sm font-semibold"
                >
                  Começar a Criar
                </Button>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted/10">
              <div className="text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <Eye className="w-7 h-7 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  A visualização do app será exibida aqui
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppBuilder;
