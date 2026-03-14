import { AgentRecommendation, AGENT_TEMPLATES } from "@/types/agent-builder";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Check, Bot, Users, Zap, HeadphonesIcon, TrendingUp, Settings2, Sparkles } from "lucide-react";

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
    onSelect(selected?.id === agent.id ? null : { ...agent, selected: true });
  };

  const predefined = AGENT_TEMPLATES.filter((a) => a.type !== "Custom");
  const custom = AGENT_TEMPLATES.find((a) => a.type === "Custom");

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Escolha o tipo de agente</h2>
        <p className="text-sm text-muted-foreground">
          Selecione um agente pré-configurado ou crie um personalizado do zero
        </p>
      </div>

      {/* Pre-configured agents */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Agentes pré-configurados
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {predefined.map((agent) => {
            const meta = TYPE_META[agent.type];
            const Icon = meta.icon;
            const active = selected?.id === agent.id;
            return (
              <button
                key={agent.id}
                onClick={() => toggle(agent)}
                className={`relative text-left rounded-xl border p-4 transition-all duration-200 space-y-3 ${
                  active
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border bg-card hover:border-primary/40 hover:shadow-sm"
                }`}
              >
                {active && (
                  <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
                <div className={`w-9 h-9 rounded-lg ${meta.accentBg} flex items-center justify-center`}>
                  <Icon className={`w-4.5 h-4.5 ${meta.accent}`} />
                </div>
                <div className="space-y-1">
                  <Badge variant={active ? "default" : "secondary"} className="text-[10px] font-bold">
                    {agent.type}
                  </Badge>
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                    {agent.objective}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {agent.benefits.slice(0, 2).map((b) => (
                    <span key={b} className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                      {b}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom agent */}
      {custom && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
            Personalizado
          </p>
          {(() => {
            const active = selected?.id === custom.id;
            return (
              <button
                onClick={() => toggle(custom)}
                className={`relative w-full text-left rounded-xl border p-5 transition-all duration-200 ${
                  active
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-dashed border-border bg-card hover:border-primary/40 hover:shadow-sm"
                }`}
              >
                {active && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
                    <Settings2 className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">Agente Personalizado</span>
                      <Sparkles className="w-3.5 h-3.5 text-warning" />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Configure um agente sob medida com total liberdade: defina objetivos, canais, integrações e comportamento sem restrições.
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {["Todos os canais", "Todas as integrações", "Objetivos livres", "100% configurável"].map((tag) => (
                        <span key={tag} className="text-[9px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            );
          })()}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2">
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
