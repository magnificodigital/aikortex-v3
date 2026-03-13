import { WIZARD_STEPS, WizardStep } from "@/types/agent-builder";
import { Check } from "lucide-react";

interface Props {
  currentStep: WizardStep;
}

const WizardStepper = ({ currentStep }: Props) => {
  // Don't show stepper on the first step (agent selection)
  if (currentStep === "agents") return null;

  // Steps after agent selection
  const postAgentSteps = WIZARD_STEPS.filter((s) => s.key !== "agents");
  const currentIndex = postAgentSteps.findIndex((s) => s.key === currentStep);

  return (
    <div className="w-full space-y-3">
      {/* Minimal progress bar */}
      <div className="relative h-1 bg-muted rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${((currentIndex + 1) / postAgentSteps.length) * 100}%` }}
        />
      </div>

      {/* Clean step labels */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {postAgentSteps.map((step, i) => {
          const isDone = i < currentIndex;
          const isActive = i === currentIndex;
          return (
            <div
              key={step.key}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : isDone
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {isDone && <Check className="w-3 h-3" />}
              {step.label}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WizardStepper;
