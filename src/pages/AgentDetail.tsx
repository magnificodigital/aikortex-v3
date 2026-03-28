import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send, Paperclip, HelpCircle, AlertTriangle, KeyRound, Bot, TestTube } from "lucide-react";
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

import avatar1 from "@/assets/avatars/avatar-1.png";
import avatar2 from "@/assets/avatars/avatar-2.png";
import avatar3 from "@/assets/avatars/avatar-3.png";
import avatar8 from "@/assets/avatars/avatar-8.png";
import { DEFAULT_FREE_SETUP_MODEL, GATEWAY_MODELS, normalizeFreeSetupModel } from "@/lib/free-setup-models";

const AGENTS_MAP: Record<string, { name: string; avatar: string; model: string; agentType: AgentType }> = {
  "sdr-1": { name: "Agente SDR", avatar: avatar1, model: "gemini-2.5-flash", agentType: "SDR" },
  "bdr-1": { name: "Agente BDR", avatar: avatar2, model: "gemini-2.5-flash", agentType: "BDR" },
  "sac-1": { name: "Agente SAC", avatar: avatar3, model: "gemini-2.5-flash", agentType: "SAC" },
  "social-1": { name: "Social Media Manager", avatar: avatar8, model: "gemini-2.5-flash", agentType: "Custom" },
  "custom-1": { name: "Agente Personalizado", avatar: avatar1, model: "gemini-2.5-flash", agentType: "Custom" },
};

const LLM_MODELS = [
  { value: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro", provider: "gemini" },
  { value: "gemini-3-flash-preview", label: "Gemini 3 Flash", provider: "gemini" },
  { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro", provider: "gemini" },
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash", provider: "gemini" },
  { value: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite", provider: "gemini" },
  { value: "gpt-5.2", label: "GPT-5.2", provider: "openai" },
  { value: "gpt-5", label: "GPT-5", provider: "openai" },
  { value: "gpt-5-mini", label: "GPT-5 Mini", provider: "openai" },
  { value: "gpt-5-nano", label: "GPT-5 Nano", provider: "openai" },
  { value: "gpt-4o", label: "GPT-4o", provider: "openai" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini", provider: "openai" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo", provider: "openai" },
  { value: "gpt-4", label: "GPT-4", provider: "openai" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo", provider: "openai" },
  { value: "claude-4-sonnet", label: "Claude 4 Sonnet", provider: "anthropic" },
  { value: "claude-3.5-sonnet", label: "Claude 3.5 Sonnet", provider: "anthropic" },
  { value: "claude-3-opus", label: "Claude 3 Opus", provider: "anthropic" },
  { value: "claude-3-haiku", label: "Claude 3 Haiku", provider: "anthropic" },
] as const;

const getProviderForModel = (model: string): string => {
  if (model.startsWith("gemini")) return "gemini";
  if (model.startsWith("gpt")) return "openai";
  if (model.startsWith("claude")) return "anthropic";
  if (model.includes("/")) return "openrouter";
  return "openai";
};

const buildSetupSystemPrompt = (config: AgentConfig | null, apiKeys: Record<string, { provider: string; configured: boolean }>, currentModel: string) => {
  const configuredProviders = Object.keys(apiKeys).filter(k => apiKeys[k]?.configured);
  const apiKeyStatus = configuredProviders.length > 0
    ? `Chaves de API configuradas: ${configuredProviders.join(", ")}.`
    : "Nenhuma chave de API configurada ainda.";

  const configStatus = config ? [
    config.name ? `Nome: ${config.name}` : null,
    config.description ? `Descrição: ${config.description.slice(0, 200)}` : null,
    config.objective ? `Objetivo: ${config.objective.slice(0, 200)}` : null,
    config.instructions ? `Instruções: ${config.instructions.slice(0, 200)}` : null,
    config.toneOfVoice ? `Tom de voz: ${config.toneOfVoice}` : null,
    config.greetingMessage ? `Mensagem de saudação: ${config.greetingMessage.slice(0, 100)}` : null,
    config.channels?.length ? `Canais: ${config.channels.join(", ")}` : null,
    config.integrations?.length ? `Integrações: ${config.integrations.join(", ")}` : null,
    config.knowledgeFiles?.length ? `Arquivos: ${config.knowledgeFiles.length} arquivo(s)` : null,
    config.urls?.length ? `URLs: ${config.urls.join(", ")}` : null,
    config.avatarUrl ? `Foto: configurada` : null,
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

const AgentDetail = () => {
  const navigate = useNavigate();
  const { agentId } = useParams();
  const agent = AGENTS_MAP[agentId || "sdr-1"] || AGENTS_MAP["sdr-1"];

  const storagePrefix = `agent-detail-${agentId || "sdr-1"}`;

  const [input, setInput] = useState("");
  const [agentModel, setAgentModel] = useState(() => {
    try { return localStorage.getItem(`${storagePrefix}-model`) || agent.model; } catch { return agent.model; }
  });
  const [setupModel, setSetupModel] = useState<string>(() => {
    try { return normalizeFreeSetupModel(localStorage.getItem(`${storagePrefix}-setupModel`)); } catch { return DEFAULT_FREE_SETUP_MODEL; }
  });
  const [rightPanelTab, setRightPanelTab] = useState("agent");
  const [chatMode, setChatMode] = useState<"setup" | "test">(() => {
    try { return (localStorage.getItem(`${storagePrefix}-chatMode`) as "setup" | "test") || "setup"; } catch { return "setup"; }
  });
  const [agentConfig, setAgentConfig] = useState<AgentConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleConfigChange = useCallback((config: AgentConfig) => {
    setAgentConfig(config);
  }, []);

  const { saveAgent } = useUserAgents();

  const handleSaveAgent = useCallback(async (config: AgentConfig & { model: string; agentType: string }) => {
    setIsSaving(true);
    try {
      const result = await saveAgent({
        id: agentId && !AGENTS_MAP[agentId] ? agentId : undefined,
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
      }
    } finally {
      setIsSaving(false);
    }
  }, [agentId, saveAgent]);

  const { keys, loading: keysLoading, refetch: refetchKeys } = useApiKeys();

  const currentProvider = useMemo(() => getProviderForModel(agentModel), [agentModel]);

  const availableModels = useMemo(() => {
    return LLM_MODELS.filter((model) => keys[model.provider]?.configured);
  }, [keys]);

  const hasApiKey = !!keys[currentProvider]?.configured;

  // Check if ANY LLM provider key is configured (required to start)
  const hasAnyLLMKey = useMemo(() => {
    return ["openai", "anthropic", "gemini", "openrouter"].some(p => keys[p]?.configured);
  }, [keys]);

  useEffect(() => {
    if (rightPanelTab !== "connectors") {
      refetchKeys();
    }
  }, [rightPanelTab, refetchKeys]);

  // Auto-redirect to Integrações tab if no API key is configured at all
  useEffect(() => {
    if (keysLoading) return;
    if (!hasAnyLLMKey) {
      setRightPanelTab("connectors");
    }
  }, [hasAnyLLMKey, keysLoading]);

  useEffect(() => {
    if (chatMode !== "test" || keysLoading) return;
    const providerForModel = getProviderForModel(agentModel);
    if (providerForModel && !keys[providerForModel]?.configured) {
      setRightPanelTab("connectors");
    }
  }, [agentModel, chatMode, keys, keysLoading]);

  // Persist chatMode, agentModel, setupModel to localStorage
  useEffect(() => { try { localStorage.setItem(`${storagePrefix}-chatMode`, chatMode); } catch {} }, [chatMode, storagePrefix]);
  useEffect(() => { try { localStorage.setItem(`${storagePrefix}-model`, agentModel); } catch {} }, [agentModel, storagePrefix]);
  useEffect(() => { try { localStorage.setItem(`${storagePrefix}-setupModel`, setupModel); } catch {} }, [setupModel, storagePrefix]);

  const setupSystemPrompt = useMemo(() => buildSetupSystemPrompt(agentConfig, keys, agentModel), [agentConfig, keys, agentModel]);

  // Setup mode ALWAYS uses free OpenRouter models
  const setupInitialMessage = useMemo(() => {
    if (!hasAnyLLMKey && !keysLoading) {
      return `⚠️ **Primeiro passo obrigatório:** Configure sua chave de API na aba **Integrações** no painel à direita para começar a construir seu agente.`;
    }
    return `Olá! 👋 Sou o assistente de configuração do **${agent.name}**. O que gostaria de configurar?`;
  }, [hasAnyLLMKey, keysLoading, agent.name]);

  const setupChat = useAgentChat(
    [{ role: "agent", text: setupInitialMessage }],
    { useGateway: true, gatewayModel: setupModel, systemPrompt: setupSystemPrompt, persistKey: `${storagePrefix}-setup-messages` }
  );

  // Build dynamic system prompt from agent configuration for test mode
  const testSystemPrompt = useMemo(() => {
    if (!agentConfig) return undefined;
    const parts: string[] = [];
    parts.push(`Você é o agente "${agentConfig.name}".`);
    parts.push(`\n\nVocê deve agir de forma totalmente coerente com a configuração operacional recebida.`);
    if (agentConfig.description) parts.push(`\n\nDescrição, papel e instruções principais:\n${agentConfig.description}`);
    if (agentConfig.objective) parts.push(`\n\nObjetivo/Missão:\n${agentConfig.objective}`);
    if (agentConfig.instructions) parts.push(`\n\nRegras e instruções específicas:\n${agentConfig.instructions}`);
    if (agentConfig.toneOfVoice) parts.push(`\n\nTom de voz: ${agentConfig.toneOfVoice}`);
    if (agentConfig.greetingMessage) parts.push(`\n\nMensagem de saudação padrão: ${agentConfig.greetingMessage}`);
    if (agentConfig.channels.length > 0) {
      parts.push(`\n\nCanais ativos: ${agentConfig.channels.join(", ")}`);
    }
    if (agentConfig.integrations.length > 0) {
      parts.push(`\n\nIntegrações configuradas: ${agentConfig.integrations.join(", ")}`);
    }
    if (agentConfig.knowledgeFiles.length > 0) {
      parts.push(`\n\nArquivos de conhecimento: ${agentConfig.knowledgeFiles.join(", ")}`);
    }
    if (agentConfig.urls.length > 0) {
      parts.push(`\n\nURLs de referência: ${agentConfig.urls.join(", ")}`);
    }
    parts.push(`\n\nRegras obrigatórias:`);
    parts.push(`\n- Nunca diga que você é um assistente genérico sem nome se um nome foi configurado.`);
    parts.push(`\n- Responda como o agente configurado, mantendo persona, função e contexto.`);
    parts.push(`\n- Se faltar alguma informação operacional, assuma apenas o mínimo necessário sem contradizer a configuração.`);
    parts.push(`\n\nResponda sempre em português brasileiro. Seja profissional, direto e coerente com o agente configurado.`);
    return parts.join("");
  }, [agentConfig]);

  const testApiConfig = agentConfig?.apiConfig;
  const testChat = useAgentChat(
    [{ role: "agent", text: `🧪 Modo de Teste ativado! Agora estou respondendo como o **${agent.name}** usando o modelo ${LLM_MODELS.find(m => m.value === agentModel)?.label || agentModel}. Envie uma mensagem para testar.` }],
    {
      provider: currentProvider,
      model: agentModel,
      systemPrompt: testSystemPrompt,
      persistKey: `${storagePrefix}-test-messages`,
      agentContext: agentConfig ? {
        name: agentConfig.name,
        description: agentConfig.description,
        objective: agentConfig.objective,
        instructions: agentConfig.instructions,
        toneOfVoice: agentConfig.toneOfVoice,
        greetingMessage: agentConfig.greetingMessage,
        channels: agentConfig.channels,
        integrations: agentConfig.integrations,
        knowledgeFiles: agentConfig.knowledgeFiles,
        urls: agentConfig.urls,
        provider: currentProvider,
        model: agentModel,
        temperature: testApiConfig?.temperature,
        maxTokens: testApiConfig?.maxTokens,
        topP: testApiConfig?.topP,
        frequencyPenalty: testApiConfig?.frequencyPenalty,
        presencePenalty: testApiConfig?.presencePenalty,
        responseFormat: testApiConfig?.responseFormat,
        stopSequences: testApiConfig?.stopSequences,
      } : undefined,
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

  const activeChat = chatMode === "setup" ? setupChat : testChat;
  const { messages, sendMessage, isStreaming } = activeChat;

  const canSend = chatMode === "setup" ? (!keysLoading && hasAnyLLMKey) : (!keysLoading && hasApiKey);

  const handleSend = () => {
    if (!input.trim() || isStreaming || !canSend) return;
    const text = input.trim();
    setInput("");
    sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* LEFT — Chat */}
      <div className="w-full max-w-[55%] flex flex-col border-r border-border">
        {/* Header */}
        <div className="h-12 border-b border-border flex items-center gap-3 px-4 shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate("/aikortex/agents")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <img src={agent.avatar} alt={agent.name} className="w-7 h-7 rounded-full object-cover" />
          <span className="text-sm font-semibold">{agent.name}</span>

          {/* Mode toggle */}
          <div className="ml-auto flex items-center gap-1.5">
            <Button
              variant={chatMode === "setup" ? "default" : "ghost"}
              size="sm"
              className="text-xs gap-1 h-7"
              onClick={() => setChatMode("setup")}
            >
              <Bot className="w-3 h-3" />
              Configurar
            </Button>
            <Button
              variant={chatMode === "test" ? "default" : "ghost"}
              size="sm"
              className="text-xs gap-1 h-7"
              onClick={() => setChatMode("test")}
            >
              <TestTube className="w-3 h-3" />
              Testar
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
                  <img src={agent.avatar} alt="" className="w-6 h-6 rounded-full object-cover mt-0.5" />
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
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* API Key Warning — required for both modes */}
        {!keysLoading && !hasAnyLLMKey && (
          <div className="px-4 pt-2">
            <Alert className="border-destructive/30 bg-destructive/5">
              <KeyRound className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-xs text-muted-foreground flex items-center justify-between">
                <span>
                  <strong className="text-foreground">Passo obrigatório:</strong> Configure pelo menos uma chave de API (OpenAI, Anthropic ou Gemini) na aba <strong className="text-foreground">Integrações</strong> para começar.
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1 ml-3 shrink-0"
                  onClick={() => setRightPanelTab("connectors")}
                >
                  <KeyRound className="w-3 h-3" /> Configurar API
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* API Key Warning — test mode specific provider */}
        {chatMode === "test" && !keysLoading && hasAnyLLMKey && !hasApiKey && (
          <div className="px-4 pt-2">
            <Alert className="border-yellow-500/30 bg-yellow-500/5">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-xs text-muted-foreground flex items-center justify-between">
                <span>
                  Configure sua chave de API do provedor <strong className="text-foreground">{currentProvider === "openai" ? "OpenAI" : currentProvider === "anthropic" ? "Anthropic" : "Gemini"}</strong> na aba Integrações para testar com o modelo <strong className="text-foreground">{LLM_MODELS.find((m) => m.value === agentModel)?.label || agentModel}</strong>.
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1 ml-3 shrink-0"
                  onClick={() => setRightPanelTab("connectors")}
                >
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
                !hasAnyLLMKey && !keysLoading
                  ? "🔑 Configure sua chave de API na aba Integrações para começar..."
                  : chatMode === "test" && !hasApiKey && !keysLoading
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
                <Button size="icon" className="h-8 w-8 rounded-full" onClick={handleSend} disabled={!input.trim() || isStreaming || !canSend}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT — Panel */}
      <AgentRightPanel agent={agent} agentType={agent.agentType} agentModel={agentModel} onModelChange={setAgentModel} activeTab={rightPanelTab} onTabChange={setRightPanelTab} onApiKeysChanged={refetchKeys} onConfigChange={handleConfigChange} onSaveAgent={handleSaveAgent} isSaving={isSaving} storagePrefix={storagePrefix} />
    </div>
  );
};

export default AgentDetail;
