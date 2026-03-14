// ── Agent Builder Wizard Types (Simplified 3-step flow) ──

export type WizardStep = "agent" | "context" | "launch";

export const WIZARD_STEPS: { key: WizardStep; label: string }[] = [
  { key: "agent", label: "Agente" },
  { key: "context", label: "Empresa" },
  { key: "launch", label: "Ativar" },
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
    objective: "Qualificar leads inbound e agendar reuniões com o time comercial.",
    targetAudience: "Leads inbound interessados",
    benefits: ["Qualificação 24/7", "60% menos tempo de resposta", "+35% conversão"],
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
    objective: "Prospectar leads e gerar oportunidades via abordagem outbound.",
    targetAudience: "Empresas-alvo para prospecção",
    benefits: ["Prospecção em escala", "Abordagem personalizada", "Pipeline alimentado"],
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
    objective: "Atender clientes, resolver problemas e fornecer suporte automatizado.",
    targetAudience: "Clientes ativos",
    benefits: ["Atendimento 24/7", "70% menos tickets", "CSAT elevado"],
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
    objective: "Garantir o sucesso dos clientes com follow-ups e feedbacks.",
    targetAudience: "Clientes em onboarding e pós-venda",
    benefits: ["Onboarding automático", "-40% churn", "Feedback contínuo"],
    exampleConversation: [
      { role: "agent", message: "Como tem sido sua experiência? Estou aqui para ajudar!" },
      { role: "customer", message: "Tenho dúvidas sobre uma funcionalidade." },
    ],
    selected: false,
  },
];

export interface KnowledgeFile {
  id: string;
  name: string;
  size: number;
  type: string;
}

export interface BusinessContext {
  // Empresa
  companyName: string;
  website: string;
  industry: string;
  mainProduct: string;
  country: string;
  language: string;
  // Público-alvo
  targetAudienceDescription: string;
  painPoints: string;
  // Base de conhecimento
  knowledgeSources: string;
  faqUrl: string;
  knowledgeFiles: KnowledgeFile[];
  // Tom e comportamento
  toneOfVoice: string;
  greetingMessage: string;
  // Operacional
  businessHours: string;
  escalationRules: string;
  averageTicket: string;
}

export const INITIAL_CONTEXT: BusinessContext = {
  companyName: "",
  website: "",
  industry: "",
  mainProduct: "",
  country: "Brasil",
  language: "Português",
  targetAudienceDescription: "",
  painPoints: "",
  knowledgeSources: "",
  faqUrl: "",
  toneOfVoice: "Profissional e amigável",
  greetingMessage: "",
  businessHours: "24/7",
  escalationRules: "",
  averageTicket: "",
};

export type AgentGoal =
  | "schedule_meetings"
  | "capture_leads"
  | "answer_questions"
  | "qualify_opportunities"
  | "support_customers"
  | "resolve_tickets"
  | "onboard_customers"
  | "collect_feedback"
  | "reduce_churn";

export const AGENT_GOALS: { value: AgentGoal; label: string; description: string }[] = [
  { value: "schedule_meetings", label: "Agendar reuniões", description: "Qualificar e agendar reuniões com leads" },
  { value: "capture_leads", label: "Capturar leads", description: "Coletar informações de contato e interesse" },
  { value: "answer_questions", label: "Responder perguntas", description: "Atendimento e suporte ao cliente" },
  { value: "qualify_opportunities", label: "Qualificar oportunidades", description: "Identificar leads com potencial de compra" },
  { value: "support_customers", label: "Suporte a clientes", description: "Acompanhamento e sucesso do cliente" },
  { value: "resolve_tickets", label: "Resolver chamados", description: "Solucionar problemas e dúvidas de clientes" },
  { value: "onboard_customers", label: "Onboarding", description: "Guiar novos clientes na adoção do produto" },
  { value: "collect_feedback", label: "Coletar feedback", description: "Pesquisas de satisfação e NPS" },
  { value: "reduce_churn", label: "Reduzir churn", description: "Identificar e reter clientes em risco" },
];

export const GOALS_BY_AGENT_TYPE: Record<AgentType, AgentGoal[]> = {
  SDR: ["capture_leads", "qualify_opportunities", "schedule_meetings"],
  BDR: ["qualify_opportunities", "schedule_meetings", "capture_leads"],
  SAC: ["answer_questions", "resolve_tickets", "collect_feedback"],
  CS: ["onboard_customers", "support_customers", "reduce_churn", "collect_feedback"],
};

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
    { id: "3", label: "Qualificação", content: "Para entender se faz sentido pra vocês, pode me dizer qual é o tamanho da sua equipe e o budget disponível?" },
    { id: "4", label: "Fechamento", content: goal === "schedule_meetings"
      ? "Que tal agendarmos uma conversa de 15 minutos com nosso especialista?"
      : "Posso enviar uma proposta personalizada para você avaliar?" },
  ];
}

export function generateMockProfile(ctx: BusinessContext, goal: AgentGoal): AgentProfile {
  return {
    persona: `Assistente virtual profissional da ${ctx.companyName}, especialista em ${ctx.industry}. Tom consultivo, amigável e direto.`,
    primaryGoal: AGENT_GOALS.find((g) => g.value === goal)?.description || "",
    conversationFlow: "Saudação → Descoberta → Qualificação → Proposta de Valor → Fechamento",
    instructions: `1. Sempre se apresentar como assistente da ${ctx.companyName}\n2. Focar em entender as necessidades do lead\n3. Qualificar usando critérios BANT\n4. Nunca prometer o que não pode cumprir\n5. Direcionar para próximo passo claro`,
    communicationStyle: `Profissional e consultivo. Linguagem em ${ctx.language}. Respostas curtas e objetivas.`,
    safetyGuidelines: "Não compartilhar informações confidenciais. Encaminhar para humano em casos sensíveis.",
    constraints: `Horário: 24/7. Idioma: ${ctx.language}. Escopo: ${ctx.mainProduct}.`,
  };
}
