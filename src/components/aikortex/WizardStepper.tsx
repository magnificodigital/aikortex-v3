import { WIZARD_STEPS, WizardStep } from "@/types/agent-builder";
import { Check } from "lucide-react";

interface Props {
  currentStep: WizardStep;
}

const WizardStepper = ({ currentStep }: Props) => {
  const currentIndex = WIZARD_STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="relative h-1.5 bg-muted rounded-full overflow-hidden mb-4">
        <div
          className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${((currentIndex + 1) / WIZARD_STEPS.length) * 100}%` }}
        />
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-between">
        {WIZARD_STEPS.map((step, i) => {
          const isDone = i < currentIndex;
          const isActive = i === currentIndex;
          const isUpcoming = i > currentIndex;
          return (
            <div key={step.key} className="flex flex-col items-center gap-1.5 relative">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-300 ${
                  isDone
                    ? "bg-primary text-primary-foreground scale-90"
                    : isActive
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : step.number}
              </div>
              <span
                className={`text-[10px] font-medium whitespace-nowrap transition-colors hidden sm:block ${
                  isActive ? "text-primary font-semibold" : isDone ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WizardStepper;
