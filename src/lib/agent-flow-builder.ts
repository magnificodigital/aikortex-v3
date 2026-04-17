// ── Auto-build a default automation flow for a newly created agent ──
// Generates trigger → agent_ai → response, with extra nodes per agent_type.
import type { UserAgent } from "@/hooks/use-user-agents";

interface FlowNode {
  id: string;
  type: "flowNode";
  position: { x: number; y: number };
  data: {
    label: string;
    category: string;
    icon: string;
    description: string;
    color: string;
    nodeType: string;
    config: Record<string, unknown>;
  };
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
}

const NODE = (
  id: string,
  nodeType: string,
  label: string,
  category: string,
  icon: string,
  color: string,
  x: number,
  y: number,
  config: Record<string, unknown> = {},
  description = ""
): FlowNode => ({
  id,
  type: "flowNode",
  position: { x, y },
  data: { label, category, icon, color, nodeType, config, description },
});

const EDGE = (source: string, target: string): FlowEdge => ({
  id: `e-${source}-${target}`,
  source,
  target,
});

/** Returns extra nodes/edges based on agent type (SDR, SAC, Custom...). */
function extraStepsByType(agentType: string, agentNodeId: string, lastY: number) {
  const t = agentType.toLowerCase();
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  let y = lastY;

  if (t.includes("sdr") || t.includes("sales") || t.includes("vend")) {
    nodes.push(
      NODE("capture-name", "capture_name", "Capturar Nome", "data_capture", "👤", "#10b981", 100, y += 140, { prompt: "Qual é o seu nome?", variable: "name", required: true }),
      NODE("capture-email", "capture_email", "Capturar E-mail", "data_capture", "📧", "#10b981", 100, y += 140, { prompt: "Qual é o seu e-mail?", variable: "email", required: true }),
      NODE("crm-lead", "crm_create_lead", "Criar Lead no CRM", "crm_actions", "➕", "#f97316", 100, y += 140, { provider: "internal" }),
      NODE("followup", "crm_create_followup", "Agendar Follow-up", "crm_actions", "🔔", "#f97316", 100, y += 140, { type: "whatsapp", delay: "24h" }),
    );
    edges.push(
      EDGE(agentNodeId, "capture-name"),
      EDGE("capture-name", "capture-email"),
      EDGE("capture-email", "crm-lead"),
      EDGE("crm-lead", "followup"),
    );
    return { nodes, edges, lastNodeId: "followup", lastY: y };
  }

  if (t.includes("sac") || t.includes("support") || t.includes("atend")) {
    nodes.push(
      NODE("intent", "intent_classifier", "Classificar Intenção", "processing", "🏷️", "#6366f1", 100, y += 140, { model: "gemini-2.5-flash" }),
      NODE("kb", "knowledge_search", "Consultar Base", "knowledge", "📚", "#a855f7", 100, y += 140, { maxResults: 5 }),
      NODE("hil", "human_in_loop", "Escalar para Humano", "control", "👤", "#ec4899", 100, y += 140, { approvalMessage: "Necessário humano?" }),
    );
    edges.push(
      EDGE(agentNodeId, "intent"),
      EDGE("intent", "kb"),
      EDGE("kb", "hil"),
    );
    return { nodes, edges, lastNodeId: "hil", lastY: y };
  }

  // Default (Custom): just a memory lookup
  nodes.push(
    NODE("memory", "memory_lookup", "Memória do Agente", "knowledge", "🧠", "#a855f7", 100, y += 140, { lookbackMessages: 10 }),
  );
  edges.push(EDGE(agentNodeId, "memory"));
  return { nodes, edges, lastNodeId: "memory", lastY: y };
}

export function buildDefaultFlowForAgent(agent: UserAgent): {
  name: string;
  description: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
} {
  const trigger = NODE(
    "trigger",
    "trigger_chat",
    "Mensagem Recebida",
    "trigger",
    "💬",
    "#22c55e",
    100,
    50,
    { channel: "any" },
    "Inicia quando o agente recebe uma mensagem"
  );

  const agentNode = NODE(
    "agent",
    "agent_ai",
    agent.name,
    "processing",
    "🧠",
    "#6366f1",
    100,
    190,
    {
      agentId: agent.id,
      agentType: agent.agent_type,
      model: agent.model || "gemini-2.5-flash",
      temperature: 0.7,
    },
    "Processa a mensagem com o agente IA"
  );

  const extras = extraStepsByType(agent.agent_type, agentNode.id, 190);

  const responseNode = NODE(
    "response",
    "send_message",
    "Enviar Resposta",
    "output",
    "💬",
    "#06b6d4",
    100,
    extras.lastY + 140,
    { message: "{{agent_response}}" },
    "Envia a resposta do agente ao usuário"
  );

  const nodes = [trigger, agentNode, ...extras.nodes, responseNode];
  const edges = [
    EDGE(trigger.id, agentNode.id),
    ...extras.edges,
    EDGE(extras.lastNodeId, responseNode.id),
  ];

  return {
    name: `Fluxo — ${agent.name}`,
    description: `Automação gerada para o agente ${agent.name} (${agent.agent_type})`,
    nodes,
    edges,
  };
}
