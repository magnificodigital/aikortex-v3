import { useState, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  type WizardStep,
  type BusinessContext,
  type AgentRecommendation,
  type DeployChannel,
  type CRMProvider,
  type ExternalTool,
  type AgentIntent,
  type ConversationStage,
  type AgentAdvancedConfig,
  INITIAL_CONTEXT,
  WIZARD_STEPS,
  MANDATORY_INTENTS,
  DEFAULT_CONVERSATION_STAGES,
  DEFAULT_ADVANCED_CONFIG,
} from "@/types/agent-builder";
import { AGENT_PRESETS } from "@/types/agent-presets";
import WizardStepper from "@/components/aikortex/WizardStepper";
import StepAgents from "@/components/aikortex/StepAgents";
import StepContext from "@/components/aikortex/StepContext";
import StepChannels from "@/components/aikortex/StepChannels";
import StepIntegrations from "@/components/aikortex/StepIntegrations";
import StepLaunch from "@/components/aikortex/StepLaunch";

const STEP_ORDER: WizardStep[] = WIZARD_STEPS.map((s) => s.key);

const Aikortex = () => {
  const [step, setStep] = useState<WizardStep>("agent");
  const [context, setContext] = useState<BusinessContext>(INITIAL_CONTEXT);
  const [selectedAgent, setSelectedAgent] = useState<AgentRecommendation | null>(null);
  const [selectedChannels, setSelectedChannels] = useState<DeployChannel[]>([]);
  const [selectedCRM, setSelectedCRM] = useState<CRMProvider | null>(null);
  const [selectedTools, setSelectedTools] = useState<ExternalTool[]>([]);
  const [intents, setIntents] = useState<AgentIntent[]>([...MANDATORY_INTENTS]);
  const [stages, setStages] = useState<ConversationStage[]>([...DEFAULT_CONVERSATION_STAGES]);
  const [advancedConfig, setAdvancedConfig] = useState<AgentAdvancedConfig>({ ...DEFAULT_ADVANCED_CONFIG });

  const currentIndex = STEP_ORDER.indexOf(step);

  const goBack = () => {
    if (currentIndex > 0) setStep(STEP_ORDER[currentIndex - 1]);
  };

  const applyPresetAndGoToContext = useCallback(() => {
    if (selectedAgent) {
      const preset = AGENT_PRESETS[selectedAgent.type];
      setContext((prev) => ({ ...prev, ...preset.context }));
      setIntents([...preset.intents]);
      setStages([...preset.stages]);
      setAdvancedConfig({ ...preset.advancedConfig });
    }
    setStep("context");
  }, [selectedAgent]);

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

        {step === "agent" && (
          <StepAgents
            selected={selectedAgent}
            onSelect={setSelectedAgent}
            onNext={applyPresetAndGoToContext}
          />
        )}
        {step === "context" && (
          <StepContext
            context={context}
            onChange={setContext}
            onNext={() => setStep("channels")}
            onBack={goBack}
            advancedConfig={advancedConfig}
            onAdvancedConfigChange={setAdvancedConfig}
            intents={intents}
            onIntentsChange={setIntents}
            stages={stages}
            onStagesChange={setStages}
          />
        )}
        {step === "channels" && (
          <StepChannels selected={selectedChannels} onToggle={toggleChannel} onNext={() => setStep("integrations")} onBack={goBack} agentType={selectedAgent?.type || null} />
        )}
        {step === "integrations" && (
          <StepIntegrations selected={selectedTools} onToggle={toggleTool} onNext={() => setStep("launch")} onBack={goBack} agentType={selectedAgent?.type || null} />
        )}
        {step === "launch" && (
          <StepLaunch
            context={context}
            agent={selectedAgent}
            selectedChannels={selectedChannels}
            onToggleChannel={toggleChannel}
            selectedCRM={selectedCRM}
            onSelectCRM={setSelectedCRM}
            onBack={goBack}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Aikortex;
