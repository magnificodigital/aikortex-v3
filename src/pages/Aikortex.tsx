import { useState, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Bot, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type WizardStep,
  type BusinessContext,
  type AgentRecommendation,
  type AgentGoal,
  type ConversationStep,
  type QualificationTier,
  type AgentProfile,
  type DeployChannel,
  type CRMProvider,
  INITIAL_CONTEXT,
  DEFAULT_QUALIFICATION_TIERS,
  WIZARD_STEPS,
  generateMockRecommendations,
  generateMockConversation,
  generateMockProfile,
} from "@/types/agent-builder";
import WizardStepper from "@/components/aikortex/WizardStepper";
import StepAgents from "@/components/aikortex/StepAgents";
import StepGoal from "@/components/aikortex/StepGoal";
import StepContext from "@/components/aikortex/StepContext";
import StepAnalysis from "@/components/aikortex/StepAnalysis";
import StepConversation from "@/components/aikortex/StepConversation";
import StepQualification from "@/components/aikortex/StepQualification";
import StepProfile from "@/components/aikortex/StepProfile";
import StepChannels from "@/components/aikortex/StepChannels";
import StepCRM from "@/components/aikortex/StepCRM";
import StepTesting from "@/components/aikortex/StepTesting";

const STEP_ORDER: WizardStep[] = WIZARD_STEPS.map((s) => s.key);

const Aikortex = () => {
  const [step, setStep] = useState<WizardStep>("agents");
  const [context, setContext] = useState<BusinessContext>(INITIAL_CONTEXT);
  const [selectedAgent, setSelectedAgent] = useState<AgentRecommendation | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<AgentGoal | null>(null);
  const [conversationSteps, setConversationSteps] = useState<ConversationStep[]>([]);
  const [qualificationTiers, setQualificationTiers] = useState<QualificationTier[]>(DEFAULT_QUALIFICATION_TIERS);
  const [agentProfile, setAgentProfile] = useState<AgentProfile | null>(null);
  const [selectedChannels, setSelectedChannels] = useState<DeployChannel[]>([]);
  const [selectedCRM, setSelectedCRM] = useState<CRMProvider | null>(null);

  const goTo = (s: WizardStep) => setStep(s);
  const currentIndex = STEP_ORDER.indexOf(step);

  const goBack = () => {
    if (currentIndex > 0) setStep(STEP_ORDER[currentIndex - 1]);
  };

  const handleAnalysisComplete = useCallback(() => {
    if (selectedAgent) {
      const enriched = generateMockRecommendations(context);
      const match = enriched.find((a) => a.id === selectedAgent.id);
      if (match) setSelectedAgent({ ...match, selected: true });
    }
    if (selectedGoal) {
      setConversationSteps(generateMockConversation(context, selectedGoal));
      setAgentProfile(generateMockProfile(context, selectedGoal));
    }
    goTo("conversation");
  }, [context, selectedAgent, selectedGoal]);

  const regenerateConversation = () => {
    if (selectedGoal) {
      setConversationSteps(generateMockConversation(context, selectedGoal));
    }
  };

  const toggleChannel = (ch: DeployChannel) => {
    setSelectedChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
        {/* Stepper */}
        <WizardStepper currentStep={step} />

        {/* Back button */}
        {currentIndex > 0 && step !== "analysis" && (
          <Button variant="ghost" size="sm" onClick={goBack} className="gap-1.5 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar
          </Button>
        )}

        {/* Steps */}
        {step === "agents" && (
          <StepAgents
            selected={selectedAgent}
            onSelect={setSelectedAgent}
            onNext={() => goTo("goal")}
          />
        )}
        {step === "goal" && selectedAgent && (
          <StepGoal
            selectedGoal={selectedGoal}
            agentType={selectedAgent.type}
            onSelect={setSelectedGoal}
            onNext={() => goTo("context")}
          />
        )}
        {step === "context" && (
          <StepContext context={context} onChange={setContext} onNext={() => goTo("analysis")} />
        )}
        {step === "analysis" && (
          <StepAnalysis context={context} onComplete={handleAnalysisComplete} />
        )}
        {step === "conversation" && (
          <StepConversation steps={conversationSteps} onRegenerate={regenerateConversation} onNext={() => goTo("qualification")} />
        )}
        {step === "qualification" && (
          <StepQualification tiers={qualificationTiers} onChange={setQualificationTiers} onNext={() => goTo("profile")} />
        )}
        {step === "profile" && agentProfile && (
          <StepProfile profile={agentProfile} onNext={() => goTo("channels")} />
        )}
        {step === "channels" && (
          <StepChannels selected={selectedChannels} onToggle={toggleChannel} onNext={() => goTo("crm")} />
        )}
        {step === "crm" && (
          <StepCRM selected={selectedCRM} onSelect={setSelectedCRM} onNext={() => goTo("testing")} />
        )}
        {step === "testing" && (
          <StepTesting context={context} agents={selectedAgent ? [selectedAgent] : []} channels={selectedChannels} crm={selectedCRM} />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Aikortex;
