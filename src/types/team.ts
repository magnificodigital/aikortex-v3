export type UserRole = "owner" | "admin" | "manager" | "member" | "client" | "partner";
export type UserStatus = "active" | "invited" | "suspended";
export type Department = "sales" | "operations" | "marketing" | "automation" | "development" | "design" | "support";

export interface ModulePermissions {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export interface RolePermissions {
  dashboard: ModulePermissions;
  clients: ModulePermissions;
  projects: ModulePermissions;
  tasks: ModulePermissions;
  financials: ModulePermissions;
  contracts: ModulePermissions;
  integrations: ModulePermissions;
  partners: ModulePermissions;
  team: ModulePermissions;
}

export interface TeamMember {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  department: Department;
  jobTitle: string;
  avatar?: string;
  status: UserStatus;
  phone?: string;
  joinedAt: string;
  lastActive: string;
  assignedTasks: number;
  activeProjects: number;
  overdueTasks: number;
  completedTasks: number;
  totalHoursLogged: number;
}

export interface ActivityLogEntry {
  id: string;
  userId: string;
  action: string;
  target: string;
  timestamp: string;
}

export const roleConfig: Record<UserRole, { label: string; color: string; bg: string }> = {
  owner: { label: "Owner", color: "text-amber-600", bg: "bg-amber-500/10" },
  admin: { label: "Admin", color: "text-purple-600", bg: "bg-purple-500/10" },
  manager: { label: "Manager", color: "text-blue-600", bg: "bg-blue-500/10" },
  member: { label: "Membro", color: "text-emerald-600", bg: "bg-emerald-500/10" },
  client: { label: "Cliente", color: "text-slate-600", bg: "bg-slate-500/10" },
  partner: { label: "Parceiro", color: "text-orange-600", bg: "bg-orange-500/10" },
};

export const statusConfig: Record<UserStatus, { label: string; color: string; bg: string }> = {
  active: { label: "Ativo", color: "text-[hsl(var(--success))]", bg: "bg-[hsl(var(--success)/.1)]" },
  invited: { label: "Convidado", color: "text-[hsl(var(--warning))]", bg: "bg-[hsl(var(--warning)/.1)]" },
  suspended: { label: "Suspenso", color: "text-destructive", bg: "bg-destructive/10" },
};

export const departmentConfig: Record<Department, { label: string; color: string; bg: string }> = {
  sales: { label: "Vendas", color: "text-emerald-600", bg: "bg-emerald-500/10" },
  operations: { label: "Operações", color: "text-blue-600", bg: "bg-blue-500/10" },
  marketing: { label: "Marketing", color: "text-pink-600", bg: "bg-pink-500/10" },
  automation: { label: "Automação", color: "text-purple-600", bg: "bg-purple-500/10" },
  development: { label: "Desenvolvimento", color: "text-orange-600", bg: "bg-orange-500/10" },
  design: { label: "Design", color: "text-cyan-600", bg: "bg-cyan-500/10" },
  support: { label: "Suporte", color: "text-amber-600", bg: "bg-amber-500/10" },
};

export const mockTeamMembers: TeamMember[] = [
  {
    id: "tm-1", fullName: "Rafael Costa", email: "rafael@agency.com", role: "owner",
    department: "operations", jobTitle: "CEO & Fundador", status: "active",
    phone: "+55 11 99999-0001", joinedAt: "2024-01-15", lastActive: "2025-03-09T10:30:00",
    assignedTasks: 8, activeProjects: 5, overdueTasks: 1, completedTasks: 142, totalHoursLogged: 1840,
  },
  {
    id: "tm-2", fullName: "Ana Oliveira", email: "ana@agency.com", role: "admin",
    department: "operations", jobTitle: "COO", status: "active",
    phone: "+55 11 99999-0002", joinedAt: "2024-02-01", lastActive: "2025-03-09T09:15:00",
    assignedTasks: 12, activeProjects: 7, overdueTasks: 2, completedTasks: 198, totalHoursLogged: 2100,
  },
  {
    id: "tm-3", fullName: "Lucas Mendes", email: "lucas@agency.com", role: "manager",
    department: "development", jobTitle: "Tech Lead", status: "active",
    joinedAt: "2024-03-10", lastActive: "2025-03-09T08:45:00",
    assignedTasks: 15, activeProjects: 4, overdueTasks: 3, completedTasks: 167, totalHoursLogged: 1920,
  },
  {
    id: "tm-4", fullName: "Mariana Santos", email: "mariana@agency.com", role: "member",
    department: "marketing", jobTitle: "Growth Specialist", status: "active",
    joinedAt: "2024-04-20", lastActive: "2025-03-08T17:30:00",
    assignedTasks: 9, activeProjects: 3, overdueTasks: 0, completedTasks: 89, totalHoursLogged: 960,
  },
  {
    id: "tm-5", fullName: "Pedro Almeida", email: "pedro@agency.com", role: "member",
    department: "automation", jobTitle: "Automation Engineer", status: "active",
    joinedAt: "2024-05-15", lastActive: "2025-03-09T11:00:00",
    assignedTasks: 11, activeProjects: 4, overdueTasks: 1, completedTasks: 134, totalHoursLogged: 1450,
  },
  {
    id: "tm-6", fullName: "Juliana Lima", email: "juliana@agency.com", role: "member",
    department: "design", jobTitle: "UI/UX Designer", status: "active",
    joinedAt: "2024-06-01", lastActive: "2025-03-09T10:00:00",
    assignedTasks: 7, activeProjects: 3, overdueTasks: 0, completedTasks: 76, totalHoursLogged: 820,
  },
  {
    id: "tm-7", fullName: "Carlos Ferreira", email: "carlos@agency.com", role: "member",
    department: "sales", jobTitle: "Account Executive", status: "active",
    joinedAt: "2024-07-10", lastActive: "2025-03-08T16:00:00",
    assignedTasks: 6, activeProjects: 2, overdueTasks: 0, completedTasks: 54, totalHoursLogged: 580,
  },
  {
    id: "tm-8", fullName: "Beatriz Rocha", email: "beatriz@agency.com", role: "member",
    department: "support", jobTitle: "Customer Success", status: "invited",
    joinedAt: "2025-03-01", lastActive: "",
    assignedTasks: 0, activeProjects: 0, overdueTasks: 0, completedTasks: 0, totalHoursLogged: 0,
  },
  {
    id: "tm-9", fullName: "Diego Nascimento", email: "diego@agency.com", role: "member",
    department: "development", jobTitle: "Full Stack Developer", status: "suspended",
    joinedAt: "2024-04-01", lastActive: "2025-02-15T14:00:00",
    assignedTasks: 0, activeProjects: 0, overdueTasks: 0, completedTasks: 45, totalHoursLogged: 520,
  },
  {
    id: "tm-10", fullName: "Fernanda Dias", email: "fernanda@agency.com", role: "manager",
    department: "marketing", jobTitle: "Marketing Director", status: "active",
    joinedAt: "2024-03-20", lastActive: "2025-03-09T09:30:00",
    assignedTasks: 10, activeProjects: 5, overdueTasks: 1, completedTasks: 112, totalHoursLogged: 1280,
  },
];

export const mockActivityLog: ActivityLogEntry[] = [
  { id: "al-1", userId: "tm-1", action: "Login", target: "Sistema", timestamp: "2025-03-09T10:30:00" },
  { id: "al-2", userId: "tm-2", action: "Editou projeto", target: "Projeto Alpha", timestamp: "2025-03-09T09:15:00" },
  { id: "al-3", userId: "tm-3", action: "Completou tarefa", target: "Setup API Gateway", timestamp: "2025-03-09T08:45:00" },
  { id: "al-4", userId: "tm-5", action: "Criou automação", target: "Lead Scoring Flow", timestamp: "2025-03-09T11:00:00" },
  { id: "al-5", userId: "tm-4", action: "Adicionou cliente", target: "TechVentures Inc", timestamp: "2025-03-08T17:30:00" },
  { id: "al-6", userId: "tm-6", action: "Enviou design", target: "Landing Page v3", timestamp: "2025-03-09T10:00:00" },
  { id: "al-7", userId: "tm-10", action: "Criou campanha", target: "Q1 Email Campaign", timestamp: "2025-03-09T09:30:00" },
  { id: "al-8", userId: "tm-7", action: "Fechou deal", target: "Contract #2847", timestamp: "2025-03-08T16:00:00" },
];
