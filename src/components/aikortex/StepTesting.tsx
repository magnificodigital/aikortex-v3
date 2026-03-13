import { useState } from "react";
import { BusinessContext, AgentRecommendation, DeployChannel, CRMProvider } from "@/types/agent-builder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, CheckCircle2, Rocket, User } from "lucide-react";

interface Props {
  context: BusinessContext;
  agents: AgentRecommendation[];
  channels: DeployChannel[];
  crm: CRMProvider | null;
}

const MOCK_RESPONSES: Record<string, string> = {
  default: "Olá! Como posso ajudar você hoje?",
  oi: "Olá! Que bom te ver por aqui. Como posso ajudar com nossos serviços?",
  preço: "Nossos planos são flexíveis e se adaptam ao tamanho da sua empresa. Posso agendar uma conversa com nosso especialista para te apresentar a melhor opção?",
  funciona: "Nosso sistema é super intuitivo! Você configura em minutos e já começa a ver resultados. Quer que eu te mostre como?",
};

const StepTesting = ({ context, agents, channels, crm }: Props) => {
  const [messages, setMessages] = useState<{ role: "user" | "agent"; text: string }[]>([
    { role: "agent", text: `Olá! Sou o assistente virtual da ${context.companyName}. Como posso ajudar?` },
  ]);
  const [input, setInput] = useState("");
  const selectedAgents = agents.filter((a) => a.selected);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setInput("");

    setTimeout(() => {
      const key = Object.keys(MOCK_RESPONSES).find((k) => userMsg.toLowerCase().includes(k));
      const response = MOCK_RESPONSES[key || "default"];
      setMessages((prev) => [...prev, { role: "agent", text: response }]);
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-success" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Seus agentes estão prontos!</h2>
        <p className="text-sm text-muted-foreground">Teste seu agente abaixo antes de colocá-lo em produção</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Agentes criados</h4>
          <div className="flex flex-wrap gap-1.5">
            {selectedAgents.map((a) => <Badge key={a.id} variant="secondary">{a.type}</Badge>)}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Canais</h4>
          <div className="flex flex-wrap gap-1.5">
            {channels.map((c) => <Badge key={c} variant="secondary">{c}</Badge>)}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">CRM</h4>
          <p className="text-sm font-medium text-foreground">{crm || "Nenhum"}</p>
        </div>
      </div>

      {/* Chat testing */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{selectedAgents[0]?.name || "Agente IA"}</p>
            <p className="text-[10px] text-success flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success" /> Online
            </p>
          </div>
        </div>

        <div className="p-4 space-y-3 min-h-[250px] max-h-[350px] overflow-y-auto">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 items-start ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "agent" && (
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3 h-3 text-primary" />
                </div>
              )}
              <div className={`rounded-lg px-3 py-2 text-xs max-w-[75%] ${
                msg.role === "agent"
                  ? "bg-muted/50 text-foreground rounded-tl-none"
                  : "bg-primary text-primary-foreground rounded-tr-none"
              }`}>
                {msg.text}
              </div>
              {msg.role === "user" && (
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3 h-3 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="px-4 py-3 border-t border-border flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Digite uma mensagem..."
            className="text-xs"
          />
          <Button size="sm" onClick={handleSend} disabled={!input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex justify-center">
        <Button size="lg" className="gap-2">
          <Rocket className="w-4 h-4" /> Ativar agentes em produção
        </Button>
      </div>
    </div>
  );
};

export default StepTesting;
