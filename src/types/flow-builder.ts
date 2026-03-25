// ── Flow Builder Types ──

export type FlowNodeCategory = "trigger" | "action" | "condition" | "agent" | "integration" | "delay" | "message";

export interface FlowNodeData {
  label: string;
  category: FlowNodeCategory;
  icon: string;
  description: string;
  config: Record<string, unknown>;
  color: string;
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
  { key: "trigger", label: "Gatilhos", color: "hsl(142, 71%, 45%)" },
  { key: "condition", label: "Condições", color: "hsl(45, 93%, 47%)" },
  { key: "message", label: "Mensagens", color: "hsl(217, 91%, 60%)" },
  { key: "action", label: "Ações", color: "hsl(262, 83%, 58%)" },
  { key: "agent", label: "Agentes IA", color: "hsl(330, 81%, 60%)" },
  { key: "integration", label: "Integrações", color: "hsl(199, 89%, 48%)" },
  { key: "delay", label: "Tempo", color: "hsl(25, 95%, 53%)" },
];

export const NODE_TEMPLATES: NodeTemplate[] = [
  // Triggers
  { type: "trigger_message", label: "Mensagem recebida", category: "trigger", icon: "💬", description: "Inicia quando uma mensagem é recebida", color: "hsl(142, 71%, 45%)", defaultConfig: { channel: "any", keyword: "" } },
  { type: "trigger_webhook", label: "Webhook", category: "trigger", icon: "🔗", description: "Inicia via chamada de API externa", color: "hsl(142, 71%, 45%)", defaultConfig: { url: "", method: "POST" } },
  { type: "trigger_schedule", label: "Agendamento", category: "trigger", icon: "⏰", description: "Inicia em horário programado", color: "hsl(142, 71%, 45%)", defaultConfig: { cron: "", timezone: "America/Sao_Paulo" } },
  { type: "trigger_event", label: "Evento", category: "trigger", icon: "⚡", description: "Inicia quando um evento ocorre", color: "hsl(142, 71%, 45%)", defaultConfig: { event: "" } },
  { type: "trigger_form", label: "Formulário", category: "trigger", icon: "📋", description: "Inicia ao submeter um formulário", color: "hsl(142, 71%, 45%)", defaultConfig: { formId: "" } },

  // Conditions
  { type: "condition_if", label: "Se / Senão", category: "condition", icon: "🔀", description: "Direciona o fluxo com base em condições", color: "hsl(45, 93%, 47%)", defaultConfig: { conditions: [] } },
  { type: "condition_switch", label: "Switch", category: "condition", icon: "🔄", description: "Múltiplas rotas baseadas em valor", color: "hsl(45, 93%, 47%)", defaultConfig: { variable: "", cases: [] } },
  { type: "condition_ab", label: "Teste A/B", category: "condition", icon: "🎯", description: "Divide tráfego aleatoriamente", color: "hsl(45, 93%, 47%)", defaultConfig: { splitPercentage: 50 } },

  // Messages
  { type: "message_text", label: "Enviar texto", category: "message", icon: "✉️", description: "Envia uma mensagem de texto", color: "hsl(217, 91%, 60%)", defaultConfig: { text: "", buttons: [] } },
  { type: "message_image", label: "Enviar imagem", category: "message", icon: "🖼️", description: "Envia uma imagem", color: "hsl(217, 91%, 60%)", defaultConfig: { imageUrl: "", caption: "" } },
  { type: "message_carousel", label: "Carrossel", category: "message", icon: "🎠", description: "Envia um carrossel de cards", color: "hsl(217, 91%, 60%)", defaultConfig: { cards: [] } },
  { type: "message_input", label: "Capturar entrada", category: "message", icon: "📝", description: "Pede e salva entrada do usuário", color: "hsl(217, 91%, 60%)", defaultConfig: { variable: "", validation: "text" } },
  { type: "message_buttons", label: "Botões", category: "message", icon: "🔘", description: "Envia opções com botões", color: "hsl(217, 91%, 60%)", defaultConfig: { text: "", buttons: [] } },
  { type: "message_list", label: "Lista", category: "message", icon: "📃", description: "Envia uma lista de opções", color: "hsl(217, 91%, 60%)", defaultConfig: { title: "", items: [] } },

  // Actions
  { type: "action_tag", label: "Adicionar tag", category: "action", icon: "🏷️", description: "Adiciona tag ao contato", color: "hsl(262, 83%, 58%)", defaultConfig: { tag: "" } },
  { type: "action_variable", label: "Definir variável", category: "action", icon: "📊", description: "Define valor de uma variável", color: "hsl(262, 83%, 58%)", defaultConfig: { variable: "", value: "" } },
  { type: "action_http", label: "Requisição HTTP", category: "action", icon: "🌐", description: "Faz chamada HTTP externa", color: "hsl(262, 83%, 58%)", defaultConfig: { url: "", method: "GET", headers: {}, body: "" } },
  { type: "action_email", label: "Enviar email", category: "action", icon: "📧", description: "Envia um email", color: "hsl(262, 83%, 58%)", defaultConfig: { to: "", subject: "", body: "" } },
  { type: "action_transfer", label: "Transferir humano", category: "action", icon: "👤", description: "Transfere para atendente humano", color: "hsl(262, 83%, 58%)", defaultConfig: { department: "" } },
  { type: "action_end", label: "Encerrar conversa", category: "action", icon: "🛑", description: "Encerra a conversa", color: "hsl(262, 83%, 58%)", defaultConfig: {} },

  // Agent
  { type: "agent_ai", label: "Agente IA", category: "agent", icon: "🤖", description: "Processa com agente IA configurado", color: "hsl(330, 81%, 60%)", defaultConfig: { agentId: "", model: "", temperature: 0.7 } },
  { type: "agent_intent", label: "Detectar intenção", category: "agent", icon: "🧠", description: "Classifica intenção do usuário", color: "hsl(330, 81%, 60%)", defaultConfig: { intents: [] } },
  { type: "agent_sentiment", label: "Análise de sentimento", category: "agent", icon: "😊", description: "Analisa sentimento da mensagem", color: "hsl(330, 81%, 60%)", defaultConfig: {} },
  { type: "agent_knowledge", label: "Base de conhecimento", category: "agent", icon: "📚", description: "Consulta base de conhecimento", color: "hsl(330, 81%, 60%)", defaultConfig: { knowledgeBaseId: "" } },

  // Integration
  { type: "integration_crm", label: "CRM", category: "integration", icon: "💼", description: "Cria/atualiza lead no CRM", color: "hsl(199, 89%, 48%)", defaultConfig: { provider: "", action: "create_lead" } },
  { type: "integration_calendar", label: "Agenda", category: "integration", icon: "📅", description: "Cria evento na agenda", color: "hsl(199, 89%, 48%)", defaultConfig: { provider: "google_calendar", action: "create_event" } },
  { type: "integration_whatsapp", label: "WhatsApp", category: "integration", icon: "📱", description: "Envia mensagem via WhatsApp", color: "hsl(199, 89%, 48%)", defaultConfig: { template: "", phone: "" } },
  { type: "integration_sheets", label: "Google Sheets", category: "integration", icon: "📊", description: "Adiciona dados em planilha", color: "hsl(199, 89%, 48%)", defaultConfig: { spreadsheetId: "", range: "" } },
  { type: "integration_zapier", label: "Zapier", category: "integration", icon: "⚡", description: "Dispara ação no Zapier", color: "hsl(199, 89%, 48%)", defaultConfig: { webhookUrl: "" } },

  // Delay
  { type: "delay_wait", label: "Aguardar", category: "delay", icon: "⏳", description: "Aguarda um tempo antes de continuar", color: "hsl(25, 95%, 53%)", defaultConfig: { duration: 5, unit: "seconds" } },
  { type: "delay_schedule", label: "Aguardar até", category: "delay", icon: "📆", description: "Aguarda até data/hora específica", color: "hsl(25, 95%, 53%)", defaultConfig: { datetime: "" } },
];

export interface SavedFlow {
  id: string;
  name: string;
  description: string;
  status: "draft" | "active" | "paused";
  nodes: unknown[];
  edges: unknown[];
  createdAt: string;
  updatedAt: string;
}
