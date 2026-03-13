import { AgentGoal, AGENT_GOALS } from "@/types/agent-builder";
import { Button } from "@/components/ui/button";
import { ArrowRight, Target, CalendarCheck, UserPlus, HelpCircle, Handshake } from "lucide-react";

interface Props {
  selectedGoal: AgentGoal | null;
  onSelect: (goal: AgentGoal) => void;
  onNext: () => void;
}

const GOAL_ICONS: Record<AgentGoal, typeof Target> = {
  schedule_meetings: CalendarCheck,
  capture_leads: UserPlus,
  answer_questions: HelpCircle,
  qualify_opportunities: Target,
  support_customers: Handshake,
};

const StepGoal = ({ selectedGoal, onSelect, onNext }: Props) => {
  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Target className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Qual é o objetivo principal?</h2>
        <p className="text-sm text-muted-foreground">Este objetivo vai definir como seu agente conduz as conversas</p>
      </div>

      <div className="grid gap-3">
        {AGENT_GOALS.map((goal) => {
          const Icon = GOAL_ICONS[goal.value];
          const isSelected = selectedGoal === goal.value;
          return (
            <button
              key={goal.value}
              onClick={() => onSelect(goal.value)}
              className={`flex items-center gap-4 rounded-xl border-2 p-5 text-left transition-all ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border bg-card hover:border-primary/30"
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{goal.label}</h3>
                <p className="text-xs text-muted-foreground">{goal.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!selectedGoal} className="gap-2">
          Continuar <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default StepGoal;
