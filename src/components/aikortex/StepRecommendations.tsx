import { AgentRecommendation } from "@/types/agent-builder";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Check, MessageSquare, Target, Users } from "lucide-react";

interface Props {
  recommendations: AgentRecommendation[];
  onToggle: (id: string) => void;
  onNext: () => void;
}

const TYPE_COLORS: Record<string, string> = {
  SDR: "bg-info/10 text-info border-info/20",
  BDR: "bg-primary/10 text-primary border-primary/20",
  SAC: "bg-warning/10 text-warning border-warning/20",
  CS: "bg-success/10 text-success border-success/20",
};

const StepRecommendations = ({ recommendations, onToggle, onNext }: Props) => {
  const hasSelection = recommendations.some((r) => r.selected);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Agentes recomendados para você</h2>
        <p className="text-sm text-muted-foreground">Selecione os agentes que deseja criar para sua equipe de IA</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.map((agent) => (
          <button
            key={agent.id}
            onClick={() => onToggle(agent.id)}
            className={`text-left rounded-xl border-2 p-5 transition-all space-y-4 ${
              agent.selected
                ? "border-primary bg-primary/5 shadow-md"
                : "border-border bg-card hover:border-primary/30 hover:shadow-sm"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <Badge variant="outline" className={TYPE_COLORS[agent.type]}>{agent.type}</Badge>
                <h3 className="text-sm font-bold text-foreground">{agent.name}</h3>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                agent.selected ? "bg-primary border-primary" : "border-border"
              }`}>
                {agent.selected && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">{agent.objective}</p>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {agent.targetAudience}</span>
            </div>

            <div className="space-y-1">
              {agent.benefits.map((b, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-foreground">
                  <Check className="w-3 h-3 text-success shrink-0" />
                  <span>{b}</span>
                </div>
              ))}
            </div>

            <div className="rounded-lg bg-muted/50 p-3 space-y-2">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> Exemplo de conversa
              </span>
              {agent.exampleConversation.slice(0, 2).map((msg, i) => (
                <div key={i} className={`text-xs px-2 py-1.5 rounded-md ${
                  msg.role === "agent" ? "bg-primary/10 text-primary" : "bg-card text-foreground"
                }`}>
                  {msg.message}
                </div>
              ))}
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!hasSelection} className="gap-2">
          Continuar <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default StepRecommendations;
