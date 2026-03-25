import { useState, useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ArrowLeft, Send, Paperclip, HelpCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

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

const CHANNELS = [
  { icon: "💬", label: "Telegram" },
  { icon: "📱", label: "WhatsApp" },
  { icon: "🎮", label: "Discord" },
  { icon: "💼", label: "Slack" },
];

const MOCK_RESPONSES: Record<string, string> = {
  default: "Olá! Como posso ajudar você hoje?",
  oi: "Olá! Que bom te ver por aqui. Como posso ajudar?",
  preço: "Nossos planos são flexíveis. Posso agendar uma conversa com nosso especialista?",
  funciona: "Nosso sistema é super intuitivo! Quer que eu te mostre como?",
};

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

  const [messages, setMessages] = useState<{ role: "user" | "agent"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [showChannels, setShowChannels] = useState(true);
  const agentModel = "gemini-2.5-flash";
  const [didAutoRoute, setDidAutoRoute] = useState(false);

  // Auto-route from Home prompt
  useEffect(() => {
    if (didAutoRoute) return;
    const state = location.state as any;
    if (!state?.initialPrompt) return;
    setDidAutoRoute(true);

    const text = state.initialPrompt.toLowerCase();
    const SDR_KW = ["sdr", "qualificação", "qualificacao", "inbound"];
    const BDR_KW = ["bdr", "prospecção", "prospeccao", "outbound"];
    const SAC_KW = ["sac", "suporte", "atendimento", "customer"];

    let agentId = "custom-1";
    let agentType: "SDR" | "BDR" | "SAC" | "Custom" = "Custom";
    let agentName = "Agente Personalizado";

    if (SDR_KW.some((k) => text.includes(k))) {
      agentId = "sdr-1"; agentType = "SDR"; agentName = "Agente SDR";
    } else if (BDR_KW.some((k) => text.includes(k))) {
      agentId = "bdr-1"; agentType = "BDR"; agentName = "Agente BDR";
    } else if (SAC_KW.some((k) => text.includes(k))) {
      agentId = "sac-1"; agentType = "SAC"; agentName = "Agente SAC";
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
    setMessages([
      { role: "agent", text: `Olá! Sou ${agentName}. Recebi seu pedido: "${state.initialPrompt}". Vamos configurar!` },
    ]);
    setStep("configure");
  }, [location.state, didAutoRoute]);

  const applyPresetAndConfigure = useCallback(() => {
    if (selectedAgent) {
      const preset = AGENT_PRESETS[selectedAgent.type];
      setContext((prev) => ({ ...prev, ...preset.context }));
      setIntents([...preset.intents]);
      setStages([...preset.stages]);
      setAdvancedConfig({ ...preset.advancedConfig });
      setMessages([{ role: "agent", text: `Olá! Sou ${selectedAgent.name}. Como posso ajudar?` }]);
    }
    setStep("configure");
  }, [selectedAgent]);

  const toggleChannel = (ch: DeployChannel) =>
    setSelectedChannels((prev) => prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]);

  const toggleTool = (tool: ExternalTool) =>
    setSelectedTools((prev) => prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setInput("");
    setTimeout(() => {
      const key = Object.keys(MOCK_RESPONSES).find((k) => userMsg.toLowerCase().includes(k));
      setMessages((prev) => [...prev, { role: "agent", text: MOCK_RESPONSES[key || "default"] }]);
    }, 600);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // Step 1: Agent selection
  if (step === "agent") {
    return (
      <DashboardLayout>
        <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
          <StepAgents selected={selectedAgent} onSelect={setSelectedAgent} onNext={applyPresetAndConfigure} />
        </div>
      </DashboardLayout>
    );
  }

  // Step 2: Configure — split layout matching AgentDetail
  const agentAvatar = AVATARS_MAP[selectedAgent?.id || "sdr-1"] || avatar1;
  const agentName = selectedAgent?.name || "Agente IA";

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* LEFT — Chat */}
      <div className="w-full max-w-[55%] flex flex-col border-r border-border">
        <div className="h-12 border-b border-border flex items-center gap-3 px-4 shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setStep("agent")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <img src={agentAvatar} alt={agentName} className="w-7 h-7 rounded-full object-cover" />
          <span className="text-sm font-semibold">{agentName}</span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Configurando
          </span>
          <span className="text-xs text-muted-foreground ml-1">{agentModel}</span>
        </div>

        {showChannels && (
          <div className="px-4 py-2 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Chat from an app you already use</span>
              <button className="ml-auto text-muted-foreground hover:text-foreground" onClick={() => setShowChannels(false)}>
                <span className="text-xs">✕</span>
              </button>
            </div>
            <div className="flex gap-2 mt-2">
              {CHANNELS.map((ch) => (
                <button key={ch.label} className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-xs font-medium hover:border-primary/40 transition-colors">
                  <span>{ch.icon}</span> {ch.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2.5 items-start ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "agent" && <img src={agentAvatar} alt="" className="w-6 h-6 rounded-full object-cover mt-0.5" />}
                <div className={`rounded-xl px-3.5 py-2.5 text-sm max-w-[75%] ${msg.role === "agent" ? "bg-muted/60 text-foreground" : "bg-primary text-primary-foreground ml-auto"}`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="px-4 pb-4 pt-2">
          <div className="border border-border rounded-xl bg-muted/30 flex flex-col">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message your agent..."
              className="border-0 bg-transparent text-sm min-h-[80px] max-h-[160px] resize-none focus-visible:ring-0 focus-visible:ring-offset-0 p-4"
            />
            <div className="flex items-center justify-between px-3 pb-3">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <Paperclip className="w-4 h-4" />
                </Button>
                <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  🤖 {agentModel} <ChevronDown className="w-3 h-3" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <HelpCircle className="w-4 h-4" />
                </Button>
                <Button size="icon" className="h-8 w-8 rounded-full" onClick={handleSend} disabled={!input.trim()}>
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
      />
    </div>
  );
};

export default Aikortex;
