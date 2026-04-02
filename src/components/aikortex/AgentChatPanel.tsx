import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowLeft, Send, Settings, FlaskConical, ChevronDown, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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

const AgentChatPanel = ({
  onBack,
  agentName,
  agentAvatar,
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

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
              msg.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground"
            }`}>
              <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 [&>ul]:my-1 [&>ol]:my-1">
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isStreaming && messages[messages.length - 1]?.role !== "agent" && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-xl px-3 py-2 text-sm text-muted-foreground animate-pulse">
              Digitando...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-3 shrink-0">
        {chatMode === "test" && !hasApiKey && !keysLoading && (
          <div className="mb-2 text-xs text-destructive flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            API key de {currentProvider} não configurada.{" "}
            <button className="underline" onClick={onGoToIntegrations}>Configurar</button>
          </div>
        )}
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={chatMode === "setup" ? "Descreva seu agente..." : "Envie uma mensagem de teste..."}
            className="min-h-[40px] max-h-[120px] resize-none text-sm"
            rows={1}
            disabled={isStreaming || (chatMode === "test" && !canSendTest)}
          />
          <Button
            size="icon"
            className="h-10 w-10 shrink-0"
            onClick={handleSend}
            disabled={!input.trim() || isStreaming || (chatMode === "test" && !canSendTest)}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AgentChatPanel;
