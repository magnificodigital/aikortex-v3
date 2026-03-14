import { AgentRecommendation, AGENT_TEMPLATES, GOALS_BY_AGENT_TYPE } from "@/types/agent-builder";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Check, Bot, Users, Zap, HeadphonesIcon, TrendingUp, Settings2 } from "lucide-react";

interface Props {
  selected: AgentRecommendation | null;
  onSelect: (agent: AgentRecommendation | null) => void;
  onNext: () => void;
}

const TYPE_META: Record<string, { icon: typeof Bot }> = {
  SDR: { icon: Zap },
  BDR: { icon: TrendingUp },
  SAC: { icon: HeadphonesIcon },
  CS: { icon: Users },
  Custom: { icon: Settings2 },
};

const StepAgents = ({ selected, onSelect, onNext }: Props) => {
  const toggle = (agent: AgentRecommendation) => {
    if (selected?.id === agent.id) {
      onSelect(null);
    } else {
      onSelect({ ...agent, selected: true });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Escolha o tipo de agente</h2>
        <p className="text-sm text-muted-foreground">Cada agente já vem configurado com os objetivos ideais para sua função</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {AGENT_TEMPLATES.map((agent) => {
          const meta = TYPE_META[agent.type];
          const Icon = meta.icon;
          const active = selected?.id === agent.id;
          return (
            <button
              key={agent.id}
              onClick={() => toggle(agent)}
              className={`relative text-center rounded-xl border p-4 transition-all duration-200 ${
                active
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mx-auto mb-3">
                <Icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <Badge variant={active ? "default" : "outline"} className="text-[10px] font-bold">
                {agent.type}
              </Badge>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{agent.objective}</p>
              {active && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {!selected ? "Selecione um agente para continuar" : `${selected.name} selecionado`}
        </p>
        <Button onClick={onNext} disabled={!selected} className="gap-2">
          Continuar <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default StepAgents;
