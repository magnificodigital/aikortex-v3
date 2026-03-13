// ── Agent Builder Wizard Types ──

export type WizardStep =
  | "agents"
  | "goal"
  | "context"
  | "analysis"
  | "conversation"
  | "qualification"
  | "profile"
  | "channels"
  | "crm"
  | "testing";

export const WIZARD_STEPS: { key: WizardStep; label: string; number: number }[] = [
  { key: "agents", label: "Agentes", number: 1 },
  { key: "goal", label: "Objetivo", number: 2 },
  { key: "context", label: "Empresa", number: 3 },
  { key: "analysis", label: "Análise", number: 4 },
  { key: "conversation", label: "Conversa", number: 5 },
  { key: "qualification", label: "Qualificação", number: 6 },
  { key: "profile", label: "Perfil", number: 7 },
  { key: "channels", label: "Canais", number: 8 },
  { key: "crm", label: "CRM", number: 9 },
  { key: "testing", label: "Teste", number: 10 },
];

// ── Data Types ──

export type AgentType = "SDR" | "BDR" | "SAC" | "CS";

export interface AgentRecommendation {
  id: string;
  type: AgentType;
  name: string;
  objective: string;
  targetAudience: string;
  benefits: string[];
  exampleConversation: { role: "customer" | "agent"; message: string }[];
  selected: boolean;
}

export const AGENT_TEMPLATES: AgentRecommendation[] = [
  {
    id: "sdr-1",
    type: "SDR",
    name: "Agente SDR",
    objective: "Qualificar leads inbound e coletar informações para agendar reuniões com o time comercial.",
    targetAudience: "Leads inbound interessados",
    benefits: [
      "Qualificação automática 24/7",
      "Redução de 60% no tempo de resposta",
      "Aumento de 35% na taxa de conversão",
    ],
    exampleConversation: [
      { role: "agent", message: "Olá! Vi que você demonstrou interesse. Posso te ajudar?" },
      { role: "customer", message: "Sim, gostaria de saber mais sobre os planos." },
    ],
    selected: false,
  },
  {
    id: "bdr-1",
    type: "BDR",
    name: "Agente BDR",
    objective: "Prospectar novos leads e gerar oportunidades de negócio através de abordagem outbound.",
    targetAudience: "Empresas-alvo para prospecção",
    benefits: [
      "Prospecção automatizada em escala",
      "Abordagem personalizada por segmento",
      "Pipeline de vendas sempre alimentado",
    ],
    exampleConversation: [
      { role: "agent", message: "Oi! Notei que sua empresa pode se beneficiar da nossa solução." },
      { role: "customer", message: "Interessante, como funciona?" },
    ],
    selected: false,
  },
  {
    id: "sac-1",
    type: "SAC",
    name: "Agente SAC",
    objective: "Atender clientes com dúvidas, resolver problemas e fornecer suporte baseado no conhecimento da empresa.",
    targetAudience: "Clientes ativos",
    benefits: [
      "Atendimento instantâneo 24/7",
      "Redução de 70% nos tickets",
      "Satisfação do cliente aumentada",
    ],
    exampleConversation: [
      { role: "customer", message: "Estou com dificuldade para acessar minha conta." },
      { role: "agent", message: "Vou te ajudar agora! Pode me informar o email cadastrado?" },
    ],
    selected: false,
  },
  {
    id: "cs-1",
    type: "CS",
    name: "Agente CS",
    objective: "Garantir o sucesso dos clientes, realizar follow-ups e coletar feedbacks.",
    targetAudience: "Clientes em onboarding e pós-venda",
    benefits: [
      "Onboarding automatizado",
      "Redução de churn em 40%",
      "Coleta contínua de feedback",
    ],
    exampleConversation: [
      { role: "agent", message: "Como tem sido sua experiência? Estou aqui para ajudar!" },
      { role: "customer", message: "Tenho dúvidas sobre uma funcionalidade." },
    ],
    selected: false,
  },
];

export interface BusinessContext {
  website: string;
  companyName: string;
  country: string;
  language: string;
  industry: string;
  mainProduct: string;
  averageTicket: string;
  mainSalesChannel: string;
  description: string;
}

export const INITIAL_CONTEXT: BusinessContext = {
  website: "",
  companyName: "",
  country: "Brasil",
  language: "Português",
  industry: "",
  mainProduct: "",
  averageTicket: "",
  mainSalesChannel: "",
  description: "",
};

export type AgentGoal =
  | "schedule_meetings"
  | "capture_leads"
  | "answer_questions"
  | "qualify_opportunities"
  | "support_customers";

export const AGENT_GOALS: { value: AgentGoal; label: string; description: string }[] = [
  { value: "schedule_meetings", label: "Agendar reuniões", description: "Qualificar e agendar reuniões com leads" },
  { value: "capture_leads", label: "Capturar leads", description: "Coletar informações de contato e interesse" },
  { value: "answer_questions", label: "Responder perguntas", description: "Atendimento e suporte ao cliente" },
  { value: "qualify_opportunities", label: "Qualificar oportunidades", description: "Identificar leads com potencial de compra" },
  { value: "support_customers", label: "Suporte a clientes", description: "Acompanhamento e sucesso do cliente" },
];

export interface ConversationStep {
  id: string;
  label: string;
  content: string;
}

export interface QualificationTier {
  id: string;
  name: string;
  description: string;
  color: string;
}

export const DEFAULT_QUALIFICATION_TIERS: QualificationTier[] = [
  { id: "passive", name: "Lead Passivo", description: "Interessado mas sem dor ou urgência clara.", color: "bg-muted text-muted-foreground" },
  { id: "not_target", name: "Não é Target", description: "Não se encaixa no perfil de cliente ideal.", color: "bg-destructive/10 text-destructive" },
  { id: "potential", name: "Cliente Potencial", description: "Mostra interesse mas sem budget ou timeline definidos.", color: "bg-warning/10 text-warning" },
  { id: "qualified", name: "Lead Qualificado", description: "Dor clara e alinhamento de budget.", color: "bg-info/10 text-info" },
  { id: "sal", name: "Sales Accepted Lead", description: "Totalmente qualificado e pronto para contato comercial.", color: "bg-success/10 text-success" },
];

export interface AgentProfile {
  persona: string;
  primaryGoal: string;
  conversationFlow: string;
  instructions: string;
  communicationStyle: string;
  safetyGuidelines: string;
  constraints: string;
}

export type DeployChannel = "whatsapp" | "instagram" | "messenger" | "website" | "email";

export const DEPLOY_CHANNELS: { value: DeployChannel; label: string; icon: string }[] = [
  { value: "whatsapp", label: "WhatsApp", icon: "📱" },
  { value: "instagram", label: "Instagram", icon: "📸" },
  { value: "messenger", label: "Messenger", icon: "💬" },
  { value: "website", label: "Website Chat", icon: "🌐" },
  { value: "email", label: "Email", icon: "📧" },
];

export type CRMProvider = "hubspot" | "pipedrive" | "zoho" | "salesforce" | "activecampaign" | "zendesk";

export const CRM_PROVIDERS: { value: CRMProvider; label: string }[] = [
  { value: "hubspot", label: "HubSpot" },
  { value: "pipedrive", label: "Pipedrive" },
  { value: "zoho", label: "Zoho CRM" },
  { value: "salesforce", label: "Salesforce" },
  { value: "activecampaign", label: "ActiveCampaign" },
  { value: "zendesk", label: "Zendesk Sell" },
];

export interface WizardState {
  step: WizardStep;
  context: BusinessContext;
  recommendations: AgentRecommendation[];
  selectedGoal: AgentGoal | null;
  conversationSteps: ConversationStep[];
  qualificationTiers: QualificationTier[];
  agentProfile: AgentProfile | null;
  selectedChannels: DeployChannel[];
  selectedCRM: CRMProvider | null;
}

// ── Mock generators ──

export function generateMockRecommendations(ctx: BusinessContext): AgentRecommendation[] {
  return AGENT_TEMPLATES.map((t) => ({
    ...t,
    name: `${t.type} Agent — ${ctx.companyName}`,
    targetAudience: t.type === "BDR" ? `Empresas do setor de ${ctx.industry}` : t.targetAudience,
    exampleConversation: [
      { role: "agent" as const, message: `Olá! Sou o assistente da ${ctx.companyName}. ${t.exampleConversation[0]?.message || ""}` },
      ...t.exampleConversation.slice(1),
    ],
  }));
}

export function generateMockConversation(ctx: BusinessContext, goal: AgentGoal): ConversationStep[] {
  return [
    { id: "1", label: "Saudação", content: `Olá! Sou o assistente virtual da ${ctx.companyName}. Posso te ajudar a conhecer mais sobre ${ctx.mainProduct}?` },
    { id: "2", label: "Descoberta", content: "Que ótimo! Para te recomendar a melhor solução, pode me contar um pouco sobre seu negócio e principais desafios?" },
    { id: "3", label: "Exploração de dor", content: "Entendo. E como isso impacta seus resultados hoje? Quanto tempo/dinheiro isso representa?" },
    { id: "4", label: "Proposta de valor", content: `Com ${ctx.mainProduct}, empresas como a sua conseguem resolver exatamente esse problema. Nossos clientes reportam resultados em menos de 30 dias.` },
    { id: "5", label: "Qualificação", content: "Para entender se faz sentido pra vocês, pode me dizer qual é o tamanho da sua equipe e o budget disponível para essa solução?" },
    { id: "6", label: "Objeções", content: "Entendo sua preocupação. Muitos dos nossos clientes tinham a mesma dúvida antes de começar. O que posso te garantir é que..." },
    { id: "7", label: "Fechamento", content: goal === "schedule_meetings"
      ? "Que tal agendarmos uma conversa rápida de 15 minutos com nosso especialista? Qual horário funciona melhor para você?"
      : "Posso enviar uma proposta personalizada para você avaliar? Qual o melhor email para receber?" },
  ];
}

export function generateMockProfile(ctx: BusinessContext, goal: AgentGoal): AgentProfile {
  return {
    persona: `Assistente virtual profissional da ${ctx.companyName}, especialista em ${ctx.industry}. Tom consultivo, amigável e direto.`,
    primaryGoal: AGENT_GOALS.find((g) => g.value === goal)?.description || "",
    conversationFlow: "Saudação → Descoberta → Qualificação → Proposta de Valor → Fechamento",
    instructions: `1. Sempre se apresentar como assistente da ${ctx.companyName}\n2. Focar em entender as necessidades do lead\n3. Qualificar usando critérios BANT\n4. Nunca prometer o que não pode cumprir\n5. Direcionar para próximo passo claro`,
    communicationStyle: `Profissional e consultivo. Linguagem em ${ctx.language}. Respostas curtas e objetivas. Uso de emojis moderado.`,
    safetyGuidelines: "Não compartilhar informações confidenciais. Não fazer promessas de resultados específicos. Encaminhar para humano em casos sensíveis.",
    constraints: `Horário: 24/7. Idioma: ${ctx.language}. Escopo: ${ctx.mainProduct}. Não discutir concorrentes.`,
  };
}
