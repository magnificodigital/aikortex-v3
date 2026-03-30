import { useState, useRef, useEffect, useCallback } from "react";
import {
  ArrowUp, Bot, ChevronDown, ChevronLeft, Mic, Wrench,
  CheckCircle2, AlertCircle, ChevronUp, FileCode, Sparkles,
  Phone, Monitor, Check, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { useAppBuilder, type ChatMessage } from "@/contexts/AppBuilderContext";

type Msg = { role: "user" | "assistant"; content: string };

interface ToolLog {
  label: string;
  status: "success" | "error";
}

type WizardStep = "describe" | "personalize" | "calibrate" | "create" | "done";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/app-chat`;

const stepLabels: { id: WizardStep; label: string; num: number }[] = [
  { id: "describe", label: "Descrever", num: 1 },
  { id: "personalize", label: "Personalizar", num: 2 },
  { id: "calibrate", label: "Calibrar", num: 3 },
  { id: "create", label: "Criar", num: 4 },
];

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

function stripStructuredBlocks(content: string): string {
  return content
    .replace(/\[FILE:.*?\]\n[\s\S]*?\[\/FILE\]/g, "")
    .replace(/\[TABLE:\w+\]\n[\s\S]*?\[\/TABLE\]/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\[METRIC:.*?\]\n[\s\S]*?\[\/METRIC\]/g, "")
    .trim();
}

/* ── Streaming ── */

async function streamChat({
  messages, onDelta, onDone, appContext,
}: { messages: Msg[]; onDelta: (t: string) => void; onDone: () => void; appContext?: Record<string, string> }) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages, appContext }),
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

/* ── Calibration ── */

interface CalibrationMsg { type: "client" | "agent"; text: string }
interface CalibrationEvent {
  kind: "status" | "messages" | "result";
  label?: string;
  done?: boolean;
  messages?: CalibrationMsg[];
  success?: boolean;
}

/* ── Component ── */

interface ChatPanelProps {
  onBack: () => void;
  initialPrompt?: string;
}

const ChatPanel = ({ onBack, initialPrompt }: ChatPanelProps) => {
  const {
    channel, initializeProject, addFile, addTable, addTerminalLog,
    setIsGenerating, setAppName, setWizardConfig,
    chatMessages, setChatMessages,
    wizardStep: ctxWizardStep, setWizardStep: setCtxWizardStep,
    wizardData: ctxWizardData, setWizardData: setCtxWizardData,
  } = useAppBuilder();

  const messagesRef = useRef(chatMessages);
  messagesRef.current = chatMessages;
  const setMessages = useCallback((update: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    if (typeof update === "function") {
      setChatMessages(update(messagesRef.current));
    } else {
      setChatMessages(update);
    }
  }, [setChatMessages]);
  const messages = chatMessages;

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toolsUsed, setToolsUsed] = useState(0);
  const [toolsExpanded, setToolsExpanded] = useState(true);
  const [toolLogs, setToolLogs] = useState<ToolLog[]>([]);
  const [filesGenerated, setFilesGenerated] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentInitial = useRef(false);
  const initializedProject = useRef(false);
  const processedBlocksRef = useRef(new Set<string>());

  // Wizard state — synced with context
  const wizardStep = ctxWizardStep;
  const setWizardStep = setCtxWizardStep;
  const wizardData = ctxWizardData;
  const setWizardData = (updater: ((prev: typeof ctxWizardData) => typeof ctxWizardData) | typeof ctxWizardData) => {
    if (typeof updater === "function") {
      setCtxWizardData(updater(ctxWizardData));
    } else {
      setCtxWizardData(updater);
    }
  };
  const [calibrating, setCalibrating] = useState(false);
  const [calibrationEvents, setCalibrationEvents] = useState<CalibrationEvent[]>([]);
  const [calibrationDone, setCalibrationDone] = useState(false);
  const [creating, setCreating] = useState(false);


  // If loading existing app that already went through wizard, mark as initialized
  useEffect(() => {
    if (ctxWizardStep === "done" && chatMessages.length > 0) {
      initializedProject.current = true;
      sentInitial.current = true;
    }
  }, []);

  // If initialPrompt is provided, skip directly to describe step completion
  useEffect(() => {
    if (initialPrompt && !sentInitial.current) {
      sentInitial.current = true;
      // Auto-fill step 1 and move to personalize
      setWizardData(prev => ({
        ...prev,
        prompt: initialPrompt,
        appName: "Meu App",
        introMessage: "Olá! Como posso ajudar você hoje?",
      }));
      setWizardStep("personalize");
      // Add system message about the description
      setMessages([
        { role: "user", content: initialPrompt },
        { role: "assistant", content: `Ótimo! Entendi sua ideia: **"${initialPrompt.slice(0, 80)}${initialPrompt.length > 80 ? "..." : ""}"**\n\nAgora vamos personalizar seu app. Ajuste as opções abaixo e clique em **Continuar** quando estiver pronto.` },
      ]);
    }
  }, [initialPrompt]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, calibrationEvents]);

  /** Process structured blocks incrementally during streaming */
  const processIncrementally = useCallback((content: string) => {
    const fileBlocks = parseFileBlocks(content);
    const legacyBlocks = parseLegacyCodeBlocks(content);
    const allFiles = fileBlocks.length > 0 ? fileBlocks : legacyBlocks;

    let newCount = 0;
    allFiles.forEach(({ filePath, code }) => {
      const key = `file:${filePath}`;
      if (!processedBlocksRef.current.has(key)) {
        processedBlocksRef.current.add(key);
        const fileName = filePath.split("/").pop() || filePath;
        addFile({ name: fileName, path: filePath, content: code });
        addTerminalLog({ text: `✓ ${fileName}`, type: "success", timestamp: Date.now() });
        newCount++;
      }
    });

    const tableBlocks = parseTableBlocks(content);
    tableBlocks.forEach(({ name, columns }) => {
      const key = `table:${name}`;
      if (!processedBlocksRef.current.has(key)) {
        processedBlocksRef.current.add(key);
        addTable({ name, columns, rows: [] });
        addTerminalLog({ text: `✓ Tabela: ${name}`, type: "success", timestamp: Date.now() });
      }
    });

    if (newCount > 0) {
      setFilesGenerated(prev => prev + newCount);
      setToolLogs(prev => [...prev, { label: `${newCount} arquivo(s) gerado(s)`, status: "success" }]);
    }
  }, [addFile, addTable, addTerminalLog]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setIsLoading(true);
    setIsGenerating(true);
    setToolsUsed((p) => p + 1);
    processedBlocksRef.current = new Set();

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
    let incrementalTimer: any = null;

    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      const currentText = assistantSoFar;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant")
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: currentText } : m));
        return [...prev, { role: "assistant", content: currentText }];
      });

      if (!incrementalTimer) {
        incrementalTimer = setTimeout(() => {
          processIncrementally(assistantSoFar);
          incrementalTimer = null;
        }, 500);
      }
    };

    try {
      await streamChat({
        messages: [...messages, userMsg],
        onDelta: upsert,
        onDone: () => {
          if (incrementalTimer) clearTimeout(incrementalTimer);
          setIsLoading(false);
          setIsGenerating(false);
          processIncrementally(assistantSoFar);
          addTerminalLog({ text: "✓ Concluído", type: "success", timestamp: Date.now() });
        },
      });
    } catch {
      if (incrementalTimer) clearTimeout(incrementalTimer);
      toast.error("Erro ao se comunicar com a IA");
      setIsLoading(false);
      setIsGenerating(false);
      setToolLogs((prev) => [...prev, { label: "Falha na comunicação", status: "error" }]);
      addTerminalLog({ text: "✗ Erro na comunicação", type: "error", timestamp: Date.now() });
    }
  };

  /* ── Wizard handlers ── */

  const handleDescribe = () => {
    if (wizardData.prompt.length < 10) {
      toast.error("Descreva com pelo menos 10 caracteres.");
      return;
    }
    const inferredName = wizardData.companyName
      ? (channel === "whatsapp" ? `Assistente ${wizardData.companyName}` : `${wizardData.companyName} App`)
      : (channel === "whatsapp" ? "Meu Assistente" : "Meu App");
    setWizardData(prev => ({
      ...prev,
      appName: inferredName,
      introMessage: channel === "whatsapp"
        ? `Olá! 👋 Sou o assistente da ${wizardData.companyName || "sua empresa"}. Como posso ajudar?`
        : `Bem-vindo ao painel da ${wizardData.companyName || "sua empresa"}!`,
    }));
    setMessages(prev => [
      ...prev,
      { role: "user", content: wizardData.prompt },
      { role: "assistant", content: `Entendi! Vou construir: **"${wizardData.prompt.slice(0, 80)}..."**\n\nAgora personalize os detalhes abaixo.` },
    ]);
    setWizardStep("personalize");
  };

  const handlePersonalize = () => {
    if (!wizardData.appName.trim()) {
      toast.error("Informe o nome do app.");
      return;
    }
    setAppName(wizardData.appName);
    // Save wizard config to context for persistence
    setWizardConfig({
      prompt: wizardData.prompt,
      companyName: wizardData.companyName,
      appName: wizardData.appName,
      tone: wizardData.tone,
      language: wizardData.language,
      introMessage: wizardData.introMessage,
      maxMessages: wizardData.maxMessages,
      onboarding: wizardData.onboarding,
    });
    setMessages(prev => [
      ...prev,
      { role: "assistant", content: `**${wizardData.appName}** configurado!\n\n🔧 Tom: ${toneLabels[wizardData.tone] || wizardData.tone}\n🌐 Idioma: ${wizardData.language}\n💬 Intro: "${wizardData.introMessage.slice(0, 50)}..."\n\nIniciando calibração...` },
    ]);
    setWizardStep("calibrate");
    runCalibration();
  };

  const runCalibration = async () => {
    setCalibrating(true);
    setCalibrationEvents([]);
    setCalibrationDone(false);

    const events: CalibrationEvent[] = [
      { kind: "status", label: "Calibração iniciada", done: true },
      { kind: "status", label: "Rodada 1 de 2", done: true },
      {
        kind: "messages",
        label: "Teste 1",
        messages: [
          { type: "client", text: "Oi, gostaria de saber mais sobre os serviços." },
          { type: "agent", text: wizardData.introMessage || "Olá! Como posso ajudar?" },
        ],
      },
      { kind: "status", label: "Analisando resposta...", done: true },
      { kind: "status", label: "Rodada 2 de 2", done: true },
      {
        kind: "messages",
        label: "Teste 2",
        messages: [
          { type: "client", text: "Pode me dar mais detalhes?" },
          { type: "agent", text: "Claro! Posso ajudar com mais informações. O que precisa saber?" },
        ],
      },
      { kind: "status", label: "Verificando consistência...", done: true },
      { kind: "result", label: "Todos os testes passaram ✓ (2/2)", success: true },
    ];

    for (let i = 0; i < events.length; i++) {
      await new Promise((r) => setTimeout(r, 600 + Math.random() * 500));
      setCalibrationEvents((prev) => [...prev, events[i]]);
    }

    setCalibrating(false);
    setCalibrationDone(true);
  };

  const handleStartCreation = async () => {
    setWizardStep("create");
    setCreating(true);

    const onboardingLabels: Record<string, string> = { none: "Nenhum", soft: "Suave", strict: "Rigoroso" };

    // Add detailed config summary to chat history
    const configSummary = `## 📋 Configuração Completa

| Configuração | Valor |
|---|---|
| **Canal** | ${channel === "whatsapp" ? "WhatsApp" : "Web App"} |
| **Nome do App** | ${wizardData.appName} |
${wizardData.companyName ? `| **Empresa** | ${wizardData.companyName} |\n` : ""}| **Tom de Voz** | ${toneLabels[wizardData.tone] || wizardData.tone} |
| **Idioma** | ${wizardData.language === "pt-BR" ? "🇧🇷 Português" : wizardData.language === "en" ? "🇺🇸 English" : "🇪🇸 Español"} |
| **Msg. Introdução** | ${wizardData.introMessage} |
| **Máx. Msgs/Turno** | ${wizardData.maxMessages} |
| **Onboarding** | ${onboardingLabels[wizardData.onboarding] || wizardData.onboarding} |

> **Descrição:** ${wizardData.prompt}

---

🚀 Iniciando geração do app com base nessas configurações...`;

    setMessages(prev => [
      ...prev,
      { role: "assistant", content: configSummary },
    ]);

    // Initialize the project
    if (!initializedProject.current) {
      initializedProject.current = true;
      initializeProject(channel, wizardData.prompt);
    }

    // Now send the full context to AI for actual generation
    const contextPrompt = `Crie um ${channel === "whatsapp" ? "WhatsApp App" : "Web App"} chamado "${wizardData.appName}".
Descrição: ${wizardData.prompt}
Tom: ${wizardData.tone}
Idioma: ${wizardData.language}
Mensagem de introdução: ${wizardData.introMessage}
Máx mensagens por turno: ${wizardData.maxMessages}
Onboarding: ${wizardData.onboarding}
${wizardData.companyName ? `Empresa: ${wizardData.companyName}` : ""}`;

    setCreating(false);
    setWizardStep("done");

    // Send the full prompt to generate code
    await sendMessage(contextPrompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (wizardStep === "done") {
        sendMessage(input);
      }
    }
  };

  const isEmpty = messages.length === 0;

  const toneLabels: Record<string, string> = {
    professional_friendly: "Profissional e Amigável",
    formal: "Formal",
    casual: "Casual e Descontraído",
    empathetic: "Empático e Acolhedor",
    direct: "Direto e Objetivo",
  };

  return (
    <div className="w-[440px] min-w-[360px] max-w-[520px] border-r border-border flex flex-col bg-card/20">
      {/* Header */}
      <div className="h-12 border-b border-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onBack}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary/15 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Studio</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium ${
            channel === "whatsapp"
              ? "bg-green-500/10 text-green-500 border border-green-500/20"
              : "bg-primary/10 text-primary border border-primary/20"
          }`}>
            {channel === "whatsapp" ? <Phone className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
            {channel === "whatsapp" ? "WhatsApp" : "Web"}
          </span>
        </div>
      </div>

      {/* Wizard Stepper */}
      {wizardStep !== "done" && (
        <div className="px-4 py-2.5 border-b border-border bg-card/30">
          <div className="flex items-center gap-1">
            {stepLabels.map((s, i) => {
              const stepOrder = ["describe", "personalize", "calibrate", "create"];
              const currentIdx = stepOrder.indexOf(wizardStep);
              const thisIdx = stepOrder.indexOf(s.id);
              const isDone = thisIdx < currentIdx;
              const isActive = s.id === wizardStep;
              return (
                <div key={s.id} className="flex items-center flex-1 last:flex-none">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all ${
                      isDone ? "bg-primary text-primary-foreground"
                      : isActive ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                    }`}>
                      {isDone ? <Check className="w-3 h-3" /> : s.num}
                    </div>
                    <span className={`text-[10px] font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                      {s.label}
                    </span>
                  </div>
                  {i < stepLabels.length - 1 && (
                    <div className={`flex-1 h-px mx-2 ${isDone ? "bg-primary" : "bg-border"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tools indicator */}
      {toolsUsed > 0 && (
        <div className="px-3 py-2">
          <button
            onClick={() => setToolsExpanded(!toolsExpanded)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors bg-muted/30 rounded-lg px-2.5 py-1.5 w-full"
          >
            <Wrench className="w-3 h-3" />
            <span>{toolsUsed} ações</span>
            {filesGenerated > 0 && (
              <span className="flex items-center gap-1 ml-2 text-primary">
                <FileCode className="w-3 h-3" />
                {filesGenerated} arquivos
              </span>
            )}
            {toolsExpanded ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
          </button>
          {toolsExpanded && toolLogs.length > 0 && (
            <div className="mt-1.5 space-y-0.5 pl-1">
              {toolLogs.slice(-6).map((log, i) => (
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

      {/* Messages + Wizard area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Step 1: Describe - empty state */}
        {wizardStep === "describe" && isEmpty && (
          <div className="flex flex-col items-center justify-center h-full pt-12">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-base font-semibold text-foreground mb-1">Descreva seu app</h2>
            <p className="text-xs text-muted-foreground text-center max-w-[280px] mb-6">
              {channel === "whatsapp"
                ? "Conte o que seu WhatsApp App deve fazer. Pense em fluxos conversacionais, qualificação e automações."
                : "Conte o que seu Web App deve fazer. Pense em páginas, dashboards e funcionalidades visuais."}
            </p>

            <div className="w-full max-w-[340px] space-y-3">
              <Input
                value={wizardData.companyName}
                onChange={(e) => setWizardData(prev => ({ ...prev, companyName: e.target.value }))}
                placeholder="Nome da empresa (opcional)"
                className="h-9 text-xs bg-card/50"
              />
              <textarea
                value={wizardData.prompt}
                onChange={(e) => setWizardData(prev => ({ ...prev, prompt: e.target.value }))}
                placeholder={channel === "whatsapp"
                  ? "Ex: Um bot de qualificação de leads que coleta nome, email e interesse via WhatsApp..."
                  : "Ex: Um painel de gestão com dashboard de métricas, cadastro de clientes e relatórios..."}
                className="w-full bg-card/50 border border-border rounded-lg outline-none resize-none text-xs text-foreground placeholder:text-muted-foreground px-3 py-2.5 min-h-[100px] focus:border-primary/30 transition-colors"
              />
              <Button onClick={handleDescribe} disabled={wizardData.prompt.length < 10} className="w-full gap-2 h-9 text-xs rounded-lg">
                <Sparkles className="w-3.5 h-3.5" />
                Continuar
              </Button>
            </div>

            {/* Quick suggestions */}
            <div className="mt-6 w-full max-w-[340px]">
              <p className="text-[10px] text-muted-foreground mb-2 text-center">ou comece com uma ideia:</p>
              <div className="space-y-1.5">
                {(channel === "whatsapp" ? [
                  "Bot de qualificação de leads via WhatsApp",
                  "Sistema de agendamento para clínicas por WhatsApp",
                  "CRM conversacional com follow-up automático",
                  "Onboarding guiado com coleta de dados via chat",
                ] : [
                  "Dashboard de gestão com métricas e relatórios",
                  "Sistema de cadastro de clientes com CRM visual",
                  "Plataforma de agendamento com calendário interativo",
                  "Painel administrativo com controle de equipe e tarefas",
                ]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setWizardData(prev => ({ ...prev, prompt: s }))}
                    className="w-full text-left text-[11px] px-3 py-2 rounded-lg border border-border hover:border-primary/30 hover:bg-accent/20 text-muted-foreground hover:text-foreground transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Chat messages */}
        {messages.map((m, i) => {
          const displayContent = m.role === "assistant" ? stripStructuredBlocks(m.content) : m.content;
          if (m.role === "assistant" && !displayContent) return null;
          return (
            <div key={i}>
              {m.role === "user" ? (
                <div className="flex justify-end">
                  <div className="bg-primary/10 border border-primary/20 rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[90%] text-sm">
                    <p className="whitespace-pre-wrap text-foreground">{displayContent}</p>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="text-sm leading-relaxed text-foreground flex-1 min-w-0">
                    <div className="prose prose-sm dark:prose-invert max-w-none
                      [&_p]:mb-2 [&_ul]:mb-2 [&_ol]:mb-2 [&_li]:mb-0.5
                      [&_strong]:text-foreground
                      [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm">
                      <ReactMarkdown>{displayContent}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Step 2: Personalize - inline form */}
        {wizardStep === "personalize" && (
          <div className="bg-card/50 border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center">
                <span className="text-[9px] font-bold text-primary">2</span>
              </div>
              <h3 className="text-xs font-semibold text-foreground">Personalizar</h3>
            </div>

            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Nome do app</label>
              <Input
                value={wizardData.appName}
                onChange={(e) => setWizardData(prev => ({ ...prev, appName: e.target.value }))}
                className="h-8 text-xs bg-background"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Tom de voz</label>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(toneLabels).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setWizardData(prev => ({ ...prev, tone: key }))}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium border transition-all ${
                      wizardData.tone === key
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-card border-border text-muted-foreground hover:border-border/80"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Idioma</label>
              <div className="flex gap-1.5">
                {[["pt-BR", "🇧🇷 Português"], ["en", "🇺🇸 English"], ["es", "🇪🇸 Español"]].map(([k, l]) => (
                  <button
                    key={k}
                    onClick={() => setWizardData(prev => ({ ...prev, language: k }))}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium border transition-all ${
                      wizardData.language === k
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-card border-border text-muted-foreground hover:border-border/80"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Mensagem de introdução</label>
              <textarea
                value={wizardData.introMessage}
                onChange={(e) => setWizardData(prev => ({ ...prev, introMessage: e.target.value }))}
                className="w-full bg-background border border-border rounded-lg text-xs px-3 py-2 min-h-[60px] resize-none outline-none focus:border-primary/30 transition-colors"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">Máx. mensagens por turno</label>
              <div className="flex gap-1.5">
                {[1, 2, 3].map((n) => (
                  <button
                    key={n}
                    onClick={() => setWizardData(prev => ({ ...prev, maxMessages: n }))}
                    className={`w-8 h-8 rounded-lg border text-xs font-medium transition-all ${
                      wizardData.maxMessages === n
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">Onboarding</label>
              <div className="flex gap-1.5">
                {([
                  { v: "none" as const, l: "Nenhum" },
                  { v: "soft" as const, l: "Suave" },
                  { v: "strict" as const, l: "Rigoroso" },
                ]).map(({ v, l }) => (
                  <button
                    key={v}
                    onClick={() => setWizardData(prev => ({ ...prev, onboarding: v }))}
                    className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-medium border transition-all ${
                      wizardData.onboarding === v
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-card border-border text-muted-foreground"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={handlePersonalize} className="w-full h-8 text-xs rounded-lg gap-1.5 mt-2">
              <Check className="w-3.5 h-3.5" />
              Continuar
            </Button>
          </div>
        )}

        {/* Step 3: Calibrate */}
        {wizardStep === "calibrate" && (
          <div className="bg-card/50 border border-border rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center">
                <span className="text-[9px] font-bold text-primary">3</span>
              </div>
              <h3 className="text-xs font-semibold text-foreground">Calibração</h3>
              {calibrating && <Loader2 className="w-3.5 h-3.5 text-primary animate-spin ml-auto" />}
            </div>

            {calibrationEvents.map((ev, i) => (
              <div key={i}>
                {ev.kind === "status" && (
                  <div className="flex items-center gap-2 text-[11px] py-1">
                    {ev.done ? <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" /> : <Loader2 className="w-3 h-3 text-muted-foreground animate-spin shrink-0" />}
                    <span className="text-muted-foreground">{ev.label}</span>
                  </div>
                )}
                {ev.kind === "messages" && ev.messages && (
                  <div className="ml-5 my-1.5 space-y-1.5 border-l-2 border-border pl-3">
                    {ev.messages.map((m, j) => (
                      <div key={j} className={`text-[11px] px-2.5 py-1.5 rounded-lg max-w-[85%] ${
                        m.type === "client"
                          ? "bg-muted/50 text-foreground"
                          : "bg-primary/10 text-primary ml-auto"
                      }`}>
                        <span className="text-[9px] font-bold text-muted-foreground block mb-0.5">
                          {m.type === "client" ? "👤 Cliente" : "🤖 Agente"}
                        </span>
                        {m.text}
                      </div>
                    ))}
                  </div>
                )}
                {ev.kind === "result" && (
                  <div className={`flex items-center gap-2 text-xs font-medium py-2 px-3 rounded-lg mt-1 ${
                    ev.success ? "bg-emerald-500/10 text-emerald-400" : "bg-destructive/10 text-destructive"
                  }`}>
                    <CheckCircle2 className="w-4 h-4" />
                    {ev.label}
                  </div>
                )}
              </div>
            ))}

            {calibrationDone && (
              <Button onClick={handleStartCreation} className="w-full h-8 text-xs rounded-lg gap-1.5 mt-3">
                <Sparkles className="w-3.5 h-3.5" />
                Criar App
              </Button>
            )}
          </div>
        )}

        {/* Step 4: Creating */}
        {wizardStep === "create" && creating && (
          <div className="flex items-center gap-3 bg-card/50 border border-border rounded-xl p-4">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
            <div>
              <p className="text-xs font-medium text-foreground">Criando {wizardData.appName}...</p>
              <p className="text-[10px] text-muted-foreground">
                {channel === "whatsapp" ? "Gerando fluxos conversacionais e código" : "Gerando páginas, componentes e código"}
              </p>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex gap-2.5">
            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-primary animate-pulse" />
            </div>
            <div className="text-sm text-muted-foreground animate-pulse flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-xs">Construindo...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input - only active after wizard is done */}
      <div className="p-3 border-t border-border">
        <div className={`rounded-xl border border-border bg-card/50 p-1 transition-colors ${wizardStep === "done" ? "focus-within:border-primary/30" : "opacity-60"}`}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={wizardStep === "done" ? "Continue construindo..." : "Complete as etapas acima para começar..."}
            rows={1}
            disabled={wizardStep !== "done"}
            className="w-full bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground px-3 py-2 min-h-[36px] max-h-[120px] disabled:cursor-not-allowed"
          />
          <div className="flex items-center justify-between px-2 pb-1">
            <div className="flex items-center gap-1">
              <button className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded" disabled={wizardStep !== "done"}>
                <Mic className="w-3.5 h-3.5" />
              </button>
            </div>
            <Button
              size="icon"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading || wizardStep !== "done"}
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
