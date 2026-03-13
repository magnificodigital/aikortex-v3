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
  const [selectedAgents, setSelectedAgents] = useState<AgentRecommendation[]>([]);
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
    const enrichedAgents = generateMockRecommendations(context);
    // Keep user selections
    const merged = enrichedAgents.map((a) => ({
      ...a,
      selected: selectedAgents.some((s) => s.id === a.id),
    }));
    setSelectedAgents(merged.filter((a) => a.selected));
    if (selectedGoal) {
      setConversationSteps(generateMockConversation(context, selectedGoal));
      setAgentProfile(generateMockProfile(context, selectedGoal));
    }
    goTo("conversation");
  }, [context, selectedAgents, selectedGoal]);

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
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[hsl(199,89%,48%)] flex items-center justify-center shadow-sm">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Aikortex</h1>
            <p className="text-xs text-muted-foreground">AI Agent Builder</p>
          </div>
        </div>

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
            selected={selectedAgents}
            onSelect={setSelectedAgents}
            onNext={() => goTo("goal")}
          />
        )}
        {step === "goal" && (
          <StepGoal
            selectedGoal={selectedGoal}
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
          <StepTesting context={context} agents={selectedAgents} channels={selectedChannels} crm={selectedCRM} />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Aikortex;
