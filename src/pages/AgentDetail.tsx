import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, Send, Paperclip, HelpCircle, AlertTriangle, KeyRound, Bot, TestTube, Loader2, Sparkles, ArrowRight, CheckCircle2, MessageSquare, Settings2, FlaskConical, Rocket } from "lucide-react";
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

const buildSetupSystemPrompt = (
  config: AgentConfig | null,
  apiKeys: Record<string, { provider: string; configured: boolean }>,
  currentModel: string,
) => {
  const configuredProviders = Object.keys(apiKeys).filter(k => apiKeys[k]?.configured);
  const apiKeyStatus = configuredProviders.length > 0
    ? `Chaves de API configuradas: ${configuredProviders.join(", ")}.`
    : "Nenhuma chave de API configurada ainda.";

  const configStatus = config ? [
    config.name         ? `Nome: ${config.name}` : null,
    config.description  ? `Descrição: ${config.description.slice(0, 200)}` : null,
    config.objective    ? `Objetivo: ${config.objective.slice(0, 200)}` : null,
    config.instructions ? `Instruções: ${config.instructions.slice(0, 200)}` : null,
    config.toneOfVoice  ? `Tom de voz: ${config.toneOfVoice}` : null,
    config.greetingMessage ? `Mensagem de saudação: ${config.greetingMessage.slice(0, 100)}` : null,
    config.channels?.length     ? `Canais: ${config.channels.join(", ")}` : null,
    config.integrations?.length ? `Integrações: ${config.integrations.join(", ")}` : null,
    config.knowledgeFiles?.length ? `Arquivos: ${config.knowledgeFiles.length} arquivo(s)` : null,
    config.urls?.length ? `URLs: ${config.urls.join(", ")}` : null,
    config.avatarUrl    ? `Foto: configurada` : null,
  ].filter(Boolean).join("\n") : "Nenhuma configuração preenchida ainda.";

  return `Você é um assistente especializado em configuração de agentes de IA na plataforma Aikortex.
Seja BREVE e direto. Faça UMA pergunta por vez (máximo 2 linhas). Quando a resposta for válida, confirme com ✅ e passe ao próximo item.

Áreas de configuração:
1. **Identidade** — Nome, descrição, foto
2. **Objetivo** — Missão principal
3. **Instruções** — Tom de voz, regras, personalidade
4. **Integrações** — APIs, MCPs, Webhooks
5. **Canais** — WhatsApp, Instagram, Site
6. **Conhecimento** — Documentos e URLs

=== ESTADO ATUAL DO AGENTE ===
${configStatus}
Modelo selecionado para teste: ${currentModel}
${apiKeyStatus}
==============================

Use as informações acima para saber o que já foi preenchido e orientar o usuário sobre os próximos passos.
Quando todas as configurações estiverem completas, sugira mudar para o modo **Teste**.
IMPORTANTE: Você NÃO é o agente final. Apenas configure.`;
};

// ── Wizard types & constants ──
type WizardStep = "describe" | "customize" | "calibrate" | "create";

interface WizardStructuredConfig {
  name: string;
  agentType: AgentType;
  description: string;
  objective: string;
  toneOfVoice: string;
  language: string;
  greetingMessage: string;
  quickReplies: string[];
  instructions: string;
  stages: Array<{ id: string; name: string; description: string; example: string }>;
}

interface CalibrationResult {
  round: number;
  userMessage: string;
  agentResponse: string;
  passed: boolean;
}

const WIZARD_STEP_META = [
  { key: "describe" as const, label: "Descrever", icon: MessageSquare },
  { key: "customize" as const, label: "Personalizar", icon: Settings2 },
  { key: "calibrate" as const, label: "Calibrar", icon: FlaskConical },
  { key: "create" as const, label: "Criar", icon: Rocket },
];

const PROMPT_SUGGESTIONS: Record<string, string[]> = {
  SDR: [
    "Crie um agente SDR que qualifique leads por WhatsApp e agenda reuniões.",
    "Quero um assistente que responda leads em segundos e aplique critérios BANT.",
  ],
  BDR: [
    "Crie um agente de prospecção outbound que pesquisa empresas e gera oportunidades.",
    "Quero um BDR que aborde empresas-alvo com mensagens personalizadas.",
  ],
  SAC: [
    "Crie um agente de suporte que resolva problemas e colete satisfação.",
    "Quero um SAC 24/7 que responda dúvidas e escale quando necessário.",
  ],
  CS: [
    "Crie um agente de Customer Success para onboarding e retenção.",
    "Quero um CS que acompanhe clientes e previna churn.",
  ],
  Custom: [
    "Descreva livremente o que seu agente deve fazer...",
  ],
};

// ── Loaded agent state ──
interface LoadedAgent {
  name: string;
  avatar: string;
  model: string;
  agentType: AgentType;
  savedConfig: Record<string, any> | null;
}

const AgentDetail = () => {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { agentId } = useParams();
  const navState   = location.state as any;

  const isTemplate = !!agentId && !!TEMPLATE_MAP[agentId];
  const templateAgent = isTemplate ? TEMPLATE_MAP[agentId!] : null;

  // ── Wizard vs Chat mode detection ──
  const fromTemplate = navState?.fromTemplate === true;
  const [hasExistingAgent, setHasExistingAgent] = useState<boolean | null>(() => {
    if (isTemplate) return false; // templates are not saved yet
    return null; // unknown until loaded
  });

  const [loadedAgent, setLoadedAgent] = useState<LoadedAgent>(() => {
    if (templateAgent) {
      return { name: templateAgent.name, avatar: templateAgent.avatar, model: templateAgent.model, agentType: templateAgent.agentType, savedConfig: null };
    }
    return { name: "Carregando...", avatar: avatar1, model: "gemini-2.5-flash", agentType: (navState?.agentType as AgentType) || "Custom", savedConfig: null };
  });
  const [agentLoading, setAgentLoading] = useState(!isTemplate);

  useEffect(() => {
    if (isTemplate || !agentId) {
      setHasExistingAgent(false);
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
        setHasExistingAgent(true);
      } else {
        setHasExistingAgent(false);
      }
      setAgentLoading(false);
    };
    load();
  }, [agentId, isTemplate]);

  // Wizard mode: from template OR agent doesn't exist yet
  const isWizardMode = fromTemplate || hasExistingAgent === false;
  // After wizard creates agent, switch to chat
  const [wizardCompleted, setWizardCompleted] = useState(false);
  const showWizard = isWizardMode && !wizardCompleted;

  // ── Wizard state ──
  const initialAgentType: AgentType = (navState?.agentType as AgentType) || templateAgent?.agentType || "Custom";
  const [wizardStep, setWizardStep] = useState<WizardStep>("describe");
  const [wizardPrompt, setWizardPrompt] = useState("");
  const [wizardConfig, setWizardConfig] = useState<WizardStructuredConfig | null>(null);
  const [calibrationResults, setCalibrationResults] = useState<CalibrationResult[]>([]);
  const [wizardGenerating, setWizardGenerating] = useState(false);
  const [wizardCreating, setWizardCreating] = useState(false);

  const updateWizardField = useCallback(<K extends keyof WizardStructuredConfig>(key: K, value: WizardStructuredConfig[K]) => {
    setWizardConfig(prev => prev ? { ...prev, [key]: value } : prev);
  }, []);

  const wizardStepIdx = WIZARD_STEP_META.findIndex(s => s.key === wizardStep);

  // Generate structured config from prompt
  const handleWizardGenerate = useCallback(async () => {
    if (!wizardPrompt.trim()) { toast.error("Descreva o que o agente deve fazer."); return; }
    setWizardGenerating(true);
    try {
      const preset = AGENT_PRESETS[initialAgentType];
      const config: WizardStructuredConfig = {
        name: preset.context.mainProduct ? `Agente ${preset.context.mainProduct}` : `Agente ${initialAgentType}`,
        agentType: initialAgentType,
        description: wizardPrompt.trim(),
        objective: preset.context.painPoints || "Atender e resolver necessidades do usuário.",
        toneOfVoice: preset.context.toneOfVoice || "Profissional e amigável",
        language: "Português",
        greetingMessage: preset.context.greetingMessage || "Olá! Como posso te ajudar?",
        quickReplies: initialAgentType === "SDR" ? ["Quero saber mais", "Agendar reunião", "Ver planos"]
          : initialAgentType === "BDR" ? ["Como funciona?", "Agendar conversa"]
          : initialAgentType === "SAC" ? ["Preciso de ajuda", "Consultar status", "Falar com humano"]
          : initialAgentType === "CS" ? ["Dúvida sobre produto", "Agendar check-in"]
          : [],
        instructions: preset.context.targetAudienceDescription || "",
        stages: preset.stages.map(s => ({ id: s.id, name: s.name, description: s.description, example: s.example })),
      };
      await new Promise(r => setTimeout(r, 800));
      setWizardConfig(config);
      setWizardStep("customize");
    } finally {
      setWizardGenerating(false);
    }
  }, [wizardPrompt, initialAgentType]);

  // Calibrate: simulate 2 rounds
  const handleWizardCalibrate = useCallback(async () => {
    if (!wizardConfig) return;
    setWizardGenerating(true);
    try {
      await new Promise(r => setTimeout(r, 1200));
      setCalibrationResults([
        {
          round: 1,
          userMessage: "Olá, quero saber mais sobre o produto.",
          agentResponse: wizardConfig.greetingMessage + " Claro! Posso te ajudar com isso. Qual é o seu principal interesse?",
          passed: true,
        },
        {
          round: 2,
          userMessage: "Quanto custa?",
          agentResponse: "Temos planos a partir de R$ 99/mês. Posso agendar uma conversa com nosso especialista para encontrar o melhor para você?",
          passed: true,
        },
      ]);
    } finally {
      setWizardGenerating(false);
    }
  }, [wizardConfig]);

  // Create agent from wizard
  const { saveAgent } = useUserAgents();

  const handleWizardCreate = useCallback(async () => {
    if (!wizardConfig) return;
    setWizardCreating(true);
    try {
      const preset = AGENT_PRESETS[initialAgentType];
      const saved = await saveAgent({
        name: wizardConfig.name,
        agent_type: wizardConfig.agentType,
        description: wizardConfig.description,
        config: {
          objective: wizardConfig.objective,
          toneOfVoice: wizardConfig.toneOfVoice,
          language: wizardConfig.language,
          greetingMessage: wizardConfig.greetingMessage,
          quickReplies: wizardConfig.quickReplies,
          instructions: wizardConfig.instructions,
          stages: wizardConfig.stages,
          intents: preset.intents,
          advancedConfig: preset.advancedConfig || DEFAULT_ADVANCED_CONFIG,
        },
        status: "configuring",
      });
      if (saved) {
        toast.success("Agente criado com sucesso!");
        // Update loaded agent state
        setLoadedAgent({
          name: saved.name,
          avatar: AVATAR_BY_TYPE[saved.agent_type] || avatar1,
          model: saved.model || "gemini-2.5-flash",
          agentType: (saved.agent_type as AgentType) || "Custom",
          savedConfig: (typeof saved.config === 'object' && saved.config !== null && !Array.isArray(saved.config) ? saved.config : null) as Record<string, any> | null,
        });
        setHasExistingAgent(true);
        setWizardCompleted(true);
        setChatMode("test");
        // Navigate to the real agent ID
        navigate(`/aikortex/agents/${saved.id}`, { replace: true, state: { chatMode: "test" } });
      }
    } finally {
      setWizardCreating(false);
    }
  }, [wizardConfig, initialAgentType, saveAgent, navigate]);

  // ── Existing chat mode logic (unchanged) ──
  const presetData = useMemo(() => {
    if (!navState?.fromTemplate || !navState?.preset) return undefined;
    const p = navState.preset;
    return {
      name:           p.agentName || "",
      description:    p.context?.targetAudienceDescription || p.agentObjective || "",
      objective:      p.context?.painPoints || p.agentObjective || "",
      instructions:   "",
      toneOfVoice:    p.context?.toneOfVoice || "",
      greetingMessage: p.context?.greetingMessage || "",
    };
  }, [navState]);

  useEffect(() => {
    if (!navState?.fromTemplate || !agentId) return;
    const prefix = `agent-detail-${agentId}`;
    try {
      ["name","desc","objective","instructions","toneOfVoice","greetingMessage","files","urls","channels","apiConfig","avatar"].forEach(k =>
        localStorage.removeItem(`${prefix}-${k}`)
      );
    } catch {}
  }, [navState?.fromTemplate, agentId]);

  const storagePrefix = `agent-detail-${agentId || "new"}`;

  const [input,        setInput]        = useState("");
  const [agentModel,   setAgentModel]   = useState(() => {
    try { return localStorage.getItem(`${storagePrefix}-model`) || loadedAgent.model; } catch { return loadedAgent.model; }
  });
  const [setupModel, setSetupModel] = useState<string>(() => {
    try { return normalizeFreeSetupModel(localStorage.getItem(`${storagePrefix}-setupModel`)); } catch { return DEFAULT_FREE_SETUP_MODEL; }
  });
  const [rightPanelTab, setRightPanelTab] = useState("agent");
  const [chatMode,     setChatMode]     = useState<"setup" | "test">(() => {
    if (navState?.chatMode === "test") return "test";
    try { return (localStorage.getItem(`${storagePrefix}-chatMode`) as "setup" | "test") || "setup"; } catch { return "setup"; }
  });
  const [agentConfig,  setAgentConfig]  = useState<AgentConfig | null>(null);
  const [isSaving,     setIsSaving]     = useState(false);

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
  useEffect(() => { try { localStorage.setItem(`${storagePrefix}-setupModel`, setupModel); } catch {} }, [setupModel, storagePrefix]);

  const setupSystemPrompt = useMemo(() => buildSetupSystemPrompt(agentConfig, keys, agentModel), [agentConfig, keys, agentModel]);

  const setupInitialMessage = useMemo(() => {
    return `Olá! 👋 Sou o assistente de configuração do **${loadedAgent.name}**. O que gostaria de configurar?`;
  }, [loadedAgent.name]);

  const setupChat = useAgentChat(
    [{ role: "agent", text: setupInitialMessage }],
    { useGateway: true, gatewayModel: setupModel, systemPrompt: setupSystemPrompt, persistKey: `${storagePrefix}-setup-messages` }
  );

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
    parts.push(`\n- Nunca diga que você é um assistente genérico sem nome se um nome foi configurado.`);
    parts.push(`\n- Responda como o agente configurado, mantendo persona, função e contexto.`);
    parts.push(`\n- Se faltar alguma informação operacional, assuma apenas o mínimo necessário sem contradizer a configuração.`);
    parts.push(`\n\nResponda sempre em português brasileiro. Seja profissional, direto e coerente com o agente configurado.`);
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

  const activeChat = chatMode === "setup" ? setupChat : testChat;
  const { messages, sendMessage, isStreaming } = activeChat;

  const canSend = chatMode === "setup" ? true : (!keysLoading && hasApiKey);

  const handleSend = () => {
    if (!input.trim() || isStreaming || !canSend) return;
    const text = input.trim();
    setInput("");
    sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // Preview data for wizard mode (passed to right panel)
  const wizardPreviewName = wizardConfig?.name || loadedAgent.name;
  const wizardPreviewGreeting = wizardConfig?.greetingMessage || "Olá! Como posso te ajudar?";
  const wizardPreviewQuickReplies = wizardConfig?.quickReplies || [];
  const wizardPreviewTone = wizardConfig?.toneOfVoice || "—";
  const wizardPreviewLanguage = wizardConfig?.language || "Português";
  const wizardPreviewStages = wizardConfig?.stages?.length || 0;

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
          <span className="text-sm font-semibold">{showWizard ? (wizardConfig?.name || loadedAgent.name) : loadedAgent.name}</span>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{initialAgentType}</span>

          {/* Mode toggle — only in chat mode */}
          {!showWizard && (
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
          )}
        </div>

        {/* ── WIZARD MODE ── */}
        {showWizard && (
          <>
            {/* Wizard stepper */}
            <div className="flex items-center gap-1 px-4 py-3 border-b border-border bg-card shrink-0">
              {WIZARD_STEP_META.map((s, i) => {
                const Icon = s.icon;
                const isActive = s.key === wizardStep;
                const isDone = i < wizardStepIdx;
                return (
                  <div key={s.key} className="flex items-center gap-1">
                    {i > 0 && <div className={`w-6 h-px ${isDone ? "bg-primary" : "bg-border"}`} />}
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      isActive ? "bg-primary text-primary-foreground" : isDone ? "bg-primary/10 text-primary" : "text-muted-foreground"
                    }`}>
                      {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                      <span className="hidden sm:inline">{s.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Wizard content */}
            <ScrollArea className="flex-1">
              <div className="p-4 sm:p-6">
                {/* Step 1: Descrever */}
                {wizardStep === "describe" && (
                  <div className="max-w-lg mx-auto space-y-5">
                    <div className="text-center space-y-1">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-2">
                        <Sparkles className="h-3.5 w-3.5" /> Agente {initialAgentType}
                      </div>
                      <h2 className="text-xl font-bold">Descreva seu agente</h2>
                      <p className="text-sm text-muted-foreground">
                        Conte com linguagem natural o que o agente deve fazer. A IA estrutura o resto.
                      </p>
                    </div>

                    <Textarea
                      placeholder="Ex: Quero um agente que qualifique leads por WhatsApp, aplique critérios BANT e agende reuniões..."
                      value={wizardPrompt}
                      onChange={e => setWizardPrompt(e.target.value)}
                      className="min-h-[120px] resize-none"
                    />

                    <div className="flex flex-wrap gap-1.5">
                      {(PROMPT_SUGGESTIONS[initialAgentType] || PROMPT_SUGGESTIONS.Custom).map((s, i) => (
                        <button
                          key={i}
                          onClick={() => setWizardPrompt(s)}
                          className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {s.length > 60 ? s.slice(0, 57) + "..." : s}
                        </button>
                      ))}
                    </div>

                    <Button onClick={handleWizardGenerate} disabled={wizardGenerating || !wizardPrompt.trim()} className="w-full">
                      {wizardGenerating ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Gerando configuração...</>
                        : <><Sparkles className="h-4 w-4 mr-2" /> Gerar configuração</>}
                    </Button>
                  </div>
                )}

                {/* Step 2: Personalizar */}
                {wizardStep === "customize" && wizardConfig && (
                  <div className="max-w-lg mx-auto space-y-4">
                    <div className="text-center space-y-1 mb-2">
                      <h2 className="text-xl font-bold">Personalize seu agente</h2>
                      <p className="text-sm text-muted-foreground">Revise e ajuste os dados gerados pela IA.</p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Nome</label>
                        <Input value={wizardConfig.name} onChange={e => updateWizardField("name", e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Tipo</label>
                        <div className="flex gap-1.5 flex-wrap">
                          {(["SDR", "BDR", "SAC", "CS", "Custom"] as const).map(t => (
                            <Badge
                              key={t}
                              variant={wizardConfig.agentType === t ? "default" : "outline"}
                              className="cursor-pointer"
                              onClick={() => updateWizardField("agentType", t)}
                            >
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Tom de voz</label>
                        <Input value={wizardConfig.toneOfVoice} onChange={e => updateWizardField("toneOfVoice", e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Idioma</label>
                        <Input value={wizardConfig.language} onChange={e => updateWizardField("language", e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Mensagem de saudação</label>
                        <Textarea value={wizardConfig.greetingMessage} onChange={e => updateWizardField("greetingMessage", e.target.value)} className="min-h-[80px] resize-none" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Objetivo</label>
                        <Textarea value={wizardConfig.objective} onChange={e => updateWizardField("objective", e.target.value)} className="min-h-[60px] resize-none" />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setWizardStep("describe")} className="flex-1">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
                      </Button>
                      <Button onClick={() => { setWizardStep("calibrate"); handleWizardCalibrate(); }} className="flex-1">
                        Continuar <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Calibrar */}
                {wizardStep === "calibrate" && (
                  <div className="max-w-lg mx-auto space-y-4">
                    <div className="text-center space-y-1 mb-2">
                      <h2 className="text-xl font-bold">Calibração</h2>
                      <p className="text-sm text-muted-foreground">Simulação de conversa para validar o comportamento.</p>
                    </div>

                    {wizardGenerating ? (
                      <div className="flex flex-col items-center gap-3 py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Simulando conversas...</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {calibrationResults.map(r => (
                          <div key={r.round} className="rounded-xl border border-border p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-muted-foreground">Rodada {r.round}</span>
                              <Badge variant={r.passed ? "default" : "destructive"} className="text-[10px]">
                                {r.passed ? "✓ Passou" : "✗ Falhou"}
                              </Badge>
                            </div>
                            <div className="space-y-1.5 text-sm">
                              <div className="flex gap-2">
                                <span className="text-muted-foreground shrink-0">Cliente:</span>
                                <span>{r.userMessage}</span>
                              </div>
                              <div className="flex gap-2">
                                <Bot className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                <span>{r.agentResponse}</span>
                              </div>
                            </div>
                          </div>
                        ))}

                        {calibrationResults.length > 0 && calibrationResults.every(r => r.passed) && (
                          <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg px-3 py-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Todos os testes passaram ({calibrationResults.length}/{calibrationResults.length})
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setWizardStep("customize")} className="flex-1">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
                      </Button>
                      <Button
                        onClick={() => setWizardStep("create")}
                        disabled={wizardGenerating || calibrationResults.length === 0}
                        className="flex-1"
                      >
                        Criar Agente <Rocket className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 4: Criar */}
                {wizardStep === "create" && wizardConfig && (
                  <div className="max-w-lg mx-auto space-y-5">
                    <div className="text-center space-y-1">
                      <Rocket className="h-10 w-10 text-primary mx-auto mb-2" />
                      <h2 className="text-xl font-bold">Tudo pronto!</h2>
                      <p className="text-sm text-muted-foreground">
                        Seu agente <strong>{wizardConfig.name}</strong> está configurado e calibrado.
                      </p>
                    </div>

                    <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Tipo</span><span className="font-medium">{wizardConfig.agentType}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Tom</span><span className="font-medium">{wizardConfig.toneOfVoice}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Idioma</span><span className="font-medium">{wizardConfig.language}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Estágios</span><span className="font-medium">{wizardConfig.stages.length}</span></div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setWizardStep("calibrate")} className="flex-1">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
                      </Button>
                      <Button onClick={handleWizardCreate} disabled={wizardCreating} className="flex-1">
                        {wizardCreating ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Criando...</>
                          : <><Sparkles className="h-4 w-4 mr-2" /> Criar Agente</>}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </>
        )}

        {/* ── CHAT MODE ── */}
        {!showWizard && (
          <>
            {/* Mode indicator */}
            <div className="px-4 py-1.5 border-b border-border bg-muted/30 flex items-center gap-2">
              {chatMode === "setup" ? (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Bot className="w-3 h-3" />
                  Assistente de Configuração — {GATEWAY_MODELS.find(m => m.value === setupModel)?.label || "IA Gratuita"}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs gap-1">
                  <TestTube className="w-3 h-3" />
                  Modo Teste — {hasApiKey ? (LLM_MODELS.find(m => m.value === agentModel)?.label || agentModel) : "Configure sua chave de API"}
                  <span className={`w-1.5 h-1.5 rounded-full ${hasApiKey ? "bg-emerald-500" : "bg-destructive"}`} />
                </Badge>
              )}
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((msg, i) => (
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
            {chatMode === "setup" && !keysLoading && !hasAnyLLMKey && (
              <div className="px-4 pt-2">
                <Alert className="border-primary/30 bg-primary/5">
                  <KeyRound className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-xs text-muted-foreground flex items-center justify-between">
                    <span>
                      Configure uma chave de API na aba <strong className="text-foreground">Integrações</strong> quando quiser <strong className="text-foreground">testar</strong> o agente com seu próprio modelo.
                    </span>
                    <Button variant="outline" size="sm" className="text-xs gap-1 ml-3 shrink-0" onClick={() => setRightPanelTab("connectors")}>
                      <KeyRound className="w-3 h-3" /> Integrações
                    </Button>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {chatMode === "test" && !keysLoading && hasAnyLLMKey && !hasApiKey && (
              <div className="px-4 pt-2">
                <Alert className="border-yellow-500/30 bg-yellow-500/5">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <AlertDescription className="text-xs text-muted-foreground flex items-center justify-between">
                    <span>
                      Configure sua chave de API do provedor <strong className="text-foreground">
                        {currentProvider === "openai" ? "OpenAI" : currentProvider === "anthropic" ? "Anthropic" : "Gemini"}
                      </strong> para testar com <strong className="text-foreground">{LLM_MODELS.find(m => m.value === agentModel)?.label || agentModel}</strong>.
                    </span>
                    <Button variant="outline" size="sm" className="text-xs gap-1 ml-3 shrink-0" onClick={() => setRightPanelTab("connectors")}>
                      <KeyRound className="w-3 h-3" /> Configurar
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
                    chatMode === "test" && !hasApiKey && !keysLoading
                      ? "⚠️ Configure sua chave de API na aba Integrações para testar..."
                      : chatMode === "setup"
                        ? "Pergunte sobre a configuração do agente..."
                        : "Envie uma mensagem para testar o agente..."
                  }
                  className="border-0 bg-transparent text-sm min-h-[80px] max-h-[160px] resize-none focus-visible:ring-0 focus-visible:ring-offset-0 p-4"
                  disabled={!canSend}
                />
                <div className="flex items-center justify-between px-3 pb-3">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    {chatMode === "setup" && (
                      <select
                        value={setupModel}
                        onChange={(e) => setSetupModel(e.target.value)}
                        className="text-xs text-muted-foreground hover:text-foreground bg-transparent border border-border rounded-md px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/40"
                      >
                        {GATEWAY_MODELS.map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                    )}
                    {chatMode === "test" && availableModels.length > 0 && (
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
                    {chatMode === "test" && availableModels.length === 0 && !keysLoading && (
                      <span className="text-xs text-destructive">Sem chave de API configurada</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <HelpCircle className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon" className="h-8 w-8 rounded-full"
                      onClick={handleSend}
                      disabled={!input.trim() || isStreaming || !canSend}
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
        {/* Wizard preview at top of right panel during wizard */}
        {showWizard && (
          <div className="border-b border-border p-4 space-y-3 shrink-0">
            {/* Chat simulation preview */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/40">
                <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{wizardPreviewName}</p>
                  <div className="flex items-center gap-1 text-xs text-emerald-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Online
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px]">{initialAgentType}</Badge>
              </div>
              <div className="p-3 space-y-2 bg-background/50 min-h-[100px]">
                <div className="flex gap-2 max-w-[90%]">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="h-3 w-3 text-primary" />
                  </div>
                  <div className="rounded-xl rounded-tl-sm bg-muted px-3 py-2 text-xs">
                    {wizardPreviewGreeting}
                  </div>
                </div>
                {wizardPreviewQuickReplies.length > 0 && (
                  <div className="flex flex-wrap gap-1 pl-8">
                    {wizardPreviewQuickReplies.map((qr, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full border border-primary/30 text-[10px] text-primary">
                        {qr}
                      </span>
                    ))}
                  </div>
                )}
                {!wizardConfig && (
                  <p className="text-[10px] text-muted-foreground text-center pt-4">Descreva seu agente para ver o preview</p>
                )}
              </div>
              <div className="px-3 py-2 border-t border-border flex items-center gap-2">
                <div className="flex-1 rounded-full bg-muted/60 px-3 py-1.5 text-[10px] text-muted-foreground">
                  Digite uma mensagem...
                </div>
                <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <Send className="h-3 w-3 text-primary" />
                </div>
              </div>
            </div>
            {/* Summary */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              <span className="text-muted-foreground">Nome</span>
              <span className="font-medium truncate">{wizardPreviewName}</span>
              <span className="text-muted-foreground">Tipo</span>
              <span className="font-medium">{initialAgentType}</span>
              <span className="text-muted-foreground">Tom</span>
              <span className="font-medium truncate">{wizardPreviewTone}</span>
              <span className="text-muted-foreground">Idioma</span>
              <span className="font-medium">{wizardPreviewLanguage}</span>
              <span className="text-muted-foreground">Estágios</span>
              <span className="font-medium">{wizardPreviewStages}</span>
            </div>
          </div>
        )}

        {/* Normal right panel (always visible) */}
        <div className="flex-1 overflow-hidden">
          <AgentRightPanel
            agent={loadedAgent}
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
            savedConfig={loadedAgent.savedConfig}
          />
        </div>
      </div>
    </div>
  );
};

export default AgentDetail;
