import { useState, useRef, useEffect, useCallback } from "react";
import { Bot, Send, Brain, RefreshCw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { NODE_TEMPLATES } from "@/types/flow-builder";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isFlowGenerated?: boolean;
}

const SUGGESTIONS = [
  "Fluxo de qualificação de leads",
  "Atendimento ao cliente com SAC",
  "Follow-up automático de vendas",
  "Agendamento de reuniões",
];

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Olá! 👋 Sou seu assistente de automação. Descreva o fluxo que quer criar e vou gerar automaticamente para você. Por exemplo: *'Quero qualificar leads pelo WhatsApp e registrar no CRM quando estiverem prontos para compra.'*",
};

interface Props {
  onClose: () => void;
  onAddNode?: (nodeType: string) => void;
  onBuildFlow?: (flowDef: { nodes: { id: string; type: string }[]; edges: { source: string; target: string }[] }) => void;
  initialPrompt?: string;
}

export default function FlowCopilotPanel({ onClose, onAddNode, onBuildFlow, initialPrompt }: Props) {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasError, setHasError] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const didAutoSend = useRef(false);
  const lastUserMsg = useRef<string>("");

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const extractJsonFromResponse = (text: string): any | null => {
    // Try ```json blocks first
    const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) {
      try {
        return JSON.parse(jsonBlockMatch[1].trim());
      } catch { /* fall through */ }
    }
    // Try [BUILD_FLOW] blocks
    const buildFlowMatch = text.match(/\[BUILD_FLOW\]\s*([\s\S]*?)\s*\[\/BUILD_FLOW\]/);
    if (buildFlowMatch) {
      try {
        return JSON.parse(buildFlowMatch[1].trim());
      } catch { /* fall through */ }
    }
    return null;
  };

  const parseAndExecuteCommands = useCallback(
    (text: string) => {
      const flowDef = extractJsonFromResponse(text);
      if (flowDef?.nodes && flowDef?.edges && onBuildFlow) {
        onBuildFlow(flowDef);
        return true;
      }
      // Fallback: individual ADD_NODE commands
      if (!onAddNode) return false;
      const regex = /\[ADD_NODE:(\w+)\]/g;
      let match;
      let found = false;
      while ((match = regex.exec(text)) !== null) {
        const nodeType = match[1];
        if (NODE_TEMPLATES.some((t) => t.type === nodeType)) {
          onAddNode(nodeType);
          found = true;
        }
      }
      return found;
    },
    [onAddNode, onBuildFlow]
  );

  const handleSend = useCallback(
    async (overrideText?: string) => {
      const text = overrideText || input;
      if (!text.trim() || isStreaming) return;

      setHasError(false);
      lastUserMsg.current = text.trim();

      const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: text.trim() };
      // Build conversation history (exclude welcome message)
      const conversationHistory = [...messages.filter((m) => m.id !== "welcome"), userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      setMessages((prev) => [...prev, userMsg]);
      if (!overrideText) setInput("");
      setIsStreaming(true);

      try {
        const { data, error } = await supabase.functions.invoke("deerflow-proxy", {
          body: { messages: conversationHistory },
        });

        if (error) throw new Error(error.message || "Erro ao conectar");

        const aiContent = data?.choices?.[0]?.message?.content || data?.error;
        if (!aiContent) throw new Error("Resposta vazia do servidor");

        const flowGenerated = parseAndExecuteCommands(aiContent);

        // Clean display text
        const displayText = aiContent
          .replace(/\[BUILD_FLOW\][\s\S]*?\[\/BUILD_FLOW\]/g, "")
          .replace(/\[ADD_NODE:\w+\]/g, "")
          .replace(/```json[\s\S]*?```/g, "")
          .trim();

        const assistantMsg: Message = {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: flowGenerated
            ? (displayText || "✅ Fluxo gerado! Confira no canvas ao lado.")
            : (displayText || "Desculpe, não consegui processar sua solicitação."),
          isFlowGenerated: flowGenerated,
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (e: any) {
        console.error("Copilot chat error:", e);
        setHasError(true);
        setMessages((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            role: "assistant",
            content: "⚠️ Erro ao conectar com o DeerFlow. Verifique sua conexão.",
          },
        ]);
      } finally {
        setIsStreaming(false);
      }
    },
    [input, messages, isStreaming, parseAndExecuteCommands]
  );

  const handleRetry = () => {
    if (lastUserMsg.current) {
      handleSend(lastUserMsg.current);
    }
  };

  // Auto-send initial prompt
  useEffect(() => {
    if (initialPrompt && !didAutoSend.current && !isStreaming) {
      didAutoSend.current = true;
      handleSend(initialPrompt);
    }
  }, [initialPrompt, handleSend]);

  const showSuggestions = messages.length <= 1;

  return (
    <div className="flex flex-col h-full bg-[hsl(var(--background))]">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-card/60 backdrop-blur-sm flex-shrink-0">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
          <Brain className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground leading-tight">Copilot IA</h3>
          <p className="text-[10px] text-muted-foreground leading-tight">Powered by DeerFlow</p>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-3 py-3" ref={scrollRef}>
        <div className="space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}
            >
              {msg.role === "assistant" && (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-violet-400" />
                </div>
              )}
              <div className="flex flex-col gap-1.5 max-w-[85%]">
                <div
                  className={cn(
                    "rounded-xl px-3 py-2 text-xs",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/70 text-foreground border border-border/50"
                  )}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-xs prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
                {msg.isFlowGenerated && (
                  <div className="flex items-center gap-1.5 px-1">
                    <div className="text-[10px] text-emerald-400 font-medium">✅ Fluxo gerado no canvas</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-2 text-[10px] text-muted-foreground hover:text-foreground"
                      onClick={() => setInput("Refinar o fluxo: ")}
                    >
                      Refinar fluxo <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isStreaming && (
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-600/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <div className="bg-muted/70 border border-border/50 rounded-xl px-3 py-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}

          {/* Error retry button */}
          {hasError && !isStreaming && (
            <div className="flex justify-center">
              <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={handleRetry}>
                <RefreshCw className="w-3 h-3" /> Tentar novamente
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Suggestions */}
      {showSuggestions && !isStreaming && (
        <div className="px-3 pb-2 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleSend(s)}
              className="text-[10px] px-2.5 py-1.5 rounded-full border border-border hover:border-violet-500/40 hover:bg-violet-500/10 text-muted-foreground hover:text-foreground transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="p-3 border-t border-border flex-shrink-0">
        <div className="relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Descreva seu fluxo..."
            className="min-h-[36px] max-h-[100px] text-xs resize-none pr-10"
            rows={1}
          />
          <Button
            size="icon"
            variant="ghost"
            className="absolute bottom-1 right-1 h-7 w-7"
            onClick={() => handleSend()}
            disabled={!input.trim() || isStreaming}
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
        <p className="text-[9px] text-muted-foreground mt-1.5 text-center">
          DeerFlow analisa e gera seu fluxo automaticamente
        </p>
      </div>
    </div>
  );
}
