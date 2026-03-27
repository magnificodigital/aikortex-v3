// ── Flow Builder Types – Aligned with Sim Studio ──

export type FlowNodeCategory =
  | "processing"
  | "logic"
  | "control"
  | "output"
  | "integration"
  | "trigger";

export interface FlowNodeData {
  label: string;
  category: FlowNodeCategory;
  icon: string;
  description: string;
  config: Record<string, unknown>;
  color: string;
  nodeType: string;
}

export interface NodeTemplate {
  type: string;
  label: string;
  category: FlowNodeCategory;
  icon: string;
  description: string;
  color: string;
  defaultConfig: Record<string, unknown>;
}

export const NODE_CATEGORIES: { key: FlowNodeCategory; label: string; color: string }[] = [
  { key: "trigger", label: "Triggers", color: "#22c55e" },
  { key: "processing", label: "Processing", color: "#6366f1" },
  { key: "logic", label: "Logic", color: "#f59e0b" },
  { key: "control", label: "Control Flow", color: "#ec4899" },
  { key: "output", label: "Output", color: "#06b6d4" },
  { key: "integration", label: "Integration", color: "#8b5cf6" },
];

export const NODE_TEMPLATES: NodeTemplate[] = [
  // ── Triggers ──
  { type: "trigger_chat", label: "Chat", category: "trigger", icon: "💬", description: "Starts when a chat message is received", color: "#22c55e", defaultConfig: { channel: "any" } },
  { type: "trigger_webhook", label: "Webhook", category: "trigger", icon: "🔗", description: "Starts via external API call", color: "#22c55e", defaultConfig: { method: "POST" } },
  { type: "trigger_schedule", label: "Schedule", category: "trigger", icon: "📅", description: "Starts on a cron schedule", color: "#22c55e", defaultConfig: { frequency: "daily", time: "09:00" } },
  { type: "trigger_form", label: "Input Form", category: "trigger", icon: "📋", description: "Starts with form input fields", color: "#22c55e", defaultConfig: { fields: [] } },

  // ── Processing ──
  { type: "agent", label: "Agent", category: "processing", icon: "🤖", description: "Chat with AI models", color: "#6366f1", defaultConfig: { model: "gemini-2.5-flash", temperature: 0.7, systemPrompt: "" } },
  { type: "function", label: "Function", category: "processing", icon: "⚡", description: "Run custom JavaScript/TypeScript code", color: "#6366f1", defaultConfig: { code: "", language: "javascript" } },
  { type: "api", label: "API", category: "processing", icon: "🌐", description: "Connect to external services via HTTP", color: "#6366f1", defaultConfig: { url: "", method: "GET", headers: {}, body: "" } },

  // ── Logic ──
  { type: "condition", label: "Condition", category: "logic", icon: "🔀", description: "Branch paths based on boolean expressions", color: "#f59e0b", defaultConfig: { expression: "" } },
  { type: "router", label: "Router", category: "logic", icon: "🧭", description: "AI-powered intelligent routing", color: "#f59e0b", defaultConfig: { model: "gemini-2.5-flash", routes: [] } },
  { type: "evaluator", label: "Evaluator", category: "logic", icon: "📊", description: "Score and assess content quality using AI", color: "#f59e0b", defaultConfig: { model: "gemini-2.5-flash", criteria: "" } },

  // ── Control Flow ──
  { type: "variables", label: "Variables", category: "control", icon: "📦", description: "Set and manage workflow-scoped variables", color: "#ec4899", defaultConfig: { variable: "", value: "" } },
  { type: "wait", label: "Wait", category: "control", icon: "⏳", description: "Pause execution for a specified time", color: "#ec4899", defaultConfig: { duration: 5, unit: "seconds" } },
  { type: "human_in_loop", label: "Human in the Loop", category: "control", icon: "👤", description: "Pause for human approval before continuing", color: "#ec4899", defaultConfig: { approvalMessage: "" } },
  { type: "loop", label: "Loop", category: "control", icon: "🔄", description: "Iterate over items in a list", color: "#ec4899", defaultConfig: { iterableVariable: "", maxIterations: 100 } },
  { type: "parallel", label: "Parallel", category: "control", icon: "⚙️", description: "Execute multiple branches simultaneously", color: "#ec4899", defaultConfig: { branches: 2 } },
  { type: "guardrails", label: "Guardrails", category: "control", icon: "🛡️", description: "Validate and filter AI outputs", color: "#ec4899", defaultConfig: { rules: [] } },

  // ── Output ──
  { type: "response", label: "Response", category: "output", icon: "📤", description: "Format and return final workflow results", color: "#06b6d4", defaultConfig: { format: "json", template: "" } },

  // ── Integration ──
  { type: "integration_crm", label: "CRM", category: "integration", icon: "💼", description: "Create/update leads in CRM", color: "#8b5cf6", defaultConfig: { provider: "", action: "create_lead" } },
  { type: "integration_email", label: "Email", category: "integration", icon: "📧", description: "Send emails", color: "#8b5cf6", defaultConfig: { to: "", subject: "", body: "" } },
  { type: "integration_whatsapp", label: "WhatsApp", category: "integration", icon: "📱", description: "Send WhatsApp messages", color: "#8b5cf6", defaultConfig: { template: "", phone: "" } },
  { type: "integration_sheets", label: "Google Sheets", category: "integration", icon: "📊", description: "Read/write spreadsheet data", color: "#8b5cf6", defaultConfig: { spreadsheetId: "", range: "" } },
  { type: "integration_calendar", label: "Calendar", category: "integration", icon: "📅", description: "Create calendar events", color: "#8b5cf6", defaultConfig: { provider: "google_calendar", action: "create_event" } },
  { type: "workflow_block", label: "Workflow", category: "integration", icon: "🔁", description: "Call a child workflow", color: "#8b5cf6", defaultConfig: { workflowId: "" } },
];

// ── Saved Flow ──

export interface SavedFlow {
  id: string;
  name: string;
  description: string;
  status: "draft" | "active" | "paused";
  folderId: string | null;
  nodes: unknown[];
  edges: unknown[];
  createdAt: string;
  updatedAt: string;
}

export interface FlowFolder {
  id: string;
  name: string;
  createdAt: string;
}

// ── Flow Templates ──

export interface FlowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  tags: string[];
  nodes: unknown[];
  edges: unknown[];
}

const pos = (x: number, y: number) => ({ x, y });

const nd = (id: string, label: string, category: FlowNodeCategory, icon: string, desc: string, color: string, cfg: Record<string, unknown>, p: { x: number; y: number }, nodeType: string) => ({
  id,
  type: "flowNode",
  position: p,
  data: { label, category, icon, description: desc, config: cfg, color, nodeType } as FlowNodeData,
});

const ed = (src: string, tgt: string, srcHandle?: string) => ({
  id: `e-${src}-${tgt}`,
  source: src,
  target: tgt,
  sourceHandle: srcHandle,
  animated: true,
  style: { stroke: "hsl(var(--primary))", strokeWidth: 2 },
});

export const FLOW_TEMPLATES: FlowTemplate[] = [
  {
    id: "tpl-lead-qualification",
    name: "Qualificação de Leads",
    description: "Qualifica leads automaticamente via chat, capturando dados e enviando para o CRM.",
    category: "Vendas",
    icon: "🎯",
    tags: ["lead", "vendas", "crm"],
    nodes: [
      nd("s1", "Chat", "trigger", "💬", "Nova mensagem recebida", "#22c55e", { channel: "whatsapp" }, pos(50, 200), "trigger_chat"),
      nd("s2", "Agent", "processing", "🤖", "Qualifica o lead", "#6366f1", { model: "gemini-2.5-flash", temperature: 0.7 }, pos(350, 200), "agent"),
      nd("s3", "Condition", "logic", "🔀", "Lead qualificado?", "#f59e0b", { expression: '{{score}} >= 7' }, pos(650, 200), "condition"),
      nd("s4", "CRM", "integration", "💼", "Salva no CRM", "#8b5cf6", { provider: "hubspot", action: "create_lead" }, pos(950, 100), "integration_crm"),
      nd("s5", "Response", "output", "📤", "Envia resposta", "#06b6d4", { format: "text", template: "Lead qualificado!" }, pos(950, 300), "response"),
    ],
    edges: [
      ed("s1", "s2"), ed("s2", "s3"),
      ed("s3", "s4", "yes"), ed("s3", "s5", "no"),
    ],
  },
  {
    id: "tpl-customer-support",
    name: "Atendimento ao Cliente",
    description: "Fluxo de atendimento com IA que resolve dúvidas ou transfere para humano.",
    category: "Suporte",
    icon: "🛟",
    tags: ["sac", "suporte", "atendimento"],
    nodes: [
      nd("c1", "Chat", "trigger", "💬", "Nova mensagem", "#22c55e", { channel: "any" }, pos(50, 200), "trigger_chat"),
      nd("c2", "Agent", "processing", "🤖", "Analisa e responde", "#6366f1", { model: "gemini-2.5-flash", systemPrompt: "Você é um assistente de suporte." }, pos(350, 200), "agent"),
      nd("c3", "Evaluator", "logic", "📊", "Avalia qualidade", "#f59e0b", { criteria: "resolved" }, pos(650, 200), "evaluator"),
      nd("c4", "Response", "output", "📤", "Resposta final", "#06b6d4", { format: "text" }, pos(950, 100), "response"),
      nd("c5", "Human in the Loop", "control", "👤", "Escalar para humano", "#ec4899", { approvalMessage: "Caso não resolvido" }, pos(950, 300), "human_in_loop"),
    ],
    edges: [
      ed("c1", "c2"), ed("c2", "c3"),
      ed("c3", "c4", "yes"), ed("c3", "c5", "no"),
    ],
  },
  {
    id: "tpl-data-pipeline",
    name: "Pipeline de Dados",
    description: "Coleta dados via API, processa com código customizado e salva em planilha.",
    category: "Automação",
    icon: "🔄",
    tags: ["api", "dados", "automação"],
    nodes: [
      nd("d1", "Schedule", "trigger", "📅", "Executa diariamente", "#22c55e", { frequency: "daily", time: "08:00" }, pos(50, 200), "trigger_schedule"),
      nd("d2", "API", "processing", "🌐", "Busca dados externos", "#6366f1", { url: "https://api.example.com/data", method: "GET" }, pos(350, 200), "api"),
      nd("d3", "Function", "processing", "⚡", "Transforma dados", "#6366f1", { code: "return data.map(item => ({ ...item, processed: true }))" }, pos(650, 200), "function"),
      nd("d4", "Google Sheets", "integration", "📊", "Salva na planilha", "#8b5cf6", { spreadsheetId: "", range: "A1" }, pos(950, 200), "integration_sheets"),
    ],
    edges: [
      ed("d1", "d2"), ed("d2", "d3"), ed("d3", "d4"),
    ],
  },
  {
    id: "tpl-appointment",
    name: "Agendamento de Reunião",
    description: "Automatiza agendamento de reuniões com validação de horários.",
    category: "Produtividade",
    icon: "📅",
    tags: ["agendamento", "reunião", "calendário"],
    nodes: [
      nd("m1", "Chat", "trigger", "💬", "Pedido de reunião", "#22c55e", { channel: "any" }, pos(50, 200), "trigger_chat"),
      nd("m2", "Agent", "processing", "🤖", "Identifica necessidade", "#6366f1", { model: "gemini-2.5-flash", temperature: 0.5 }, pos(350, 200), "agent"),
      nd("m3", "Calendar", "integration", "📅", "Agenda no calendário", "#8b5cf6", { provider: "google_calendar", action: "create_event" }, pos(650, 200), "integration_calendar"),
      nd("m4", "Response", "output", "📤", "Confirma agendamento", "#06b6d4", { format: "text", template: "Reunião agendada ✅" }, pos(950, 200), "response"),
    ],
    edges: [
      ed("m1", "m2"), ed("m2", "m3"), ed("m3", "m4"),
    ],
  },
];
