import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type WizardStep,
  type BusinessContext,
  type AgentRecommendation,
  type DeployChannel,
  type CRMProvider,
  type ExternalTool,
  INITIAL_CONTEXT,
  WIZARD_STEPS,
  GOALS_BY_AGENT_TYPE,
} from "@/types/agent-builder";
import WizardStepper from "@/components/aikortex/WizardStepper";
import StepAgents from "@/components/aikortex/StepAgents";
import StepContext from "@/components/aikortex/StepContext";
import StepChannels from "@/components/aikortex/StepChannels";
import StepLaunch from "@/components/aikortex/StepLaunch";

const STEP_ORDER: WizardStep[] = WIZARD_STEPS.map((s) => s.key);

const Aikortex = () => {
  const [step, setStep] = useState<WizardStep>("agent");
  const [context, setContext] = useState<BusinessContext>(INITIAL_CONTEXT);
  const [selectedAgent, setSelectedAgent] = useState<AgentRecommendation | null>(null);
  const [selectedChannels, setSelectedChannels] = useState<DeployChannel[]>([]);
  const [selectedCRM, setSelectedCRM] = useState<CRMProvider | null>(null);
  const [selectedTools, setSelectedTools] = useState<ExternalTool[]>([]);

  const currentIndex = STEP_ORDER.indexOf(step);

  const goBack = () => {
    if (currentIndex > 0) setStep(STEP_ORDER[currentIndex - 1]);
  };

  const toggleChannel = (ch: DeployChannel) => {
    setSelectedChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  const toggleTool = (tool: ExternalTool) => {
    setSelectedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  };

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
        <WizardStepper currentStep={step} />

        {currentIndex > 0 && (
          <Button variant="ghost" size="sm" onClick={goBack} className="gap-1.5 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar
          </Button>
        )}

        {step === "agent" && (
          <StepAgents
            selected={selectedAgent}
            onSelect={setSelectedAgent}
            onNext={() => setStep("context")}
          />
        )}
        {step === "context" && (
          <StepContext context={context} onChange={setContext} onNext={() => setStep("channels")} selectedTools={selectedTools} onToggleTool={toggleTool} />
        )}
        {step === "channels" && (
          <StepChannels selected={selectedChannels} onToggle={toggleChannel} onNext={() => setStep("launch")} />
        )}
        {step === "launch" && (
          <StepLaunch
            context={context}
            agent={selectedAgent}
            selectedChannels={selectedChannels}
            onToggleChannel={toggleChannel}
            selectedCRM={selectedCRM}
            onSelectCRM={setSelectedCRM}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Aikortex;
