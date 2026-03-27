import { useState, useRef, useEffect, useCallback } from "react";
import { Bot, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { NODE_TEMPLATES } from "@/types/flow-builder";
import { AGENT_TEMPLATES } from "@/types/agent-builder";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-chat`;

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Crie um fluxo de qualificação de leads",
  "Adicione um bloco de Agente para classificar intenções",
  "Como conectar com WhatsApp?",
  "Otimize meu fluxo atual",
];

// Build a system prompt that knows about available nodes and agents
const nodeList = NODE_TEMPLATES.map((n) => `- ${n.type}: ${n.label} (${n.category})`).join("\n");
const agentList = AGENT_TEMPLATES.map((a) => `- ${a.id}: ${a.name} (${a.type}) — ${a.objective}`).join("\n");

const SYSTEM_PROMPT = `You are the Copilot for the Aikortex Flow Builder. Help the user build automation workflows.

Available blocks:
${nodeList}

Available AI Agents:
${agentList}

IMPORTANT: When the user asks to CREATE a flow or automation, you MUST respond with a [BUILD_FLOW] JSON block that defines ALL nodes and their connections. Format:

[BUILD_FLOW]
{"nodes":[{"id":"n1","type":"trigger_chat"},{"id":"n2","type":"agent"},{"id":"n3","type":"send_message"}],"edges":[{"source":"n1","target":"n2"},{"source":"n2","target":"n3"}]}
[/BUILD_FLOW]

Rules for BUILD_FLOW:
- Each node needs a temporary "id" (e.g. "n1","n2") and a "type" matching one of the available blocks above.
- Edges define connections using the temporary ids.
- Always connect nodes sequentially unless branching logic is needed.
- Start with a trigger block.
- You can ONLY use one BUILD_FLOW per response.

When the user asks to ADD a SINGLE block to an existing flow, use:
[ADD_NODE:block_type]

Always explain what each block does after the command block.
Reply in Portuguese Brazilian. Be direct and use markdown when appropriate.`;

interface Props {
  onClose: () => void;
  onAddNode?: (nodeType: string) => void;
  onBuildFlow?: (flowDef: { nodes: { id: string; type: string }[]; edges: { source: string; target: string }[] }) => void;
  initialPrompt?: string;
}

export default function FlowCopilotPanel({ onClose, onAddNode, onBuildFlow, initialPrompt }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const didAutoSend = useRef(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Parse [BUILD_FLOW]...[/BUILD_FLOW] and [ADD_NODE:type] commands from AI response
  const parseAndExecuteCommands = useCallback(
    (text: string) => {
      // Check for BUILD_FLOW command
      const buildFlowMatch = text.match(/\[BUILD_FLOW\]\s*([\s\S]*?)\s*\[\/BUILD_FLOW\]/);
      if (buildFlowMatch && onBuildFlow) {
        try {
          const flowDef = JSON.parse(buildFlowMatch[1].trim());
          if (flowDef.nodes && flowDef.edges) {
            onBuildFlow(flowDef);
          }
        } catch (e) {
          console.error("Failed to parse BUILD_FLOW:", e);
        }
        return;
      }

      // Fallback: individual ADD_NODE commands
      if (!onAddNode) return;
      const regex = /\[ADD_NODE:(\w+)\]/g;
      let match;
      while ((match = regex.exec(text)) !== null) {
        const nodeType = match[1];
        if (NODE_TEMPLATES.some((t) => t.type === nodeType)) {
          onAddNode(nodeType);
        }
      }
    },
    [onAddNode, onBuildFlow]
  );

  const handleSend = useCallback(async (overrideText?: string) => {
    const text = overrideText || input;
    if (!text.trim() || isStreaming) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: text.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    if (!overrideText) setInput("");
    setIsStreaming(true);

    // Build API messages
    const apiMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...updatedMessages.map((m) => ({ role: m.role, content: m.content })),
    ];

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) {
        throw new Error("Você precisa estar logado para usar o Copilot.");
      }

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          messages: apiMessages,
          model: "gemini-2.5-flash",
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Erro desconhecido" }));
        throw new Error(err.error || `Erro ${resp.status}`);
      }

      if (!resp.body) throw new Error("Sem resposta do servidor");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";

      const assistantId = `a-${Date.now()}`;
      setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantText += content;
              const finalText = assistantText;
              setMessages((prev) => {
                const arr = [...prev];
                arr[arr.length - 1] = { ...arr[arr.length - 1], content: finalText };
                return arr;
              });
            }
          } catch {
            // partial JSON, skip
          }
        }
      }

      parseAndExecuteCommands(assistantText);
    } catch (e: any) {
      console.error("Copilot chat error:", e);
      setMessages((prev) => [
        ...prev.filter((m) => m.content !== ""),
        { id: `e-${Date.now()}`, role: "assistant", content: `⚠️ ${e.message || "Erro ao conectar com a IA."}` },
      ]);
    } finally {
      setIsStreaming(false);
    }
  }, [input, messages, isStreaming, parseAndAddNodes]);

  // Auto-send initial prompt from Home page
  useEffect(() => {
    if (initialPrompt && !didAutoSend.current && !isStreaming && messages.length === 0) {
      didAutoSend.current = true;
      handleSend(initialPrompt);
    }
  }, [initialPrompt, handleSend]);

  const handleSuggestion = (text: string) => {
    setInput(text);
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full">
      {isEmpty ? (
        <div className="flex-1 flex flex-col">
          <div className="px-4 pt-4 pb-2">
            <h3 className="text-sm font-semibold text-foreground">Novo Chat</h3>
          </div>
          <div className="flex-1 flex flex-col justify-end px-3 pb-3">
            <div className="space-y-1.5 mb-3">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSuggestion(s)}
                  className="w-full text-left text-[11px] px-3 py-2 rounded-lg border border-border hover:border-primary/40 hover:bg-accent/30 text-muted-foreground hover:text-foreground transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
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
                placeholder="Descreva o que quer construir..."
                className="min-h-[60px] max-h-[120px] text-xs resize-none pr-10"
                rows={2}
              />
              <Button
                size="icon"
                variant="ghost"
                className="absolute bottom-1.5 right-1.5 h-7 w-7"
                onClick={() => handleSend()}
                disabled={!input.trim() || isStreaming}
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-3 py-3" ref={scrollRef}>
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-2",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.role === "assistant" && (
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "rounded-xl px-3 py-2 text-xs max-w-[85%]",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    )}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-xs prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        <ReactMarkdown>
                          {msg.content.replace(/\[ADD_NODE:\w+\]/g, "").trim()}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}
              {isStreaming && messages[messages.length - 1]?.content === "" && (
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3.5 h-3.5 text-primary animate-pulse" />
                  </div>
                  <div className="bg-muted rounded-xl px-3 py-2 text-xs text-muted-foreground">
                    Pensando...
                  </div>
                </div>
              )}
            </div>
          </div>

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
                placeholder="Descreva o que quer construir..."
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
          </div>
        </>
      )}
    </div>
  );
}
