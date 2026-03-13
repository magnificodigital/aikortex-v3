import { useState } from "react";
import { AgentRecommendation, AGENT_TEMPLATES } from "@/types/agent-builder";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Check, Bot, Users, Zap, HeadphonesIcon, TrendingUp } from "lucide-react";

interface Props {
  selected: AgentRecommendation[];
  onSelect: (agents: AgentRecommendation[]) => void;
  onNext: () => void;
}

const TYPE_META: Record<string, { icon: typeof Bot; gradient: string; accent: string }> = {
  SDR: { icon: Zap, gradient: "from-[hsl(217,91%,50%)] to-[hsl(199,89%,48%)]", accent: "text-info" },
  BDR: { icon: TrendingUp, gradient: "from-[hsl(142,71%,45%)] to-[hsl(160,60%,45%)]", accent: "text-success" },
  SAC: { icon: HeadphonesIcon, gradient: "from-[hsl(38,92%,50%)] to-[hsl(25,95%,53%)]", accent: "text-warning" },
  CS: { icon: Users, gradient: "from-[hsl(280,70%,50%)] to-[hsl(300,60%,50%)]", accent: "text-primary" },
};

const StepAgents = ({ selected, onSelect, onNext }: Props) => {
  const toggle = (agent: AgentRecommendation) => {
    const exists = selected.find((a) => a.id === agent.id);
    if (exists) {
      onSelect(selected.filter((a) => a.id !== agent.id));
    } else {
      onSelect([...selected, { ...agent, selected: true }]);
    }
  };

  const isSelected = (id: string) => selected.some((a) => a.id === id);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
          <Bot className="w-3.5 h-3.5" />
          Comece aqui
        </div>
        <h2 className="text-3xl font-bold text-foreground">
          Monte sua equipe de IA
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Escolha os agentes que vão trabalhar para sua empresa. Você pode selecionar quantos quiser.
        </p>
      </div>

      {/* Agent cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
        {AGENT_TEMPLATES.map((agent) => {
          const meta = TYPE_META[agent.type];
          const Icon = meta.icon;
          const active = isSelected(agent.id);
          return (
            <button
              key={agent.id}
              onClick={() => toggle(agent)}
              className={`group relative text-left rounded-2xl border-2 p-6 transition-all duration-200 ${
                active
                  ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                  : "border-border bg-card hover:border-primary/40 hover:shadow-md"
              }`}
            >
              {/* Selection indicator */}
              <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                active ? "bg-primary border-primary scale-110" : "border-muted-foreground/30 group-hover:border-primary/50"
              }`}>
                {active && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
              </div>

              {/* Icon with gradient */}
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center mb-4 shadow-sm`}>
                <Icon className="w-6 h-6 text-white" />
              </div>

              {/* Content */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-[10px] font-bold ${meta.accent}`}>
                    {agent.type}
                  </Badge>
                </div>
                <h3 className="text-base font-bold text-foreground">{agent.name}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{agent.objective}</p>
              </div>

              {/* Benefits */}
              <div className="mt-4 space-y-1.5">
                {agent.benefits.map((b, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-foreground/80">
                    <Check className="w-3 h-3 text-success shrink-0" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between max-w-3xl mx-auto">
        <p className="text-sm text-muted-foreground">
          {selected.length === 0
            ? "Selecione pelo menos um agente"
            : `${selected.length} agente${selected.length > 1 ? "s" : ""} selecionado${selected.length > 1 ? "s" : ""}`}
        </p>
        <Button onClick={onNext} disabled={selected.length === 0} size="lg" className="gap-2 px-6">
          Continuar <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default StepAgents;
