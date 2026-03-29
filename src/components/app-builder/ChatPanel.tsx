import { useState, useRef, useEffect } from "react";
import {
  ArrowUp, Bot, ChevronDown, ChevronLeft, Mic, Wrench,
  CheckCircle2, AlertCircle, ChevronUp, FileCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { useAppBuilder } from "@/contexts/AppBuilderContext";

type Msg = { role: "user" | "assistant"; content: string };

interface ToolLog {
  label: string;
  status: "success" | "error";
}

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

/** Parse [FILE:path]...[/FILE] blocks */
function parseFileBlocks(content: string): { filePath: string; code: string }[] {
  const regex = /\[FILE:(.*?)\]\n([\s\S]*?)\[\/FILE\]/g;
  const results: { filePath: string; code: string }[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    results.push({ filePath: match[1].trim(), code: match[2].trim() });
  }
  return results;
}

/** Parse [TABLE:name]...[/TABLE] blocks */
function parseTableBlocks(content: string): { name: string; columns: { name: string; type: string; isPK?: boolean }[] }[] {
  const regex = /\[TABLE:(\w+)\]\n([\s\S]*?)\[\/TABLE\]/g;
  const results: { name: string; columns: { name: string; type: string; isPK?: boolean }[] }[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    const name = match[1].trim();
    const lines = match[2].trim().split("\n");
    const columns = lines.map(line => {
      const parts = line.split(":");
      return {
        name: parts[0]?.trim() || "",
        type: parts[1]?.trim() || "TEXT",
        isPK: parts[2]?.trim() === "PK" || undefined,
      };
    }).filter(c => c.name);
    results.push({ name, columns });
  }
  return results;
}

/** Also parse legacy ```filename.ext ... ``` blocks as fallback */
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
      else if (lang.includes("agent") || lang.includes("qualifier") || lang.includes("scheduler"))
        path = `/src/agents/${lang}`;
      else if (lang.includes("api") || lang.includes("webhook"))
        path = `/src/integrations/${lang}`;
      else if (ext === "tsx" && lang.startsWith("use"))
        path = `/src/hooks/${lang}`;
      results.push({ filePath: path, code });
    }
  }
  return results;
}

/** Strip all structured blocks from message to show clean text */
function stripStructuredBlocks(content: string): string {
  return content
    .replace(/\[FILE:.*?\]\n[\s\S]*?\[\/FILE\]/g, "")
    .replace(/\[TABLE:\w+\]\n[\s\S]*?\[\/TABLE\]/g, "")
    .replace(/```\S+\n[\s\S]*?```/g, "")
    .trim();
}

interface ChatPanelProps {
  onBack: () => void;
  initialPrompt?: string;
}

const ChatPanel = ({ onBack, initialPrompt }: ChatPanelProps) => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toolsUsed, setToolsUsed] = useState(0);
  const [toolsExpanded, setToolsExpanded] = useState(true);
  const [toolLogs, setToolLogs] = useState<ToolLog[]>([]);
  const [filesGenerated, setFilesGenerated] = useState(0);
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

  const processAIResponse = (content: string) => {
    // Parse new [FILE:...] format
    let fileBlocks = parseFileBlocks(content);
    
    // Fallback to legacy ```filename.ext``` format
    if (fileBlocks.length === 0) {
      fileBlocks = parseLegacyCodeBlocks(content);
    }

    let newFilesCount = 0;
    fileBlocks.forEach(({ filePath, code }) => {
      const fileName = filePath.split("/").pop() || filePath;
      addFile({ name: fileName, path: filePath, content: code });
      addTerminalLog({ text: `✓ ${fileName}`, type: "success", timestamp: Date.now() });
      newFilesCount++;
    });

    // Parse table blocks
    const tableBlocks = parseTableBlocks(content);
    tableBlocks.forEach(({ name, columns }) => {
      addTable({ name, columns, rows: [] });
      addTerminalLog({ text: `✓ Tabela: ${name}`, type: "success", timestamp: Date.now() });
    });

    // Legacy table detection
    if (tableBlocks.length === 0) {
      const tableRegex = /(?:tabela|table)\s+[`"]?(\w+)[`"]?/gi;
      let tableMatch;
      while ((tableMatch = tableRegex.exec(content)) !== null) {
        const tableName = tableMatch[1].toLowerCase();
        addTable({
          name: tableName,
          columns: [
            { name: "id", type: "UUID", isPK: true },
            { name: "created_at", type: "TIMESTAMP" },
          ],
          rows: [],
        });
      }
    }

    if (newFilesCount > 0) {
      setFilesGenerated(prev => prev + newFilesCount);
      setToolLogs(prev => [
        ...prev,
        { label: `${newFilesCount} arquivo(s) gerado(s)`, status: "success" },
      ]);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setIsLoading(true);
    setIsGenerating(true);
    setToolsUsed((p) => p + 1);

    if (!initializedProject.current) {
      initializedProject.current = true;
      initializeProject(channel, text.trim());
    }

    setToolLogs((prev) => [
      ...prev,
      { label: `Processando: "${text.trim().slice(0, 40)}..."`, status: "success" },
    ]);

    addTerminalLog({ text: `$ Processando...`, type: "command", timestamp: Date.now() });

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
      await streamChat({
        messages: [...messages, userMsg],
        onDelta: upsert,
        onDone: () => {
          setIsLoading(false);
          setIsGenerating(false);
          processAIResponse(assistantSoFar);
          addTerminalLog({ text: "✓ Concluído", type: "success", timestamp: Date.now() });
        },
      });
    } catch {
      toast.error("Erro ao se comunicar com a IA");
      setIsLoading(false);
      setIsGenerating(false);
      setToolLogs((prev) => [
        ...prev,
        { label: "Falha na comunicação", status: "error" },
      ]);
      addTerminalLog({ text: "✗ Erro na comunicação", type: "error", timestamp: Date.now() });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  return (
    <div className="w-[480px] min-w-[380px] max-w-[520px] border-r border-border flex flex-col bg-card/30">
      {/* Header */}
      <div className="h-11 border-b border-border flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onBack}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-semibold tracking-tight">Studio</span>
        </div>
      </div>

      {/* Tools + files indicator */}
      {toolsUsed > 0 && (
        <div className="px-4 py-2">
          <button
            onClick={() => setToolsExpanded(!toolsExpanded)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors bg-muted/40 rounded-md px-2.5 py-1.5 w-full"
          >
            <Wrench className="w-3 h-3" />
            <span>{toolsUsed} ações</span>
            {filesGenerated > 0 && (
              <span className="flex items-center gap-1 ml-2 text-primary">
                <FileCode className="w-3 h-3" />
                {filesGenerated} arquivos
              </span>
            )}
            {toolsExpanded ? (
              <ChevronUp className="w-3 h-3 ml-auto" />
            ) : (
              <ChevronDown className="w-3 h-3 ml-auto" />
            )}
          </button>
          {toolsExpanded && toolLogs.length > 0 && (
            <div className="mt-1.5 space-y-1 pl-1">
              {toolLogs.slice(-8).map((log, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[11px]">
                  {log.status === "success" ? (
                    <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
                  )}
                  <span className="text-muted-foreground truncate">{log.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages — code blocks are stripped, only clean text shown */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
        {messages.map((m, i) => {
          const displayContent = m.role === "assistant" ? stripStructuredBlocks(m.content) : m.content;
          if (m.role === "assistant" && !displayContent) return null;

          return (
            <div key={i}>
              {m.role === "user" ? (
                <div className="flex justify-end">
                  <div className="bg-muted rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[90%] text-sm">
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
          <div className="text-sm text-muted-foreground animate-pulse flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Gerando...
          </div>
        )}
      </div>

      {/* Credits */}
      <div className="px-4 py-2 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>⚡</span>
          <span>Créditos disponíveis</span>
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
            placeholder="Descreva o que quer construir..."
            rows={1}
            className="w-full bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground px-3 py-2 min-h-[36px] max-h-[120px]"
          />
          <div className="flex items-center justify-between px-2 pb-1">
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <Mic className="w-3.5 h-3.5" />
            </button>
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
  );
};

export default ChatPanel;
