import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  ArrowLeft, Send, Paperclip, HelpCircle, AlertTriangle, KeyRound,
  Bot, TestTube, Loader2, Sparkles, Check, Pencil, RotateCw,
  ArrowUp, CheckCircle2, AlertCircle, Wrench, ChevronUp, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { DEFAULT_ADVANCED_CONFIG } from "@/types/agent-builder";
import { supabase } from "@/integrations/supabase/client";

import avatar1 from "@/assets/avatars/avatar-1.png";
import avatar2 from "@/assets/avatars/avatar-2.png";
import avatar3 from "@/assets/avatars/avatar-3.png";
import avatar8 from "@/assets/avatars/avatar-8.png";
import { DEFAULT_FREE_SETUP_MODEL, GATEWAY_MODELS, normalizeFreeSetupModel } from "@/lib/free-setup-models";

/* ── Constants ── */

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/app-chat`;

const TEMPLATE_MAP: Record<string, { name: string; avatar: string; model: string; agentType: AgentType }> = {
  "sdr-1":    { name: "Agente SDR",             avatar: avatar1, model: "gemini-2.5-flash", agentType: "SDR" },
  "bdr-1":    { name: "Agente BDR",             avatar: avatar2, model: "gemini-2.5-flash", agentType: "BDR" },
  "sac-1":    { name: "Agente SAC",             avatar: avatar3, model: "gemini-2.5-flash", agentType: "SAC" },
  "social-1": { name: "Social Media Manager",   avatar: avatar8, model: "gemini-2.5-flash", agentType: "Custom" },
  "custom-1": { name: "Agente Personalizado",   avatar: avatar1, model: "gemini-2.5-flash", agentType: "Custom" },
};

const AVATAR_BY_TYPE: Record<string, string> = {
  SDR: avatar1, BDR: avatar2, SAC: avatar3, CS: avatar3, Custom: avatar1,
};

const LLM_MODELS = [
  { value: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro",       provider: "gemini" },
  { value: "gemini-3-flash-preview", label: "Gemini 3 Flash",       provider: "gemini" },
  { value: "gemini-2.5-pro",         label: "Gemini 2.5 Pro",       provider: "gemini" },
  { value: "gemini-2.5-flash",       label: "Gemini 2.5 Flash",     provider: "gemini" },
  { value: "gemini-2.5-flash-lite",  label: "Gemini 2.5 Flash Lite",provider: "gemini" },
  { value: "gpt-5.2",                label: "GPT-5.2",              provider: "openai" },
  { value: "gpt-5",                  label: "GPT-5",                provider: "openai" },
  { value: "gpt-5-mini",             label: "GPT-5 Mini",           provider: "openai" },
  { value: "gpt-5-nano",             label: "GPT-5 Nano",           provider: "openai" },
  { value: "gpt-4o",                 label: "GPT-4o",               provider: "openai" },
  { value: "gpt-4o-mini",            label: "GPT-4o Mini",          provider: "openai" },
  { value: "gpt-4-turbo",            label: "GPT-4 Turbo",          provider: "openai" },
  { value: "gpt-4",                  label: "GPT-4",                provider: "openai" },
  { value: "gpt-3.5-turbo",          label: "GPT-3.5 Turbo",        provider: "openai" },
  { value: "claude-4-sonnet",        label: "Claude 4 Sonnet",      provider: "anthropic" },
  { value: "claude-3.5-sonnet",      label: "Claude 3.5 Sonnet",    provider: "anthropic" },
  { value: "claude-3-opus",          label: "Claude 3 Opus",        provider: "anthropic" },
  { value: "claude-3-haiku",         label: "Claude 3 Haiku",       provider: "anthropic" },
] as const;

const getProviderForModel = (model: string): string => {
  if (model.startsWith("gemini")) return "gemini";
  if (model.startsWith("gpt"))    return "openai";
  if (model.startsWith("claude")) return "anthropic";
  if (model.includes("/"))        return "openrouter";
  return "openai";
};

const stepLabels = [
  { id: "discover" as const, label: "Descobrir", num: 1 },
  { id: "structure" as const, label: "Estruturar", num: 2 },
  { id: "build" as const, label: "Construir", num: 3 },
];

const toneLabels: Record<string, string> = {
  professional_friendly: "Profissional e Amigável",
  formal: "Formal",
  casual: "Casual",
  empathetic: "Empático",
  direct: "Direto",
};

const SUGGESTIONS_BY_TYPE: Record<AgentType, string[]> = {
  SDR: [
    "Agente que qualifica leads inbound e agenda reuniões",
    "SDR que coleta nome, empresa e cargo antes de passar para o closer",
    "Assistente de vendas que aplica BANT e envia materiais",
    "Qualificador automático com follow-up por WhatsApp",
  ],
  BDR: [
    "Agente de prospecção outbound para empresas de tecnologia",
    "BDR que pesquisa empresas-alvo e envia mensagens personalizadas",
    "Prospector que identifica decisores e agenda reuniões",
    "Agente outbound com cadência multicanal",
  ],
  SAC: [
    "Agente de suporte que resolve dúvidas e abre chamados",
    "Atendente que resolve problemas técnicos e coleta feedback",
    "Suporte 24/7 com escalonamento para humano",
    "Assistente de atendimento com FAQ inteligente",
  ],
  CS: [
    "Agente de onboarding que guia novos clientes",
    "Customer Success com health check mensal",
    "Agente de retenção que previne churn",
    "Consultor de sucesso com NPS automático",
  ],
  Custom: [
    "Assistente virtual para atendimento ao cliente",
    "Agente de IA para automação de processos",
    "Bot conversacional para captação de leads",
    "Assistente inteligente personalizado",
  ],
};

/* ── Structured Config Type ── */

interface StructuredAgentConfig {
  agent_name: string;
  agent_type: string;
  description: string;
  objective: string;
  tone: string;
  language: string;
  greeting_message: string;
  instructions: string;
  quick_replies: string[];
  stages: Array<{ id: string; name: string; description: string; example: string }>;
}

/* ── JSON extraction ── */

function extractJson(raw: string): any {
  let cleaned = raw.replace(/^```(?:json)?\s*\n?/gm, "").replace(/\n?```\s*$/gm, "").trim();
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
  cleaned = cleaned.replace(/,\s*([}\]])/g, "$1");
  return JSON.parse(cleaned);
}

/* ── API helpers ── */

async function requestStructure(description: string, agentType: string, language: string): Promise<StructuredAgentConfig | null> {
  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
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
    const raw = typeof data.structuredConfig === "string" ? extractJson(data.structuredConfig) : data.structuredConfig;
    return raw as StructuredAgentConfig;
  } catch {
    return null;
  }
}

/* ── Chat message type for wizard ── */

interface WizardChatMessage {
  role: "user" | "assistant";
  content: string;
}

/* ── Loaded Agent ── */

interface LoadedAgent {
  name: string;
  avatar: string;
  model: string;
  agentType: AgentType;
  savedConfig: Record<string, any> | null;
}

/* ── Component ── */

const AgentDetail = () => {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { agentId } = useParams();
  const navState   = location.state as any;

  const isTemplate = !!agentId && !!TEMPLATE_MAP[agentId];
  const templateAgent = isTemplate ? TEMPLATE_MAP[agentId!] : null;
  const initialAgentType: AgentType = (navState?.agentType as AgentType) || templateAgent?.agentType || "Custom";

  const [loadedAgent, setLoadedAgent] = useState<LoadedAgent>(() => {
    if (templateAgent) {
      return { name: templateAgent.name, avatar: templateAgent.avatar, model: templateAgent.model, agentType: templateAgent.agentType, savedConfig: null };
    }
    return { name: "Carregando...", avatar: avatar1, model: "gemini-2.5-flash", agentType: initialAgentType, savedConfig: null };
  });
  const [agentLoading, setAgentLoading] = useState(!isTemplate);

  useEffect(() => {
    if (isTemplate || !agentId) {
      setAgentLoading(false);
      return;
    }
    const load = async () => {
      setAgentLoading(true);
      const { data } = await supabase
        .from("user_agents")
        .select("*")
        .eq("id", agentId)
        .single();
      if (data) {
        const avatarSrc = data.avatar_url || AVATAR_BY_TYPE[data.agent_type] || avatar1;
        setLoadedAgent({
          name: data.name,
          avatar: avatarSrc,
          model: data.model || "gemini-2.5-flash",
          agentType: (data.agent_type as AgentType) || "Custom",
          savedConfig: (typeof data.config === 'object' && data.config !== null && !Array.isArray(data.config) ? data.config : null) as Record<string, any> | null,
        });
      }
      setAgentLoading(false);
    };
    load();
  }, [agentId, isTemplate]);

  const { saveAgent } = useUserAgents();

  const presetData = useMemo(() => {
    if (navState?.fromTemplate) return undefined;
    return undefined;
  }, [navState]);

  useEffect(() => {
    if (!navState?.fromTemplate || !agentId) return;
    const prefix = `agent-detail-${agentId}`;
    try {
      ["name","desc","objective","instructions","toneOfVoice","greetingMessage","files","urls","channels","apiConfig","avatar"].forEach(k =>
        localStorage.removeItem(`${prefix}-${k}`)
      );
      localStorage.removeItem(`${prefix}-setup-messages`);
      localStorage.removeItem(`${prefix}-test-messages`);
      localStorage.removeItem(`${prefix}-chatMode`);
    } catch {}
  }, [navState?.fromTemplate, agentId]);

  const storagePrefix = `agent-detail-${agentId || "new"}`;

  const [input,        setInput]        = useState("");
  const [agentModel,   setAgentModel]   = useState(() => {
    try { return localStorage.getItem(`${storagePrefix}-model`) || loadedAgent.model; } catch { return loadedAgent.model; }
  });
  const [rightPanelTab, setRightPanelTab] = useState("agent");
  const [chatMode,     setChatMode]     = useState<"setup" | "test">(() => {
    if (navState?.chatMode === "test") return "test";
    try { return (localStorage.getItem(`${storagePrefix}-chatMode`) as "setup" | "test") || "setup"; } catch { return "setup"; }
  });
  const [agentConfig,  setAgentConfig]  = useState<AgentConfig | null>(null);
  const [isSaving,     setIsSaving]     = useState(false);

  /* ── Wizard State ── */
  const isNewAgent = isTemplate || navState?.fromTemplate;
  const [wizardStep, setWizardStep] = useState<"discover" | "structure" | "build" | "done">(
    isNewAgent ? "discover" : "done"
  );
  const [wizardPrompt, setWizardPrompt] = useState("");
  const [wizardMessages, setWizardMessages] = useState<WizardChatMessage[]>([]);
  const [structuredConfig, setStructuredConfig] = useState<StructuredAgentConfig | null>(null);
  const [isStructuring, setIsStructuring] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);
  const [editingConfig, setEditingConfig] = useState(false);
  const [toolLogs, setToolLogs] = useState<Array<{ label: string; status: "success" | "error" }>>([]);
  const [toolsExpanded, setToolsExpanded] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  /* ── Patch mode state ── */
  const [patchInput, setPatchInput] = useState("");
  const [isPatchLoading, setIsPatchLoading] = useState(false);

  useEffect(() => {
    if (!isTemplate && loadedAgent.model) {
      setAgentModel(prev => {
        const stored = (() => { try { return localStorage.getItem(`${storagePrefix}-model`); } catch { return null; } })();
        return stored || loadedAgent.model;
      });
    }
  }, [loadedAgent.model, isTemplate, storagePrefix]);

  const handleConfigChange = useCallback((config: AgentConfig) => {
    setAgentConfig(config);
  }, []);

  const handleSaveAgent = useCallback(async (config: AgentConfig & { model: string; agentType: string }) => {
    setIsSaving(true);
    try {
      const result = await saveAgent({
        id: agentId && !TEMPLATE_MAP[agentId] ? agentId : undefined,
        name:        config.name,
        agent_type:  config.agentType,
        description: config.description,
        avatar_url:  config.avatarUrl,
        model:       config.model,
        status:      "configuring",
        config: {
          objective:       config.objective,
          instructions:    config.instructions,
          toneOfVoice:     config.toneOfVoice,
          greetingMessage: config.greetingMessage,
          channels:        config.channels,
          integrations:    config.integrations,
          knowledgeFiles:  config.knowledgeFiles,
          urls:            config.urls,
          apiConfig:       config.apiConfig,
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

  const { keys, loading: keysLoading, refetch: refetchKeys } = useApiKeys();

  const currentProvider = useMemo(() => getProviderForModel(agentModel), [agentModel]);

  const availableModels = useMemo(() => {
    return LLM_MODELS.filter((model) => keys[model.provider]?.configured);
  }, [keys]);

  const hasApiKey    = !!keys[currentProvider]?.configured;
  const hasAnyLLMKey = useMemo(() => {
    return ["openai", "anthropic", "gemini", "openrouter"].some(p => keys[p]?.configured);
  }, [keys]);

  useEffect(() => {
    if (rightPanelTab !== "connectors") refetchKeys();
  }, [rightPanelTab, refetchKeys]);

  useEffect(() => {
    if (chatMode !== "test" || keysLoading) return;
    const providerForModel = getProviderForModel(agentModel);
    if (providerForModel && !keys[providerForModel]?.configured) {
      setRightPanelTab("connectors");
    }
  }, [agentModel, chatMode, keys, keysLoading]);

  useEffect(() => { try { localStorage.setItem(`${storagePrefix}-chatMode`, chatMode); } catch {} }, [chatMode, storagePrefix]);
  useEffect(() => { try { localStorage.setItem(`${storagePrefix}-model`, agentModel); } catch {} }, [agentModel, storagePrefix]);

  /* ── Scroll on message change ── */
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [wizardMessages, isStructuring, isBuilding]);

  /* ── Test mode chat ── */
  const testSystemPrompt = useMemo(() => {
    if (!agentConfig) return undefined;
    const parts: string[] = [];
    parts.push(`Você é o agente "${agentConfig.name}".`);
    parts.push(`\n\nVocê deve agir de forma totalmente coerente com a configuração operacional recebida.`);
    if (agentConfig.description)    parts.push(`\n\nDescrição, papel e instruções principais:\n${agentConfig.description}`);
    if (agentConfig.objective)      parts.push(`\n\nObjetivo/Missão:\n${agentConfig.objective}`);
    if (agentConfig.instructions)   parts.push(`\n\nRegras e instruções específicas:\n${agentConfig.instructions}`);
    if (agentConfig.toneOfVoice)    parts.push(`\n\nTom de voz: ${agentConfig.toneOfVoice}`);
    if (agentConfig.greetingMessage) parts.push(`\n\nMensagem de saudação padrão: ${agentConfig.greetingMessage}`);
    if (agentConfig.channels.length > 0)     parts.push(`\n\nCanais ativos: ${agentConfig.channels.join(", ")}`);
    if (agentConfig.integrations.length > 0) parts.push(`\n\nIntegrações configuradas: ${agentConfig.integrations.join(", ")}`);
    if (agentConfig.knowledgeFiles.length > 0) parts.push(`\n\nArquivos de conhecimento: ${agentConfig.knowledgeFiles.join(", ")}`);
    if (agentConfig.urls.length > 0) parts.push(`\n\nURLs de referência: ${agentConfig.urls.join(", ")}`);
    parts.push(`\n\nRegras obrigatórias:`);
    parts.push(`\n- Nunca diga que você é um assistente genérico.`);
    parts.push(`\n- Responda como o agente configurado.`);
    parts.push(`\n\nResponda sempre em português brasileiro.`);
    return parts.join("");
  }, [agentConfig]);

  const testApiConfig = agentConfig?.apiConfig;
  const testChat = useAgentChat(
    [{ role: "agent", text: `🧪 Modo de Teste ativado! Agora estou respondendo como o **${loadedAgent.name}** usando o modelo ${LLM_MODELS.find(m => m.value === agentModel)?.label || agentModel}. Envie uma mensagem para testar.` }],
    {
      provider:    currentProvider,
      model:       agentModel,
      systemPrompt: testSystemPrompt,
      persistKey:  `${storagePrefix}-test-messages`,
      agentContext: agentConfig ? {
        name:            agentConfig.name,
        description:     agentConfig.description,
        objective:       agentConfig.objective,
        instructions:    agentConfig.instructions,
        toneOfVoice:     agentConfig.toneOfVoice,
        greetingMessage: agentConfig.greetingMessage,
        channels:        agentConfig.channels,
        integrations:    agentConfig.integrations,
        knowledgeFiles:  agentConfig.knowledgeFiles,
        urls:            agentConfig.urls,
        provider:        currentProvider,
        model:           agentModel,
        temperature:     testApiConfig?.temperature,
        maxTokens:       testApiConfig?.maxTokens,
        topP:            testApiConfig?.topP,
        frequencyPenalty: testApiConfig?.frequencyPenalty,
        presencePenalty: testApiConfig?.presencePenalty,
        responseFormat:  testApiConfig?.responseFormat,
        stopSequences:   testApiConfig?.stopSequences,
      } : undefined,
      apiConfig: testApiConfig ? {
        temperature:      testApiConfig.temperature,
        maxTokens:        testApiConfig.maxTokens,
        topP:             testApiConfig.topP,
        frequencyPenalty: testApiConfig.frequencyPenalty,
        presencePenalty:  testApiConfig.presencePenalty,
        responseFormat:   testApiConfig.responseFormat,
        stopSequences:    testApiConfig.stopSequences,
      } : undefined,
    }
  );

  /* ── Wizard handlers ── */

  const handleDiscover = () => {
    if (wizardPrompt.length < 10) {
      toast.error("Descreva com pelo menos 10 caracteres.");
      return;
    }
    setWizardMessages(prev => [...prev, { role: "user", content: wizardPrompt }]);
    handleStructure(wizardPrompt);
  };

  const handleStructure = async (description: string) => {
    setWizardStep("structure");
    setIsStructuring(true);
    setWizardMessages(prev => [...prev, { role: "assistant", content: "🧠 Analisando sua descrição e estruturando o agente..." }]);

    const result = await requestStructure(description, initialAgentType, "pt-BR");

    if (result) {
      // Apply fallbacks from AGENT_PRESETS
      const preset = AGENT_PRESETS[initialAgentType];
      const config: StructuredAgentConfig = {
        agent_name: result.agent_name || preset?.context?.agentName || loadedAgent.name || "Meu Agente",
        agent_type: result.agent_type || initialAgentType,
        description: result.description || preset?.context?.targetAudienceDescription || "",
        objective: result.objective || preset?.context?.painPoints || "",
        tone: result.tone || "professional_friendly",
        language: result.language || "pt-BR",
        greeting_message: result.greeting_message || preset?.context?.greetingMessage || "",
        instructions: result.instructions || "",
        quick_replies: result.quick_replies || [],
        stages: result.stages || preset?.stages?.map(s => ({ id: s.id, name: s.name, description: s.description, example: s.example })) || [],
      };
      setStructuredConfig(config);

      setWizardMessages(prev => {
        const filtered = prev.filter(m => m.content !== "🧠 Analisando sua descrição e estruturando o agente...");
        return [...filtered, { role: "assistant", content: `✅ Estrutura definida para **${config.agent_name}**!\n\nRevise a configuração abaixo e clique em **Construir** quando estiver pronto.` }];
      });
    } else {
      toast.error("Erro ao estruturar. Tente novamente.");
      setWizardStep("discover");
      setWizardMessages(prev => prev.filter(m => m.content !== "🧠 Analisando sua descrição e estruturando o agente..."));
    }
    setIsStructuring(false);
  };

  const handleBuild = async () => {
    if (!structuredConfig) return;
    setWizardStep("build");
    setIsBuilding(true);

    const buildMsg = `🚀 **Construindo ${structuredConfig.agent_name}**\n\nTipo: ${structuredConfig.agent_type} · Tom: ${toneLabels[structuredConfig.tone] || structuredConfig.tone} · Idioma: ${structuredConfig.language}`;
    setWizardMessages(prev => [...prev, { role: "assistant", content: buildMsg }]);
    setToolLogs(prev => [...prev, { label: "Salvando configuração do agente...", status: "success" }]);

    try {
      const result = await saveAgent({
        id: agentId && !TEMPLATE_MAP[agentId] ? agentId : undefined,
        name:        structuredConfig.agent_name,
        agent_type:  structuredConfig.agent_type || initialAgentType,
        description: structuredConfig.description,
        avatar_url:  loadedAgent.avatar,
        model:       agentModel,
        status:      "configuring",
        config: {
          objective:       structuredConfig.objective,
          instructions:    structuredConfig.instructions,
          toneOfVoice:     structuredConfig.tone,
          greetingMessage: structuredConfig.greeting_message,
          quickReplies:    structuredConfig.quick_replies,
          stages:          structuredConfig.stages,
          channels:        [],
          integrations:    [],
          knowledgeFiles:  [],
          urls:            [],
        },
      });

      if (result) {
        setToolLogs(prev => [...prev, { label: "Agente salvo com sucesso", status: "success" }]);

        // Update loaded agent info
        setLoadedAgent(prev => ({
          ...prev,
          name: structuredConfig.agent_name,
          agentType: (structuredConfig.agent_type as AgentType) || initialAgentType,
        }));

        setWizardMessages(prev => {
          const filtered = prev.filter(m => m.content !== buildMsg);
          return [...filtered, { role: "assistant", content: `✅ **${structuredConfig.agent_name}** criado com sucesso!\n\nO agente foi salvo e está pronto para teste. Mudando para o modo **Testar**...` }];
        });

        // Navigate to the saved agent if it's a new one
        if (agentId && TEMPLATE_MAP[agentId] && result.id !== agentId) {
          navigate(`/aikortex/agents/${result.id}`, { replace: true });
        }

        // Transition to done + test mode
        setTimeout(() => {
          setWizardStep("done");
          setChatMode("test");
        }, 1500);
      } else {
        throw new Error("Falha ao salvar");
      }
    } catch (e: any) {
      toast.error("Erro ao criar agente.");
      setToolLogs(prev => [...prev, { label: e.message || "Erro ao salvar", status: "error" }]);
      setWizardMessages(prev => [...prev, { role: "assistant", content: `❌ Erro ao criar o agente. Tente novamente.` }]);
      setWizardStep("structure");
    } finally {
      setIsBuilding(false);
    }
  };

  /* ── Patch mode send (after wizard done, in setup mode) ── */
  const handlePatchSend = async () => {
    if (!patchInput.trim() || isPatchLoading) return;
    const text = patchInput.trim();
    setPatchInput("");
    setWizardMessages(prev => [...prev, { role: "user", content: text }]);
    setIsPatchLoading(true);

    // For now, re-structure with the new input appended to the original prompt
    const result = await requestStructure(
      `${wizardPrompt}\n\nAlteração solicitada: ${text}`,
      initialAgentType,
      "pt-BR"
    );

    if (result) {
      setStructuredConfig(result as any);
      setWizardMessages(prev => [...prev, { role: "assistant", content: `✅ Configuração atualizada com base na sua solicitação.` }]);
    } else {
      setWizardMessages(prev => [...prev, { role: "assistant", content: `⚠️ Não consegui processar a alteração. Tente reformular.` }]);
    }
    setIsPatchLoading(false);
  };

  /* ── Test mode handlers ── */
  const canSendTest = !keysLoading && hasApiKey;

  const handleTestSend = () => {
    if (!input.trim() || testChat.isStreaming || !canSendTest) return;
    const text = input.trim();
    setInput("");
    testChat.sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (chatMode === "test") handleTestSend();
      else if (wizardStep === "done") handlePatchSend();
    }
  };

  /* ── Loading state ── */
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

  /* ── Wizard step index for stepper ── */
  const stepOrder = ["discover", "structure", "build"];
  const currentStepIdx = stepOrder.indexOf(wizardStep);
  const isEmpty = wizardMessages.length === 0;

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
          <span className="text-sm font-semibold">{structuredConfig?.agent_name || loadedAgent.name}</span>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{initialAgentType}</span>

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
            {/* Wizard Stepper - only for new agents */}
            {wizardStep !== "done" && (
              <div className="px-4 py-2.5 border-b border-border bg-card/30">
                <div className="flex items-center gap-1">
                  {stepLabels.map((s, i) => {
                    const isDone = i < currentStepIdx;
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
            {toolLogs.length > 0 && (
              <div className="px-3 py-2">
                <button
                  onClick={() => setToolsExpanded(!toolsExpanded)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors bg-muted/30 rounded-lg px-2.5 py-1.5 w-full"
                >
                  <Wrench className="w-3 h-3" />
                  <span>{toolLogs.length} ações</span>
                  {toolsExpanded ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
                </button>
                {toolsExpanded && (
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

              {/* ══ Step 1: Discover ══ */}
              {wizardStep === "discover" && isEmpty && (
                <div className="flex flex-col items-center justify-center h-full pt-12">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-base font-semibold text-foreground mb-1">Descreva seu agente</h2>
                  <p className="text-xs text-muted-foreground text-center max-w-[280px] mb-6">
                    Conte o que seu agente {initialAgentType !== "Custom" ? initialAgentType : ""} deve fazer. A IA vai estruturar tudo automaticamente.
                  </p>

                  <div className="w-full max-w-[340px] space-y-3">
                    <textarea
                      value={wizardPrompt}
                      onChange={(e) => setWizardPrompt(e.target.value)}
                      placeholder={`Ex: ${SUGGESTIONS_BY_TYPE[initialAgentType]?.[0] || "Descreva o que o agente deve fazer..."}`}
                      className="w-full bg-card/50 border border-border rounded-lg outline-none resize-none text-xs text-foreground placeholder:text-muted-foreground px-3 py-2.5 min-h-[100px] focus:border-primary/30 transition-colors"
                    />
                    <Button onClick={handleDiscover} disabled={wizardPrompt.length < 10} className="w-full gap-2 h-9 text-xs rounded-lg">
                      <Sparkles className="w-3.5 h-3.5" />
                      Estruturar com IA
                    </Button>
                  </div>

                  {/* Quick suggestions */}
                  <div className="mt-6 w-full max-w-[340px]">
                    <p className="text-[10px] text-muted-foreground mb-2 text-center">ou comece com uma ideia:</p>
                    <div className="space-y-1.5">
                      {(SUGGESTIONS_BY_TYPE[initialAgentType] || SUGGESTIONS_BY_TYPE.Custom).map((s) => (
                        <button
                          key={s}
                          onClick={() => setWizardPrompt(s)}
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
              {wizardMessages.map((m, i) => {
                if (m.role === "assistant" && !m.content) return null;
                return (
                  <div key={i}>
                    {m.role === "user" ? (
                      <div className="flex justify-end">
                        <div className="bg-primary/10 border border-primary/20 rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[90%] text-sm">
                          <p className="whitespace-pre-wrap text-foreground">{m.content}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2.5">
                        <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Bot className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div className="text-sm leading-relaxed text-foreground flex-1 min-w-0">
                          <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:mb-2 [&_strong]:text-foreground">
                            <ReactMarkdown>{m.content}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* ══ Structuring loader ══ */}
              {isStructuring && (
                <div className="flex items-center gap-3 bg-card/50 border border-border rounded-xl p-4">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  <div>
                    <p className="text-xs font-medium text-foreground">Estruturando com IA...</p>
                    <p className="text-[10px] text-muted-foreground">Analisando descrição e definindo configuração</p>
                  </div>
                </div>
              )}

              {/* ══ Structured Config Card ══ */}
              {wizardStep === "structure" && structuredConfig && !isStructuring && (
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
                        <span className="text-muted-foreground">Tom</span>
                        <span className="font-medium text-foreground">{toneLabels[structuredConfig.tone] || structuredConfig.tone}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-border/50">
                        <span className="text-muted-foreground">Idioma</span>
                        <span className="font-medium text-foreground">{structuredConfig.language}</span>
                      </div>
                      {structuredConfig.objective && (
                        <div className="py-1 border-b border-border/50">
                          <span className="text-muted-foreground block mb-1">Objetivo</span>
                          <span className="text-foreground">{structuredConfig.objective}</span>
                        </div>
                      )}
                      <div className="py-1 border-b border-border/50">
                        <span className="text-muted-foreground block mb-1">Mensagem de saudação</span>
                        <span className="text-foreground italic">"{structuredConfig.greeting_message}"</span>
                      </div>
                      {structuredConfig.quick_replies?.length > 0 && (
                        <div className="py-1">
                          <span className="text-muted-foreground block mb-1">Respostas rápidas</span>
                          <div className="flex flex-wrap gap-1">
                            {structuredConfig.quick_replies.map((r, i) => (
                              <Badge key={i} variant="secondary" className="text-[9px] px-1.5 py-0.5">{r}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <div>
                        <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Nome</label>
                        <Input
                          value={structuredConfig.agent_name}
                          onChange={(e) => setStructuredConfig({ ...structuredConfig, agent_name: e.target.value })}
                          className="h-7 text-xs bg-background"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Tom</label>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(toneLabels).map(([key, label]) => (
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
                          className="w-full bg-background border border-border rounded-md text-xs px-2 py-1.5 min-h-[50px] resize-none outline-none focus:border-primary/30 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Objetivo</label>
                        <textarea
                          value={structuredConfig.objective}
                          onChange={(e) => setStructuredConfig({ ...structuredConfig, objective: e.target.value })}
                          className="w-full bg-background border border-border rounded-md text-xs px-2 py-1.5 min-h-[40px] resize-none outline-none focus:border-primary/30 transition-colors"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 text-xs rounded-lg gap-1"
                      onClick={() => handleStructure(wizardPrompt)}
                    >
                      <RotateCw className="w-3 h-3" />
                      Re-estruturar
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 h-8 text-xs rounded-lg gap-1"
                      onClick={handleBuild}
                    >
                      <Sparkles className="w-3 h-3" />
                      Construir
                    </Button>
                  </div>
                </div>
              )}

              {/* ══ Building indicator ══ */}
              {isBuilding && (
                <div className="flex items-center gap-3 bg-card/50 border border-border rounded-xl p-4">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  <div>
                    <p className="text-xs font-medium text-foreground">Construindo {structuredConfig?.agent_name}...</p>
                    <p className="text-[10px] text-muted-foreground">Salvando configuração e preparando agente</p>
                  </div>
                </div>
              )}

              {/* Patch loading */}
              {isPatchLoading && (
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
                    <span className="text-xs">Processando...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input - patch mode after wizard done */}
            <div className="p-3 border-t border-border">
              <div className={`rounded-xl border border-border bg-card/50 p-1 transition-colors ${wizardStep === "done" ? "focus-within:border-primary/30" : "opacity-60"}`}>
                <textarea
                  value={patchInput}
                  onChange={(e) => setPatchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handlePatchSend();
                    }
                  }}
                  placeholder={wizardStep === "done" ? "Peça alterações ao agente..." : "Complete as etapas acima para começar..."}
                  rows={1}
                  disabled={wizardStep !== "done"}
                  className="w-full bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground px-3 py-2 min-h-[36px] max-h-[120px] disabled:cursor-not-allowed"
                />
                <div className="flex items-center justify-end px-2 pb-1">
                  <Button
                    size="icon"
                    onClick={handlePatchSend}
                    disabled={!patchInput.trim() || isPatchLoading || wizardStep !== "done"}
                    className="h-8 w-8 rounded-full"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ══ TEST MODE ══ */}
        {chatMode === "test" && (
          <>
            {/* Mode indicator */}
            <div className="px-4 py-1.5 border-b border-border bg-muted/30 flex items-center gap-2">
              <Badge variant="outline" className="text-xs gap-1">
                <TestTube className="w-3 h-3" />
                Modo Teste — {hasApiKey ? (LLM_MODELS.find(m => m.value === agentModel)?.label || agentModel) : "Configure sua chave de API"}
                <span className={`w-1.5 h-1.5 rounded-full ${hasApiKey ? "bg-emerald-500" : "bg-destructive"}`} />
              </Badge>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {testChat.messages.map((msg, i) => (
                  <div key={i} className={`flex gap-2.5 items-start ${msg.role === "user" ? "justify-end" : ""}`}>
                    {msg.role === "agent" && (
                      <img src={loadedAgent.avatar} alt="" className="w-6 h-6 rounded-full object-cover mt-0.5" />
                    )}
                    <div className={`rounded-xl px-3.5 py-2.5 text-sm max-w-[75%] ${
                      msg.role === "agent"
                        ? "bg-muted/60 text-foreground"
                        : "bg-primary text-primary-foreground ml-auto"
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

            {/* API Key alerts */}
            {!keysLoading && hasAnyLLMKey && !hasApiKey && (
              <div className="px-4 pt-2">
                <Alert className="border-yellow-500/30 bg-yellow-500/5">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <AlertDescription className="text-xs text-muted-foreground flex items-center justify-between">
                    <span>
                      Configure sua chave de API do provedor <strong className="text-foreground">
                        {currentProvider === "openai" ? "OpenAI" : currentProvider === "anthropic" ? "Anthropic" : "Gemini"}
                      </strong> para testar.
                    </span>
                    <Button variant="outline" size="sm" className="text-xs gap-1 ml-3 shrink-0" onClick={() => setRightPanelTab("connectors")}>
                      <KeyRound className="w-3 h-3" /> Configurar
                    </Button>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {!keysLoading && !hasAnyLLMKey && (
              <div className="px-4 pt-2">
                <Alert className="border-primary/30 bg-primary/5">
                  <KeyRound className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-xs text-muted-foreground flex items-center justify-between">
                    <span>
                      Configure uma chave de API na aba <strong className="text-foreground">Integrações</strong> para testar o agente.
                    </span>
                    <Button variant="outline" size="sm" className="text-xs gap-1 ml-3 shrink-0" onClick={() => setRightPanelTab("connectors")}>
                      <KeyRound className="w-3 h-3" /> Integrações
                    </Button>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Input */}
            <div className="px-4 pb-4 pt-2">
              <div className="border border-border rounded-xl bg-muted/30 flex flex-col">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    !hasApiKey && !keysLoading
                      ? "⚠️ Configure sua chave de API na aba Integrações para testar..."
                      : "Envie uma mensagem para testar o agente..."
                  }
                  className="border-0 bg-transparent text-sm min-h-[80px] max-h-[160px] resize-none focus-visible:ring-0 focus-visible:ring-offset-0 p-4"
                  disabled={!canSendTest}
                />
                <div className="flex items-center justify-between px-3 pb-3">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    {availableModels.length > 0 && (
                      <select
                        value={agentModel}
                        onChange={(e) => setAgentModel(e.target.value)}
                        className="text-xs text-muted-foreground hover:text-foreground bg-transparent border border-border rounded-md px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/40"
                      >
                        {availableModels.map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                    )}
                    {availableModels.length === 0 && !keysLoading && (
                      <span className="text-xs text-destructive">Sem chave de API configurada</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <HelpCircle className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon" className="h-8 w-8 rounded-full"
                      onClick={handleTestSend}
                      disabled={!input.trim() || testChat.isStreaming || !canSendTest}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* RIGHT — Panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AgentRightPanel
          agent={navState?.fromTemplate || isTemplate ? { name: "", avatar: loadedAgent.avatar } : loadedAgent}
          agentType={loadedAgent.agentType}
          agentModel={agentModel}
          onModelChange={setAgentModel}
          activeTab={rightPanelTab}
          onTabChange={setRightPanelTab}
          onApiKeysChanged={refetchKeys}
          onConfigChange={handleConfigChange}
          onSaveAgent={handleSaveAgent}
          isSaving={isSaving}
          storagePrefix={storagePrefix}
          presetData={presetData}
          savedConfig={navState?.fromTemplate ? null : loadedAgent.savedConfig}
        />
      </div>
    </div>
  );
};

export default AgentDetail;
