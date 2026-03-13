import { DeployChannel, DEPLOY_CHANNELS } from "@/types/agent-builder";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Radio } from "lucide-react";

interface Props {
  selected: DeployChannel[];
  onToggle: (ch: DeployChannel) => void;
  onNext: () => void;
}

const StepChannels = ({ selected, onToggle, onNext }: Props) => {
  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Radio className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Canais de deploy</h2>
        <p className="text-sm text-muted-foreground">Onde seu agente vai operar?</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {DEPLOY_CHANNELS.map((ch) => {
          const isSelected = selected.includes(ch.value);
          return (
            <button
              key={ch.value}
              onClick={() => onToggle(ch.value)}
              className={`flex items-center gap-4 rounded-xl border-2 p-5 text-left transition-all ${
                isSelected ? "border-primary bg-primary/5 shadow-md" : "border-border bg-card hover:border-primary/30"
              }`}
            >
              <span className="text-2xl">{ch.icon}</span>
              <span className="text-sm font-semibold text-foreground flex-1">{ch.label}</span>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                isSelected ? "bg-primary border-primary" : "border-border"
              }`}>
                {isSelected && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={selected.length === 0} className="gap-2">
          Continuar <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default StepChannels;
