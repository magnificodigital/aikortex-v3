// ─── PLATFORM HIERARCHY ─────────────────────────────

export type PlatformRole = "platform_owner" | "platform_admin";

export type AgencyRole = "agency_owner" | "agency_admin" | "agency_manager" | "agency_member";

export type ClientRole = "client_owner" | "client_manager" | "client_viewer";

export type SystemRole = PlatformRole | AgencyRole | ClientRole;

// ─── MODULES ────────────────────────────────────────

export type CoreModule =
  | "dashboard"
  | "clients"
  | "projects"
  | "tasks"
  | "team"
  | "finance"
  | "contracts"
  | "reports"
  | "integrations"
  | "partners";

export type EcosystemModule =
  | "aikortex"
  | "webedit"
  | "alowdigital"
  | "iagora"
  | "sintonia";

export type SystemModule = CoreModule | EcosystemModule;

// ─── PERMISSIONS ────────────────────────────────────

export type PermissionAction = "view" | "create" | "edit" | "delete" | "manage";

export interface ModulePermission {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  manage: boolean;
}

export type RolePermissionMap = Record<SystemModule, ModulePermission>;

// ─── FEATURE FLAGS ──────────────────────────────────

export type FeatureFlag =
  | "feature.ai_agents"
  | "feature.voice_agents"
  | "feature.saas_builder"
  | "feature.marketplace_access"
  | "feature.event_speaker"
  | "feature.advanced_automation"
  | "feature.custom_reports"
  | "feature.white_label"
  | "feature.api_access"
  | "feature.media_participation";

export type PartnerTier = "bronze" | "silver" | "gold" | "elite";

export interface TierFeatureConfig {
  label: string;
  color: string;
  bg: string;
  icon: string;
  features: FeatureFlag[];
}

// ─── AUDIT LOG ──────────────────────────────────────

export type AuditAction =
  | "role_assigned"
  | "role_removed"
  | "permission_changed"
  | "user_invited"
  | "user_suspended"
  | "user_activated"
  | "feature_enabled"
  | "feature_disabled"
  | "financial_change"
  | "module_access_changed";

export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  action: AuditAction;
  target: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
}

// ─── TENANT ─────────────────────────────────────────

export interface Tenant {
  id: string;
  name: string;
  type: "platform" | "agency" | "client";
  parentId?: string; // agency parent for client tenants
  tier?: PartnerTier;
  createdAt: string;
}

// ─── USER ───────────────────────────────────────────

export interface PlatformUser {
  id: string;
  fullName: string;
  email: string;
  avatar?: string;
  role: SystemRole;
  tenantId: string;
  status: "active" | "invited" | "suspended";
  permissions: Partial<RolePermissionMap>;
  featureFlags: FeatureFlag[];
  lastActive?: string;
  createdAt: string;
}

// ─── CONFIGS ────────────────────────────────────────

export const ALL_MODULES: { key: SystemModule; label: string; group: "core" | "ecosystem" }[] = [
  { key: "dashboard", label: "Dashboard", group: "core" },
  { key: "clients", label: "Clientes", group: "core" },
  { key: "projects", label: "Projetos", group: "core" },
  { key: "tasks", label: "Tarefas", group: "core" },
  { key: "team", label: "Equipe", group: "core" },
  { key: "finance", label: "Financeiro", group: "core" },
  { key: "contracts", label: "Contratos", group: "core" },
  { key: "reports", label: "Relatórios", group: "core" },
  { key: "integrations", label: "Integrações", group: "core" },
  { key: "partners", label: "Partners", group: "core" },
  { key: "aikortex", label: "Aikortex", group: "ecosystem" },
  { key: "webedit", label: "WebEdit", group: "ecosystem" },
  { key: "alowdigital", label: "AlowDigital", group: "ecosystem" },
  { key: "iagora", label: "IAgora", group: "ecosystem" },
  { key: "sintonia", label: "SintonIA", group: "ecosystem" },
];

export const PERMISSION_ACTIONS: { key: PermissionAction; label: string }[] = [
  { key: "view", label: "Visualizar" },
  { key: "create", label: "Criar" },
  { key: "edit", label: "Editar" },
  { key: "delete", label: "Excluir" },
  { key: "manage", label: "Gerenciar" },
];

export const ROLE_CONFIG: Record<SystemRole, { label: string; level: "platform" | "agency" | "client"; color: string; bg: string; description: string }> = {
  platform_owner: { label: "Platform Owner", level: "platform", color: "text-red-600", bg: "bg-red-500/10", description: "Acesso total à plataforma e todas as agências" },
  platform_admin: { label: "Platform Admin", level: "platform", color: "text-red-500", bg: "bg-red-500/10", description: "Administração da plataforma com restrições" },
  agency_owner: { label: "Agency Owner", level: "agency", color: "text-amber-600", bg: "bg-amber-500/10", description: "Proprietário da agência com acesso total ao workspace" },
  agency_admin: { label: "Agency Admin", level: "agency", color: "text-purple-600", bg: "bg-purple-500/10", description: "Administrador da agência" },
  agency_manager: { label: "Agency Manager", level: "agency", color: "text-blue-600", bg: "bg-blue-500/10", description: "Gerente com acesso a projetos e equipe" },
  agency_member: { label: "Agency Member", level: "agency", color: "text-emerald-600", bg: "bg-emerald-500/10", description: "Membro da equipe com acesso operacional" },
  client_owner: { label: "Client Owner", level: "client", color: "text-slate-700", bg: "bg-slate-500/10", description: "Proprietário do workspace do cliente" },
  client_manager: { label: "Client Manager", level: "client", color: "text-slate-600", bg: "bg-slate-500/10", description: "Gerente do cliente com acesso parcial" },
  client_viewer: { label: "Client Viewer", level: "client", color: "text-slate-500", bg: "bg-slate-500/10", description: "Visualização do workspace do cliente" },
};

export const TIER_FEATURE_CONFIG: Record<PartnerTier, TierFeatureConfig> = {
  bronze: {
    label: "Bronze",
    color: "text-amber-700",
    bg: "bg-amber-500/10",
    icon: "🥉",
    features: [],
  },
  silver: {
    label: "Silver",
    color: "text-gray-400",
    bg: "bg-gray-500/10",
    icon: "🥈",
    features: ["feature.marketplace_access", "feature.custom_reports"],
  },
  gold: {
    label: "Gold",
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
    icon: "🥇",
    features: [
      "feature.marketplace_access",
      "feature.custom_reports",
      "feature.ai_agents",
      "feature.advanced_automation",
      "feature.api_access",
    ],
  },
  elite: {
    label: "Elite",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    icon: "💎",
    features: [
      "feature.marketplace_access",
      "feature.custom_reports",
      "feature.ai_agents",
      "feature.voice_agents",
      "feature.saas_builder",
      "feature.advanced_automation",
      "feature.api_access",
      "feature.event_speaker",
      "feature.white_label",
      "feature.media_participation",
    ],
  },
};

export const FEATURE_FLAG_LABELS: Record<FeatureFlag, string> = {
  "feature.ai_agents": "Agentes de IA",
  "feature.voice_agents": "Agentes de Voz",
  "feature.saas_builder": "Criação de SaaS",
  "feature.marketplace_access": "Marketplace",
  "feature.event_speaker": "Speaker em Eventos",
  "feature.advanced_automation": "Automação Avançada",
  "feature.custom_reports": "Relatórios Customizados",
  "feature.white_label": "White Label",
  "feature.api_access": "Acesso via API",
  "feature.media_participation": "Participação em Mídia",
};

// ─── DEFAULT PERMISSIONS PER ROLE ───────────────────

const fullAccess: ModulePermission = { view: true, create: true, edit: true, delete: true, manage: true };
const readOnly: ModulePermission = { view: true, create: false, edit: false, delete: false, manage: false };
const noAccess: ModulePermission = { view: false, create: false, edit: false, delete: false, manage: false };
const editAccess: ModulePermission = { view: true, create: true, edit: true, delete: false, manage: false };

const allModulesFull = (): RolePermissionMap =>
  Object.fromEntries(ALL_MODULES.map(m => [m.key, { ...fullAccess }])) as RolePermissionMap;

const allModulesNone = (): RolePermissionMap =>
  Object.fromEntries(ALL_MODULES.map(m => [m.key, { ...noAccess }])) as RolePermissionMap;

export const DEFAULT_ROLE_PERMISSIONS: Record<SystemRole, RolePermissionMap> = {
  platform_owner: allModulesFull(),
  platform_admin: allModulesFull(),
  agency_owner: allModulesFull(),
  agency_admin: {
    ...allModulesFull(),
    partners: { ...readOnly },
  },
  agency_manager: {
    ...allModulesNone(),
    dashboard: { ...readOnly },
    clients: { ...editAccess },
    projects: { ...editAccess },
    tasks: { ...fullAccess },
    team: { ...readOnly },
    reports: { ...readOnly },
    finance: { ...readOnly },
    contracts: { ...readOnly },
    integrations: { ...noAccess },
    partners: { ...noAccess },
    aikortex: { ...readOnly },
    webedit: { ...noAccess },
    alowdigital: { ...noAccess },
    iagora: { ...noAccess },
    sintonia: { ...noAccess },
  },
  agency_member: {
    ...allModulesNone(),
    dashboard: { ...readOnly },
    projects: { ...editAccess },
    tasks: { ...editAccess },
    clients: { ...readOnly },
    team: { ...noAccess },
    finance: { ...noAccess },
    contracts: { ...noAccess },
    reports: { ...noAccess },
    integrations: { ...noAccess },
    partners: { ...noAccess },
    aikortex: { ...readOnly },
    webedit: { ...noAccess },
    alowdigital: { ...noAccess },
    iagora: { ...noAccess },
    sintonia: { ...noAccess },
  },
  client_owner: {
    ...allModulesNone(),
    dashboard: { ...readOnly },
    projects: { ...readOnly },
    tasks: { ...readOnly },
    contracts: { ...readOnly },
    reports: { ...readOnly },
    clients: { ...noAccess },
    team: { ...noAccess },
    finance: { ...noAccess },
    integrations: { ...noAccess },
    partners: { ...noAccess },
    aikortex: { ...noAccess },
    webedit: { ...noAccess },
    alowdigital: { ...noAccess },
    iagora: { ...noAccess },
    sintonia: { ...noAccess },
  },
  client_manager: {
    ...allModulesNone(),
    dashboard: { ...readOnly },
    projects: { ...readOnly },
    tasks: { ...readOnly },
    contracts: { ...readOnly },
    reports: { ...noAccess },
    clients: { ...noAccess },
    team: { ...noAccess },
    finance: { ...noAccess },
    integrations: { ...noAccess },
    partners: { ...noAccess },
    aikortex: { ...noAccess },
    webedit: { ...noAccess },
    alowdigital: { ...noAccess },
    iagora: { ...noAccess },
    sintonia: { ...noAccess },
  },
  client_viewer: {
    ...allModulesNone(),
    dashboard: { ...readOnly },
    projects: { ...readOnly },
    clients: { ...noAccess },
    team: { ...noAccess },
    finance: { ...noAccess },
    contracts: { ...noAccess },
    reports: { ...noAccess },
    tasks: { ...noAccess },
    integrations: { ...noAccess },
    partners: { ...noAccess },
    aikortex: { ...noAccess },
    webedit: { ...noAccess },
    alowdigital: { ...noAccess },
    iagora: { ...noAccess },
    sintonia: { ...noAccess },
  },
};

// ─── MOCK DATA ──────────────────────────────────────

export const mockAuditLog: AuditLogEntry[] = [
  { id: "au-1", userId: "tm-1", userName: "Rafael Costa", action: "role_assigned", target: "Ana Oliveira", details: "Atribuiu role agency_admin", timestamp: "2025-03-09T10:30:00" },
  { id: "au-2", userId: "tm-2", userName: "Ana Oliveira", action: "permission_changed", target: "Lucas Mendes", details: "Alterou permissões de Financeiro para somente leitura", timestamp: "2025-03-09T09:15:00" },
  { id: "au-3", userId: "tm-1", userName: "Rafael Costa", action: "user_invited", target: "beatriz@agency.com", details: "Convidou como agency_member", timestamp: "2025-03-08T17:00:00" },
  { id: "au-4", userId: "tm-1", userName: "Rafael Costa", action: "feature_enabled", target: "feature.ai_agents", details: "Ativou Agentes de IA para tier Gold", timestamp: "2025-03-08T14:00:00" },
  { id: "au-5", userId: "tm-2", userName: "Ana Oliveira", action: "user_suspended", target: "Diego Nascimento", details: "Conta suspensa por inatividade", timestamp: "2025-02-15T14:00:00" },
  { id: "au-6", userId: "tm-1", userName: "Rafael Costa", action: "financial_change", target: "Invoice #2847", details: "Aprovou pagamento de R$ 15.000", timestamp: "2025-03-07T11:00:00" },
];
