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

// ── Flow Templates (prebuilt flows) ──

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

const nd = (id: string, label: string, category: FlowNodeCategory, icon: string, desc: string, color: string, cfg: Record<string, unknown>, p: { x: number; y: number }) => ({
  id,
  type: "flowNode",
  position: p,
  data: { label, category, icon, description: desc, config: cfg, color } as FlowNodeData,
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
    description: "Qualifica leads automaticamente via WhatsApp, capturando dados e enviando para o CRM.",
    category: "Vendas",
    icon: "🎯",
    tags: ["lead", "vendas", "whatsapp", "crm"],
    nodes: [
      nd("s1", "Mensagem recebida", "trigger", "💬", "Nova mensagem no WhatsApp", "hsl(142,71%,45%)", { channel: "whatsapp" }, pos(50, 200)),
      nd("s2", "Boas-vindas", "message", "✉️", "Envia saudação", "hsl(217,91%,60%)", { text: "Olá! 👋 Como posso ajudar?" }, pos(300, 200)),
      nd("s3", "Capturar nome", "message", "📝", "Pede o nome", "hsl(217,91%,60%)", { variable: "nome", validation: "text" }, pos(550, 200)),
      nd("s4", "Capturar email", "message", "📝", "Pede o email", "hsl(217,91%,60%)", { variable: "email", validation: "email" }, pos(800, 200)),
      nd("s5", "Agente IA", "agent", "🤖", "Qualifica o lead", "hsl(330,81%,60%)", { agentId: "sdr", temperature: 0.7 }, pos(1050, 200)),
      nd("s6", "É qualificado?", "condition", "🔀", "Verifica score", "hsl(45,93%,47%)", { expression: '{{score}} >= 7' }, pos(1300, 200)),
      nd("s7", "Criar lead CRM", "integration", "💼", "Salva no CRM", "hsl(199,89%,48%)", { provider: "hubspot", action: "create_lead" }, pos(1550, 100)),
      nd("s8", "Transferir humano", "action", "👤", "Passa para vendedor", "hsl(262,83%,58%)", { department: "vendas" }, pos(1800, 100)),
      nd("s9", "Enviar conteúdo", "message", "✉️", "Envia material educativo", "hsl(217,91%,60%)", { text: "Enquanto isso, confira nosso material..." }, pos(1550, 320)),
    ],
    edges: [
      ed("s1", "s2"), ed("s2", "s3"), ed("s3", "s4"), ed("s4", "s5"), ed("s5", "s6"),
      ed("s6", "s7", "yes"), ed("s6", "s9", "no"), ed("s7", "s8"),
    ],
  },
  {
    id: "tpl-customer-support",
    name: "Atendimento ao Cliente (SAC)",
    description: "Fluxo de atendimento com IA que resolve dúvidas ou transfere para humano.",
    category: "Suporte",
    icon: "🛟",
    tags: ["sac", "suporte", "atendimento", "ia"],
    nodes: [
      nd("c1", "Mensagem recebida", "trigger", "💬", "Nova mensagem", "hsl(142,71%,45%)", { channel: "any" }, pos(50, 200)),
      nd("c2", "Detectar intenção", "agent", "🧠", "Classifica assunto", "hsl(330,81%,60%)", { intents: ["duvida", "reclamacao", "elogio"] }, pos(300, 200)),
      nd("c3", "Base de conhecimento", "agent", "📚", "Busca resposta", "hsl(330,81%,60%)", { knowledgeBaseId: "" }, pos(550, 200)),
      nd("c4", "Resolveu?", "condition", "🔀", "IA resolveu?", "hsl(45,93%,47%)", { expression: '{{resolved}} == true' }, pos(800, 200)),
      nd("c5", "Enviar resposta", "message", "✉️", "Resposta automática", "hsl(217,91%,60%)", { text: "{{ai_response}}" }, pos(1050, 100)),
      nd("c6", "Transferir humano", "action", "👤", "Atendente humano", "hsl(262,83%,58%)", { department: "suporte" }, pos(1050, 320)),
      nd("c7", "Pesquisa satisfação", "message", "📝", "Avalia atendimento", "hsl(217,91%,60%)", { variable: "satisfacao", validation: "number" }, pos(1300, 200)),
    ],
    edges: [
      ed("c1", "c2"), ed("c2", "c3"), ed("c3", "c4"),
      ed("c4", "c5", "yes"), ed("c4", "c6", "no"),
      ed("c5", "c7"), ed("c6", "c7"),
    ],
  },
  {
    id: "tpl-onboarding",
    name: "Onboarding de Clientes",
    description: "Guia novos clientes passo a passo após a compra.",
    category: "Sucesso do Cliente",
    icon: "🚀",
    tags: ["onboarding", "cliente", "boas-vindas"],
    nodes: [
      nd("o1", "Novo cliente", "trigger", "⚡", "Evento de compra", "hsl(142,71%,45%)", { event: "purchase_completed" }, pos(50, 200)),
      nd("o2", "Email boas-vindas", "action", "📧", "Envia email de boas-vindas", "hsl(262,83%,58%)", { to: "{{email}}", subject: "Bem-vindo!", body: "" }, pos(300, 200)),
      nd("o3", "Aguardar 1 dia", "delay", "⏳", "Espera 24h", "hsl(25,95%,53%)", { duration: 1, unit: "days" }, pos(550, 200)),
      nd("o4", "WhatsApp tutorial", "integration", "📱", "Envia tutorial via WhatsApp", "hsl(199,89%,48%)", { template: "onboarding_tutorial" }, pos(800, 200)),
      nd("o5", "Aguardar 3 dias", "delay", "⏳", "Espera 3 dias", "hsl(25,95%,53%)", { duration: 3, unit: "days" }, pos(1050, 200)),
      nd("o6", "Check-in IA", "agent", "🤖", "IA verifica satisfação", "hsl(330,81%,60%)", { agentId: "cs", temperature: 0.5 }, pos(1300, 200)),
    ],
    edges: [
      ed("o1", "o2"), ed("o2", "o3"), ed("o3", "o4"), ed("o4", "o5"), ed("o5", "o6"),
    ],
  },
  {
    id: "tpl-abandoned-cart",
    name: "Carrinho Abandonado",
    description: "Recupera vendas de carrinhos abandonados com mensagens automáticas.",
    category: "E-commerce",
    icon: "🛒",
    tags: ["ecommerce", "carrinho", "recuperação", "vendas"],
    nodes: [
      nd("a1", "Carrinho abandonado", "trigger", "⚡", "Evento de abandono", "hsl(142,71%,45%)", { event: "cart_abandoned" }, pos(50, 200)),
      nd("a2", "Aguardar 30min", "delay", "⏳", "Espera 30 min", "hsl(25,95%,53%)", { duration: 30, unit: "minutes" }, pos(300, 200)),
      nd("a3", "Lembrete WhatsApp", "message", "✉️", "Lembra do carrinho", "hsl(217,91%,60%)", { text: "Ei {{nome}}, você esqueceu itens no carrinho! 🛒" }, pos(550, 200)),
      nd("a4", "Aguardar 1 dia", "delay", "⏳", "Espera 1 dia", "hsl(25,95%,53%)", { duration: 1, unit: "days" }, pos(800, 200)),
      nd("a5", "Comprou?", "condition", "🔀", "Verificar status", "hsl(45,93%,47%)", { expression: '{{purchased}} == true' }, pos(1050, 200)),
      nd("a6", "Encerrar", "action", "🛑", "Fim do fluxo", "hsl(262,83%,58%)", {}, pos(1300, 100)),
      nd("a7", "Oferecer desconto", "message", "✉️", "Cupom de desconto", "hsl(217,91%,60%)", { text: "Use o cupom VOLTE10 e ganhe 10% off! 🎉" }, pos(1300, 320)),
    ],
    edges: [
      ed("a1", "a2"), ed("a2", "a3"), ed("a3", "a4"), ed("a4", "a5"),
      ed("a5", "a6", "yes"), ed("a5", "a7", "no"),
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
      nd("m1", "Mensagem recebida", "trigger", "💬", "Pedido de reunião", "hsl(142,71%,45%)", { channel: "any", keyword: "agendar" }, pos(50, 200)),
      nd("m2", "Agente IA", "agent", "🤖", "Identifica necessidade", "hsl(330,81%,60%)", { agentId: "sdr", temperature: 0.5 }, pos(300, 200)),
      nd("m3", "Capturar data", "message", "📝", "Pede data preferida", "hsl(217,91%,60%)", { variable: "data_reuniao", validation: "text" }, pos(550, 200)),
      nd("m4", "Criar evento", "integration", "📅", "Agenda no Google Calendar", "hsl(199,89%,48%)", { provider: "google_calendar", action: "create_event" }, pos(800, 200)),
      nd("m5", "Confirmação", "message", "✉️", "Confirma o agendamento", "hsl(217,91%,60%)", { text: "Reunião agendada para {{data_reuniao}} ✅" }, pos(1050, 200)),
    ],
    edges: [
      ed("m1", "m2"), ed("m2", "m3"), ed("m3", "m4"), ed("m4", "m5"),
    ],
  },
  {
    id: "tpl-nps-survey",
    name: "Pesquisa NPS",
    description: "Coleta NPS automaticamente e encaminha feedbacks negativos.",
    category: "Sucesso do Cliente",
    icon: "⭐",
    tags: ["nps", "pesquisa", "feedback", "satisfação"],
    nodes: [
      nd("n1", "Agendamento", "trigger", "⏰", "Dispara periodicamente", "hsl(142,71%,45%)", { cron: "0 10 * * 1" }, pos(50, 200)),
      nd("n2", "Enviar NPS", "message", "📝", "Pergunta de 0-10", "hsl(217,91%,60%)", { variable: "nps_score", validation: "number" }, pos(300, 200)),
      nd("n3", "Análise sentimento", "agent", "😊", "Analisa a nota", "hsl(330,81%,60%)", {}, pos(550, 200)),
      nd("n4", "Score >= 9?", "condition", "🔀", "Promotor?", "hsl(45,93%,47%)", { expression: '{{nps_score}} >= 9' }, pos(800, 200)),
      nd("n5", "Agradecer", "message", "✉️", "Agradece o feedback", "hsl(217,91%,60%)", { text: "Obrigado pelo feedback! 🎉" }, pos(1050, 100)),
      nd("n6", "Salvar planilha", "integration", "📊", "Registra no Sheets", "hsl(199,89%,48%)", { spreadsheetId: "", range: "NPS!A:C" }, pos(1300, 100)),
      nd("n7", "Alerta equipe", "action", "👤", "Notifica CS", "hsl(262,83%,58%)", { department: "cs" }, pos(1050, 320)),
    ],
    edges: [
      ed("n1", "n2"), ed("n2", "n3"), ed("n3", "n4"),
      ed("n4", "n5", "yes"), ed("n4", "n7", "no"),
      ed("n5", "n6"),
    ],
  },
];
