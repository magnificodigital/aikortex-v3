import { WIZARD_STEPS, WizardStep } from "@/types/agent-builder";
import { Check } from "lucide-react";

interface Props {
  currentStep: WizardStep;
}

const WizardStepper = ({ currentStep }: Props) => {
  const currentIndex = WIZARD_STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2 px-1">
      {WIZARD_STEPS.map((step, i) => {
        const isDone = i < currentIndex;
        const isActive = i === currentIndex;
        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center gap-1 min-w-[56px]">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                  isDone
                    ? "bg-success text-success-foreground"
                    : isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : step.number}
              </div>
              <span className={`text-[10px] font-medium whitespace-nowrap ${
                isActive ? "text-primary" : isDone ? "text-foreground" : "text-muted-foreground"
              }`}>
                {step.label}
              </span>
            </div>
            {i < WIZARD_STEPS.length - 1 && (
              <div className={`w-6 h-px mx-0.5 mt-[-14px] ${
                i < currentIndex ? "bg-success" : "bg-border"
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default WizardStepper;
