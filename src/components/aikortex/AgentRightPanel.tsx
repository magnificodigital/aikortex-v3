import { useState, useRef, useEffect, useCallback } from "react";
import {
  ArrowUp, Bot, ChevronDown, ChevronLeft, Mic, Wrench,
  CheckCircle2, AlertCircle, ChevronUp, Sparkles,
  Check, Loader2, Pencil, RotateCw, TestTube,
  KeyRound, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import type { AgentType } from "@/types/agent-builder";
import { AGENT_PRESETS } from "@/types/agent-presets";

/* ── Types ── */

type Msg = { role: "user" | "assistant"; content: string };

interface ToolLog {
  label: string;
  status: "success" | "error";
}

export interface StructuredAgentConfig {
  agent_name: string;
  agent_type: AgentType;
  description: string;
  objective: string;
  tone: string;
  language: string;
  greeting_message: string;
  quick_replies: string[];
  instructions: string;
  channels: string[];
}

/* ── Constants ── */

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/app-chat`;

const STEP_LABELS = [
  { id: "discover" as const,  label: "Descrever",    num: 1 },
  { id: "structure" as const, label: "Personalizar", num: 2 },
  { id: "build" as const,     label: "Criar",        num: 3 },
];

const TONE_LABELS: Record<string, string> = {
  professional_friendly: "Profissional e Amigável",
  formal:                "Formal",
  casual:                "Casual e Descontraído",
  empathetic:            "Empático e Acolhedor",
  direct:                "Direto e Objetivo",
};

const SUGGESTIONS_BY_TYPE: Record<AgentType, string[]> = {
  SDR: [
    "Agente que qualifica leads inbound e agenda reuniões com o time comercial",
    "SDR que coleta nome, empresa e cargo antes de passar para o closer",
    "Assistente que responde leads em segundos e aplica critérios BANT",
    "Bot de qualificação que envia material e agenda demo automaticamente",
  ],
  BDR: [
    "Agente de prospecção outbound para empresas de tecnologia",
    "BDR que pesquisa empresas-alvo e envia mensagens personalizadas",
    "Assistente que aborda decisores no LinkedIn com contexto da empresa",
    "Bot de cold outreach que qualifica e agenda reuniões com C-level",
  ],
  SAC: [
    "Agente de suporte que resolve dúvidas e abre chamados automaticamente",
    "Atendente que resolve problemas técnicos e coleta feedback de satisfação",
    "SAC que responde 24/7 e escala para humano quando necessário",
    "Assistente de suporte que consulta status de pedidos e resolve reclamações",
  ],
  CS: [
    "Agente de customer success que acompanha onboarding de novos clientes",
    "CS que faz check-in mensal e identifica riscos de churn",
    "Assistente que guia o cliente nos primeiros 30 dias de uso",
    "Bot de NPS que coleta feedback e aciona retenção proativamente",
  ],
  Custom: [
    "Assistente virtual para atendimento ao cliente no WhatsApp",
    "Agente de vendas consultivo para e-commerce",
    "Bot de agendamento para clínicas e consultórios",
    "Assistente de RH para triagem de candidatos",
  ],
};

/* ── JSON extraction ── */

function extractJson(raw: string): any {
  let cleaned = raw.replace(/^```(?:json)?\s*\n?/gm, "").replace(/\n?```\s*$/gm, "").trim();
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
  cleaned = cleaned.replace(/,\s*([}\]])/g, "$1");
  return JSON.parse(cleaned);
}

function validateAgentConfig(obj: any): StructuredAgentConfig | null {
  const cfg = obj?.agent_config || obj;
  if (!cfg?.agent_name && !cfg?.greeting_message) return null;
  return {
    agent_name:       cfg.agent_name       || "Meu Agente",
    agent_type:       cfg.agent_type       || "Custom",
    description:      cfg.description      || "",
    objective:        cfg.objective        || "",
    tone:             cfg.tone             || "professional_friendly",
    language:         cfg.language         || "pt-BR",
    greeting_message: cfg.greeting_message || "Olá! Como posso te ajudar?",
    quick_replies:    cfg.quick_replies    || [],
    instructions:     cfg.instructions    || "",
    channels:         cfg.channels         || [],
  };
}

/* ── API calls ── */

async function requestAgentStructure(
  description: string,
  agentType: AgentType,
  language: string,
): Promise<StructuredAgentConfig | null> {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: description }],
      appContext: { app_type: "agent", agent_type: agentType, language },
      mode: "structure",
    }),
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  try {
    // Try structuredConfig first, then agentConfig, then raw
    const raw = data.structuredConfig
      ? (typeof data.structuredConfig === "string" ? extractJson(data.structuredConfig) : data.structuredConfig)
      : data.agentConfig
        ? (typeof data.agentConfig === "string" ? extractJson(data.agentConfig) : data.agentConfig)
        : data;

    // Map app-chat structure response to agent config
    const mapped: StructuredAgentConfig = {
      agent_name:       raw.app_name || raw.agent_name || "Meu Agente",
      agent_type:       agentType,
      description:      raw.app_description || raw.description || description.slice(0, 200),
      objective:        raw.app_description || raw.objective || "",
      tone:             raw.tone || "professional_friendly",
      language:         raw.language || language,
      greeting_message: raw.intro_message || raw.greeting_message || `Olá! Sou seu agente ${agentType}. Como posso ajudar?`,
      quick_replies:    raw.quick_replies || [],
      instructions:     raw.instructions || "",
      channels:         raw.channels || [],
    };
    return validateAgentConfig(mapped);
  } catch {
    return null;
  }
}

async function requestAgentBuild(
  config: StructuredAgentConfig,
  agentType: AgentType,
): Promise<{ summary: string; error?: string }> {
  const contextPrompt = `Crie um agente de IA do tipo ${agentType} chamado "${config.agent_name}".
Descrição: ${config.description}
Objetivo: ${config.objective}
Tom: ${TONE_LABELS[config.tone] || config.tone}
Idioma: ${config.language}
Mensagem de saudação: ${config.greeting_message}
Instruções: ${config.instructions}
Canais: ${config.channels.join(", ")}`;

  const appContext: Record<string, string> = {
    app_type:    "agent",
    agent_type:  agentType,
    app_name:    config.agent_name,
    app_description: config.description,
    tone:        config.tone,
    language:    config.language,
    intro_message: config.greeting_message,
    is_patch:    "false",
  };

  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: contextPrompt }],
      appContext,
      mode: "build",
    }),
  });

  if (resp.status === 429) return { summary: "", error: "Limite de requisições excedido." };
  if (resp.status === 402) return { summary: "", error: "Créditos insuficientes." };
  if (!resp.ok) return { summary: "", error: "Erro no serviço de IA" };

  const data = await resp.json();
  if (data.error) return { summary: "", error: data.error };

  const summary = data.chatSummary || data.chat_summary || "";
  return { summary };
}

/* ── Component ── */

export interface AgentChatPanelProps {
  onBack: () => void;
  agentType: AgentType;
  agentName: string;
  agentAvatar: string;
  // Wizard state — lifted to parent
  wizardStep: "discover" | "structure" | "build" | "done";
  setWizardStep: (s: "discover" | "structure" | "build" | "done") => void;
  structuredConfig: StructuredAgentConfig | null;
  setStructuredConfig: (c: StructuredAgentConfig | null) => void;
  // Chat mode
  chatMode: "setup" | "test";
  setChatMode: (m: "setup" | "test") => void;
  // API keys
  hasApiKey: boolean;
  hasAnyLLMKey: boolean;
  keysLoading: boolean;
  currentProvider: string;
  agentModel: string;
  availableModels: { value: string; label: string; provider: string }[];
  setupModel: string;
  setSetupModel: (m: string) => void;
  setAgentModel: (m: string) => void;
  gatewayModels: { value: string; label: string }[];
  onGoToIntegrations: () => void;
  // Callbacks
  onConfigStructured: (config: StructuredAgentConfig) => void;
  onAgentCreated: (config: StructuredAgentConfig) => Promise<void>;
  // Messages
  messages: { role: "user" | "agent"; text: string }[];
  sendMessage: (text: string) => void;
  isStreaming: boolean;
}

const AgentChatPanel = ({
  onBack, agentType, agentName, agentAvatar,
  wizardStep, setWizardStep, structuredConfig, setStructuredConfig,
  chatMode, setChatMode,
  hasApiKey, hasAnyLLMKey, keysLoading, currentProvider,
  agentModel, availableModels, setupModel, setSetupModel, setAgentModel,
  gatewayModels, onGoToIntegrations,
  onConfigStructured, onAgentCreated,
  messages, sendMessage, isStreaming,
}: AgentChatPanelProps) => {

  const [input,          setInput]          = useState("");
  const [isLoading,      setIsLoading]      = useState(false);
  const [toolsUsed,      setToolsUsed]      = useState(0);
  const [toolsExpanded,  setToolsExpanded]  = useState(true);
  const [toolLogs,       setToolLogs]       = useState<ToolLog[]>([]);
  const [structuring,    setStructuring]    = useState(false);
  const [building,       setBuilding]       = useState(false);
  const [editingConfig,  setEditingConfig]  = useState(false);
  const [prompt,         setPrompt]         = useState("");
  const [companyName,    setCompanyName]    = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const isEmpty = messages.length === 0 && wizardStep === "discover";
  const suggestions = SUGGESTIONS_BY_TYPE[agentType] || SUGGESTIONS_BY_TYPE["Custom"];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, structuring, building]);

  /* ── Step 1 → Step 2: Estruturar ── */

  const handleDiscover = () => {
    if (prompt.length < 10) {
      toast.error("Descreva com pelo menos 10 caracteres.");
      return;
    }
    handleStructure(prompt);
  };

  const handleStructure = async (description: string) => {
    setWizardStep("structure");
    setStructuring(true);
    setToolsUsed(p => p + 1);
    setToolLogs(prev => [...prev, { label: "Analisando descrição do agente...", status: "success" }]);

    const result = await requestAgentStructure(
      companyName ? `Empresa: ${companyName}. ${description}` : description,
      agentType,
      "pt-BR",
    );

    if (result) {
      setStructuredConfig(result);
      onConfigStructured(result);
      setToolLogs(prev => [...prev, { label: `Agente "${result.agent_name}" estruturado`, status: "success" }]);
    } else {
      toast.error("Erro ao estruturar. Tente novamente.");
      setWizardStep("discover");
      setToolLogs(prev => [...prev, { label: "Erro ao estruturar agente", status: "error" }]);
    }
    setStructuring(false);
  };

  /* ── Step 2 → Step 3: Construir ── */

  const handleBuild = async () => {
    if (!structuredConfig) return;
    setWizardStep("build");
    setBuilding(true);
    setToolsUsed(p => p + 1);
    setToolLogs(prev => [...prev, { label: `Criando agente "${structuredConfig.agent_name}"...`, status: "success" }]);

    const { summary, error } = await requestAgentBuild(structuredConfig, agentType);

    if (error) {
      toast.error(error);
      setToolLogs(prev => [...prev, { label: error, status: "error" }]);
      setWizardStep("structure");
      setBuilding(false);
      return;
    }

    // Salvar agente
    await onAgentCreated(structuredConfig);

    setToolLogs(prev => [
      ...prev,
      { label: "Configuração salva com sucesso", status: "success" },
      { label: "Pronto para testar", status: "success" },
    ]);

    setBuilding(false);
    setWizardStep("done");
    setChatMode("test");

    toast.success(`✅ Agente "${structuredConfig.agent_name}" criado com sucesso!`);
  };

  /* ── Patch mode (após done) ── */

  const handleSend = () => {
    if (!input.trim() || isStreaming || isLoading) return;
    const text = input.trim();
    setInput("");
    sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (wizardStep === "done") handleSend();
    }
  };

  const canSend = chatMode === "setup"
    ? wizardStep === "done"
    : !keysLoading && hasApiKey;

  return (
    <div className="w-full max-w-[55%] min-w-[360px] border-r border-border flex flex-col bg-card/20">

      {/* ── Header ── */}
      <div className="h-12 border-b border-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onBack}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <img src={agentAvatar} alt={agentName} className="w-6 h-6 rounded-full object-cover" />
          <span className="text-sm font-semibold tracking-tight">{agentName}</span>
          <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{agentType}</span>
        </div>

        {/* Mode toggle — só aparece após wizard concluído */}
        {wizardStep === "done" && (
          <div className="flex items-center gap-1">
            <Button
              variant={chatMode === "setup" ? "default" : "ghost"}
              size="sm" className="text-xs gap-1 h-7"
              onClick={() => setChatMode("setup")}
            >
              <Bot className="w-3 h-3" /> Configurar
            </Button>
            <Button
              variant={chatMode === "test" ? "default" : "ghost"}
              size="sm" className="text-xs gap-1 h-7"
              onClick={() => setChatMode("test")}
            >
              <TestTube className="w-3 h-3" /> Testar
            </Button>
          </div>
        )}
      </div>

      {/* ── Stepper — só durante o wizard ── */}
      {wizardStep !== "done" && (
        <div className="px-4 py-2.5 border-b border-border bg-card/30">
          <div className="flex items-center gap-1">
            {STEP_LABELS.map((s, i) => {
              const order   = ["discover", "structure", "build"];
              const currIdx = order.indexOf(wizardStep);
              const thisIdx = order.indexOf(s.id);
              const isDone  = thisIdx < currIdx;
              const isActive = s.id === wizardStep;
              return (
                <div key={s.id} className="flex items-center flex-1 last:flex-none">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all ${
                      isDone || isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      {isDone ? <Check className="w-3 h-3" /> : s.num}
                    </div>
                    <span className={`text-[10px] font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                      {s.label}
                    </span>
                  </div>
                  {i < STEP_LABELS.length - 1 && (
                    <div className={`flex-1 h-px mx-2 ${isDone ? "bg-primary" : "bg-border"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Mode badge — após wizard concluído ── */}
      {wizardStep === "done" && (
        <div className="px-4 py-1.5 border-b border-border bg-muted/30 flex items-center gap-2">
          {chatMode === "setup" ? (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Bot className="w-3 h-3 text-primary" />
              Assistente de configuração — modelo gratuito
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TestTube className="w-3 h-3 text-primary" />
              Modo Teste — {hasApiKey
                ? (availableModels.find(m => m.value === agentModel)?.label || agentModel)
                : "Configure sua chave de API"}
              <span className={`w-1.5 h-1.5 rounded-full ${hasApiKey ? "bg-emerald-500" : "bg-destructive"}`} />
            </span>
          )}
        </div>
      )}

      {/* ── Tool logs ── */}
      {toolsUsed > 0 && wizardStep !== "done" && (
        <div className="px-3 py-2">
          <button
            onClick={() => setToolsExpanded(!toolsExpanded)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors bg-muted/30 rounded-lg px-2.5 py-1.5 w-full"
          >
            <Wrench className="w-3 h-3" />
            <span>{toolsUsed} ações</span>
            {toolsExpanded ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
          </button>
          {toolsExpanded && toolLogs.length > 0 && (
            <div className="mt-1.5 space-y-0.5 pl-1">
              {toolLogs.slice(-6).map((log, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[11px]">
                  {log.status === "success"
                    ? <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                    : <AlertCircle  className="w-3 h-3 text-destructive shrink-0" />}
                  <span className="text-muted-foreground truncate">{log.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Main area ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-4">

        {/* ══ Step 1: Discover ══ */}
        {wizardStep === "discover" && isEmpty && (
          <div className="flex flex-col items-center justify-center h-full pt-8">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-base font-semibold text-foreground mb-1">Descreva seu agente</h2>
            <p className="text-xs text-muted-foreground text-center max-w-[280px] mb-6">
              Conte o que seu agente {agentType} deve fazer. A IA vai estruturar tudo automaticamente.
            </p>

            <div className="w-full max-w-[340px] space-y-3">
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Nome da empresa (opcional)"
                className="h-9 text-xs bg-card/50"
              />
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={suggestions[0]}
                className="w-full bg-card/50 border border-border rounded-lg outline-none resize-none text-xs text-foreground placeholder:text-muted-foreground px-3 py-2.5 min-h-[100px] focus:border-primary/30 transition-colors"
              />
              <Button
                onClick={handleDiscover}
                disabled={prompt.length < 10}
                className="w-full gap-2 h-9 text-xs rounded-lg"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Estruturar com IA
              </Button>
            </div>

            <div className="mt-6 w-full max-w-[340px]">
              <p className="text-[10px] text-muted-foreground mb-2 text-center">ou comece com uma ideia:</p>
              <div className="space-y-1.5">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => setPrompt(s)}
                    className="w-full text-left text-[11px] px-3 py-2 rounded-lg border border-border hover:border-primary/30 hover:bg-accent/20 text-muted-foreground hover:text-foreground transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mensagens do chat (modo done) */}
        {messages.map((m, i) => {
          if (m.role === "agent" && !m.text) return null;
          return (
            <div key={i}>
              {m.role === "user" ? (
                <div className="flex justify-end">
                  <div className="bg-primary/10 border border-primary/20 rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[90%] text-sm">
                    <p className="whitespace-pre-wrap text-foreground">{m.text}</p>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2.5">
                  <img src={agentAvatar} alt="" className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5" />
                  <div className="text-sm leading-relaxed text-foreground flex-1 min-w-0">
                    <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:mb-2 [&_strong]:text-foreground [&_h2]:text-sm [&_h3]:text-sm">
                      <ReactMarkdown>{m.text}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* ══ Step 2: Structuring loader ══ */}
        {structuring && (
          <div className="flex items-center gap-3 bg-card/50 border border-border rounded-xl p-4">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
            <div>
              <p className="text-xs font-medium text-foreground">Estruturando com IA...</p>
              <p className="text-[10px] text-muted-foreground">Analisando descrição e definindo configuração do agente</p>
            </div>
          </div>
        )}

        {/* ══ Step 2: Config card ══ */}
        {wizardStep === "structure" && structuredConfig && !structuring && (
          <div className="bg-card/50 border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary" />
                </div>
                <h3 className="text-xs font-semibold text-foreground">Configuração Estruturada</h3>
              </div>
              <button
                onClick={() => setEditingConfig(!editingConfig)}
                className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <Pencil className="w-3 h-3" />
                {editingConfig ? "Fechar" : "Editar"}
              </button>
            </div>

            {!editingConfig ? (
              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Nome</span>
                  <span className="font-medium text-foreground">{structuredConfig.agent_name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Tipo</span>
                  <span className="font-medium text-foreground">{structuredConfig.agent_type}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Tom</span>
                  <span className="font-medium text-foreground">{TONE_LABELS[structuredConfig.tone] || structuredConfig.tone}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Idioma</span>
                  <span className="font-medium text-foreground">{structuredConfig.language}</span>
                </div>
                <div className="py-1 border-b border-border/50">
                  <span className="text-muted-foreground block mb-1">Mensagem de saudação</span>
                  <span className="text-foreground italic">"{structuredConfig.greeting_message}"</span>
                </div>
                {structuredConfig.quick_replies.length > 0 && (
                  <div className="py-1">
                    <span className="text-muted-foreground block mb-1">Quick replies</span>
                    <div className="flex flex-wrap gap-1">
                      {structuredConfig.quick_replies.map((qr, i) => (
                        <Badge key={i} variant="secondary" className="text-[9px] px-1.5 py-0.5">{qr}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Nome do agente</label>
                  <Input
                    value={structuredConfig.agent_name}
                    onChange={(e) => setStructuredConfig({ ...structuredConfig, agent_name: e.target.value })}
                    className="h-7 text-xs bg-background"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Tom de voz</label>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(TONE_LABELS).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setStructuredConfig({ ...structuredConfig, tone: key })}
                        className={`px-2 py-1 rounded-md text-[9px] font-medium border transition-all ${
                          structuredConfig.tone === key
                            ? "bg-primary/10 border-primary/30 text-primary"
                            : "bg-card border-border text-muted-foreground"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Idioma</label>
                  <div className="flex gap-1">
                    {[["pt-BR", "🇧🇷 PT"], ["en", "🇺🇸 EN"], ["es", "🇪🇸 ES"]].map(([k, l]) => (
                      <button
                        key={k}
                        onClick={() => setStructuredConfig({ ...structuredConfig, language: k })}
                        className={`px-2 py-1 rounded-md text-[9px] font-medium border transition-all ${
                          structuredConfig.language === k
                            ? "bg-primary/10 border-primary/30 text-primary"
                            : "bg-card border-border text-muted-foreground"
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Mensagem de saudação</label>
                  <textarea
                    value={structuredConfig.greeting_message}
                    onChange={(e) => setStructuredConfig({ ...structuredConfig, greeting_message: e.target.value })}
                    className="w-full bg-background border border-border rounded-md text-xs px-2 py-1.5 min-h-[60px] resize-none outline-none focus:border-primary/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Objetivo</label>
                  <textarea
                    value={structuredConfig.objective}
                    onChange={(e) => setStructuredConfig({ ...structuredConfig, objective: e.target.value })}
                    className="w-full bg-background border border-border rounded-md text-xs px-2 py-1.5 min-h-[60px] resize-none outline-none focus:border-primary/30 transition-colors"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline" size="sm"
                className="flex-1 h-8 text-xs rounded-lg gap-1"
                onClick={() => { setWizardStep("discover"); setStructuredConfig(null); }}
              >
                <RotateCw className="w-3 h-3" />
                Re-estruturar
              </Button>
              <Button
                size="sm"
                className="flex-1 h-8 text-xs rounded-lg gap-1 bg-primary"
                onClick={handleBuild}
              >
                <Sparkles className="w-3 h-3" />
                Criar Agente
              </Button>
            </div>
          </div>
        )}

        {/* ══ Step 3: Building loader ══ */}
        {building && (
          <div className="flex items-center gap-3 bg-card/50 border border-border rounded-xl p-4">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
            <div>
              <p className="text-xs font-medium text-foreground">Criando {structuredConfig?.agent_name}...</p>
              <p className="text-[10px] text-muted-foreground">Gerando configuração completa do agente</p>
            </div>
          </div>
        )}

        {/* Loading indicator (patch mode) */}
        {isStreaming && messages[messages.length - 1]?.role === "user" && (
          <div className="flex gap-2.5">
            <img src={agentAvatar} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
            <div className="text-sm text-muted-foreground animate-pulse flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── API key alerts ── */}
      {wizardStep === "done" && chatMode === "setup" && !keysLoading && !hasAnyLLMKey && (
        <div className="px-4 pt-2">
          <Alert className="border-primary/30 bg-primary/5">
            <KeyRound className="h-4 w-4 text-primary" />
            <AlertDescription className="text-xs text-muted-foreground flex items-center justify-between">
              <span>Configure uma chave de API em <strong className="text-foreground">Integrações</strong> para testar o agente.</span>
              <Button variant="outline" size="sm" className="text-xs gap-1 ml-3 shrink-0" onClick={onGoToIntegrations}>
                <KeyRound className="w-3 h-3" /> Configurar
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {wizardStep === "done" && chatMode === "test" && !keysLoading && hasAnyLLMKey && !hasApiKey && (
        <div className="px-4 pt-2">
          <Alert className="border-yellow-500/30 bg-yellow-500/5">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-xs text-muted-foreground flex items-center justify-between">
              <span>Configure a chave do provedor <strong className="text-foreground">{currentProvider}</strong> para testar.</span>
              <Button variant="outline" size="sm" className="text-xs gap-1 ml-3 shrink-0" onClick={onGoToIntegrations}>
                <KeyRound className="w-3 h-3" /> Configurar
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* ── Input ── */}
      <div className="p-3 border-t border-border">
        {wizardStep === "done" ? (
          <div className={`rounded-xl border border-border bg-card/50 p-1 transition-colors focus-within:border-primary/30`}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                chatMode === "test" && !hasApiKey
                  ? "⚠️ Configure sua chave de API para testar..."
                  : chatMode === "setup"
                    ? "Peça alterações ao agente... (modo patch)"
                    : "Envie uma mensagem para testar o agente..."
              }
              rows={1}
              disabled={!canSend}
              className="w-full bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground px-3 py-2 min-h-[36px] max-h-[120px] disabled:cursor-not-allowed"
            />
            <div className="flex items-center justify-between px-2 pb-1">
              <div className="flex items-center gap-1">
                <button className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded">
                  <Mic className="w-3.5 h-3.5" />
                </button>
                {chatMode === "setup" && (
                  <select
                    value={setupModel}
                    onChange={(e) => setSetupModel(e.target.value)}
                    className="text-xs text-muted-foreground bg-transparent border border-border rounded-md px-2 py-1 cursor-pointer focus:outline-none"
                  >
                    {gatewayModels.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                )}
                {chatMode === "test" && availableModels.length > 0 && (
                  <select
                    value={agentModel}
                    onChange={(e) => setAgentModel(e.target.value)}
                    className="text-xs text-muted-foreground bg-transparent border border-border rounded-md px-2 py-1 cursor-pointer focus:outline-none"
                  >
                    {availableModels.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                )}
              </div>
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || isStreaming || !canSend}
                className="h-8 w-8 rounded-full bg-primary hover:bg-primary/90"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border/50 bg-card/30 px-3 py-2.5 text-xs text-muted-foreground text-center opacity-60">
            Complete as etapas acima para começar...
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentChatPanel;
