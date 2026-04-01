import { useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import {
  type AgentRecommendation,
} from "@/types/agent-builder";
import { AGENT_PRESETS } from "@/types/agent-presets";
import StepAgents from "@/components/aikortex/StepAgents";

const Aikortex = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<AgentRecommendation | null>(null);

  const handleAgentSelect = useCallback((agent: AgentRecommendation) => {
    setSelected(agent);

    // Get preset for this agent type
    const preset = AGENT_PRESETS[agent.type];

    // Clear stale localStorage for this agent so template values take precedence
    const storagePrefix = `agent-detail-${agent.id}`;
    try {
      ["name", "desc", "objective", "instructions", "toneOfVoice", "greetingMessage"].forEach(k =>
        localStorage.removeItem(`${storagePrefix}-${k}`)
      );
    } catch {}

    // Navigate to Agent Builder wizard with agent type pre-selected
    navigate("/agent-builder", {
      state: {
        agentType: agent.type,
        agentName: agent.name,
        preset: {
          context: preset.context,
          intents: preset.intents,
          stages: preset.stages,
          advancedConfig: preset.advancedConfig,
        },
      },
    });
  }, [navigate]);

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
        <StepAgents selected={selected} onSelect={handleAgentSelect} />
      </div>
    </DashboardLayout>
  );
};

export default Aikortex;
