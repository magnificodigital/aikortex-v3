// ── Flow Builder Types – Full 10-Category Block System ──

export type FlowNodeCategory =
  | "trigger"
  | "processing"
  | "logic"
  | "control"
  | "output"
  | "integration"
  | "data_capture"
  | "crm_actions"
  | "knowledge"
  | "database"
  | "dev_advanced";

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
  { key: "data_capture", label: "Data Capture", color: "#10b981" },
  { key: "crm_actions", label: "CRM Actions", color: "#f97316" },
  { key: "knowledge", label: "Knowledge / IA", color: "#a855f7" },
  { key: "database", label: "Database", color: "#3b82f6" },
  { key: "dev_advanced", label: "Dev / Advanced", color: "#64748b" },
];

export const NODE_TEMPLATES: NodeTemplate[] = [
  // ── Triggers ──
  { type: "trigger_chat", label: "Chat", category: "trigger", icon: "💬", description: "Starts when a chat message is received", color: "#22c55e", defaultConfig: { channel: "any" } },
  { type: "trigger_webhook", label: "Webhook", category: "trigger", icon: "🔗", description: "Starts via external API call", color: "#22c55e", defaultConfig: { method: "POST" } },
  { type: "trigger_schedule", label: "Schedule", category: "trigger", icon: "📅", description: "Starts on a cron schedule", color: "#22c55e", defaultConfig: { frequency: "daily", time: "09:00" } },
  { type: "trigger_form", label: "Input Form", category: "trigger", icon: "📋", description: "Starts with form input fields", color: "#22c55e", defaultConfig: { fields: [] } },
  { type: "trigger_new_lead", label: "Novo Lead", category: "trigger", icon: "🎯", description: "Triggered when a new lead is created", color: "#22c55e", defaultConfig: { source: "any" } },
  { type: "trigger_new_message", label: "Nova Mensagem", category: "trigger", icon: "✉️", description: "Triggered by a new message", color: "#22c55e", defaultConfig: { channel: "any" } },
  { type: "trigger_crm_event", label: "Evento CRM", category: "trigger", icon: "📊", description: "Triggered by a CRM event", color: "#22c55e", defaultConfig: { event: "deal_updated" } },
  { type: "trigger_new_contact", label: "Novo Contato", category: "trigger", icon: "👤", description: "Triggered when a new contact is added", color: "#22c55e", defaultConfig: {} },
  { type: "trigger_stage_change", label: "Mudança de Etapa", category: "trigger", icon: "🔄", description: "Triggered when a pipeline stage changes", color: "#22c55e", defaultConfig: { pipeline: "" } },
  { type: "trigger_manual", label: "Trigger Manual", category: "trigger", icon: "🖱️", description: "Manually triggered by the user", color: "#22c55e", defaultConfig: {} },

  // ── Processing ──
  { type: "agent_ai", label: "Agente IA", category: "processing", icon: "🧠", description: "Converse com modelos de IA configurados", color: "#6366f1", defaultConfig: { agentType: "", agentId: "", model: "gemini-2.5-flash", temperature: 0.7, systemPrompt: "" } },
  { type: "function", label: "Function", category: "processing", icon: "⚡", description: "Run custom JavaScript/TypeScript code", color: "#6366f1", defaultConfig: { code: "", language: "javascript" } },
  { type: "api", label: "API Request", category: "processing", icon: "🌐", description: "Connect to external services via HTTP", color: "#6366f1", defaultConfig: { url: "", method: "GET", headers: {}, body: "" } },
  { type: "prompt", label: "Prompt", category: "processing", icon: "📝", description: "Send a structured prompt to an AI model", color: "#6366f1", defaultConfig: { model: "gemini-2.5-flash", prompt: "", temperature: 0.7 } },
  { type: "text_parser", label: "Text Parser", category: "processing", icon: "🔍", description: "Extract structured data from text", color: "#6366f1", defaultConfig: { pattern: "", format: "json" } },
  { type: "data_extractor", label: "Data Extractor", category: "processing", icon: "📦", description: "Extract specific fields from input data", color: "#6366f1", defaultConfig: { fields: "" } },
  { type: "intent_classifier", label: "Intent Classifier", category: "processing", icon: "🏷️", description: "Classify user intent using AI", color: "#6366f1", defaultConfig: { model: "gemini-2.5-flash", intents: "" } },
  { type: "summarizer", label: "Summarizer", category: "processing", icon: "📄", description: "Summarize long text using AI", color: "#6366f1", defaultConfig: { model: "gemini-2.5-flash", maxLength: 200 } },
  { type: "enrichment", label: "Enrichment", category: "processing", icon: "✨", description: "Enrich data with additional information", color: "#6366f1", defaultConfig: { source: "api", fields: "" } },
  { type: "validator", label: "Validator", category: "processing", icon: "✅", description: "Validate data against rules", color: "#6366f1", defaultConfig: { rules: "" } },
  { type: "json_formatter", label: "JSON Formatter", category: "processing", icon: "{ }", description: "Format and transform JSON data", color: "#6366f1", defaultConfig: { template: "" } },

  // ── Logic ──
  { type: "condition", label: "If / Else", category: "logic", icon: "🔀", description: "Branch paths based on boolean expressions", color: "#f59e0b", defaultConfig: { expression: "" } },
  { type: "switch_block", label: "Switch", category: "logic", icon: "🔃", description: "Multi-way branching based on value", color: "#f59e0b", defaultConfig: { variable: "", cases: "" } },
  { type: "router", label: "Router", category: "logic", icon: "🧭", description: "AI-powered intelligent routing", color: "#f59e0b", defaultConfig: { model: "gemini-2.5-flash", routes: [] } },
  { type: "evaluator", label: "Evaluator", category: "logic", icon: "📊", description: "Score and assess content quality using AI", color: "#f59e0b", defaultConfig: { model: "gemini-2.5-flash", criteria: "" } },
  { type: "filter", label: "Filter", category: "logic", icon: "🔽", description: "Filter items based on conditions", color: "#f59e0b", defaultConfig: { condition: "" } },
  { type: "score_check", label: "Score Check", category: "logic", icon: "🎯", description: "Check if a score meets threshold", color: "#f59e0b", defaultConfig: { threshold: 7, operator: ">=" } },
  { type: "compare_values", label: "Compare Values", category: "logic", icon: "⚖️", description: "Compare two values", color: "#f59e0b", defaultConfig: { valueA: "", valueB: "", operator: "==" } },

  // ── Control Flow ──
  { type: "wait", label: "Wait / Delay", category: "control", icon: "⏳", description: "Pause execution for a specified time", color: "#ec4899", defaultConfig: { duration: 5, unit: "seconds" } },
  { type: "retry", label: "Retry", category: "control", icon: "🔁", description: "Retry on failure with configurable attempts", color: "#ec4899", defaultConfig: { maxRetries: 3, delayMs: 1000 } },
  { type: "loop", label: "Loop", category: "control", icon: "🔄", description: "Iterate over items in a list", color: "#ec4899", defaultConfig: { iterableVariable: "", maxIterations: 100 } },
  { type: "parallel", label: "Parallel", category: "control", icon: "⚙️", description: "Execute multiple branches simultaneously", color: "#ec4899", defaultConfig: { branches: 2 } },
  { type: "human_in_loop", label: "Human in the Loop", category: "control", icon: "👤", description: "Pause for human approval before continuing", color: "#ec4899", defaultConfig: { approvalMessage: "" } },
  { type: "variables", label: "Variables", category: "control", icon: "📦", description: "Set and manage workflow-scoped variables", color: "#ec4899", defaultConfig: { variable: "", value: "" } },
  { type: "guardrails", label: "Guardrails", category: "control", icon: "🛡️", description: "Validate and filter AI outputs", color: "#ec4899", defaultConfig: { rules: [] } },
  { type: "stop", label: "Stop", category: "control", icon: "🛑", description: "Stop flow execution", color: "#ec4899", defaultConfig: { reason: "" } },
  { type: "merge", label: "Merge", category: "control", icon: "🔗", description: "Merge multiple branches into one", color: "#ec4899", defaultConfig: {} },
  { type: "split", label: "Split", category: "control", icon: "✂️", description: "Split data into multiple paths", color: "#ec4899", defaultConfig: { splitBy: "" } },
  { type: "timeout", label: "Timeout", category: "control", icon: "⏰", description: "Set a timeout limit for the next step", color: "#ec4899", defaultConfig: { timeoutSeconds: 30 } },
  { type: "queue", label: "Queue", category: "control", icon: "📋", description: "Add task to a processing queue", color: "#ec4899", defaultConfig: { queueName: "" } },

  // ── Output ──
  { type: "response", label: "Response", category: "output", icon: "📤", description: "Format and return final workflow results", color: "#06b6d4", defaultConfig: { format: "json", template: "" } },
  { type: "send_message", label: "Send Message", category: "output", icon: "💬", description: "Send a message to the user", color: "#06b6d4", defaultConfig: { message: "" } },
  { type: "send_email", label: "Send Email", category: "output", icon: "📧", description: "Send an email", color: "#06b6d4", defaultConfig: { to: "", subject: "", body: "" } },
  { type: "send_whatsapp", label: "Send WhatsApp", category: "output", icon: "📱", description: "Send a WhatsApp message", color: "#06b6d4", defaultConfig: { phone: "", template: "" } },
  { type: "create_notification", label: "Notification", category: "output", icon: "🔔", description: "Create an internal notification", color: "#06b6d4", defaultConfig: { title: "", message: "" } },
  { type: "generate_response", label: "Generate Response", category: "output", icon: "✍️", description: "Generate a dynamic AI response", color: "#06b6d4", defaultConfig: { model: "gemini-2.5-flash", prompt: "" } },
  { type: "confirmation_message", label: "Confirmation", category: "output", icon: "✅", description: "Send a confirmation message", color: "#06b6d4", defaultConfig: { message: "Ação concluída com sucesso!" } },

  // ── Data Capture ──
  { type: "capture_name", label: "Capturar Nome", category: "data_capture", icon: "👤", description: "Ask and capture the user's name", color: "#10b981", defaultConfig: { prompt: "Qual é o seu nome?", variable: "name", required: true } },
  { type: "capture_email", label: "Capturar E-mail", category: "data_capture", icon: "📧", description: "Ask and capture e-mail with validation", color: "#10b981", defaultConfig: { prompt: "Qual é o seu e-mail?", variable: "email", required: true } },
  { type: "capture_phone", label: "Capturar Telefone", category: "data_capture", icon: "📞", description: "Ask and capture phone number", color: "#10b981", defaultConfig: { prompt: "Qual é o seu telefone?", variable: "phone", required: true } },
  { type: "capture_company", label: "Capturar Empresa", category: "data_capture", icon: "🏢", description: "Ask and capture company name", color: "#10b981", defaultConfig: { prompt: "Qual é a sua empresa?", variable: "company", required: false } },
  { type: "capture_role", label: "Capturar Cargo", category: "data_capture", icon: "💼", description: "Ask and capture job title", color: "#10b981", defaultConfig: { prompt: "Qual é o seu cargo?", variable: "role", required: false } },
  { type: "capture_budget", label: "Capturar Orçamento", category: "data_capture", icon: "💰", description: "Ask and capture budget range", color: "#10b981", defaultConfig: { prompt: "Qual é o seu orçamento?", variable: "budget", required: false } },
  { type: "capture_interest", label: "Capturar Interesse", category: "data_capture", icon: "⭐", description: "Ask and capture the user's interest", color: "#10b981", defaultConfig: { prompt: "O que você procura?", variable: "interest", required: true } },
  { type: "capture_need", label: "Capturar Necessidade", category: "data_capture", icon: "❓", description: "Ask and capture pain points / needs", color: "#10b981", defaultConfig: { prompt: "Qual sua principal necessidade?", variable: "need", required: true } },
  { type: "capture_document", label: "Capturar Documento", category: "data_capture", icon: "📄", description: "Ask user to upload a document", color: "#10b981", defaultConfig: { prompt: "Envie o documento", variable: "document", fileTypes: "pdf,docx" } },
  { type: "capture_open", label: "Resposta Aberta", category: "data_capture", icon: "💭", description: "Capture a free-text response", color: "#10b981", defaultConfig: { prompt: "Conte mais sobre...", variable: "open_response", required: true } },

  // ── CRM Actions ──
  { type: "crm_create_lead", label: "Criar Lead", category: "crm_actions", icon: "➕", description: "Create a new lead in the CRM", color: "#f97316", defaultConfig: { provider: "internal", name: "", email: "" } },
  { type: "crm_update_lead", label: "Atualizar Lead", category: "crm_actions", icon: "✏️", description: "Update an existing lead", color: "#f97316", defaultConfig: { leadId: "", fields: "" } },
  { type: "crm_create_opportunity", label: "Criar Oportunidade", category: "crm_actions", icon: "🎯", description: "Create a new sales opportunity", color: "#f97316", defaultConfig: { title: "", value: 0, stage: "new" } },
  { type: "crm_move_stage", label: "Mover Etapa", category: "crm_actions", icon: "➡️", description: "Move a deal to a different stage", color: "#f97316", defaultConfig: { dealId: "", targetStage: "" } },
  { type: "crm_create_task", label: "Criar Tarefa", category: "crm_actions", icon: "📝", description: "Create a follow-up task", color: "#f97316", defaultConfig: { title: "", assignee: "", dueDate: "" } },
  { type: "crm_register_interaction", label: "Registrar Interação", category: "crm_actions", icon: "📋", description: "Log an interaction with a lead/contact", color: "#f97316", defaultConfig: { type: "call", notes: "" } },
  { type: "crm_update_score", label: "Atualizar Score", category: "crm_actions", icon: "📈", description: "Update lead scoring", color: "#f97316", defaultConfig: { leadId: "", scoreChange: 0 } },
  { type: "crm_add_tag", label: "Adicionar Tag", category: "crm_actions", icon: "🏷️", description: "Add a tag to a lead or contact", color: "#f97316", defaultConfig: { tag: "" } },
  { type: "crm_assign_owner", label: "Atribuir Responsável", category: "crm_actions", icon: "👥", description: "Assign a lead to a team member", color: "#f97316", defaultConfig: { ownerId: "" } },
  { type: "crm_create_followup", label: "Criar Follow-up", category: "crm_actions", icon: "🔔", description: "Schedule a follow-up action", color: "#f97316", defaultConfig: { type: "email", delay: "24h", message: "" } },

  // ── Knowledge / IA ──
  { type: "knowledge_search", label: "Consultar Base", category: "knowledge", icon: "📚", description: "Search the knowledge base", color: "#a855f7", defaultConfig: { query: "", maxResults: 5 } },
  { type: "rag_search", label: "RAG Search", category: "knowledge", icon: "🔎", description: "Retrieval-Augmented Generation search", color: "#a855f7", defaultConfig: { query: "", collection: "", topK: 5 } },
  { type: "context_injection", label: "Context Injection", category: "knowledge", icon: "💉", description: "Inject context into AI prompts", color: "#a855f7", defaultConfig: { context: "" } },
  { type: "memory_lookup", label: "Memory Lookup", category: "knowledge", icon: "🧠", description: "Look up conversation memory", color: "#a855f7", defaultConfig: { userId: "", lookbackMessages: 10 } },
  { type: "similarity_search", label: "Similarity Search", category: "knowledge", icon: "🔗", description: "Find similar documents/items", color: "#a855f7", defaultConfig: { input: "", threshold: 0.8 } },
  { type: "agent_memory", label: "Agent Memory", category: "knowledge", icon: "💾", description: "Store and retrieve agent memory", color: "#a855f7", defaultConfig: { action: "store", key: "", value: "" } },
  { type: "doc_search", label: "Buscar Documento", category: "knowledge", icon: "📑", description: "Search for a specific document", color: "#a855f7", defaultConfig: { query: "", fileType: "any" } },

  // ── Database / Storage ──
  { type: "db_create_record", label: "Create Record", category: "database", icon: "➕", description: "Create a new database record", color: "#3b82f6", defaultConfig: { table: "", data: "" } },
  { type: "db_update_record", label: "Update Record", category: "database", icon: "✏️", description: "Update an existing record", color: "#3b82f6", defaultConfig: { table: "", recordId: "", data: "" } },
  { type: "db_find_record", label: "Find Record", category: "database", icon: "🔍", description: "Search for records in a table", color: "#3b82f6", defaultConfig: { table: "", filter: "" } },
  { type: "db_delete_record", label: "Delete Record", category: "database", icon: "🗑️", description: "Delete a database record", color: "#3b82f6", defaultConfig: { table: "", recordId: "" } },
  { type: "db_save_variable", label: "Save Variable", category: "database", icon: "💾", description: "Persist a variable to storage", color: "#3b82f6", defaultConfig: { key: "", value: "" } },
  { type: "db_load_variable", label: "Load Variable", category: "database", icon: "📥", description: "Load a variable from storage", color: "#3b82f6", defaultConfig: { key: "" } },
  { type: "db_query", label: "Query Database", category: "database", icon: "🗃️", description: "Run a custom database query", color: "#3b82f6", defaultConfig: { query: "" } },
  { type: "db_save_conversation", label: "Save Conversation", category: "database", icon: "💬", description: "Save the current conversation", color: "#3b82f6", defaultConfig: { conversationId: "" } },

  // ── Dev / Advanced ──
  { type: "run_code", label: "Run Code", category: "dev_advanced", icon: "💻", description: "Execute custom code", color: "#64748b", defaultConfig: { language: "javascript", code: "" } },
  { type: "custom_function", label: "Custom Function", category: "dev_advanced", icon: "🔧", description: "Call a custom serverless function", color: "#64748b", defaultConfig: { functionName: "", params: "" } },
  { type: "json_editor", label: "JSON Editor", category: "dev_advanced", icon: "{ }", description: "Edit and transform JSON", color: "#64748b", defaultConfig: { input: "", transform: "" } },
  { type: "http_request", label: "HTTP Request", category: "dev_advanced", icon: "🌐", description: "Make an advanced HTTP request", color: "#64748b", defaultConfig: { url: "", method: "GET", headers: "", body: "", auth: "" } },
  { type: "webhook_response", label: "Webhook Response", category: "dev_advanced", icon: "↩️", description: "Send a response to a webhook caller", color: "#64748b", defaultConfig: { statusCode: 200, body: "" } },
  { type: "transform_payload", label: "Transform Payload", category: "dev_advanced", icon: "🔀", description: "Transform data between formats", color: "#64748b", defaultConfig: { inputFormat: "json", outputFormat: "json", mapping: "" } },
  { type: "data_mapping", label: "Data Mapping", category: "dev_advanced", icon: "🗺️", description: "Map fields between schemas", color: "#64748b", defaultConfig: { sourceFields: "", targetFields: "" } },
  { type: "script_executor", label: "Script Executor", category: "dev_advanced", icon: "▶️", description: "Execute a saved script", color: "#64748b", defaultConfig: { scriptId: "", args: "" } },

  // ── Legacy Integration ──
  { type: "integration_crm", label: "CRM", category: "integration", icon: "💼", description: "Create/update leads in CRM", color: "#8b5cf6", defaultConfig: { provider: "", action: "create_lead" } },
  { type: "integration_email", label: "Email", category: "integration", icon: "📧", description: "Send emails", color: "#8b5cf6", defaultConfig: { to: "", subject: "", body: "" } },
  { type: "integration_whatsapp", label: "WhatsApp", category: "integration", icon: "📱", description: "Send WhatsApp messages", color: "#8b5cf6", defaultConfig: { template: "", phone: "" } },
  { type: "integration_sheets", label: "Google Sheets", category: "integration", icon: "📊", description: "Read/write spreadsheet data", color: "#8b5cf6", defaultConfig: { spreadsheetId: "", range: "" } },
  { type: "integration_calendar", label: "Calendar", category: "integration", icon: "📅", description: "Create calendar events", color: "#8b5cf6", defaultConfig: { provider: "google_calendar", action: "create_event" } },
  { type: "integration_slack", label: "Slack", category: "integration", icon: "💬", description: "Send messages to Slack", color: "#8b5cf6", defaultConfig: { channel: "", message: "" } },
  { type: "integration_telegram", label: "Telegram", category: "integration", icon: "📨", description: "Send Telegram messages", color: "#8b5cf6", defaultConfig: { chatId: "", message: "" } },
  { type: "integration_hubspot", label: "HubSpot", category: "integration", icon: "🟠", description: "HubSpot CRM integration", color: "#8b5cf6", defaultConfig: { action: "create_contact" } },
  { type: "integration_pipedrive", label: "Pipedrive", category: "integration", icon: "🟢", description: "Pipedrive CRM integration", color: "#8b5cf6", defaultConfig: { action: "create_deal" } },
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
      nd("s2", "Agente IA", "processing", "🧠", "Qualifica o lead", "#6366f1", { agentType: "sdr", model: "gemini-2.5-flash", temperature: 0.7 }, pos(350, 200), "agent_ai"),
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
  {
    id: "tpl-sdr-inbound",
    name: "SDR Inbound",
    description: "Agente SDR que qualifica leads inbound automaticamente.",
    category: "Vendas",
    icon: "📞",
    tags: ["sdr", "inbound", "vendas"],
    nodes: [
      nd("si1", "Novo Lead", "trigger", "🎯", "Lead inbound recebido", "#22c55e", { source: "form" }, pos(50, 200), "trigger_new_lead"),
      nd("si2", "Capturar Nome", "data_capture", "👤", "Captura nome do lead", "#10b981", { prompt: "Qual o seu nome?", variable: "name" }, pos(350, 200), "capture_name"),
      nd("si3", "Capturar E-mail", "data_capture", "📧", "Captura e-mail", "#10b981", { prompt: "Qual seu e-mail?", variable: "email" }, pos(650, 200), "capture_email"),
      nd("si4", "Agente IA", "processing", "🧠", "SDR qualifica", "#6366f1", { agentType: "sdr", model: "gemini-2.5-flash" }, pos(950, 200), "agent_ai"),
      nd("si5", "Criar Lead", "crm_actions", "➕", "Cria lead no CRM", "#f97316", { provider: "internal" }, pos(1250, 200), "crm_create_lead"),
    ],
    edges: [ed("si1", "si2"), ed("si2", "si3"), ed("si3", "si4"), ed("si4", "si5")],
  },
  {
    id: "tpl-followup",
    name: "Follow-up Comercial",
    description: "Envia follow-ups automáticos para leads que não responderam.",
    category: "Vendas",
    icon: "🔔",
    tags: ["followup", "vendas", "reengajamento"],
    nodes: [
      nd("f1", "Schedule", "trigger", "📅", "Check diário", "#22c55e", { frequency: "daily", time: "10:00" }, pos(50, 200), "trigger_schedule"),
      nd("f2", "Find Record", "database", "🔍", "Busca leads sem resposta", "#3b82f6", { table: "leads", filter: "last_response > 48h" }, pos(350, 200), "db_find_record"),
      nd("f3", "Loop", "control", "🔄", "Para cada lead", "#ec4899", { iterableVariable: "leads" }, pos(650, 200), "loop"),
      nd("f4", "Send Email", "output", "📧", "Envia follow-up", "#06b6d4", { subject: "Ainda posso ajudar?" }, pos(950, 200), "send_email"),
    ],
    edges: [ed("f1", "f2"), ed("f2", "f3"), ed("f3", "f4")],
  },
  {
    id: "tpl-onboarding",
    name: "Onboarding de Cliente",
    description: "Fluxo de onboarding com coleta de dados e boas-vindas.",
    category: "Customer Success",
    icon: "🚀",
    tags: ["onboarding", "cs", "cliente"],
    nodes: [
      nd("o1", "Novo Contato", "trigger", "👤", "Novo cliente cadastrado", "#22c55e", {}, pos(50, 200), "trigger_new_contact"),
      nd("o2", "Send Message", "output", "💬", "Mensagem de boas-vindas", "#06b6d4", { message: "Bem-vindo!" }, pos(350, 200), "send_message"),
      nd("o3", "Capturar Necessidade", "data_capture", "❓", "O que precisa resolver?", "#10b981", { prompt: "Qual sua principal necessidade?", variable: "need" }, pos(650, 200), "capture_need"),
      nd("o4", "Criar Tarefa", "crm_actions", "📝", "Cria tarefa de setup", "#f97316", { title: "Setup do cliente" }, pos(950, 200), "crm_create_task"),
    ],
    edges: [ed("o1", "o2"), ed("o2", "o3"), ed("o3", "o4")],
  },
  {
    id: "tpl-faq",
    name: "FAQ Inteligente",
    description: "Responde perguntas frequentes usando base de conhecimento.",
    category: "Suporte",
    icon: "❓",
    tags: ["faq", "suporte", "knowledge"],
    nodes: [
      nd("fq1", "Chat", "trigger", "💬", "Pergunta recebida", "#22c55e", { channel: "any" }, pos(50, 200), "trigger_chat"),
      nd("fq2", "RAG Search", "knowledge", "🔎", "Busca na base", "#a855f7", { collection: "faq", topK: 3 }, pos(350, 200), "rag_search"),
      nd("fq3", "Agent", "processing", "🤖", "Gera resposta", "#6366f1", { model: "gemini-2.5-flash" }, pos(650, 200), "agent"),
      nd("fq4", "Response", "output", "📤", "Envia resposta", "#06b6d4", { format: "text" }, pos(950, 200), "response"),
    ],
    edges: [ed("fq1", "fq2"), ed("fq2", "fq3"), ed("fq3", "fq4")],
  },
];
