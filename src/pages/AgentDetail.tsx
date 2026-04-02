import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Loader2, ArrowLeft, Sparkles, Bot, Settings, Plug, Share2, SlidersHorizontal, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ConversationProvider } from "@elevenlabs/react";
import AgentRightPanel, { type AgentConfig } from "@/components/aikortex/AgentRightPanel";
import AgentChatPanel, { type StructuredAgentConfig } from "@/components/aikortex/AgentChatPanel";
import VoiceCallPanel from "@/components/aikortex/VoiceCallPanel";
import { useAgentChat } from "@/hooks/use-agent-chat";
import { useApiKeys } from "@/hooks/use-api-keys";
import { useUserAgents } from "@/hooks/use-user-agents";
import { toast } from "sonner";
import type { AgentType } from "@/types/agent-builder";
import { supabase } from "@/integrations/supabase/client";
import { AGENT_PRESETS } from "@/types/agent-presets";
import { DEFAULT_FREE_SETUP_MODEL, GATEWAY_MODELS, normalizeFreeSetupModel } from "@/lib/free-setup-models";

import avatar1 from "@/assets/avatars/avatar-1.png";
import avatar2 from "@/assets/avatars/avatar-2.png";
import avatar3 from "@/assets/avatars/avatar-3.png";
import avatar8 from "@/assets/avatars/avatar-8.png";

/* ── Constants ── */

const TEMPLATE_MAP: Record<string, { name: string; avatar: string; model: string; agentType: AgentType; autoPrompt: string }> = {
  "sdr-1":    { name: "Agente SDR",           avatar: avatar1, model: "gemini-2.5-flash", agentType: "SDR",    autoPrompt: "Crie um agente SDR para qualificação de leads inbound. Ele deve coletar nome, email, empresa e interesse do lead, qualificar com base em critérios BANT e agendar reuniões com o time comercial." },
  "bdr-1":    { name: "Agente BDR",           avatar: avatar2, model: "gemini-2.5-flash", agentType: "BDR",    autoPrompt: "Crie um agente BDR para prospecção outbound. Ele deve abordar leads frios de forma consultiva, identificar dores e necessidades, qualificar oportunidades e agendar reuniões com executivos de vendas." },
  "sac-1":    { name: "Agente SAC",           avatar: avatar3, model: "gemini-2.5-flash", agentType: "SAC",    autoPrompt: "Crie um agente de atendimento ao cliente (SAC). Ele deve responder dúvidas frequentes, resolver problemas comuns, escalar casos complexos para humanos e manter um tom empático e profissional." },
  "social-1": { name: "Social Media Manager", avatar: avatar8, model: "gemini-2.5-flash", agentType: "Custom", autoPrompt: "Crie um agente gerenciador de redes sociais. Ele deve sugerir conteúdos, responder comentários e mensagens diretas, manter a voz da marca e gerar relatórios de engajamento." },
  "custom-1": { name: "Agente Personalizado", avatar: avatar1, model: "gemini-2.5-flash", agentType: "Custom", autoPrompt: "" },
};

const AVATAR_BY_TYPE: Record<string, string> = {
  SDR: avatar1, BDR: avatar2, SAC: avatar3, CS: avatar3, Custom: avatar1,
};

const LLM_MODELS = [
  { value: "gemini-2.5-pro",         label: "Gemini 2.5 Pro",        provider: "gemini" },
  { value: "gemini-2.5-flash",       label: "Gemini 2.5 Flash",      provider: "gemini" },
  { value: "gemini-2.5-flash-lite",  label: "Gemini 2.5 Flash Lite", provider: "gemini" },
  { value: "gpt-4o",                 label: "GPT-4o",                provider: "openai" },
  { value: "gpt-4o-mini",            label: "GPT-4o Mini",           provider: "openai" },
  { value: "gpt-4-turbo",            label: "GPT-4 Turbo",           provider: "openai" },
  { value: "gpt-3.5-turbo",          label: "GPT-3.5 Turbo",         provider: "openai" },
  { value: "claude-4-sonnet",        label: "Claude 4 Sonnet",       provider: "anthropic" },
  { value: "claude-3.5-sonnet",      label: "Claude 3.5 Sonnet",     provider: "anthropic" },
  { value: "claude-3-haiku",         label: "Claude 3 Haiku",        provider: "anthropic" },
] as const;

const getProviderForModel = (model: string): string => {
  if (model.startsWith("gemini")) return "gemini";
  if (model.startsWith("gpt"))    return "openai";
  if (model.startsWith("claude")) return "anthropic";
  return "openai";
};

const STRUCTURE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-structure`;

/* ── Types ── */

interface LoadedAgent {
  name: string;
  avatar: string;
  model: string;
  agentType: AgentType;
  savedConfig: Record<string, any> | null;
}

/* ── Component ── */

const AgentDetail = () => {
  const navigate    = useNavigate();
  const location    = useLocation();
  const { agentId } = useParams();
  const navState    = location.state as any;

  const isTemplate    = !!agentId && !!TEMPLATE_MAP[agentId];
  const templateAgent = isTemplate ? TEMPLATE_MAP[agentId!] : null;
  const initialType: AgentType = (navState?.agentType as AgentType) || templateAgent?.agentType || "Custom";

  /* ── Agent loading ── */

  const [loadedAgent, setLoadedAgent] = useState<LoadedAgent>(() => {
    if (templateAgent) {
      return { name: templateAgent.name, avatar: templateAgent.avatar, model: templateAgent.model, agentType: templateAgent.agentType, savedConfig: null };
    }
    return { name: "Carregando...", avatar: avatar1, model: "gemini-2.5-flash", agentType: initialType, savedConfig: null };
  });
  const [agentLoading, setAgentLoading] = useState(!isTemplate);

  useEffect(() => {
    if (isTemplate || !agentId) { setAgentLoading(false); return; }
    const load = async () => {
      setAgentLoading(true);
      const { data } = await supabase.from("user_agents").select("*").eq("id", agentId).single();
      if (data) {
        setLoadedAgent({
          name:        data.name,
          avatar:      data.avatar_url || AVATAR_BY_TYPE[data.agent_type] || avatar1,
          model:       data.model || "gemini-2.5-flash",
          agentType:   (data.agent_type as AgentType) || "Custom",
          savedConfig: (typeof data.config === "object" && data.config !== null ? data.config : null) as Record<string, any> | null,
        });
      }
      setAgentLoading(false);
    };
    load();
  }, [agentId, isTemplate]);

  /* ── Wizard state ── */

  const hasAutoPrompt = isTemplate && !!templateAgent?.autoPrompt;
  // Templates skip wizard entirely — start at "done" and auto-save in background
  const [wizardStep, setWizardStep] = useState<"discover" | "structure" | "build" | "done">(
    isTemplate && hasAutoPrompt ? "done" : (isTemplate ? "discover" : "done")
  );
  const [structuredConfig, setStructuredConfig] = useState<StructuredAgentConfig | null>(null);
  const [isStructuring, setIsStructuring] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);

  /* ── Chat mode ── */

  const storagePrefix = `agent-detail-${agentId || "new"}`;

  const [chatMode, setChatMode] = useState<"setup" | "test">(() => {
    if (navState?.chatMode === "test") return "test";
    try { return (localStorage.getItem(`${storagePrefix}-chatMode`) as "setup" | "test") || "setup"; } catch { return "setup"; }
  });

  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(`${storagePrefix}-chatMode`, chatMode); } catch {}
  }, [chatMode, storagePrefix]);

  /* ── Model state ── */

  const [agentModel, setAgentModel] = useState(() => {
    try { return localStorage.getItem(`${storagePrefix}-model`) || loadedAgent.model; } catch { return loadedAgent.model; }
  });
  const [setupModel, setSetupModel] = useState<string>(() => {
    try { return normalizeFreeSetupModel(localStorage.getItem(`${storagePrefix}-setupModel`)); } catch { return DEFAULT_FREE_SETUP_MODEL; }
  });

  // Auto-select first available model when keys load and current model's provider isn't configured
  useEffect(() => {
    if (keysLoading) return;
    const provider = getProviderForModel(agentModel);
    const hasCurrentKey = keys[provider]?.configured;
    if (!hasCurrentKey) {
      const firstAvailable = LLM_MODELS.find(m => keys[m.provider]?.configured);
      if (firstAvailable) {
        setAgentModel(firstAvailable.value);
      }
    }
  }, [keysLoading, keys]);

  useEffect(() => {
    try { localStorage.setItem(`${storagePrefix}-model`, agentModel); } catch {}
  }, [agentModel, storagePrefix]);
  useEffect(() => {
    try { localStorage.setItem(`${storagePrefix}-setupModel`, setupModel); } catch {}
  }, [setupModel, storagePrefix]);

  /* ── API keys ── */

  const { keys, loading: keysLoading, refetch: refetchKeys } = useApiKeys();
  const currentProvider = useMemo(() => getProviderForModel(agentModel), [agentModel]);
  const availableModels = useMemo(() => LLM_MODELS.filter(m => keys[m.provider]?.configured), [keys]);
  const hasApiKey    = !!keys[currentProvider]?.configured;
  const hasAnyLLMKey = useMemo(() => ["openai", "anthropic", "gemini"].some(p => keys[p]?.configured), [keys]);

  /* ── Agent config (from right panel) ── */

  const [agentConfig, setAgentConfig] = useState<AgentConfig | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Save agent ── */

  const { saveAgent } = useUserAgents();
  const [isSaving, setIsSaving] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState("agent");

  const handleSaveAgent = useCallback(async (config: AgentConfig & { model: string; agentType: string }) => {
    setIsSaving(true);
    try {
      const result = await saveAgent({
        id:          agentId && !TEMPLATE_MAP[agentId] ? agentId : undefined,
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
          voiceConfig:     config.voiceConfig,
        },
      });
      if (result) {
        if (agentId && TEMPLATE_MAP[agentId] && result.id !== agentId) {
          navigate(`/aikortex/agents/${result.id}`, { replace: true });
        }
      }
    } finally {
      setIsSaving(false);
    }
  }, [agentId, saveAgent, navigate]);

  const saveAgentRef = useRef(handleSaveAgent);
  saveAgentRef.current = handleSaveAgent;

  const handleConfigChange = useCallback((config: AgentConfig) => {
    setAgentConfig(config);

    // Auto-save with debounce
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      if (config.name?.trim()) {
        saveAgentRef.current({ ...config, model: agentModel, agentType: loadedAgent.agentType });
      }
    }, 2000);
  }, [agentModel, loadedAgent.agentType]);

  // Cleanup timer on unmount
  useEffect(() => () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); }, []);

  /* ── Wizard: preencher painel direito ── */

  const [presetData, setPresetData] = useState<{
    name?: string; description?: string; objective?: string;
    toneOfVoice?: string; greetingMessage?: string; instructions?: string;
  } | undefined>(undefined);

  const handleConfigStructured = useCallback((config: StructuredAgentConfig) => {
    setPresetData({
      name:            config.agent_name,
      description:     config.description,
      objective:       config.objective,
      toneOfVoice:     config.tone,
      greetingMessage: config.greeting_message,
      instructions:    config.instructions,
    });
  }, []);

  /* ── Wizard: structure request (calls edge function) ── */

  const handleStructureRequest = useCallback(async (description: string): Promise<StructuredAgentConfig | null> => {
    setIsStructuring(true);
    try {
      const resp = await fetch(STRUCTURE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          description,
          agent_type: loadedAgent.agentType,
          language: "pt-BR",
        }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        toast.error(data.error || "Erro ao estruturar agente");
        return null;
      }

      const data = await resp.json();
      return data.structuredConfig as StructuredAgentConfig;
    } catch (e) {
      console.error("Structure request error:", e);
      toast.error("Erro de conexão ao estruturar agente");
      return null;
    } finally {
      setIsStructuring(false);
    }
  }, [loadedAgent.agentType]);

  /* ── Wizard: build (save agent) ── */

  const handleBuildAgent = useCallback(async (config: StructuredAgentConfig) => {
    setIsBuilding(true);
    const resolvedType = loadedAgent.agentType || "Custom";
    try {
      const result = await saveAgent({
        id:          agentId && !TEMPLATE_MAP[agentId] ? agentId : undefined,
        name:        config.agent_name,
        agent_type:  resolvedType,
        description: config.description,
        avatar_url:  AVATAR_BY_TYPE[resolvedType] || avatar1,
        model:       agentModel,
        status:      "configuring",
        config: {
          objective:       config.objective,
          instructions:    config.instructions,
          toneOfVoice:     config.tone,
          greetingMessage: config.greeting_message,
          channels:        config.channels,
          integrations:    [],
          knowledgeFiles:  [],
          urls:            [],
        },
      });

      if (result) {
        toast.success(`✅ ${config.agent_name} criado com sucesso!`);
        setLoadedAgent({
          name: config.agent_name,
          avatar: AVATAR_BY_TYPE[resolvedType] || avatar1,
          model: agentModel,
          agentType: resolvedType,
          savedConfig: {
            objective: config.objective,
            instructions: config.instructions,
            toneOfVoice: config.tone,
            greetingMessage: config.greeting_message,
            channels: config.channels,
          },
        });
        setPresetData({
          name: config.agent_name,
          description: config.description,
          objective: config.objective,
          toneOfVoice: config.tone,
          greetingMessage: config.greeting_message,
          instructions: config.instructions,
        });
        setWizardStep("done");

        if (agentId && TEMPLATE_MAP[agentId] && result.id !== agentId) {
          navigate(`/aikortex/agents/${result.id}`, { replace: true });
        }
      }
    } catch (e) {
      console.error("Build agent error:", e);
      toast.error("Erro ao criar agente");
    } finally {
      setIsBuilding(false);
    }
  }, [agentId, saveAgent, navigate, agentModel, loadedAgent.agentType]);

  /* ── Auto-populate and auto-save for templates ── */

  const autoSavedRef = useRef(false);
  useEffect(() => {
    if (autoSavedRef.current || !isTemplate || !templateAgent?.autoPrompt) return;
    autoSavedRef.current = true;

    // Build preset data from AGENT_PRESETS immediately
    const preset = AGENT_PRESETS[templateAgent.agentType];
    const presetContext = preset?.context || {};
    
    const immediatePreset = {
      name: templateAgent.name,
      description: presetContext.targetAudienceDescription || templateAgent.autoPrompt.slice(0, 150),
      objective: presetContext.painPoints || "",
      toneOfVoice: presetContext.toneOfVoice || "Profissional e amigável",
      greetingMessage: presetContext.greetingMessage || "",
      instructions: `1. Sempre se apresentar como assistente\n2. Focar em entender as necessidades\n3. Ser ${presetContext.toneOfVoice || "profissional"}\n4. Nunca prometer o que não pode cumprir\n5. Direcionar para próximo passo claro`,
    };
    
    // Immediately populate the right panel
    setPresetData(immediatePreset);

    // Auto-save the agent in background
    const run = async () => {
      setIsBuilding(true);
      try {
        // First try AI-enhanced structure
        const aiConfig = await (async () => {
          try {
            const resp = await fetch(STRUCTURE_URL, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              },
              body: JSON.stringify({
                description: templateAgent.autoPrompt,
                agent_type: templateAgent.agentType,
                language: "pt-BR",
              }),
            });
            if (resp.ok) {
              const data = await resp.json();
              return data.structuredConfig as StructuredAgentConfig;
            }
          } catch (e) {
            console.warn("AI structure failed, using preset defaults:", e);
          }
          return null;
        })();

        // Use AI config if available, otherwise use preset defaults
        const finalConfig: StructuredAgentConfig = aiConfig || {
          agent_name: templateAgent.name,
          agent_type: templateAgent.agentType,
          description: immediatePreset.description,
          objective: immediatePreset.objective,
          tone: immediatePreset.toneOfVoice,
          language: "pt-BR",
          greeting_message: immediatePreset.greetingMessage,
          instructions: immediatePreset.instructions,
          channels: ["whatsapp", "website"],
          selected_features: [],
          onboarding_level: "soft",
        };

        // Update preset data with AI-enhanced config
        setPresetData({
          name: finalConfig.agent_name,
          description: finalConfig.description,
          objective: finalConfig.objective,
          toneOfVoice: finalConfig.tone,
          greetingMessage: finalConfig.greeting_message,
          instructions: finalConfig.instructions,
        });

        // Save to database
        const resolvedType = templateAgent.agentType;
        const result = await saveAgent({
          name: finalConfig.agent_name,
          agent_type: resolvedType,
          description: finalConfig.description,
          avatar_url: AVATAR_BY_TYPE[resolvedType] || avatar1,
          model: agentModel,
          status: "configuring",
          config: {
            objective: finalConfig.objective,
            instructions: finalConfig.instructions,
            toneOfVoice: finalConfig.tone,
            greetingMessage: finalConfig.greeting_message,
            channels: finalConfig.channels,
            integrations: [],
            knowledgeFiles: [],
            urls: [],
          },
        });

        if (result) {
          toast.success(`✅ ${finalConfig.agent_name} criado com sucesso!`);
          setLoadedAgent({
            name: finalConfig.agent_name,
            avatar: AVATAR_BY_TYPE[resolvedType] || avatar1,
            model: agentModel,
            agentType: resolvedType,
            savedConfig: {
              objective: finalConfig.objective,
              instructions: finalConfig.instructions,
              toneOfVoice: finalConfig.tone,
              greetingMessage: finalConfig.greeting_message,
              channels: finalConfig.channels,
            },
          });
          if (result.id !== agentId) {
            navigate(`/aikortex/agents/${result.id}`, { replace: true });
          }
        }
      } catch (e) {
        console.error("Auto-save template error:", e);
        toast.error("Erro ao criar agente. Os campos foram preenchidos — salve manualmente.");
      } finally {
        setIsBuilding(false);
      }
    };

    run();
  }, [isTemplate, templateAgent, agentId, agentModel, saveAgent, navigate]);

  /* ── Chat (setup mode — gratuito) ── */

  const setupSystemPrompt = useMemo(() => {
    const configSummary = agentConfig ? [
      agentConfig.name        ? `Nome: ${agentConfig.name}` : null,
      agentConfig.objective   ? `Objetivo: ${agentConfig.objective.slice(0, 150)}` : null,
      agentConfig.toneOfVoice ? `Tom: ${agentConfig.toneOfVoice}` : null,
    ].filter(Boolean).join("\n") : "Nenhuma configuração ainda.";

    return `Você é um assistente especializado em configurar agentes de IA na plataforma Aikortex.
Tipo do agente: ${loadedAgent.agentType}.
Seja BREVE e direto. Faça UMA pergunta por vez (máximo 2 linhas).

ESTADO ATUAL:
${configSummary}

Quando o usuário pedir alterações, oriente sobre o que pode ser ajustado no painel direito.
Quando todas as configurações estiverem completas, sugira usar o modo Testar.
IMPORTANTE: Você NÃO é o agente final. Apenas configure.`;
  }, [agentConfig, loadedAgent.agentType]);

  const setupInitialMessage = useMemo(() => {
    return `Olá! 👋 Sou o assistente de configuração do **${loadedAgent.name}**. O que gostaria de ajustar?`;
  }, [loadedAgent.name]);

  const setupChat = useAgentChat(
    [{ role: "agent", text: setupInitialMessage }],
    {
      useGateway:   true,
      gatewayModel: setupModel,
      systemPrompt: setupSystemPrompt,
      persistKey:   `${storagePrefix}-setup-messages`,
    }
  );

  /* ── Chat (test mode) ── */

  const testSystemPrompt = useMemo(() => {
    if (!agentConfig) return undefined;
    const parts = [
      `Você é o agente "${agentConfig.name}".`,
      agentConfig.description    ? `\nDescrição: ${agentConfig.description}` : "",
      agentConfig.objective      ? `\nObjetivo: ${agentConfig.objective}` : "",
      agentConfig.instructions   ? `\nInstruções: ${agentConfig.instructions}` : "",
      agentConfig.toneOfVoice    ? `\nTom de voz: ${agentConfig.toneOfVoice}` : "",
      agentConfig.greetingMessage ? `\nMensagem de saudação: ${agentConfig.greetingMessage}` : "",
      "\nResponda sempre em português brasileiro. Seja coerente com a configuração acima.",
    ];
    return parts.join("");
  }, [agentConfig]);

  const testChat = useAgentChat(
    [{ role: "agent", text: `🧪 Modo de Teste ativado! Respondendo como **${loadedAgent.name}**. Envie uma mensagem.` }],
    {
      provider:     currentProvider,
      model:        agentModel,
      systemPrompt: testSystemPrompt,
      persistKey:   `${storagePrefix}-test-messages`,
    }
  );

  const activeChat = chatMode === "setup" ? setupChat : testChat;

  /* ── Limpar localStorage ao abrir template ── */

  useEffect(() => {
    if (!isTemplate || !agentId) return;
    const prefix = `agent-detail-${agentId}`;
    try {
      ["name","desc","objective","instructions","toneOfVoice","greetingMessage",
       "files","urls","channels","apiConfig","avatar","setup-messages","test-messages","chatMode","model","setupModel"].forEach(k =>
        localStorage.removeItem(`${prefix}-${k}`)
      );
    } catch {}
  }, [isTemplate, agentId]);

  /* ── Loading screen ── */

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

      {/* ── LEFT: Studio (Chat Panel) ── */}
      <AgentChatPanel
        onBack={() => navigate("/aikortex/agents")}
        agentType={loadedAgent.agentType}
        agentName={loadedAgent.name}
        agentAvatar={loadedAgent.avatar}
        wizardStep={wizardStep}
        setWizardStep={setWizardStep}
        structuredConfig={structuredConfig}
        setStructuredConfig={setStructuredConfig}
        chatMode={chatMode}
        setChatMode={setChatMode as any}
        hasApiKey={hasApiKey}
        hasAnyLLMKey={hasAnyLLMKey}
        keysLoading={keysLoading}
        currentProvider={currentProvider}
        agentModel={agentModel}
        availableModels={availableModels as any}
        setupModel={setupModel}
        setSetupModel={setSetupModel}
        setAgentModel={setAgentModel}
        gatewayModels={GATEWAY_MODELS}
        onGoToIntegrations={() => { setShowConfig(true); setRightPanelTab("connectors"); }}
        onConfigStructured={handleConfigStructured}
        onAgentCreated={handleBuildAgent}
        messages={activeChat.messages}
        sendMessage={activeChat.sendMessage}
        isStreaming={activeChat.isStreaming}
        onStructureRequest={handleStructureRequest}
        onBuildAgent={handleBuildAgent}
        isStructuring={isStructuring}
        isBuilding={isBuilding}
        onOpenConfig={() => setShowConfig(true)}
      />

      {/* ── RIGHT: Voice Agent ── */}
      <div className="flex-1 flex flex-col overflow-hidden border-l border-border">
        {/* Top bar */}
        <div className="h-12 border-b border-border flex items-center justify-between px-4 shrink-0 bg-card/30">
          <div className="flex items-center gap-2">
            <img src={loadedAgent.avatar} className="w-6 h-6 rounded-full object-cover" alt="" />
            <span className="text-sm font-semibold">{loadedAgent.name}</span>
            <span className="text-[10px] text-muted-foreground">— Agente de Voz</span>
          </div>
          <div className="flex items-center gap-1">
            {[
              { label: "Agente",       icon: Bot,               tab: "agent" },
              { label: "Integrações",  icon: Plug,              tab: "connectors" },
              { label: "Canais",       icon: Share2,            tab: "channels" },
              { label: "Avançado",     icon: SlidersHorizontal, tab: "advanced" },
            ].map((btn) => (
              <Button
                key={btn.tab}
                variant={showConfig && rightPanelTab === btn.tab ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-xs gap-1 px-2"
                onClick={() => { setRightPanelTab(btn.tab); setShowConfig(true); }}
              >
                <btn.icon className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">{btn.label}</span>
              </Button>
            ))}
            <div className="w-px h-5 bg-border mx-1" />
            {isSaving && (
              <span className="text-[10px] text-muted-foreground animate-pulse">Salvando...</span>
            )}
            <Button
              size="sm"
              className="h-7 text-xs gap-1 px-2"
              disabled={!agentConfig?.name?.trim() || isSaving}
              onClick={() => toast.info("Publicação em breve!")}
            >
              <Rocket className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Publicar</span>
            </Button>
          </div>
        </div>

        {/* Voice call interface */}
        <ConversationProvider>
          <VoiceCallPanel
            agentName={loadedAgent.name}
            agentAvatar={loadedAgent.avatar}
            elevenLabsAgentId={(agentConfig as any)?.voiceConfig?.elevenLabsAgentId}
            hasElevenLabsKey={!!keys["elevenlabs"]?.configured}
            onGoToIntegrations={() => { setShowConfig(true); setRightPanelTab("connectors"); }}
          />
        </ConversationProvider>
      </div>

      {/* ── Config Panel (Sheet overlay like AppBuilder) ── */}
      <Sheet open={showConfig} onOpenChange={setShowConfig}>
        <SheetContent side="right" className="w-full sm:w-[50vw] sm:max-w-[50vw] p-0 border-l border-border">
          <SheetHeader className="sr-only">
            <SheetTitle>Configurações do Agente</SheetTitle>
          </SheetHeader>
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
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AgentDetail;
