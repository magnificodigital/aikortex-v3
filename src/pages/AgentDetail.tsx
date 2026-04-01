import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, Send, Paperclip, HelpCircle, AlertTriangle, KeyRound, Bot, TestTube, Loader2 } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";

import avatar1 from "@/assets/avatars/avatar-1.png";
import avatar2 from "@/assets/avatars/avatar-2.png";
import avatar3 from "@/assets/avatars/avatar-3.png";
import avatar8 from "@/assets/avatars/avatar-8.png";
import { DEFAULT_FREE_SETUP_MODEL, GATEWAY_MODELS, normalizeFreeSetupModel } from "@/lib/free-setup-models";

// FIX: mapa apenas para templates — agentes salvos (UUID) carregam do banco
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

// FIX: estado do agente carregado do banco
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

  // FIX: detectar se é template ou agente salvo (UUID)
  const isTemplate = !!agentId && !!TEMPLATE_MAP[agentId];
  const templateAgent = isTemplate ? TEMPLATE_MAP[agentId!] : null;

  // FIX: estado do agente — começa com template ou placeholder até carregar do banco
  const [loadedAgent, setLoadedAgent] = useState<LoadedAgent>(() => {
    if (templateAgent) {
      return { name: templateAgent.name, avatar: templateAgent.avatar, model: templateAgent.model, agentType: templateAgent.agentType, savedConfig: null };
    }
    return { name: "Carregando...", avatar: avatar1, model: "gemini-2.5-flash", agentType: "Custom", savedConfig: null };
  });
  const [agentLoading, setAgentLoading] = useState(!isTemplate);

  // FIX: carregar agente salvo do banco quando for UUID
  useEffect(() => {
    if (isTemplate || !agentId) return;
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
          savedConfig: data.config || null,
        });
      }
      setAgentLoading(false);
    };
    load();
  }, [agentId, isTemplate]);

  // FIX: preset data extraído corretamente da navegação
  const navState   = location.state as any;
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

  // FIX: forçar limpeza do localStorage quando vier de template
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
    try { return (localStorage.getItem(`${storagePrefix}-chatMode`) as "setup" | "test") || "setup"; } catch { return "setup"; }
  });
  const [agentConfig,  setAgentConfig]  = useState<AgentConfig | null>(null);
  const [isSaving,     setIsSaving]     = useState(false);

  // Sync model when loadedAgent changes (from DB load)
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

  const { saveAgent } = useUserAgents();

  const handleSaveAgent = useCallback(async (config: AgentConfig & { model: string; agentType: string }) => {
    setIsSaving(true);
    try {
      // FIX: usar agentType do config (passado pelo RightPanel) — nunca do TEMPLATE_MAP
      const result = await saveAgent({
        // FIX: só passar id se for UUID (agente salvo), não se for template key
        id: agentId && !TEMPLATE_MAP[agentId] ? agentId : undefined,
        name:        config.name,
        agent_type:  config.agentType,  // FIX: vem do RightPanel, não do mapa
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
        // FIX: navegar para o ID real salvo se veio de template
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

  // Loading state enquanto carrega agente do banco
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
      {/* LEFT — Chat */}
      <div className="w-full max-w-[55%] flex flex-col border-r border-border">
        {/* Header */}
        <div className="h-12 border-b border-border flex items-center gap-3 px-4 shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate("/aikortex/agents")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <img src={loadedAgent.avatar} alt={loadedAgent.name} className="w-7 h-7 rounded-full object-cover" />
          <span className="text-sm font-semibold">{loadedAgent.name}</span>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{loadedAgent.agentType}</span>

          {/* Mode toggle */}
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

        {/* API Key Info — setup mode sem chaves */}
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

        {/* API Key Warning — test mode sem chave do provider */}
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
      </div>

      {/* RIGHT — Panel */}
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
  );
};

export default AgentDetail;
