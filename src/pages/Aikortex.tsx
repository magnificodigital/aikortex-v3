import { useState, useCallback, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { ArrowLeft, Send, Paperclip, HelpCircle, Bot, TestTube, AlertTriangle, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";

import DashboardLayout from "@/components/DashboardLayout";
import {
  type WizardStep,
  type BusinessContext,
  type AgentRecommendation,
  type DeployChannel,
  type CRMProvider,
  type ExternalTool,
  type AgentIntent,
  type ConversationStage,
  type AgentAdvancedConfig,
  INITIAL_CONTEXT,
  MANDATORY_INTENTS,
  DEFAULT_CONVERSATION_STAGES,
  DEFAULT_ADVANCED_CONFIG,
} from "@/types/agent-builder";
import { AGENT_PRESETS } from "@/types/agent-presets";
import StepAgents from "@/components/aikortex/StepAgents";
import WizardRightPanel from "@/components/aikortex/WizardRightPanel";
import { useAgentChat } from "@/hooks/use-agent-chat";
import { useApiKeys } from "@/hooks/use-api-keys";
import { useUserAgents } from "@/hooks/use-user-agents";

import avatar1 from "@/assets/avatars/avatar-1.png";
import avatar2 from "@/assets/avatars/avatar-2.png";
import avatar3 from "@/assets/avatars/avatar-3.png";
import avatar8 from "@/assets/avatars/avatar-8.png";

const AVATARS_MAP: Record<string, string> = {
  "sdr-1": avatar1,
  "bdr-1": avatar2,
  "sac-1": avatar3,
  "social-1": avatar8,
  "custom-1": avatar1,
};

const LLM_MODELS = [
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash", provider: "gemini" },
  { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro", provider: "gemini" },
  { value: "gemini-3-flash-preview", label: "Gemini 3 Flash", provider: "gemini" },
  { value: "gpt-5", label: "GPT-5", provider: "openai" },
  { value: "gpt-5-mini", label: "GPT-5 Mini", provider: "openai" },
] as const;

// Free models available via OpenRouter for the setup assistant
const FREE_MODELS = [
  { value: "stepfun/step-3.5-flash:free", label: "Step 3.5 Flash" },
  { value: "deepseek/deepseek-chat-v3-0324:free", label: "DeepSeek V3" },
  { value: "google/gemma-3-27b-it:free", label: "Gemma 3 27B" },
  { value: "meta-llama/llama-4-maverick:free", label: "Llama 4 Maverick" },
] as const;

const getProviderForModel = (model: string) => {
  if (model.startsWith("gemini")) return "gemini";
  if (model.startsWith("gpt")) return "openai";
  return "openai";
};

const getBestAvailableModel = (currentModel: string, keys: Record<string, { configured: boolean }>) => {
  const currentProvider = getProviderForModel(currentModel);
  if (keys[currentProvider]?.configured) return currentModel;
  if (keys.openai?.configured) return "gpt-5-mini";
  if (keys.gemini?.configured) return "gemini-2.5-flash";
  return currentModel;
};

const SETUP_SYSTEM_PROMPT = `Você é o assistente de configuração de agentes na Aikortex. Responda em português brasileiro, seja BREVE e direto. Faça UMA pergunta por vez, curta (máximo 2 linhas). Se a resposta do usuário for válida, confirme rapidamente e preencha o campo automaticamente. Não repita informações já fornecidas.

FLUXO COMPLETO DE CONFIGURAÇÃO (siga nesta ordem):
1. **Identidade** — Nome do agente, descrição/cargo, empresa, tom de voz, mensagem de saudação
2. **Foto** — Pergunte se quer trocar a foto do agente
3. **Objetivo** — O que o agente faz (propósito), resultado esperado, público atendido
4. **Ações** — Quais ações personalizadas o agente deve ter (ex: agendar reunião, enviar proposta)
5. **Estágios** — Revisar/ajustar etapas da conversa
6. **Avançado** — Limite de respostas, tamanho de mensagem, criatividade, tempo mínimo de resposta
7. **Integrações, Canais e Arquivos** — Direcionados ao painel lateral

REGRA DE PREENCHIMENTO AUTOMÁTICO:
Sempre que confirmar um campo, inclua um marcador oculto no formato [SET:campo=valor]. Campos disponíveis:
- agentName (nome do agente)
- companyName (nome da empresa)
- industry (setor/indústria)
- mainProduct (cargo/função do agente)
- targetAudienceDescription (o que o agente faz — propósito principal)
- painPoints (resultado esperado)
- knowledgeSources (público atendido)
- toneOfVoice (tom de voz)
- greetingMessage (mensagem de saudação)
- website (site da empresa)
- businessHours (horário de funcionamento)
- escalationRules (regras de escalação)

Exemplo: "✅ Nome definido! [SET:agentName=Luna] Qual o objetivo principal do agente?"
Exemplo: "✅ Entendi! [SET:companyName=TechCorp] [SET:industry=Tecnologia] E qual é o produto ou serviço principal?"
Exemplo: "✅ Propósito registrado! [SET:targetAudienceDescription=Qualificar leads inbound e agendar reuniões] [SWITCH_NAV:objetivo] Qual o resultado esperado?"

REGRA DE NAVEGAÇÃO DO PAINEL:
Quando preencher campos de uma seção, inclua o marcador [SWITCH_NAV:secao] para direcionar o painel à direita:
- [SWITCH_NAV:identidade] — ao configurar nome, empresa, tom de voz
- [SWITCH_NAV:objetivo] — ao configurar propósito, resultado esperado, público
- [SWITCH_NAV:intencoes] — ao configurar ações personalizadas
- [SWITCH_NAV:estagios] — ao configurar etapas da conversa
- [SWITCH_NAV:avancado] — ao configurar limites e comportamento

REGRA SOBRE FOTO DO AGENTE:
Quando o usuário quiser trocar a foto/avatar, responda: "📷 Para trocar a foto do agente, clique no ícone da câmera no painel à direita, na seção **Identidade**." e inclua [SWITCH_NAV:identidade]

REGRA IMPORTANTE sobre Integrações, Canais e Arquivos/Conhecimento:
- **Integrações** (APIs, MCPs, Webhooks, chaves de API): "⚙️ Para configurar integrações, use o painel à direita na aba **Integrações**." [SWITCH_TAB:connectors]
- **Canais** (WhatsApp, Instagram, Facebook, Site, Telegram): "📱 Para configurar canais, use o painel à direita na aba **Canais**." [SWITCH_TAB:channels]
- **Arquivos/Conhecimento** (documentos, PDFs, URLs, base de conhecimento): "📄 Para adicionar arquivos e conhecimento, use o painel à direita na aba **Conhecimento**." [SWITCH_TAB:knowledge]

IMPORTANTE: Você NÃO é o agente final. Apenas configure.`;

const Aikortex = () => {
  const location = useLocation();
  const [step, setStep] = useState<"agent" | "configure">("agent");
  const [context, setContext] = useState<BusinessContext>(INITIAL_CONTEXT);
  const [selectedAgent, setSelectedAgent] = useState<AgentRecommendation | null>(null);
  const [selectedChannels, setSelectedChannels] = useState<DeployChannel[]>([]);
  const [selectedCRM, setSelectedCRM] = useState<CRMProvider | null>(null);
  const [selectedTools, setSelectedTools] = useState<ExternalTool[]>([]);
  const [intents, setIntents] = useState<AgentIntent[]>([...MANDATORY_INTENTS]);
  const [stages, setStages] = useState<ConversationStage[]>([...DEFAULT_CONVERSATION_STAGES]);
  const [advancedConfig, setAdvancedConfig] = useState<AgentAdvancedConfig>({ ...DEFAULT_ADVANCED_CONFIG });

  const [input, setInput] = useState("");
  const [agentModel, setAgentModel] = useState("gemini-2.5-flash");
  const [setupModel, setSetupModel] = useState<string>(FREE_MODELS[0].value);
  const [rightPanelTab, setRightPanelTab] = useState("agent");
  const [rightPanelSection, setRightPanelSection] = useState<string | undefined>(undefined);
  const [didAutoRoute, setDidAutoRoute] = useState(false);
  const [chatMode, setChatMode] = useState<"setup" | "test">("setup");
  const [savedAgentId, setSavedAgentId] = useState<string | null>(null);

  const { saveAgent: saveUserAgent } = useUserAgents();

  const { keys, loading: keysLoading, refetch: refetchKeys } = useApiKeys();

  const currentProvider = useMemo(() => getProviderForModel(agentModel), [agentModel]);

  const availableModels = useMemo(() => {
    return LLM_MODELS.filter((model) => keys[model.provider]?.configured);
  }, [keys]);

  const hasApiKey = !!keys[currentProvider]?.configured;

  useEffect(() => {
    if (rightPanelTab !== "connectors") {
      refetchKeys();
    }
  }, [rightPanelTab, refetchKeys]);

  useEffect(() => {
    if (chatMode !== "test" || keysLoading) return;
    const nextModel = getBestAvailableModel(agentModel, keys);
    if (nextModel !== agentModel) {
      setAgentModel(nextModel);
    }
  }, [agentModel, chatMode, keys, keysLoading]);

  const agentNameForChat = selectedAgent?.name || "Agente IA";

  // Setup mode ALWAYS uses free OpenRouter models
  const setupChat = useAgentChat(
    [{ role: "agent", text: `👋 Vou configurar o **${agentNameForChat}**. Qual nome quer dar ao agente?` }],
    { useGateway: true, gatewayModel: setupModel, systemPrompt: SETUP_SYSTEM_PROMPT }
  );

  const testChat = useAgentChat(
    [{ role: "agent", text: `🧪 Modo de Teste ativado! Agora estou respondendo como o **${agentNameForChat}** usando o modelo ${LLM_MODELS.find(m => m.value === agentModel)?.label || agentModel}. Envie uma mensagem para testar.` }],
    { model: agentModel }
  );

  useEffect(() => {
    testChat.setMessages([
      {
        role: "agent",
        text: `🧪 Modo de Teste ativado! Agora estou respondendo como o **${agentNameForChat}** usando o modelo ${LLM_MODELS.find((m) => m.value === agentModel)?.label || agentModel}. Envie uma mensagem para testar.`,
      },
    ]);
  }, [agentModel, agentNameForChat, testChat.setMessages]);

  const activeChat = chatMode === "setup" ? setupChat : testChat;
  const { messages, sendMessage, isStreaming } = activeChat;

  // Auto-switch right panel tab/section and auto-fill fields when AI suggests it
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role !== "agent") return;

    // Switch top-level tab
      const tabMatch = lastMsg.text.match(/\[SWITCH_TAB:(connectors|channels|knowledge)\]/);
      if (tabMatch) {
        const tabMap = {
          connectors: "connectors",
          channels: "settings",
          knowledge: "files",
        } as const;
        setRightPanelTab(tabMap[tabMatch[1] as keyof typeof tabMap]);
      }

    // Switch agent sub-section navigation
    const navMatch = lastMsg.text.match(/\[SWITCH_NAV:(identidade|objetivo|intencoes|estagios|avancado)\]/);
    if (navMatch) {
      setRightPanelTab("agent");
      setRightPanelSection(navMatch[1]);
    }

    // Auto-fill fields from [SET:field=value] markers
    const setMatches = lastMsg.text.matchAll(/\[SET:(\w+)=([^\]]+)\]/g);
    const updates: Partial<BusinessContext> = {};
    for (const m of setMatches) {
      const field = m[1] as keyof BusinessContext;
      const value = m[2];
      const validFields: (keyof BusinessContext)[] = [
        "agentName", "companyName", "industry", "mainProduct",
        "targetAudienceDescription", "toneOfVoice", "greetingMessage",
        "website", "painPoints", "knowledgeSources", "businessHours", "escalationRules",
      ];
      if (validFields.includes(field)) {
        updates[field] = value as any;
      }
    }
    if (Object.keys(updates).length > 0) {
      setContext(prev => {
        const next = { ...prev, ...updates };
        // Auto-save agent to database
        const agentName = updates.agentName || prev.agentName || selectedAgent?.name || "Agente";
        saveUserAgent({
          id: savedAgentId || undefined,
          name: agentName,
          agent_type: selectedAgent?.type || "Custom",
          description: next.mainProduct || selectedAgent?.objective || "",
          model: agentModel,
          status: "configuring",
          config: next as any,
        }).then(saved => {
          if (saved && !savedAgentId) setSavedAgentId(saved.id);
        });
        return next;
      });
    }
  }, [messages]);

  const canSend = chatMode === "setup" || (!keysLoading && hasApiKey);

  // Auto-route from Home prompt
  useEffect(() => {
    if (didAutoRoute) return;
    const state = location.state as any;
    if (!state?.initialPrompt) return;
    setDidAutoRoute(true);

    const text = state.initialPrompt.toLowerCase();
    const SDR_KW = ["sdr", "qualificação", "qualificacao", "qualificador", "qualificar", "inbound", "triagem", "filtrar lead"];
    const BDR_KW = ["bdr", "prospecção", "prospeccao", "outbound", "captura de lead", "captação", "captacao", "gerar lead", "cold call"];
    const SAC_KW = ["sac", "suporte", "atendimento", "customer service", "help desk", "chamado", "reclamação", "reclamacao"];
    const CS_KW = ["customer success", "cs ", "pós-venda", "pos-venda", "onboarding", "retenção", "retencao", "churn"];

    let agentId = "custom-1";
    let agentType: "SDR" | "BDR" | "SAC" | "CS" | "Custom" = "Custom";
    let agentName = "Agente Personalizado";

    if (SDR_KW.some((k) => text.includes(k))) {
      agentId = "sdr-1"; agentType = "SDR"; agentName = "Agente SDR";
    } else if (BDR_KW.some((k) => text.includes(k))) {
      agentId = "bdr-1"; agentType = "BDR"; agentName = "Agente BDR";
    } else if (SAC_KW.some((k) => text.includes(k))) {
      agentId = "sac-1"; agentType = "SAC"; agentName = "Agente SAC";
    } else if (CS_KW.some((k) => text.includes(k))) {
      agentId = "custom-1"; agentType = "CS"; agentName = "Agente Customer Success";
    }

    const agent: AgentRecommendation = {
      id: agentId, type: agentType, name: agentName,
      objective: state.initialPrompt, targetAudience: "", benefits: [],
      exampleConversation: [], selected: true,
    };
    setSelectedAgent(agent);

    const preset = AGENT_PRESETS[agentType];
    setContext((prev) => ({ ...prev, ...preset.context }));
    setIntents([...preset.intents]);
    setStages([...preset.stages]);
    setAdvancedConfig({ ...preset.advancedConfig });
    setStep("configure");

    // Send the initial prompt to the AI after a tick
    setTimeout(() => {
      setupChat.sendMessage(state.initialPrompt);
    }, 500);
  }, [location.state, didAutoRoute]);

  const handleAgentSelect = useCallback((agent: AgentRecommendation) => {
    setSelectedAgent(agent);
    const preset = AGENT_PRESETS[agent.type];
    setContext((prev) => ({ ...prev, ...preset.context }));
    setIntents([...preset.intents]);
    setStages([...preset.stages]);
    setAdvancedConfig({ ...preset.advancedConfig });
    setStep("configure");
  }, []);

  const toggleChannel = (ch: DeployChannel) =>
    setSelectedChannels((prev) => prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]);

  const toggleTool = (tool: ExternalTool) =>
    setSelectedTools((prev) => prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]);

  const handleSend = () => {
    if (!input.trim() || isStreaming || !canSend) return;
    const text = input.trim();
    setInput("");
    sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // Step 1: Agent selection
  if (step === "agent") {
    return (
      <DashboardLayout>
        <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
          <StepAgents selected={selectedAgent} onSelect={handleAgentSelect} />
        </div>
      </DashboardLayout>
    );
  }

  // Step 2: Configure — split layout with real AI chat
  const agentAvatar = AVATARS_MAP[selectedAgent?.id || "sdr-1"] || avatar1;
  const agentName = selectedAgent?.name || "Agente IA";

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* LEFT — Chat */}
      <div className="w-full max-w-[55%] flex flex-col border-r border-border">
        {/* Header */}
        <div className="h-12 border-b border-border flex items-center gap-3 px-4 shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setStep("agent")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <img src={agentAvatar} alt={agentName} className="w-7 h-7 rounded-full object-cover" />
          <span className="text-sm font-semibold">{agentName}</span>

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
              Assistente de Configuração — {FREE_MODELS.find(m => m.value === setupModel)?.label || "IA Gratuita"}
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
                {msg.role === "agent" && <img src={agentAvatar} alt="" className="w-6 h-6 rounded-full object-cover mt-0.5" />}
                <div className={`rounded-xl px-3.5 py-2.5 text-sm max-w-[75%] ${
                  msg.role === "agent"
                    ? "bg-muted/60 text-foreground"
                    : "bg-primary text-primary-foreground ml-auto"
                }`}>
                  {msg.role === "agent" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{msg.text.replace(/\[SWITCH_TAB:\w+\]/g, "").replace(/\[SET:\w+=[^\]]+\]/g, "").replace(/\[SWITCH_NAV:\w+\]/g, "")}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* API Key Warning — only in test mode */}
        {chatMode === "test" && !keysLoading && !hasApiKey && (
          <div className="px-4 pt-2">
            <Alert className="border-yellow-500/30 bg-yellow-500/5">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-xs text-muted-foreground flex items-center justify-between">
                <span>
                  Configure sua chave de API do provedor <strong className="text-foreground">{currentProvider === "openai" ? "OpenAI" : "Gemini"}</strong> na aba Integrações para testar com o modelo <strong className="text-foreground">{LLM_MODELS.find((m) => m.value === agentModel)?.label || agentModel}</strong>.
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
                    {setupHasUserKey ? (
                      availableModels.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))
                    ) : (
                      FREE_MODELS.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))
                    )}
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

      {/* RIGHT — Wizard Panel */}
      <WizardRightPanel
        context={context}
        onContextChange={setContext}
        selectedAgent={selectedAgent}
        selectedChannels={selectedChannels}
        onToggleChannel={toggleChannel}
        selectedTools={selectedTools}
        onToggleTool={toggleTool}
        selectedCRM={selectedCRM}
        onSelectCRM={setSelectedCRM}
        intents={intents}
        onIntentsChange={setIntents}
        stages={stages}
        onStagesChange={setStages}
        advancedConfig={advancedConfig}
        onAdvancedConfigChange={setAdvancedConfig}
        activeTab={rightPanelTab}
        onTabChange={setRightPanelTab}
        activeSection={rightPanelSection}
        onSectionChange={setRightPanelSection}
        onApiKeysChanged={refetchKeys}
      />
    </div>
  );
};

export default Aikortex;
