import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send, Paperclip, HelpCircle, AlertTriangle, KeyRound, Bot, TestTube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import AgentRightPanel from "@/components/aikortex/AgentRightPanel";
import { useAgentChat } from "@/hooks/use-agent-chat";
import { useApiKeys } from "@/hooks/use-api-keys";
import ReactMarkdown from "react-markdown";
import type { AgentType } from "@/types/agent-builder";

import avatar1 from "@/assets/avatars/avatar-1.png";
import avatar2 from "@/assets/avatars/avatar-2.png";
import avatar3 from "@/assets/avatars/avatar-3.png";
import avatar8 from "@/assets/avatars/avatar-8.png";

const AGENTS_MAP: Record<string, { name: string; avatar: string; model: string; agentType: AgentType }> = {
  "sdr-1": { name: "Agente SDR", avatar: avatar1, model: "gemini-2.5-flash", agentType: "SDR" },
  "bdr-1": { name: "Agente BDR", avatar: avatar2, model: "gemini-2.5-flash", agentType: "BDR" },
  "sac-1": { name: "Agente SAC", avatar: avatar3, model: "gemini-2.5-flash", agentType: "SAC" },
  "social-1": { name: "Social Media Manager", avatar: avatar8, model: "gemini-2.5-flash", agentType: "Custom" },
  "custom-1": { name: "Agente Personalizado", avatar: avatar1, model: "gemini-2.5-flash", agentType: "Custom" },
};

const LLM_MODELS = [
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  { value: "gemini-3-flash-preview", label: "Gemini 3 Flash" },
  { value: "gpt-5", label: "GPT-5" },
  { value: "gpt-5-mini", label: "GPT-5 Mini" },
];

const SETUP_SYSTEM_PROMPT = `Você é um assistente especializado em configuração de agentes de IA na plataforma Aikortex. 
Seja BREVE e direto. Faça UMA pergunta por vez (máximo 2 linhas). Quando a resposta for válida, confirme com ✅ e passe ao próximo item.

Áreas de configuração:
1. **Identidade** — Nome, descrição, foto
2. **Objetivo** — Missão principal
3. **Instruções** — Tom de voz, regras, personalidade
4. **Integrações** — APIs, MCPs, Webhooks
5. **Canais** — WhatsApp, Instagram, Site
6. **Conhecimento** — Documentos e URLs

Quando todas as configurações estiverem completas, sugira mudar para o modo **Teste**.
IMPORTANTE: Você NÃO é o agente final. Apenas configure.`;

const AgentDetail = () => {
  const navigate = useNavigate();
  const { agentId } = useParams();
  const agent = AGENTS_MAP[agentId || "sdr-1"] || AGENTS_MAP["sdr-1"];

  const [input, setInput] = useState("");
  const [agentModel, setAgentModel] = useState(agent.model);
  const [rightPanelTab, setRightPanelTab] = useState("agent");
  // "setup" = uses free Lovable AI gateway to help configure
  // "test" = uses the user's configured LLM to test the agent
  const [chatMode, setChatMode] = useState<"setup" | "test">("setup");

  const { keys, loading: keysLoading, refetch: refetchKeys } = useApiKeys();

  const currentProvider = useMemo(() => {
    if (agentModel.startsWith("gemini")) return "gemini";
    if (agentModel.startsWith("gpt")) return "openai";
    return "openai";
  }, [agentModel]);

  const hasApiKey = !!keys[currentProvider]?.configured;

  useEffect(() => {
    if (rightPanelTab !== "connectors") {
      refetchKeys();
    }
  }, [rightPanelTab, refetchKeys]);

  const setupChat = useAgentChat(
    [{ role: "agent", text: `Olá! 👋 Sou o assistente de configuração do **${agent.name}**. O que gostaria de configurar?` }],
    { model: "gemini-2.5-flash", systemPrompt: SETUP_SYSTEM_PROMPT }
  );

  const testChat = useAgentChat(
    [{ role: "agent", text: `🧪 Modo de Teste ativado! Agora estou respondendo como o **${agent.name}** usando o modelo ${LLM_MODELS.find(m => m.value === agentModel)?.label || agentModel}. Envie uma mensagem para testar.` }],
    { model: agentModel }
  );

  const activeChat = chatMode === "setup" ? setupChat : testChat;
  const { messages, sendMessage, isStreaming } = activeChat;

  const canSend = chatMode === "setup" || hasApiKey || keysLoading;

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
              Assistente de Configuração — Step 3.5 Flash (gratuito)
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs gap-1">
              <TestTube className="w-3 h-3" />
              Modo Teste — {LLM_MODELS.find(m => m.value === agentModel)?.label || agentModel}
              <span className={`w-1.5 h-1.5 rounded-full ${hasApiKey ? "bg-emerald-500" : "bg-yellow-500"}`} />
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

        {/* API Key Warning — only in test mode */}
        {chatMode === "test" && !keysLoading && !hasApiKey && (
          <div className="px-4 pt-2">
            <Alert className="border-yellow-500/30 bg-yellow-500/5">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-xs text-muted-foreground flex items-center justify-between">
                <span>
                  Configure sua chave de API do provedor <strong className="text-foreground">{currentProvider === "openai" ? "OpenAI" : "Gemini"}</strong> na aba Integrações para testar o agente.
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
                {chatMode === "test" && (
                  <select
                    value={agentModel}
                    onChange={(e) => setAgentModel(e.target.value)}
                    className="text-xs text-muted-foreground hover:text-foreground bg-transparent border border-border rounded-md px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/40"
                  >
                    {LLM_MODELS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
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
      <AgentRightPanel agent={agent} agentType={agent.agentType} agentModel={agentModel} onModelChange={setAgentModel} activeTab={rightPanelTab} onTabChange={setRightPanelTab} />
    </div>
  );
};

export default AgentDetail;
