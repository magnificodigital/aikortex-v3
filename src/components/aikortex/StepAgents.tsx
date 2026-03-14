import { AgentRecommendation, AgentGoal, AgentType, AGENT_TEMPLATES, AGENT_GOALS, GOALS_BY_AGENT_TYPE } from "@/types/agent-builder";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Check, Bot, Users, Zap, HeadphonesIcon, TrendingUp } from "lucide-react";

interface Props {
  selected: AgentRecommendation | null;
  selectedGoal: AgentGoal | null;
  onSelect: (agent: AgentRecommendation | null) => void;
  onSelectGoal: (goal: AgentGoal) => void;
  onNext: () => void;
}

const TYPE_META: Record<string, { icon: typeof Bot; gradient: string }> = {
  SDR: { icon: Zap, gradient: "from-[hsl(217,91%,50%)] to-[hsl(199,89%,48%)]" },
  BDR: { icon: TrendingUp, gradient: "from-[hsl(142,71%,45%)] to-[hsl(160,60%,45%)]" },
  SAC: { icon: HeadphonesIcon, gradient: "from-[hsl(38,92%,50%)] to-[hsl(25,95%,53%)]" },
  CS: { icon: Users, gradient: "from-[hsl(280,70%,50%)] to-[hsl(300,60%,50%)]" },
};

const StepAgents = ({ selected, selectedGoal, onSelect, onSelectGoal, onNext }: Props) => {
  const toggle = (agent: AgentRecommendation) => {
    if (selected?.id === agent.id) {
      onSelect(null);
    } else {
      onSelect({ ...agent, selected: true });
    }
  };

  const allowedGoals = selected ? GOALS_BY_AGENT_TYPE[selected.type] : [];
  const filteredGoals = AGENT_GOALS.filter((g) => allowedGoals.includes(g.value));
  const canContinue = selected && selectedGoal;

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Escolha o agente e objetivo</h2>
        <p className="text-sm text-muted-foreground">Selecione o tipo de agente e o que ele deve fazer</p>
      </div>

      {/* Agent type cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${meta.gradient} flex items-center justify-center mx-auto mb-3`}>
                <Icon className="w-5 h-5 text-white" />
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

      {/* Goal selection - only shows after agent is selected */}
      {selected && (
        <div className="space-y-3 animate-fade-in">
          <h3 className="text-sm font-semibold text-foreground">Objetivo do agente {selected.type}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {filteredGoals.map((goal) => {
              const isSelected = selectedGoal === goal.value;
              return (
                <button
                  key={goal.value}
                  onClick={() => onSelectGoal(goal.value)}
                  className={`rounded-lg border p-3 text-left transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/30"
                  }`}
                >
                  <p className="text-sm font-medium text-foreground">{goal.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{goal.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {!selected ? "Selecione um agente" : !selectedGoal ? "Selecione um objetivo" : "Pronto para continuar"}
        </p>
        <Button onClick={onNext} disabled={!canContinue} className="gap-2">
          Continuar <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default StepAgents;
