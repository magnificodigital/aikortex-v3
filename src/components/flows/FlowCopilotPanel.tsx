import { useState, useRef, useEffect } from "react";
import { Bot, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Crie um fluxo de qualificação de leads",
  "Adicione um bloco de IA para classificar intenções",
  "Como conectar com WhatsApp?",
  "Otimize meu fluxo atual",
];

interface Props {
  onClose: () => void;
  onAddNode?: (nodeType: string) => void;
}

export default function FlowCopilotPanel({ onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    setTimeout(() => {
      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: getSimulatedResponse(userMsg.content),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setLoading(false);
    }, 1200);
  };

  const handleSuggestion = (text: string) => {
    setInput(text);
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full">
      {isEmpty ? (
        /* Empty state — Sim Studio "New Chat" style */
        <div className="flex-1 flex flex-col">
          <div className="px-4 pt-4 pb-2">
            <h3 className="text-sm font-semibold text-foreground">New Chat</h3>
          </div>
          <div className="flex-1 flex flex-col justify-end px-3 pb-3">
            {/* Suggestions */}
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
            {/* Input */}
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
                placeholder="Build an AI agent..."
                className="min-h-[60px] max-h-[120px] text-xs resize-none pr-10"
                rows={2}
              />
              <Button
                size="icon"
                variant="ghost"
                className="absolute bottom-1.5 right-1.5 h-7 w-7"
                onClick={handleSend}
                disabled={!input.trim() || loading}
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Chat mode */
        <>
          <ScrollArea className="flex-1 px-3 py-3" ref={scrollRef}>
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
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
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
          </ScrollArea>

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
                onClick={handleSend}
                disabled={!input.trim() || loading}
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

function getSimulatedResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("qualificação") || lower.includes("lead"))
    return "Para criar um fluxo de qualificação de leads, sugiro começar com um gatilho de 'Mensagem recebida', seguido de blocos de captura de dados (nome, email), um Agente IA para qualificar, e uma condição para direcionar leads quentes ao CRM. Quer que eu adicione esses blocos automaticamente?";
  if (lower.includes("whatsapp"))
    return "Para conectar com WhatsApp, adicione um bloco de integração 'WhatsApp' ao seu fluxo. Você precisará configurar o template de mensagem e o número de telefone de destino. Use o bloco na categoria 'Integrações' na barra inferior.";
  if (lower.includes("ia") || lower.includes("agente") || lower.includes("intenção"))
    return "O bloco 'Detectar Intenção' usa IA para classificar as mensagens dos usuários em categorias como dúvida, reclamação ou elogio. Adicione-o após o gatilho e antes de um bloco de condição para direcionar o fluxo com base na intenção detectada.";
  if (lower.includes("otimiz"))
    return "Para otimizar seu fluxo, considere: 1) Adicionar tratamento de erros com blocos de condição 2) Inserir delays estratégicos para não sobrecarregar o usuário 3) Usar análise de sentimento antes de escalar para humano 4) Implementar testes A/B para comparar abordagens.";
  return "Entendi! Posso ajudar com isso. Para implementar, sugiro usar uma combinação de blocos de gatilho, ações e condições. Quer que eu detalhe o passo a passo ou prefere que eu adicione blocos automaticamente ao canvas?";
}
