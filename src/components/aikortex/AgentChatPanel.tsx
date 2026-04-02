import { useState, useRef, useEffect, useCallback } from "react";
import {
  ArrowLeft, ArrowUp, Send, Settings, FlaskConical, AlertTriangle,
  Sparkles, Bot, Mic,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ReactMarkdown from "react-markdown";
import type { ChatMessage } from "@/hooks/use-agent-chat";
import type { AgentType } from "@/types/agent-builder";

export interface StructuredAgentConfig {
  agent_name: string;
  agent_type: string;
  description: string;
  objective: string;
  tone: string;
  language: string;
  greeting_message: string;
  instructions: string;
  channels: string[];
  quick_replies?: string[];
  stages?: Array<{ id: string; name: string; description: string; example: string }>;
}

interface AgentChatPanelProps {
  onBack: () => void;
  agentType: AgentType;
  agentName: string;
  agentAvatar: string;
  wizardStep: "discover" | "structure" | "build" | "done";
  setWizardStep: (step: "discover" | "structure" | "build" | "done") => void;
  structuredConfig: StructuredAgentConfig | null;
  setStructuredConfig: (config: StructuredAgentConfig | null) => void;
  chatMode: "setup" | "test";
  setChatMode: (mode: "setup" | "test") => void;
  hasApiKey: boolean;
  hasAnyLLMKey: boolean;
  keysLoading: boolean;
  currentProvider: string;
  agentModel: string;
  availableModels: Array<{ value: string; label: string; provider: string }>;
  setupModel: string;
  setSetupModel: (model: string) => void;
  setAgentModel: (model: string) => void;
  gatewayModels: ReadonlyArray<{ value: string; label: string }>;
  onGoToIntegrations: () => void;
  onConfigStructured: (config: StructuredAgentConfig) => void;
  onAgentCreated: (config: StructuredAgentConfig) => void;
  messages: ChatMessage[];
  sendMessage: (text: string) => void;
  isStreaming: boolean;
}

const AGENT_SUGGESTIONS = [
  "Agente SDR para qualificação de leads B2B",
  "Agente de suporte ao cliente para e-commerce",
  "Agente de agendamento para clínicas e consultórios",
  "Agente de onboarding para novos clientes",
];

const AgentChatPanel = ({
  onBack,
  agentName,
  agentAvatar,
  wizardStep,
  chatMode,
  setChatMode,
  hasApiKey,
  hasAnyLLMKey,
  keysLoading,
  currentProvider,
  agentModel,
  availableModels,
  setupModel,
  setSetupModel,
  setAgentModel,
  gatewayModels,
  onGoToIntegrations,
  messages,
  sendMessage,
  isStreaming,
}: AgentChatPanelProps) => {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(() => {
    if (!input.trim() || isStreaming) return;
    sendMessage(input.trim());
    setInput("");
  }, [input, isStreaming, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSendTest = chatMode === "test" ? hasApiKey : true;
  const isEmpty = messages.length === 0;
  const isDiscoverEmpty = wizardStep === "discover" && isEmpty;

  return (
    <div className="w-[420px] min-w-[360px] border-r border-border flex flex-col bg-background">
      {/* Header */}
      <div className="h-12 border-b border-border flex items-center px-3 gap-2 shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <img src={agentAvatar} className="w-7 h-7 rounded-full object-cover" alt="" />
        <span className="text-sm font-medium truncate flex-1">{agentName}</span>

        {/* Mode toggle */}
        <div className="flex gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={chatMode === "setup" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => setChatMode("setup")}
                >
                  <Settings className="w-3 h-3 mr-1" /> Configurar
                </Button>
              </TooltipTrigger>
              <TooltipContent>Assistente gratuito para configurar o agente</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={chatMode === "test" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => {
                    if (!hasAnyLLMKey && !keysLoading) {
                      onGoToIntegrations();
                      return;
                    }
                    setChatMode("test");
                  }}
                >
                  <FlaskConical className="w-3 h-3 mr-1" /> Testar
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {hasAnyLLMKey ? "Testar o agente com sua API key" : "Configure uma API key para testar"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Model selector bar */}
      <div className="h-9 border-b border-border flex items-center px-3 gap-2 shrink-0">
        {chatMode === "setup" ? (
          <>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Modelo:</span>
            <Select value={setupModel} onValueChange={setSetupModel}>
              <SelectTrigger className="h-6 text-xs flex-1 border-0 bg-muted/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {gatewayModels.map(m => (
                  <SelectItem key={m.value} value={m.value} className="text-xs">{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        ) : (
          <>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Modelo:</span>
            {availableModels.length > 0 ? (
              <Select value={agentModel} onValueChange={setAgentModel}>
                <SelectTrigger className="h-6 text-xs flex-1 border-0 bg-muted/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map(m => (
                    <SelectItem key={m.value} value={m.value} className="text-xs">{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Button variant="ghost" size="sm" className="h-6 text-xs text-destructive" onClick={onGoToIntegrations}>
                <AlertTriangle className="w-3 h-3 mr-1" /> Conectar API Key
              </Button>
            )}
          </>
        )}
      </div>

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Empty state — discover */}
        {isDiscoverEmpty && (
          <div className="flex flex-col items-center justify-center h-full pt-12">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-base font-semibold text-foreground mb-1">Descreva seu agente</h2>
            <p className="text-xs text-muted-foreground text-center max-w-[280px] mb-6">
              Conte o que seu agente deve fazer. A IA vai estruturar a configuração automaticamente.
            </p>

            {/* Quick suggestions */}
            <div className="w-full max-w-[340px]">
              <p className="text-[10px] text-muted-foreground mb-2 text-center">ou comece com uma ideia:</p>
              <div className="space-y-1.5">
                {AGENT_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
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
        {messages.map((msg, i) => (
          <div key={i}>
            {msg.role === "user" ? (
              <div className="flex justify-end">
                <div className="bg-primary/10 border border-primary/20 rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[90%] text-sm">
                  <p className="whitespace-pre-wrap text-foreground">{msg.text}</p>
                </div>
              </div>
            ) : (
              <div className="flex gap-2.5">
                <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="text-sm leading-relaxed text-foreground flex-1 min-w-0">
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 [&>ul]:my-1 [&>ol]:my-1 [&_strong]:text-foreground">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {isStreaming && messages[messages.length - 1]?.role !== "agent" && (
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
              <span className="text-xs">Pensando...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="p-3 border-t border-border shrink-0">
        {chatMode === "test" && !hasApiKey && !keysLoading && (
          <div className="mb-2 text-xs text-destructive flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            API key de {currentProvider} não configurada.{" "}
            <button className="underline" onClick={onGoToIntegrations}>Configurar</button>
          </div>
        )}
        <div className="rounded-xl border border-border bg-card/50 p-1 transition-colors focus-within:border-primary/30">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={chatMode === "setup"
              ? "Descreva o agente que quer criar..."
              : "Envie uma mensagem de teste..."}
            rows={2}
            disabled={isStreaming || (chatMode === "test" && !canSendTest)}
            className="w-full bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground px-3 py-2 min-h-[36px] max-h-[120px] disabled:cursor-not-allowed"
          />
          <div className="flex items-center justify-between px-2 pb-1">
            <div className="flex items-center gap-1">
              <button className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded" disabled={isStreaming}>
                <Mic className="w-3.5 h-3.5" />
              </button>
            </div>
            {isDiscoverEmpty && input.trim().length >= 10 ? (
              <Button
                size="sm"
                onClick={handleSend}
                disabled={isStreaming}
                className="h-8 rounded-full bg-primary hover:bg-primary/90 gap-1.5 text-xs px-4"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Criar Agente
              </Button>
            ) : (
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || isStreaming || (chatMode === "test" && !canSendTest)}
                className="h-8 w-8 rounded-full bg-primary hover:bg-primary/90"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentChatPanel;
