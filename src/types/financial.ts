export type PaymentStatus = "paid" | "pending" | "overdue" | "cancelled";
export type PaymentFrequency = "monthly" | "quarterly" | "yearly" | "one-time";
export type RevenueSource = "retainer" | "subscription" | "project" | "consulting" | "implementation";

export interface Invoice {
  id: string;
  client: string;
  clientId: string;
  description: string;
  amount: number;
  dueDate: string;
  issueDate: string;
  status: PaymentStatus;
  items: InvoiceItem[];
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface RevenueEntry {
  id: string;
  client: string;
  clientId: string;
  amount: number;
  frequency: PaymentFrequency;
  source: RevenueSource;
  status: PaymentStatus;
  date: string;
  description: string;
}

export interface Subscription {
  id: string;
  client: string;
  clientId: string;
  plan: string;
  amount: number;
  frequency: PaymentFrequency;
  startDate: string;
  nextBillingDate: string;
  status: "active" | "paused" | "cancelled";
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  recurring: boolean;
}

export const paymentStatusConfig: Record<PaymentStatus, { label: string; color: string }> = {
  paid: { label: "Pago", color: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]" },
  pending: { label: "Pendente", color: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]" },
  overdue: { label: "Atrasado", color: "bg-destructive/10 text-destructive" },
  cancelled: { label: "Cancelado", color: "bg-muted text-muted-foreground" },
};

export const frequencyLabels: Record<PaymentFrequency, string> = {
  monthly: "Mensal",
  quarterly: "Trimestral",
  yearly: "Anual",
  "one-time": "Único",
};

export const sourceLabels: Record<RevenueSource, string> = {
  retainer: "Retainer",
  subscription: "Assinatura",
  project: "Projeto",
  consulting: "Consultoria",
  implementation: "Implementação",
};

// Mock data
export const mockInvoices: Invoice[] = [
  { id: "INV-001", client: "TechFlow Corp", clientId: "c1", description: "Automação IA - Março 2025", amount: 8500, dueDate: "2025-03-15", issueDate: "2025-03-01", status: "paid", items: [{ description: "Automação IA", quantity: 1, unitPrice: 8500, total: 8500 }] },
  { id: "INV-002", client: "Nova Digital", clientId: "c2", description: "Gestão de Tráfego - Março 2025", amount: 4200, dueDate: "2025-03-10", issueDate: "2025-03-01", status: "paid", items: [{ description: "Gestão de Tráfego", quantity: 1, unitPrice: 4200, total: 4200 }] },
  { id: "INV-003", client: "Startup Hub", clientId: "c3", description: "Desenvolvimento Web + IA", amount: 12000, dueDate: "2025-03-20", issueDate: "2025-03-05", status: "pending", items: [{ description: "Desenvolvimento Web", quantity: 1, unitPrice: 7000, total: 7000 }, { description: "Agente IA", quantity: 1, unitPrice: 5000, total: 5000 }] },
  { id: "INV-004", client: "MegaStore", clientId: "c4", description: "Chatbot + CRM - Fevereiro 2025", amount: 6800, dueDate: "2025-02-28", issueDate: "2025-02-01", status: "overdue", items: [{ description: "Chatbot IA", quantity: 1, unitPrice: 4000, total: 4000 }, { description: "Integração CRM", quantity: 1, unitPrice: 2800, total: 2800 }] },
  { id: "INV-005", client: "Fintech Plus", clientId: "c5", description: "Consultoria IA - Março 2025", amount: 15000, dueDate: "2025-03-25", issueDate: "2025-03-10", status: "pending", items: [{ description: "Consultoria IA", quantity: 1, unitPrice: 15000, total: 15000 }] },
  { id: "INV-006", client: "EduTech", clientId: "c6", description: "Plataforma E-learning", amount: 9500, dueDate: "2025-03-30", issueDate: "2025-03-15", status: "pending", items: [{ description: "Plataforma E-learning", quantity: 1, unitPrice: 9500, total: 9500 }] },
  { id: "INV-007", client: "HealthCare AI", clientId: "c7", description: "Voice Agent - Janeiro 2025", amount: 3200, dueDate: "2025-01-31", issueDate: "2025-01-01", status: "cancelled", items: [{ description: "Voice Agent", quantity: 1, unitPrice: 3200, total: 3200 }] },
];

export const mockRevenue: RevenueEntry[] = [
  { id: "r1", client: "TechFlow Corp", clientId: "c1", amount: 8500, frequency: "monthly", source: "retainer", status: "paid", date: "2025-03-01", description: "Retainer mensal" },
  { id: "r2", client: "Nova Digital", clientId: "c2", amount: 4200, frequency: "monthly", source: "subscription", status: "paid", date: "2025-03-01", description: "Assinatura SaaS" },
  { id: "r3", client: "Startup Hub", clientId: "c3", amount: 12000, frequency: "one-time", source: "project", status: "pending", date: "2025-03-05", description: "Projeto Web + IA" },
  { id: "r4", client: "MegaStore", clientId: "c4", amount: 6800, frequency: "monthly", source: "retainer", status: "overdue", date: "2025-02-01", description: "Chatbot + CRM" },
  { id: "r5", client: "Fintech Plus", clientId: "c5", amount: 15000, frequency: "quarterly", source: "consulting", status: "pending", date: "2025-03-10", description: "Consultoria estratégica" },
  { id: "r6", client: "EduTech", clientId: "c6", amount: 9500, frequency: "one-time", source: "implementation", status: "pending", date: "2025-03-15", description: "Implementação plataforma" },
];

export const mockSubscriptions: Subscription[] = [
  { id: "s1", client: "TechFlow Corp", clientId: "c1", plan: "Enterprise AI", amount: 8500, frequency: "monthly", startDate: "2024-06-01", nextBillingDate: "2025-04-01", status: "active" },
  { id: "s2", client: "Nova Digital", clientId: "c2", plan: "Growth", amount: 4200, frequency: "monthly", startDate: "2024-09-01", nextBillingDate: "2025-04-01", status: "active" },
  { id: "s3", client: "MegaStore", clientId: "c4", plan: "Starter AI", amount: 2500, frequency: "monthly", startDate: "2024-11-01", nextBillingDate: "2025-04-01", status: "active" },
  { id: "s4", client: "Fintech Plus", clientId: "c5", plan: "Premium Consulting", amount: 15000, frequency: "quarterly", startDate: "2025-01-01", nextBillingDate: "2025-04-01", status: "active" },
  { id: "s5", client: "HealthCare AI", clientId: "c7", plan: "Basic", amount: 3200, frequency: "monthly", startDate: "2024-08-01", nextBillingDate: "-", status: "cancelled" },
];

export const mockExpenses: Expense[] = [
  { id: "e1", category: "Software", description: "OpenAI API", amount: 2400, date: "2025-03-01", recurring: true },
  { id: "e2", category: "Software", description: "Servidor Cloud", amount: 850, date: "2025-03-01", recurring: true },
  { id: "e3", category: "Marketing", description: "Google Ads", amount: 3500, date: "2025-03-01", recurring: true },
  { id: "e4", category: "Operacional", description: "Coworking", amount: 1200, date: "2025-03-01", recurring: true },
  { id: "e5", category: "Software", description: "Ferramentas SaaS", amount: 680, date: "2025-03-01", recurring: true },
];
