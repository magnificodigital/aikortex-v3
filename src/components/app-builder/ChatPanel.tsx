import { useState, useRef, useEffect, useCallback } from "react";
import {
  ArrowUp, ChevronLeft, Loader2, FileCode, Database as DbIcon,
  CheckCircle2, Circle, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { useAppBuilder } from "@/contexts/AppBuilderContext";

type Msg = { role: "user" | "assistant"; content: string };

interface ActionLog {
  label: string;
  type: "file" | "table" | "process";
  status: "pending" | "done";
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/app-chat`;

async function streamChat({
  messages, channel, onDelta, onDone,
}: { messages: Msg[]; channel: string; onDelta: (t: string) => void; onDone: () => void }) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages, channel }),
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

/* ── Parsers ── */

function parseFileBlocks(content: string): { filePath: string; code: string }[] {
  const regex = /\[FILE:(.*?)\]\n([\s\S]*?)\[\/FILE\]/g;
  const results: { filePath: string; code: string }[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    results.push({ filePath: match[1].trim(), code: match[2].trim() });
  }
  return results;
}

function parseTableBlocks(content: string): { name: string; columns: { name: string; type: string; isPK?: boolean }[] }[] {
  const regex = /\[TABLE:(\w+)\]\n([\s\S]*?)\[\/TABLE\]/g;
  const results: { name: string; columns: { name: string; type: string; isPK?: boolean }[] }[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    const name = match[1].trim();
    const lines = match[2].trim().split("\n");
    const columns = lines.map(line => {
      const parts = line.split(":");
      return { name: parts[0]?.trim() || "", type: parts[1]?.trim() || "TEXT", isPK: parts[2]?.trim() === "PK" || undefined };
    }).filter(c => c.name);
    results.push({ name, columns });
  }
  return results;
}

function parseLegacyCodeBlocks(content: string): { filePath: string; code: string }[] {
  const regex = /```(\S+)\n([\s\S]*?)```/g;
  const results: { filePath: string; code: string }[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    const lang = match[1];
    const code = match[2].trim();
    if (lang.includes(".")) {
      const ext = lang.split(".").pop() || "";
      let path = `/src/${lang}`;
      if (ext === "html") path = `/${lang}`;
      else if (lang.includes("agent") || lang.includes("qualifier") || lang.includes("scheduler")) path = `/src/agents/${lang}`;
      else if (lang.includes("api") || lang.includes("webhook")) path = `/src/integrations/${lang}`;
      else if (ext === "tsx" && lang.startsWith("use")) path = `/src/hooks/${lang}`;
      results.push({ filePath: path, code });
    }
  }
  return results;
}

function stripStructuredBlocks(content: string): string {
  return content
    .replace(/\[FILE:.*?\]\n[\s\S]*?\[\/FILE\]/g, "")
    .replace(/\[TABLE:\w+\]\n[\s\S]*?\[\/TABLE\]/g, "")
    .replace(/```\S+\n[\s\S]*?```/g, "")
    .trim();
}

/* ── Component ── */

interface ChatPanelProps {
  onBack: () => void;
  initialPrompt?: string;
}

const ChatPanel = ({ onBack, initialPrompt }: ChatPanelProps) => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const [actionsExpanded, setActionsExpanded] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentInitial = useRef(false);
  const initializedProject = useRef(false);

  const {
    channel, initializeProject, addFile, addTable, addTerminalLog,
    setIsGenerating,
  } = useAppBuilder();

  useEffect(() => {
    if (initialPrompt && !sentInitial.current) {
      sentInitial.current = true;
      if (!initializedProject.current) {
        initializedProject.current = true;
        initializeProject(channel, initialPrompt);
      }
      sendMessage(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const processAIResponse = useCallback((content: string) => {
    let fileBlocks = parseFileBlocks(content);
    if (fileBlocks.length === 0) fileBlocks = parseLegacyCodeBlocks(content);

    const newLogs: ActionLog[] = [];

    fileBlocks.forEach(({ filePath, code }) => {
      const fileName = filePath.split("/").pop() || filePath;
      addFile({ name: fileName, path: filePath, content: code });
      addTerminalLog({ text: `✓ ${filePath}`, type: "success", timestamp: Date.now() });
      newLogs.push({ label: fileName, type: "file", status: "done" });
    });

    const tableBlocks = parseTableBlocks(content);
    tableBlocks.forEach(({ name, columns }) => {
      addTable({ name, columns, rows: [] });
      addTerminalLog({ text: `✓ Tabela: ${name}`, type: "success", timestamp: Date.now() });
      newLogs.push({ label: `Tabela ${name}`, type: "table", status: "done" });
    });

    if (newLogs.length > 0) {
      setActionLogs(prev => [...prev, ...newLogs]);
    }
  }, [addFile, addTable, addTerminalLog]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    setMessages(p => [...p, userMsg]);
    setInput("");
    setIsLoading(true);
    setIsGenerating(true);

    if (!initializedProject.current) {
      initializedProject.current = true;
      initializeProject(channel, text.trim());
    }

    setActionLogs(prev => [...prev, { label: "Analisando solicitação...", type: "process", status: "pending" }]);
    addTerminalLog({ text: `$ Processando...`, type: "command", timestamp: Date.now() });

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant")
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: [...messages, userMsg],
        channel,
        onDelta: upsert,
        onDone: () => {
          setIsLoading(false);
          setIsGenerating(false);
          // Mark pending process log as done
          setActionLogs(prev => prev.map(l => l.status === "pending" ? { ...l, status: "done" as const } : l));
          processAIResponse(assistantSoFar);
          addTerminalLog({ text: "✓ Concluído", type: "success", timestamp: Date.now() });
        },
      });
    } catch {
      toast.error("Erro ao se comunicar com a IA");
      setIsLoading(false);
      setIsGenerating(false);
      setActionLogs(prev => prev.map(l => l.status === "pending" ? { ...l, status: "done" as const } : l));
      addTerminalLog({ text: "✗ Erro na comunicação", type: "error", timestamp: Date.now() });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const totalFiles = actionLogs.filter(l => l.type === "file").length;
  const totalTables = actionLogs.filter(l => l.type === "table").length;

  return (
    <div className="w-[420px] min-w-[360px] max-w-[480px] border-r border-border flex flex-col bg-background">
      {/* Header */}
      <div className="h-12 border-b border-border flex items-center px-3 gap-2 shrink-0">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onBack}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <span className="text-sm font-semibold">Studio</span>
          <span className="text-[10px] text-muted-foreground ml-2">{channel === "whatsapp" ? "WhatsApp App" : "Web App"}</span>
        </div>
      </div>

      {/* Activity bar */}
      {actionLogs.length > 0 && (
        <div className="border-b border-border">
          <button
            onClick={() => setActionsExpanded(!actionsExpanded)}
            className="flex items-center gap-2 px-4 py-2 w-full text-xs hover:bg-muted/30 transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 animate-spin text-primary" />
            ) : (
              <CheckCircle2 className="w-3 h-3 text-green-500" />
            )}
            <span className="text-muted-foreground">
              {isLoading ? "Gerando..." : "Concluído"}
            </span>
            {totalFiles > 0 && (
              <span className="flex items-center gap-1 text-primary">
                <FileCode className="w-3 h-3" />
                {totalFiles}
              </span>
            )}
            {totalTables > 0 && (
              <span className="flex items-center gap-1 text-blue-500">
                <DbIcon className="w-3 h-3" />
                {totalTables}
              </span>
            )}
            {actionsExpanded ? <ChevronUp className="w-3 h-3 ml-auto text-muted-foreground" /> : <ChevronDown className="w-3 h-3 ml-auto text-muted-foreground" />}
          </button>

          {actionsExpanded && (
            <div className="px-4 pb-2 space-y-0.5 max-h-[120px] overflow-y-auto">
              {actionLogs.slice(-10).map((log, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px] py-0.5">
                  {log.status === "pending" ? (
                    <Circle className="w-2.5 h-2.5 text-muted-foreground animate-pulse" />
                  ) : log.type === "file" ? (
                    <FileCode className="w-2.5 h-2.5 text-primary" />
                  ) : log.type === "table" ? (
                    <DbIcon className="w-2.5 h-2.5 text-blue-500" />
                  ) : (
                    <CheckCircle2 className="w-2.5 h-2.5 text-green-500" />
                  )}
                  <span className="text-muted-foreground truncate">{log.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <FileCode className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              {channel === "whatsapp" ? "Crie seu WhatsApp App" : "Crie seu Web App"}
            </p>
            <p className="text-xs text-muted-foreground max-w-[280px]">
              Descreva o que quer construir e o Studio vai gerar o código, banco de dados e preview em tempo real.
            </p>
          </div>
        )}

        {messages.map((m, i) => {
          const displayContent = m.role === "assistant" ? stripStructuredBlocks(m.content) : m.content;
          if (m.role === "assistant" && !displayContent) return null;

          return (
            <div key={i}>
              {m.role === "user" ? (
                <div className="flex justify-end">
                  <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[85%] text-sm">
                    <p className="whitespace-pre-wrap">{displayContent}</p>
                  </div>
                </div>
              ) : (
                <div className="text-sm leading-relaxed text-foreground">
                  <div className="prose prose-sm dark:prose-invert max-w-none
                    [&_p]:mb-2 [&_ul]:mb-2 [&_ol]:mb-2 [&_li]:mb-0.5
                    [&_strong]:text-foreground
                    [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm">
                    <ReactMarkdown>{displayContent}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
            <span>Construindo...</span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border">
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Descreva o que quer construir..."
            rows={1}
            className="w-full bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground px-4 py-3 min-h-[40px] max-h-[120px]"
          />
          <div className="flex items-center justify-end px-3 pb-2">
            <Button
              size="icon"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="h-8 w-8 rounded-full bg-primary hover:bg-primary/90"
            >
              <ArrowUp className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
