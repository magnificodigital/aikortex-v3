import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  ArrowLeft, Send, Bot, TestTube, Loader2, Sparkles,
  Paperclip, HelpCircle, AlertTriangle, KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import AgentRightPanel, { type AgentConfig, type ApiConfig } from "@/components/aikortex/AgentRightPanel";
import { useAgentChat } from "@/hooks/use-agent-chat";
import { useApiKeys } from "@/hooks/use-api-keys";
import { useUserAgents } from "@/hooks/use-user-agents";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import type { AgentType } from "@/types/agent-builder";
import { AGENT_PRESETS } from "@/types/agent-presets";
import { supabase } from "@/integrations/supabase/client";

import avatar1 from "@/assets/avatars/avatar-1.png";
import avatar2 from "@/assets/avatars/avatar-2.png";
import avatar3 from "@/assets/avatars/avatar-3.png";
import avatar8 from "@/assets/avatars/avatar-8.png";

/* ── Constants ── */

const TEMPLATE_MAP: Record<string, { name: string; avatar: string; model: string; agentType: AgentType }> = {
  "sdr-1":    { name: "Agente SDR",           avatar: avatar1, model: "gemini-2.5-flash", agentType: "SDR" },
  "bdr-1":    { name: "Agente BDR",           avatar: avatar2, model: "gemini-2.5-flash", agentType: "BDR" },
  "sac-1":    { name: "Agente SAC",           avatar: avatar3, model: "gemini-2.5-flash", agentType: "SAC" },
  "social-1": { name: "Social Media Manager", avatar: avatar8, model: "gemini-2.5-flash", agentType: "Custom" },
  "custom-1": { name: "Agente Personalizado", avatar: avatar1, model: "gemini-2.5-flash", agentType: "Custom" },
};

const AVATAR_BY_TYPE: Record<string, string> = {
  SDR: avatar1, BDR: avatar2, SAC: avatar3, CS: avatar3, Custom: avatar1,
};

const LLM_MODELS = [
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash", provider: "gemini" },
  { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro", provider: "gemini" },
  { value: "gpt-5", label: "GPT-5", provider: "openai" },
  { value: "gpt-4o", label: "GPT-4o", provider: "openai" },
  { value: "claude-4-sonnet", label: "Claude 4 Sonnet", provider: "anthropic" },
  { value: "claude-3.5-sonnet", label: "Claude 3.5 Sonnet", provider: "anthropic" },
] as const;

const getProviderForModel = (model: string): string => {
  if (model.startsWith("gemini")) return "gemini";
  if (model.startsWith("gpt")) return "openai";
  if (model.startsWith("claude")) return "anthropic";
  return "openai";
};

/* ── Field parsing from AI responses ── */

function parseAgentFields(text: string): { field: string; value: string } | null {
  try {
    // Try to find JSON with "field" and "value" keys
    const match = text.match(/\{[^{}]*"field"\s*:\s*"[^"]*"[^{}]*"value"\s*:\s*"[^"]*"[^{}]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (parsed.field && parsed.value) return parsed;
    }
    // Try reverse order
    const match2 = text.match(/\{[^{}]*"value"\s*:\s*"[^"]*"[^{}]*"field"\s*:\s*"[^"]*"[^{}]*\}/);
    if (match2) {
      const parsed = JSON.parse(match2[0]);
      if (parsed.field && parsed.value) return parsed;
    }
  } catch { /* ignore */ }
  return null;
}

/* ── Build setup system prompt ── */

function buildSetupSystemPrompt(agentType: AgentType, currentFields: Record<string, string>): string {
  const fieldStatus = Object.entries(currentFields)
    .map(([k, v]) => `- ${k}: ${v || "(vazio)"}`)
    .join("\n");

  return `Você é um assistente especializado em configurar agentes de IA na plataforma Aikortex.

Seu trabalho é coletar as informações necessárias para configurar o agente através de uma conversa natural.

REGRAS:
- Faça UMA pergunta por vez, máximo 2 linhas
- Quando o usuário responder, confirme com ✅ e extraia o valor
- Após cada resposta válida, retorne um JSON no formato:
  {"field": "nome_do_campo", "value": "valor_extraído"}
  seguido de sua mensagem de confirmação e próxima pergunta
- Campos disponíveis e ordem de coleta:
  1. name - Nome do agente
  2. description - Qual empresa ou negócio ele representa
  3. objective - Objetivo principal (o que ele deve fazer)
  4. toneOfVoice - Tom de voz (ofereça: Profissional e Amigável, Formal, Casual, Empático, Direto)
  5. greetingMessage - Mensagem de saudação (primeira mensagem que o agente envia)
  6. channels - Canais de atuação (WhatsApp, Instagram, Site, etc.)
- Seja natural e encorajador
- Quando TODOS os campos estiverem preenchidos, mostre um resumo formatado e pergunte: "Posso salvar o agente?"
- Se o usuário confirmar o salvamento, responda com: {"field": "SAVE", "value": "confirmed"}

ESTADO ATUAL DOS CAMPOS:
${fieldStatus}

Tipo do agente: ${agentType}

Se já existem campos preenchidos, pergunte apenas os que faltam. Se todos estiverem preenchidos, funcione em modo de ajuste — aceite alterações pontuais.`;
}

/* ── Component ── */

const AgentDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { agentId } = useParams();
  const navState = location.state as any;

  const isTemplate = !!agentId && !!TEMPLATE_MAP[agentId];
  const templateAgent = isTemplate ? TEMPLATE_MAP[agentId!] : null;
  const initialAgentType: AgentType = (navState?.agentType as AgentType) || templateAgent?.agentType || "Custom";

  // ── Loaded agent state ──
  const [loadedAgent, setLoadedAgent] = useState(() => {
    if (templateAgent) {
      return { name: templateAgent.name, avatar: templateAgent.avatar, model: templateAgent.model, agentType: templateAgent.agentType, savedConfig: null as Record<string, any> | null };
    }
    return { name: "Carregando...", avatar: avatar1, model: "gemini-2.5-flash", agentType: initialAgentType, savedConfig: null as Record<string, any> | null };
  });
  const [agentLoading, setAgentLoading] = useState(!isTemplate);

  useEffect(() => {
    if (isTemplate || !agentId) { setAgentLoading(false); return; }
    const load = async () => {
      setAgentLoading(true);
      const { data } = await supabase.from("user_agents").select("*").eq("id", agentId).single();
      if (data) {
        setLoadedAgent({
          name: data.name,
          avatar: data.avatar_url || AVATAR_BY_TYPE[data.agent_type] || avatar1,
          model: data.model || "gemini-2.5-flash",
          agentType: (data.agent_type as AgentType) || "Custom",
          savedConfig: (typeof data.config === "object" && data.config !== null && !Array.isArray(data.config) ? data.config : null) as Record<string, any> | null,
        });
      }
      setAgentLoading(false);
    };
    load();
  }, [agentId, isTemplate]);

  const { saveAgent, deleteAgent } = useUserAgents();

  // ── Core state ──
  const storagePrefix = `agent-detail-${agentId || "new"}`;
  const [agentModel, setAgentModel] = useState(() => loadedAgent.model);
  const [rightPanelTab, setRightPanelTab] = useState("agent");
  const [chatMode, setChatMode] = useState<"setup" | "test">("setup");
  const [agentConfig, setAgentConfig] = useState<AgentConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [fieldUpdates, setFieldUpdates] = useState<Record<string, string>>({});

  // ── Setup chat state ──
  const isExistingAgent = !isTemplate && agentId && agentId.length > 10; // UUID
  const [setupMessages, setSetupMessages] = useState<Array<{ role: "user" | "agent"; text: string }>>([]);
  const [setupInput, setSetupInput] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Track collected fields for the system prompt
  const [collectedFields, setCollectedFields] = useState<Record<string, string>>(() => {
    if (loadedAgent.savedConfig) {
      return {
        name: loadedAgent.name || "",
        description: (loadedAgent.savedConfig as any)?.objective || "",
        objective: (loadedAgent.savedConfig as any)?.objective || "",
        toneOfVoice: (loadedAgent.savedConfig as any)?.toneOfVoice || "",
        greetingMessage: (loadedAgent.savedConfig as any)?.greetingMessage || "",
        channels: ((loadedAgent.savedConfig as any)?.channels || []).join(", "),
      };
    }
    // Pre-fill from preset if template
    if (isTemplate && templateAgent) {
      const preset = AGENT_PRESETS[templateAgent.agentType];
      return {
        name: "",
        description: "",
        objective: preset?.context?.painPoints || "",
        toneOfVoice: preset?.context?.toneOfVoice || "",
        greetingMessage: preset?.context?.greetingMessage || "",
        channels: "",
      };
    }
    return { name: "", description: "", objective: "", toneOfVoice: "", greetingMessage: "", channels: "" };
  });

  // Update collected fields when loaded agent data arrives
  useEffect(() => {
    if (!isTemplate && loadedAgent.savedConfig) {
      const cfg = loadedAgent.savedConfig as any;
      setCollectedFields({
        name: loadedAgent.name || "",
        description: cfg?.objective || "",
        objective: cfg?.objective || "",
        toneOfVoice: cfg?.toneOfVoice || "",
        greetingMessage: cfg?.greetingMessage || "",
        channels: (cfg?.channels || []).join(", "),
      });
    }
  }, [loadedAgent.savedConfig, isTemplate, loadedAgent.name]);

  // Auto-welcome message
  useEffect(() => {
    if (setupMessages.length > 0) return;
    if (isExistingAgent) {
      setSetupMessages([{
        role: "agent",
        text: `Olá! 👋 O que você gostaria de ajustar no agente **${loadedAgent.name}**?`,
      }]);
    } else {
      setSetupMessages([{
        role: "agent",
        text: `Olá! 👋 Vou te ajudar a configurar seu agente${initialAgentType !== "Custom" ? ` **${initialAgentType}**` : ""}. Vamos começar?\n\nQual será o **nome** do seu agente?`,
      }]);
    }
  }, [isExistingAgent, loadedAgent.name, initialAgentType]);

  // ── Parse AI responses for field updates ──
  const processedMsgCount = useRef(0);
  useEffect(() => {
    if (setupMessages.length <= processedMsgCount.current) return;
    const newMessages = setupMessages.slice(processedMsgCount.current);
    processedMsgCount.current = setupMessages.length;

    for (const msg of newMessages) {
      if (msg.role !== "agent") continue;
      const parsed = parseAgentFields(msg.text);
      if (!parsed) continue;

      if (parsed.field === "SAVE" && parsed.value === "confirmed") {
        // Trigger save
        handleAutoSave();
        continue;
      }

      // Update collected fields
      setCollectedFields(prev => ({ ...prev, [parsed.field]: parsed.value }));
      // Push to right panel
      setFieldUpdates(prev => ({ ...prev, [parsed.field]: parsed.value }));
    }
  }, [setupMessages]);

  // ── Send setup message ──
  const handleSetupSend = useCallback(async () => {
    if (!setupInput.trim() || setupLoading) return;
    const userText = setupInput.trim();
    setSetupInput("");
    setSetupMessages(prev => [...prev, { role: "user", text: userText }]);
    setSetupLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const systemPrompt = buildSetupSystemPrompt(loadedAgent.agentType, collectedFields);

      // Build messages for API
      const apiMessages = [
        { role: "system", content: systemPrompt },
        ...setupMessages.map(m => ({
          role: m.role === "agent" ? "assistant" : "user",
          content: m.text,
        })),
        { role: "user", content: userText },
      ];

      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/app-chat`;

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          messages: apiMessages.filter(m => m.role !== "system"),
          appContext: {
            app_type: "agent",
            agent_type: loadedAgent.agentType,
            language: "pt-BR",
          },
          mode: "structure",
          // Pass system prompt via appContext to keep it simple
        }),
      });

      if (!resp.ok) {
        throw new Error(`Erro ${resp.status}`);
      }

      const data = await resp.json();
      let aiText = "";

      // The structure mode returns structuredConfig, but we want a conversational response
      // So let's use a direct gateway call instead
      const gatewayResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: apiMessages,
          stream: false,
        }),
      });

      if (gatewayResp.ok) {
        const gData = await gatewayResp.json();
        aiText = gData.choices?.[0]?.message?.content || "Desculpe, não consegui processar. Tente novamente.";
      } else {
        aiText = "⚠️ Não foi possível conectar ao assistente. Tente novamente.";
      }

      setSetupMessages(prev => [...prev, { role: "agent", text: aiText }]);
    } catch (e: any) {
      console.error("Setup chat error:", e);
      setSetupMessages(prev => [...prev, { role: "agent", text: `⚠️ ${e.message || "Erro ao conectar com a IA."}` }]);
    } finally {
      setSetupLoading(false);
    }
  }, [setupInput, setupLoading, setupMessages, collectedFields, loadedAgent.agentType]);

  // ── Auto-save from chat ──
  const handleAutoSave = useCallback(async () => {
    if (!agentConfig) return;
    setIsSaving(true);
    try {
      const result = await saveAgent({
        id: agentId && !TEMPLATE_MAP[agentId] ? agentId : undefined,
        name: agentConfig.name || collectedFields.name || "Meu Agente",
        agent_type: loadedAgent.agentType,
        description: agentConfig.description,
        avatar_url: agentConfig.avatarUrl,
        model: agentModel,
        status: "configuring",
        config: {
          objective: agentConfig.objective,
          instructions: agentConfig.instructions,
          toneOfVoice: agentConfig.toneOfVoice,
          greetingMessage: agentConfig.greetingMessage,
          channels: agentConfig.channels,
          integrations: agentConfig.integrations,
          knowledgeFiles: agentConfig.knowledgeFiles,
          urls: agentConfig.urls,
          apiConfig: agentConfig.apiConfig,
        },
      });
      if (result) {
        toast.success("Agente salvo com sucesso!");
        if (agentId && TEMPLATE_MAP[agentId] && result.id !== agentId) {
          navigate(`/aikortex/agents/${result.id}`, { replace: true });
        }
        setSetupMessages(prev => [...prev, {
          role: "agent",
          text: "✅ Agente salvo com sucesso! Você pode clicar em **Testar** para experimentar o agente ou continuar ajustando aqui.",
        }]);
      }
    } catch {
      toast.error("Erro ao salvar agente.");
    } finally {
      setIsSaving(false);
    }
  }, [agentConfig, agentId, agentModel, collectedFields, loadedAgent.agentType, saveAgent, navigate]);

  // ── Manual save from right panel ──
  const handleSaveAgent = useCallback(async (config: AgentConfig & { model: string; agentType: string }) => {
    setIsSaving(true);
    try {
      const result = await saveAgent({
        id: agentId && !TEMPLATE_MAP[agentId] ? agentId : undefined,
        name: config.name,
        agent_type: config.agentType,
        description: config.description,
        avatar_url: config.avatarUrl,
        model: config.model,
        status: "configuring",
        config: {
          objective: config.objective,
          instructions: config.instructions,
          toneOfVoice: config.toneOfVoice,
          greetingMessage: config.greetingMessage,
          channels: config.channels,
          integrations: config.integrations,
          knowledgeFiles: config.knowledgeFiles,
          urls: config.urls,
          apiConfig: config.apiConfig,
        },
      });
      if (result) {
        toast.success("Agente salvo com sucesso!");
        if (agentId && TEMPLATE_MAP[agentId] && result.id !== agentId) {
          navigate(`/aikortex/agents/${result.id}`, { replace: true });
        }
      }
    } finally {
      setIsSaving(false);
    }
  }, [agentId, saveAgent, navigate]);

  // ── Publish handler ──
  const handlePublish = useCallback(async () => {
    if (!agentConfig?.name) return;
    setIsSaving(true);
    try {
      const result = await saveAgent({
        id: agentId && !TEMPLATE_MAP[agentId] ? agentId : undefined,
        name: agentConfig.name,
        agent_type: loadedAgent.agentType,
        description: agentConfig.description,
        avatar_url: agentConfig.avatarUrl,
        model: agentModel,
        status: "active",
        config: {
          objective: agentConfig.objective,
          instructions: agentConfig.instructions,
          toneOfVoice: agentConfig.toneOfVoice,
          greetingMessage: agentConfig.greetingMessage,
          channels: agentConfig.channels,
          integrations: agentConfig.integrations,
          knowledgeFiles: agentConfig.knowledgeFiles,
          urls: agentConfig.urls,
          apiConfig: agentConfig.apiConfig,
        },
      });
      if (result) {
        toast.success("Agente publicado e ativo! 🚀");
        if (agentId && TEMPLATE_MAP[agentId] && result.id !== agentId) {
          navigate(`/aikortex/agents/${result.id}`, { replace: true });
        }
      }
    } finally {
      setIsSaving(false);
    }
  }, [agentConfig, agentId, agentModel, loadedAgent.agentType, saveAgent, navigate]);

  const handleConfigChange = useCallback((config: AgentConfig) => {
    setAgentConfig(config);
  }, []);

  // ── API keys ──
  const { keys, loading: keysLoading, refetch: refetchKeys } = useApiKeys();
  const currentProvider = useMemo(() => getProviderForModel(agentModel), [agentModel]);
  const availableModels = useMemo(() => LLM_MODELS.filter(m => keys[m.provider]?.configured), [keys]);
  const hasApiKey = !!keys[currentProvider]?.configured;
  const hasAnyLLMKey = useMemo(() => ["openai", "anthropic", "gemini", "openrouter"].some(p => keys[p]?.configured), [keys]);

  useEffect(() => { if (rightPanelTab !== "connectors") refetchKeys(); }, [rightPanelTab, refetchKeys]);
  useEffect(() => {
    if (chatMode !== "test" || keysLoading) return;
    if (!keys[getProviderForModel(agentModel)]?.configured) setRightPanelTab("connectors");
  }, [agentModel, chatMode, keys, keysLoading]);

  useEffect(() => {
    if (!isTemplate && loadedAgent.model) setAgentModel(loadedAgent.model);
  }, [loadedAgent.model, isTemplate]);

  // ── Scroll on new messages ──
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [setupMessages, setupLoading]);

  // ── Test mode chat ──
  const testSystemPrompt = useMemo(() => {
    if (!agentConfig) return undefined;
    const parts: string[] = [];
    parts.push(`Você é o agente "${agentConfig.name}".`);
    parts.push(`\n\nVocê deve agir de forma totalmente coerente com a configuração operacional recebida.`);
    if (agentConfig.description) parts.push(`\n\nDescrição:\n${agentConfig.description}`);
    if (agentConfig.objective) parts.push(`\n\nObjetivo:\n${agentConfig.objective}`);
    if (agentConfig.instructions) parts.push(`\n\nInstruções:\n${agentConfig.instructions}`);
    if (agentConfig.toneOfVoice) parts.push(`\n\nTom de voz: ${agentConfig.toneOfVoice}`);
    if (agentConfig.greetingMessage) parts.push(`\n\nSaudação: ${agentConfig.greetingMessage}`);
    parts.push(`\n\nResponda sempre em português brasileiro.`);
    return parts.join("");
  }, [agentConfig]);

  const testApiConfig = agentConfig?.apiConfig;
  const testChat = useAgentChat(
    [{ role: "agent", text: `🧪 Modo de Teste ativado! Envie uma mensagem para testar o agente **${loadedAgent.name}**.` }],
    {
      provider: currentProvider,
      model: agentModel,
      systemPrompt: testSystemPrompt,
      persistKey: `${storagePrefix}-test-messages`,
      apiConfig: testApiConfig ? {
        temperature: testApiConfig.temperature,
        maxTokens: testApiConfig.maxTokens,
        topP: testApiConfig.topP,
        frequencyPenalty: testApiConfig.frequencyPenalty,
        presencePenalty: testApiConfig.presencePenalty,
        responseFormat: testApiConfig.responseFormat,
        stopSequences: testApiConfig.stopSequences,
      } : undefined,
    }
  );

  const canSendTest = !keysLoading && hasApiKey;
  const [testInput, setTestInput] = useState("");

  const handleTestSend = () => {
    if (!testInput.trim() || testChat.isStreaming || !canSendTest) return;
    testChat.sendMessage(testInput.trim());
    setTestInput("");
  };

  // ── Can publish? ──
  const canPublish = !!(agentConfig?.name?.trim()) && hasAnyLLMKey;

  // ── Loading ──
  if (agentLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-sm">Carregando agente...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* LEFT panel */}
      <div className="w-full max-w-[55%] flex flex-col border-r border-border">
        {/* Header */}
        <div className="h-12 border-b border-border flex items-center gap-3 px-4 shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate("/aikortex/agents")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <img src={loadedAgent.avatar} alt={loadedAgent.name} className="w-7 h-7 rounded-full object-cover" />
          <span className="text-sm font-semibold">{agentConfig?.name || loadedAgent.name}</span>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{loadedAgent.agentType}</span>

          <div className="ml-auto flex items-center gap-1.5">
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
        </div>

        {/* ══ SETUP MODE ══ */}
        {chatMode === "setup" && (
          <>
            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
              {setupMessages.map((m, i) => (
                <div key={i}>
                  {m.role === "user" ? (
                    <div className="flex justify-end">
                      <div className="bg-primary/10 border border-primary/20 rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[85%] text-sm">
                        <p className="whitespace-pre-wrap text-foreground">{m.text}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="text-sm leading-relaxed text-foreground flex-1 min-w-0">
                        <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:mb-2 [&_strong]:text-foreground">
                          <ReactMarkdown>
                            {m.text.replace(/\{"field".*?"value".*?\}/g, "").trim()}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {setupLoading && (
                <div className="flex gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5 text-primary animate-pulse" />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    Pensando...
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border">
              <div className="rounded-xl border border-border bg-card/50 p-1 transition-colors focus-within:border-primary/30">
                <textarea
                  value={setupInput}
                  onChange={(e) => setSetupInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSetupSend();
                    }
                  }}
                  placeholder="Digite sua resposta..."
                  rows={1}
                  disabled={setupLoading}
                  className="w-full bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground px-3 py-2 min-h-[36px] max-h-[120px] disabled:cursor-not-allowed"
                />
                <div className="flex items-center justify-end px-2 pb-1">
                  <Button
                    size="icon"
                    onClick={handleSetupSend}
                    disabled={!setupInput.trim() || setupLoading}
                    className="h-8 w-8 rounded-full"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ══ TEST MODE ══ */}
        {chatMode === "test" && (
          <>
            <div className="px-4 py-1.5 border-b border-border bg-muted/30 flex items-center gap-2">
              <Badge variant="outline" className="text-xs gap-1">
                <TestTube className="w-3 h-3" />
                Modo Teste — {hasApiKey ? (LLM_MODELS.find(m => m.value === agentModel)?.label || agentModel) : "Configure sua chave de API"}
                <span className={`w-1.5 h-1.5 rounded-full ${hasApiKey ? "bg-emerald-500" : "bg-destructive"}`} />
              </Badge>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {testChat.messages.map((msg, i) => (
                  <div key={i} className={`flex gap-2.5 items-start ${msg.role === "user" ? "justify-end" : ""}`}>
                    {msg.role === "agent" && (
                      <img src={loadedAgent.avatar} alt="" className="w-6 h-6 rounded-full object-cover mt-0.5" />
                    )}
                    <div className={`rounded-xl px-3.5 py-2.5 text-sm max-w-[75%] ${
                      msg.role === "agent" ? "bg-muted/60 text-foreground" : "bg-primary text-primary-foreground ml-auto"
                    }`}>
                      {msg.role === "agent" ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                      ) : msg.text}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {!keysLoading && !hasApiKey && (
              <div className="px-4 pt-2">
                <Alert className="border-primary/30 bg-primary/5">
                  <KeyRound className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-xs text-muted-foreground flex items-center justify-between">
                    <span>Configure uma chave de API na aba <strong className="text-foreground">Integrações</strong> para testar.</span>
                    <Button variant="outline" size="sm" className="text-xs gap-1 ml-3 shrink-0" onClick={() => setRightPanelTab("connectors")}>
                      <KeyRound className="w-3 h-3" /> Integrações
                    </Button>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <div className="px-4 pb-4 pt-2">
              <div className="border border-border rounded-xl bg-muted/30 flex flex-col">
                <Textarea
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleTestSend();
                    }
                  }}
                  placeholder={!hasApiKey && !keysLoading ? "⚠️ Configure sua chave de API..." : "Envie uma mensagem para testar..."}
                  className="border-0 bg-transparent text-sm min-h-[80px] max-h-[160px] resize-none focus-visible:ring-0 focus-visible:ring-offset-0 p-4"
                  disabled={!canSendTest}
                />
                <div className="flex items-center justify-between px-3 pb-3">
                  <div className="flex items-center gap-2">
                    {availableModels.length > 0 && (
                      <select
                        value={agentModel}
                        onChange={(e) => setAgentModel(e.target.value)}
                        className="text-xs text-muted-foreground bg-transparent border border-border rounded-md px-2 py-1 cursor-pointer"
                      >
                        {availableModels.map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <Button
                    size="icon" className="h-8 w-8 rounded-full"
                    onClick={handleTestSend}
                    disabled={!testInput.trim() || testChat.isStreaming || !canSendTest}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* RIGHT — Panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AgentRightPanel
          agent={{ name: loadedAgent.name, avatar: loadedAgent.avatar }}
          agentType={loadedAgent.agentType}
          agentModel={agentModel}
          onModelChange={setAgentModel}
          activeTab={rightPanelTab}
          onTabChange={setRightPanelTab}
          onApiKeysChanged={refetchKeys}
          onConfigChange={handleConfigChange}
          onSaveAgent={handleSaveAgent}
          onPublish={handlePublish}
          canPublish={canPublish}
          isSaving={isSaving}
          storagePrefix={storagePrefix}
          savedConfig={isTemplate ? null : loadedAgent.savedConfig}
          fieldUpdates={fieldUpdates}
          onDeleteAgent={async () => {
            if (agentId && !TEMPLATE_MAP[agentId]) {
              const ok = await deleteAgent(agentId);
              if (ok) {
                toast.success("Agente excluído.");
                navigate("/aikortex/agents");
              }
            }
          }}
        />
      </div>
    </div>
  );
};

export default AgentDetail;
