import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowUp, Bot, User, RefreshCw, Code2, Eye, Database, ChevronLeft, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/app-chat`;

async function streamChat({
  messages,
  onDelta,
  onDone,
}: {
  messages: Msg[];
  onDelta: (t: string) => void;
  onDone: () => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (resp.status === 429) { toast.error("Limite de requisições excedido. Tente novamente."); onDone(); return; }
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
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: [...messages, userMsg],
        onDelta: upsert,
        onDone: () => setIsLoading(false),
      });
    } catch {
      toast.error("Erro ao se comunicar com a IA");
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const tabs = [
    { id: "preview" as const, label: "Preview", icon: Eye },
    { id: "code" as const, label: "Code", icon: Code2 },
    { id: "database" as const, label: "Database", icon: Database },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Left Panel - Chat */}
      <div className="w-[520px] min-w-[400px] border-r border-border flex flex-col">
        {/* Chat Header */}
        <div className="h-12 border-b border-border flex items-center px-3 gap-2 shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/home")}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-sm font-medium">App Builder</span>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role === "assistant" && (
                <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                </div>
              )}
              <div
                className={`rounded-xl px-3.5 py-2.5 max-w-[85%] text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-foreground"
                }`}
              >
                {m.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:mb-2 [&_ul]:mb-2 [&_ol]:mb-2 [&_code]:bg-background/50 [&_code]:px-1 [&_code]:rounded [&_pre]:bg-background/80 [&_pre]:rounded-lg [&_pre]:p-3">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                )}
              </div>
              {m.role === "user" && (
                <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5 text-accent-foreground" />
                </div>
              )}
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5 text-primary animate-pulse" />
              </div>
              <div className="bg-muted/50 rounded-xl px-3.5 py-2.5">
                <span className="text-sm text-muted-foreground animate-pulse">Pensando...</span>
              </div>
            </div>
          )}
        </div>

        {/* Tools used indicator */}
        {toolsUsed > 0 && (
          <div className="px-4 py-1.5">
            <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Wrench className="w-3 h-3" />
              <span>Used tools {toolsUsed} times</span>
            </button>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-border p-3">
          <div className="rounded-xl border border-border bg-card/50 p-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask App Builder to build..."
              rows={1}
              className="w-full bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground px-3 py-2 min-h-[38px] max-h-[140px]"
            />
            <div className="flex items-center justify-between px-2 pb-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>⚡ Studio AI</span>
              </div>
              <Button
                size="icon"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className="h-8 w-8 rounded-full bg-primary hover:bg-primary/90 shrink-0"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Preview */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="h-12 border-b border-border flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
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
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 flex items-center justify-center bg-muted/20">
          {messages.length === 0 ? (
            <div className="text-center space-y-4 max-w-lg px-6">
              <h2 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                Build software<br />with AI
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Descreva seu app em linguagem natural e a IA constrói para você.<br />
                React, TypeScript e Tailwind prontos para produção em segundos.
              </p>
              <div className="flex items-center gap-2 max-w-md mx-auto mt-6">
                <div className="flex-1 flex items-center gap-2 rounded-lg border border-border bg-card/50 px-3 py-2.5">
                  <Code2 className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground">Build a modern CRM dashboard with analytics...</span>
                </div>
                <Button className="shrink-0 h-10 px-4 bg-foreground text-background hover:bg-foreground/90 rounded-lg text-sm font-medium">
                  Start Building
                </Button>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                  <Eye className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  O preview do app será exibido aqui
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
