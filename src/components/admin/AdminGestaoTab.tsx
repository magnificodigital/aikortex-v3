import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Search, Loader2, RefreshCw, Building2, CheckCircle, XCircle,
  ArrowLeft, Users, DollarSign, LayoutTemplate, ChevronRight, Eye, User,
} from "lucide-react";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ROLE_CONFIG } from "@/types/rbac";
import EditUserDialog from "@/components/admin/EditUserDialog";
import ResetPasswordDialog from "@/components/shared/ResetPasswordDialog";
import { useAuth } from "@/contexts/AuthContext";

/* ────────────────────── types ────────────────────── */

interface AgencyRow {
  id: string; user_id: string; agency_name: string | null; logo_url: string | null;
  tier: string; active_clients_count: number | null; asaas_api_key: string | null;
  asaas_wallet_id: string | null; created_at: string | null; custom_pricing: any;
  email?: string; mrr?: number; platformRevenue?: number;
}

interface ClientRow {
  id: string; client_name: string; client_email: string | null; client_phone: string | null;
  client_document: string | null; status: string | null; created_at: string | null;
  client_user_id: string | null; agency_id: string;
  templates: { id: string; name: string; agency_price: number; platform_price: number; status: string; channel: string | null; activated_at: string | null; subscription_id: string }[];
  mrr: number; platformRevenue: number;
}

interface UserRow {
  id: string; user_id: string; email: string | null; full_name: string | null;
  role: string; tenant_type: string; is_active: boolean; last_sign_in_at: string | null;
}

interface SubscriptionDetail {
  id: string; template_name: string; category: string; agency_price: number;
  platform_price: number; agency_profit: number; status: string; channel: string | null;
  activated_at: string | null; created_at: string | null;
  payments: { id: string; created_at: string | null; amount: number; platform_amount: number; status: string; asaas_id: string | null }[];
}

/* ────────────────────── helpers ────────────────────── */

const TIER_BADGES: Record<string, { label: string; className: string }> = {
  starter: { label: "Starter", className: "bg-muted text-muted-foreground" },
  explorer: { label: "Explorer", className: "bg-blue-500/10 text-blue-600" },
  hack: { label: "Hack", className: "bg-purple-500/10 text-purple-600" },
};

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  active: { label: "Ativo", cls: "bg-green-500/10 text-green-600" },
  pending: { label: "Pendente", cls: "bg-yellow-500/10 text-yellow-600" },
  suspended: { label: "Suspenso", cls: "bg-red-500/10 text-red-500" },
  inactive: { label: "Inativo", cls: "bg-muted text-muted-foreground" },
  trial: { label: "Trial", cls: "bg-cyan-500/10 text-cyan-600" },
  cancelled: { label: "Cancelado", cls: "bg-red-500/10 text-red-500" },
};

const relativeDate = (d: string | null) => {
  if (!d) return "—";
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Hoje";
  if (days === 1) return "Ontem";
  if (days < 30) return `${days}d atrás`;
  if (days < 365) return `${Math.floor(days / 30)}m atrás`;
  return new Date(d).toLocaleDateString("pt-BR");
};

const getTierProgress = (tier: string, clients: number) => {
  if (tier === "hack") return { target: 15, pct: 100, next: null };
  if (tier === "explorer") return { target: 15, pct: Math.min(100, (clients / 15) * 100), next: "Hack" };
  return { target: 5, pct: Math.min(100, (clients / 5) * 100), next: "Explorer" };
};

/* ────────────────────── Nav state ────────────────────── */
type NavLevel =
  | { level: 1 }
  | { level: 2; agency: AgencyRow }
  | { level: 3; agency: AgencyRow; client: ClientRow }
  | { level: 4; agency: AgencyRow; client: ClientRow; subscription: SubscriptionDetail };

interface GestaoProps {
  initialAgencyId?: string;
  initialClientId?: string;
  initialTier?: string;
}

/* ════════════════════════════════════════════════════════ */
const AdminGestaoTab = ({ initialAgencyId, initialClientId, initialTier }: GestaoProps) => {
  const { user } = useAuth();
  const [nav, setNav] = useState<NavLevel>({ level: 1 });
  const goBack = useCallback(() => {
    if (nav.level === 4) setNav({ level: 3, agency: nav.agency, client: nav.client });
    else if (nav.level === 3) setNav({ level: 2, agency: nav.agency });
    else setNav({ level: 1 });
  }, [nav]);

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink className="cursor-pointer" onClick={() => setNav({ level: 1 })}>Gestão</BreadcrumbLink>
          </BreadcrumbItem>
          {nav.level >= 2 && "agency" in nav && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {nav.level === 2 ? (
                  <BreadcrumbPage>{nav.agency.agency_name || "Agência"}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink className="cursor-pointer" onClick={() => setNav({ level: 2, agency: nav.agency })}>{nav.agency.agency_name || "Agência"}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </>
          )}
          {nav.level >= 3 && "client" in nav && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {nav.level === 3 ? (
                  <BreadcrumbPage>{nav.client.client_name}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink className="cursor-pointer" onClick={() => setNav({ level: 3, agency: nav.agency, client: nav.client })}>{nav.client.client_name}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </>
          )}
          {nav.level === 4 && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>{nav.subscription.template_name}</BreadcrumbPage></BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Back button */}
      {nav.level > 1 && (
        <Button variant="ghost" size="sm" onClick={goBack} className="text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
        </Button>
      )}

      {nav.level === 1 && <Level1 onSelectAgency={(a) => setNav({ level: 2, agency: a })} initialTier={initialTier} initialAgencyId={initialAgencyId} />}
      {nav.level === 2 && <Level2 agency={nav.agency} onSelectClient={(c) => setNav({ level: 3, agency: nav.agency, client: c })} />}
      {nav.level === 3 && <Level3 agency={nav.agency} client={nav.client} onSelectSubscription={(s) => setNav({ level: 4, agency: nav.agency, client: nav.client, subscription: s })} onGoToAgency={() => setNav({ level: 2, agency: nav.agency })} />}
      {nav.level === 4 && <Level4 subscription={nav.subscription} />}
    </div>
  );
};

/* ═══════════════════ LEVEL 1 — Platform ═══════════════════ */

const Level1 = ({ onSelectAgency, initialTier, initialAgencyId }: { onSelectAgency: (a: AgencyRow) => void; initialTier?: string; initialAgencyId?: string }) => {
  const [agencies, setAgencies] = useState<AgencyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState(initialTier || "all");
  const [stats, setStats] = useState({ totalAgencies: 0, totalClients: 0, platformMRR: 0, templatesSold: 0, tierBreakdown: { starter: { agencies: 0, clients: 0, mrr: 0 }, explorer: { agencies: 0, clients: 0, mrr: 0 }, hack: { agencies: 0, clients: 0, mrr: 0 } } });

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { if (initialTier) setTierFilter(initialTier); }, [initialTier]);
  useEffect(() => {
    if (initialAgencyId && agencies.length > 0) {
      const a = agencies.find(ag => ag.id === initialAgencyId);
      if (a) onSelectAgency(a);
    }
  }, [initialAgencyId, agencies]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [agenciesRes, subsRes, usersData, clientsRes] = await Promise.all([
        supabase.from("agency_profiles").select("id, user_id, agency_name, logo_url, tier, active_clients_count, asaas_api_key, asaas_wallet_id, created_at, custom_pricing"),
        supabase.from("client_template_subscriptions").select("agency_id, agency_price_monthly, platform_price_monthly, status").in("status", ["active", "trial"]),
        supabase.functions.invoke("admin-get-users"),
        supabase.from("agency_clients").select("id, status, agency_id"),
      ]);

      const usersMap = new Map<string, string>();
      (usersData?.data?.users || []).forEach((u: any) => usersMap.set(u.user_id, u.email || ""));

      const mrrMap = new Map<string, number>();
      const platformMap = new Map<string, number>();
      const activeSubs = subsRes.data || [];
      activeSubs.forEach((s: any) => {
        mrrMap.set(s.agency_id, (mrrMap.get(s.agency_id) || 0) + ((s.agency_price_monthly || 0) - (s.platform_price_monthly || 0)));
        platformMap.set(s.agency_id, (platformMap.get(s.agency_id) || 0) + (s.platform_price_monthly || 0));
      });

      const agenciesData = (agenciesRes.data || []).map(a => ({
        ...a,
        email: usersMap.get(a.user_id) || "",
        mrr: mrrMap.get(a.id) || 0,
        platformRevenue: platformMap.get(a.id) || 0,
      }));
      setAgencies(agenciesData);

      const activeClients = (clientsRes.data || []).filter(c => c.status === "active");
      const platformMRR = activeSubs.reduce((sum, s) => sum + (s.platform_price_monthly || 0), 0);

      const agencyTierMap = new Map(agenciesData.map(a => [a.id, a.tier]));
      const tb = { starter: { agencies: 0, clients: 0, mrr: 0 }, explorer: { agencies: 0, clients: 0, mrr: 0 }, hack: { agencies: 0, clients: 0, mrr: 0 } };
      agenciesData.forEach(a => { const t = a.tier as keyof typeof tb; if (tb[t]) { tb[t].agencies++; tb[t].clients += a.active_clients_count || 0; } });
      activeSubs.forEach(s => { const t = agencyTierMap.get(s.agency_id) as keyof typeof tb; if (t && tb[t]) tb[t].mrr += s.platform_price_monthly || 0; });

      setStats({ totalAgencies: agenciesData.length, totalClients: activeClients.length, platformMRR, templatesSold: activeSubs.length, tierBreakdown: tb });
    } catch { toast.error("Erro ao carregar dados"); }
    setLoading(false);
  };

  const filtered = agencies.filter(a => {
    if (search) { const s = search.toLowerCase(); if (!(a.agency_name || "").toLowerCase().includes(s) && !(a.email || "").toLowerCase().includes(s)) return false; }
    if (tierFilter !== "all" && a.tier !== tierFilter) return false;
    return true;
  });

  const tierRows = [
    { key: "starter" as const, label: "Starter", cls: "bg-muted", textCls: "text-muted-foreground" },
    { key: "explorer" as const, label: "Explorer", cls: "bg-blue-500/10", textCls: "text-blue-600" },
    { key: "hack" as const, label: "Hack", cls: "bg-purple-500/10", textCls: "text-purple-600" },
  ];

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Building2, iconCls: "bg-blue-500/10 text-blue-600", value: stats.totalAgencies, label: "Agências ativas" },
          { icon: Users, iconCls: "bg-emerald-500/10 text-emerald-600", value: stats.totalClients, label: "Clientes ativos" },
          { icon: DollarSign, iconCls: "bg-primary/10 text-primary", value: `R$ ${stats.platformMRR.toFixed(0)}`, label: "MRR Plataforma" },
          { icon: LayoutTemplate, iconCls: "bg-purple-500/10 text-purple-600", value: stats.templatesSold, label: "Templates vendidos" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.iconCls.split(" ")[0]}`}>
                <s.icon className={`h-5 w-5 ${s.iconCls.split(" ")[1]}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tier breakdown */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Distribuição por tier</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {tierRows.map(t => {
              const data = stats.tierBreakdown[t.key];
              return (
                <div key={t.key} className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setTierFilter(tierFilter === t.key ? "all" : t.key)}>
                  <div className="flex items-center gap-3">
                    <Badge className={`${t.cls} ${t.textCls} border-0 text-xs min-w-[70px] justify-center`}>{t.label}</Badge>
                    <span className="text-sm font-medium">{data.agencies} agência(s)</span>
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{data.clients} clientes</span>
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                    <span className="text-sm font-medium text-primary">R$ {data.mrr.toFixed(0)} MRR</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Agencies table */}
      <div className="space-y-3">
        <div className="flex gap-2 items-center flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar agência..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Tier" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tiers</SelectItem>
              <SelectItem value="starter">Starter</SelectItem>
              <SelectItem value="explorer">Explorer</SelectItem>
              <SelectItem value="hack">Hack</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={fetchData}><RefreshCw className="w-4 h-4 mr-1.5" /> Atualizar</Button>
        </div>

        <div className="text-xs text-muted-foreground">{filtered.length} agência(s)</div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agência</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Clientes</TableHead>
                  <TableHead>MRR</TableHead>
                  <TableHead>Asaas</TableHead>
                  <TableHead>Cadastro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma agência encontrada</TableCell></TableRow>
                ) : filtered.map(a => {
                  const tier = TIER_BADGES[a.tier] || TIER_BADGES.starter;
                  return (
                    <TableRow key={a.id} className="cursor-pointer hover:bg-accent/50" onClick={() => onSelectAgency(a)}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {a.logo_url ? <img src={a.logo_url} alt="" className="w-7 h-7 rounded-full object-cover" /> : (
                            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center"><Building2 className="w-3.5 h-3.5 text-muted-foreground" /></div>
                          )}
                          <span className="font-medium">{a.agency_name || "Sem nome"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{a.email || "—"}</TableCell>
                      <TableCell><Badge className={`${tier.className} border-0 text-xs`}>{tier.label}</Badge></TableCell>
                      <TableCell>{a.active_clients_count || 0}</TableCell>
                      <TableCell className="font-medium">R$ {((a.mrr || 0) + (a.platformRevenue || 0)).toFixed(2)}</TableCell>
                      <TableCell>
                        {a.asaas_api_key ? (
                          <Badge className="bg-green-500/10 text-green-600 border-0 text-xs"><CheckCircle className="w-3 h-3 mr-1" />Conectado</Badge>
                        ) : (
                          <Badge className="bg-red-500/10 text-red-500 border-0 text-xs"><XCircle className="w-3 h-3 mr-1" />Não config.</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{relativeDate(a.created_at)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

/* ═══════════════════ LEVEL 2 — Agency detail ═══════════════════ */

const Level2 = ({ agency, onSelectClient }: { agency: AgencyRow; onSelectClient: (c: ClientRow) => void }) => {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<UserRow | null>(null);
  const [resetPwTarget, setResetPwTarget] = useState<UserRow | null>(null);

  useEffect(() => { fetchData(); }, [agency.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [clientsRes, subsRes, templatesRes, usersData] = await Promise.all([
        supabase.from("agency_clients").select("id, client_name, client_email, client_phone, client_document, status, created_at, client_user_id, agency_id").eq("agency_id", agency.id),
        supabase.from("client_template_subscriptions").select("id, client_id, template_id, agency_price_monthly, platform_price_monthly, status, activated_channel, activated_at").eq("agency_id", agency.id),
        supabase.from("platform_templates").select("id, name"),
        supabase.functions.invoke("admin-get-users"),
      ]);

      const templateMap = new Map((templatesRes.data || []).map(t => [t.id, t.name]));
      const clientSubsMap = new Map<string, ClientRow["templates"]>();
      const clientMRR = new Map<string, number>();
      const clientPlatform = new Map<string, number>();

      (subsRes.data || []).forEach(s => {
        if (!clientSubsMap.has(s.client_id)) clientSubsMap.set(s.client_id, []);
        clientSubsMap.get(s.client_id)!.push({
          id: s.template_id, name: templateMap.get(s.template_id) || "—",
          agency_price: s.agency_price_monthly || 0, platform_price: s.platform_price_monthly || 0,
          status: s.status || "—", channel: s.activated_channel, activated_at: s.activated_at, subscription_id: s.id,
        });
        if (["active", "trial"].includes(s.status || "")) {
          clientMRR.set(s.client_id, (clientMRR.get(s.client_id) || 0) + (s.agency_price_monthly || 0));
          clientPlatform.set(s.client_id, (clientPlatform.get(s.client_id) || 0) + (s.platform_price_monthly || 0));
        }
      });

      setClients((clientsRes.data || []).map(c => ({
        ...c,
        templates: clientSubsMap.get(c.id) || [],
        mrr: clientMRR.get(c.id) || 0,
        platformRevenue: clientPlatform.get(c.id) || 0,
      })));

      // Filter users belonging to this agency
      const allUsers: any[] = usersData?.data?.users || [];
      setUsers(allUsers.filter((u: any) => u.agency?.id === agency.id || (u.tenant_type === "agency" && u.user_id === agency.user_id)).map((u: any) => ({
        id: u.id, user_id: u.user_id, email: u.email, full_name: u.full_name,
        role: u.role, tenant_type: u.tenant_type, is_active: u.is_active,
        last_sign_in_at: u.last_sign_in_at,
      })));
    } catch { toast.error("Erro ao carregar dados da agência"); }
    setLoading(false);
  };

  const tier = TIER_BADGES[agency.tier] || TIER_BADGES.starter;
  const progress = getTierProgress(agency.tier, agency.active_clients_count || 0);

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      {/* Agency info card */}
      <Card>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                {agency.logo_url ? <img src={agency.logo_url} alt="" className="w-10 h-10 rounded-full object-cover" /> : (
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"><Building2 className="w-5 h-5 text-muted-foreground" /></div>
                )}
                <div>
                  <h2 className="text-lg font-bold">{agency.agency_name || "Sem nome"}</h2>
                  <p className="text-sm text-muted-foreground">{agency.email || "—"}</p>
                </div>
              </div>
              <p className="text-sm"><span className="text-muted-foreground">Asaas:</span> {agency.asaas_api_key ? "Configurado" : "Não configurado"}</p>
              <p className="text-sm text-muted-foreground">Cadastro: {relativeDate(agency.created_at)}</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Tier</p>
              <div className="flex items-center gap-2">
                <Badge className={`${tier.className} border-0`}>{tier.label}</Badge>
                <span className="text-sm">{agency.active_clients_count || 0} clientes</span>
              </div>
              <Progress value={progress.pct} className="h-2" />
              {progress.next && <p className="text-xs text-muted-foreground">Faltam {progress.target - (agency.active_clients_count || 0)} para {progress.next}</p>}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Financeiro</p>
              <p className="text-sm">MRR Total: <span className="font-bold">R$ {((agency.mrr || 0) + (agency.platformRevenue || 0)).toFixed(2)}</span></p>
              <p className="text-sm">Plataforma: <span className="font-medium text-primary">R$ {(agency.platformRevenue || 0).toFixed(2)}</span></p>
              <p className="text-sm">Lucro Agência: <span className="font-medium">R$ {(agency.mrr || 0).toFixed(2)}</span></p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clients table */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Clientes ({clients.length})</h3>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Templates ativos</TableHead>
                  <TableHead>MRR</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cadastro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum cliente</TableCell></TableRow>
                ) : clients.map(c => {
                  const st = STATUS_MAP[c.status || ""] || STATUS_MAP.inactive;
                  return (
                    <TableRow key={c.id} className="cursor-pointer hover:bg-accent/50" onClick={() => onSelectClient(c)}>
                      <TableCell className="font-medium">{c.client_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.client_email || "—"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {c.templates.filter(t => ["active", "trial"].includes(t.status)).slice(0, 2).map(t => (
                            <Badge key={t.subscription_id} variant="outline" className="text-[10px]">{t.name}</Badge>
                          ))}
                          {c.templates.filter(t => ["active", "trial"].includes(t.status)).length > 2 && <Badge variant="outline" className="text-[10px]">+{c.templates.filter(t => ["active", "trial"].includes(t.status)).length - 2}</Badge>}
                          {c.templates.filter(t => ["active", "trial"].includes(t.status)).length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">R$ {c.mrr.toFixed(2)}</TableCell>
                      <TableCell><Badge className={`${st.cls} border-0 text-xs`}>{st.label}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{relativeDate(c.created_at)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Agency users */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Usuários da agência ({users.length})</h3>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Último acesso</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Nenhum usuário</TableCell></TableRow>
                ) : users.map(u => {
                  const cfg = ROLE_CONFIG[u.role as keyof typeof ROLE_CONFIG];
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{u.email || "—"}</TableCell>
                      <TableCell>{cfg ? <Badge className={`${cfg.bg} ${cfg.color} border-0 text-xs`}>{cfg.label}</Badge> : <Badge variant="secondary" className="text-xs">{u.role}</Badge>}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString("pt-BR") : "Nunca"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setEditTarget(u)}>Editar</Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <EditUserDialog open={!!editTarget} onClose={() => setEditTarget(null)} onSuccess={fetchData} user={editTarget as any} />
      <ResetPasswordDialog open={!!resetPwTarget} onClose={() => setResetPwTarget(null)} userId={resetPwTarget?.user_id || ""} userName={resetPwTarget?.full_name || resetPwTarget?.email || ""} />
    </div>
  );
};

/* ═══════════════════ LEVEL 3 — Client detail ═══════════════════ */

const Level3 = ({ agency, client, onSelectSubscription, onGoToAgency }: { agency: AgencyRow; client: ClientRow; onSelectSubscription: (s: SubscriptionDetail) => void; onGoToAgency: () => void }) => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("billing_events").select("id, event_type, amount, platform_amount, description, created_at, asaas_payment_id, subscription_id").eq("client_id", client.id).order("created_at", { ascending: false }).limit(20)
      .then(res => { setPayments(res.data || []); setLoading(false); });
  }, [client.id]);

  const st = STATUS_MAP[client.status || ""] || STATUS_MAP.inactive;
  const activeTemplates = client.templates.filter(t => ["active", "trial"].includes(t.status));

  const handleSelectTemplate = async (t: ClientRow["templates"][0]) => {
    // Fetch payment history for this specific subscription
    const res = await supabase.from("billing_events").select("id, created_at, amount, platform_amount, event_type, asaas_payment_id").eq("subscription_id", t.subscription_id).order("created_at", { ascending: false }).limit(20);
    onSelectSubscription({
      id: t.subscription_id, template_name: t.name, category: "—",
      agency_price: t.agency_price, platform_price: t.platform_price,
      agency_profit: t.agency_price - t.platform_price, status: t.status,
      channel: t.channel, activated_at: t.activated_at, created_at: null,
      payments: (res.data || []).map(p => ({ id: p.id, created_at: p.created_at, amount: p.amount || 0, platform_amount: p.platform_amount || 0, status: p.event_type, asaas_id: p.asaas_payment_id })),
    });
  };

  return (
    <div className="space-y-6">
      {/* Client info */}
      <Card>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h2 className="text-lg font-bold">{client.client_name}</h2>
              <p className="text-sm"><span className="text-muted-foreground">E-mail:</span> {client.client_email || "—"}</p>
              <p className="text-sm"><span className="text-muted-foreground">Telefone:</span> {client.client_phone || "—"}</p>
              <p className="text-sm"><span className="text-muted-foreground">Documento:</span> {client.client_document || "—"}</p>
              <Badge className={`${st.cls} border-0 text-xs`}>{st.label}</Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="text-muted-foreground">Agência:</span>{" "}
                <span className="text-blue-600 hover:underline cursor-pointer" onClick={onGoToAgency}>{agency.agency_name || "—"}</span>
              </p>
              <p className="text-sm"><span className="text-muted-foreground">MRR:</span> <span className="font-bold">R$ {client.mrr.toFixed(2)}</span></p>
              <p className="text-sm"><span className="text-muted-foreground">Receita plataforma:</span> <span className="font-medium text-primary">R$ {client.platformRevenue.toFixed(2)}</span></p>
              <p className="text-sm text-muted-foreground">Cadastro: {relativeDate(client.created_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Templates ativos ({activeTemplates.length})</h3>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template</TableHead>
                  <TableHead>Preço agência</TableHead>
                  <TableHead>Receita plataforma</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Ativado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {client.templates.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Nenhum template</TableCell></TableRow>
                ) : client.templates.map(t => {
                  const tSt = STATUS_MAP[t.status] || STATUS_MAP.inactive;
                  return (
                    <TableRow key={t.subscription_id} className="cursor-pointer hover:bg-accent/50" onClick={() => handleSelectTemplate(t)}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell>R$ {t.agency_price.toFixed(2)}</TableCell>
                      <TableCell className="text-primary font-medium">R$ {t.platform_price.toFixed(2)}</TableCell>
                      <TableCell><Badge className={`${tSt.cls} border-0 text-xs`}>{tSt.label}</Badge></TableCell>
                      <TableCell className="text-sm">{t.channel || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{relativeDate(t.activated_at)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Client workspace info */}
      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold mb-2">Acesso ao workspace</h3>
          {client.client_user_id ? (
            <p className="text-sm text-muted-foreground">Usuário vinculado: <span className="font-medium text-foreground">{client.client_user_id.slice(0, 8)}...</span></p>
          ) : (
            <p className="text-sm text-muted-foreground">Sem acesso ao workspace</p>
          )}
        </CardContent>
      </Card>

      {/* Payment history */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Histórico de pagamentos</h3>
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum evento registrado.</p>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Plataforma</TableHead>
                    <TableHead>Descrição</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="text-xs">{p.created_at ? new Date(p.created_at).toLocaleDateString("pt-BR") : "—"}</TableCell>
                      <TableCell>
                        <Badge className={`${(STATUS_MAP[p.event_type] || { cls: "bg-muted text-muted-foreground" }).cls} border-0 text-xs`}>
                          {p.event_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">R$ {(p.amount || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-primary">R$ {(p.platform_amount || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.description || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════ LEVEL 4 — Subscription detail ═══════════════════ */

const Level4 = ({ subscription }: { subscription: SubscriptionDetail }) => {
  const st = STATUS_MAP[subscription.status] || STATUS_MAP.inactive;

  return (
    <div className="space-y-6">
      {/* Subscription info */}
      <Card>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h2 className="text-lg font-bold">{subscription.template_name}</h2>
              <Badge className={`${st.cls} border-0 text-xs`}>{st.label}</Badge>
              <p className="text-sm"><span className="text-muted-foreground">Canal:</span> {subscription.channel || "—"}</p>
              <p className="text-sm"><span className="text-muted-foreground">Ativado em:</span> {relativeDate(subscription.activated_at)}</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Financeiro</p>
              <p className="text-sm">Preço agência: <span className="font-bold">R$ {subscription.agency_price.toFixed(2)}</span></p>
              <p className="text-sm">Receita plataforma: <span className="font-medium text-primary">R$ {subscription.platform_price.toFixed(2)}</span></p>
              <p className="text-sm">Lucro agência: <span className="font-medium">R$ {subscription.agency_profit.toFixed(2)}</span></p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment history for this subscription */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Histórico de pagamentos</h3>
        {subscription.payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum pagamento registrado.</p>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Receita plataforma</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Asaas ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscription.payments.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="text-xs">{p.created_at ? new Date(p.created_at).toLocaleDateString("pt-BR") : "—"}</TableCell>
                      <TableCell className="font-medium">R$ {p.amount.toFixed(2)}</TableCell>
                      <TableCell className="text-primary">R$ {p.platform_amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className={`${(STATUS_MAP[p.status] || { cls: "bg-muted text-muted-foreground" }).cls} border-0 text-xs`}>
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{p.asaas_id ? p.asaas_id.slice(0, 12) + "..." : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminGestaoTab;
