import { ExternalTool, EXTERNAL_TOOLS, AgentType, TOOLS_BY_AGENT_TYPE } from "@/types/agent-builder";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Check, Puzzle } from "lucide-react";

interface Props {
  selected: ExternalTool[];
  onToggle: (tool: ExternalTool) => void;
  onNext: () => void;
  onBack: () => void;
  agentType: AgentType | null;
}

const StepIntegrations = ({ selected, onToggle, onNext, onBack, agentType }: Props) => {
  const allowedTools = agentType ? TOOLS_BY_AGENT_TYPE[agentType] : EXTERNAL_TOOLS.map(t => t.value);
  const filteredTools = EXTERNAL_TOOLS.filter(t => allowedTools.includes(t.value));
  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Puzzle className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Integrações</h2>
        <p className="text-sm text-muted-foreground">Conecte ferramentas externas para expandir as capacidades do agente.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredTools.map((tool) => {
          const isSelected = selected.includes(tool.value);
          return (
            <div
              key={tool.value}
              className={`flex items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                isSelected ? "border-primary bg-primary/5 shadow-md" : "border-border bg-card"
              }`}
            >
              <img
                src={tool.logo}
                alt={tool.label}
                className="w-9 h-9 rounded-lg object-contain shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{tool.label}</p>
                <p className="text-xs text-muted-foreground truncate">{tool.description}</p>
              </div>
              <Button
                size="sm"
                variant={isSelected ? "default" : "outline"}
                onClick={() => onToggle(tool.value)}
                className="shrink-0 text-xs h-8 gap-1.5"
              >
                {isSelected ? (
                  <><Check className="w-3 h-3" /> Conectado</>
                ) : (
                  "Conectar"
                )}
              </Button>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
        <Button onClick={onNext} className="gap-2">
          Continuar <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default StepIntegrations;
