import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Search, Loader2, RefreshCw, Building2, Eye, CheckCircle, XCircle } from "lucide-react";

interface AgencyRow {
  id: string;
  user_id: string;
  agency_name: string | null;
  logo_url: string | null;
  tier: string;
  active_clients_count: number | null;
  asaas_api_key: string | null;
  asaas_wallet_id: string | null;
  created_at: string | null;
  email?: string;
  mrr?: number;
  platformRevenue?: number;
}

interface ClientDetail {
  id: string;
  client_name: string;
  client_email: string | null;
  status: string | null;
  created_at: string | null;
  templates_count: number;
  mrr: number;
}

interface TemplateSub {
  template_name: string;
  client_name: string;
  agency_price: number;
  platform_price: number;
  status: string;
  channel: string | null;
}

const TIER_BADGES: Record<string, { label: string; className: string }> = {
  starter: { label: "Starter", className: "bg-muted text-muted-foreground" },
  explorer: { label: "Explorer", className: "bg-blue-500/10 text-blue-600" },
  hack: { label: "Hack", className: "bg-purple-500/10 text-purple-600" },
};

const getTierProgress = (tier: string, clients: number) => {
  if (tier === "hack") return { target: 15, pct: 100 };
  if (tier === "explorer") return { target: 15, pct: Math.min(100, (clients / 15) * 100) };
  return { target: 5, pct: Math.min(100, (clients / 5) * 100) };
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

const AdminAgenciesTab = () => {
  const [agencies, setAgencies] = useState<AgencyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedAgency, setSelectedAgency] = useState<AgencyRow | null>(null);
  const [detailClients, setDetailClients] = useState<ClientDetail[]>([]);
  const [detailTemplates, setDetailTemplates] = useState<TemplateSub[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => { fetchAgencies(); }, []);

  const fetchAgencies = async () => {
    setLoading(true);
    try {
      const [agenciesRes, subsRes, usersData] = await Promise.all([
        supabase.from("agency_profiles").select("id, user_id, agency_name, logo_url, tier, active_clients_count, asaas_api_key, asaas_wallet_id, created_at"),
        supabase.from("client_template_subscriptions").select("agency_id, agency_price_monthly, platform_price_monthly, status").in("status", ["active", "trial"]),
        supabase.functions.invoke("admin-get-users"),
      ]);

      const usersMap = new Map<string, string>();
      (usersData?.data?.users || []).forEach((u: any) => usersMap.set(u.user_id, u.email || ""));

      const mrrMap = new Map<string, number>();
      const platformMap = new Map<string, number>();
      (subsRes.data || []).forEach((s: any) => {
        mrrMap.set(s.agency_id, (mrrMap.get(s.agency_id) || 0) + ((s.agency_price_monthly || 0) - (s.platform_price_monthly || 0)));
        platformMap.set(s.agency_id, (platformMap.get(s.agency_id) || 0) + (s.platform_price_monthly || 0));
      });

      setAgencies((agenciesRes.data || []).map(a => ({
        ...a,
        email: usersMap.get(a.user_id) || "",
        mrr: mrrMap.get(a.id) || 0,
        platformRevenue: platformMap.get(a.id) || 0,
      })));
    } catch {
      toast.error("Erro ao carregar agências");
    }
    setLoading(false);
  };

  const openDetail = async (agency: AgencyRow) => {
    setSelectedAgency(agency);
    setDetailLoading(true);

    const [clientsRes, subsRes, templatesRes] = await Promise.all([
      supabase.from("agency_clients").select("id, client_name, client_email, status, created_at").eq("agency_id", agency.id).order("created_at", { ascending: false }),
      supabase.from("client_template_subscriptions").select("client_id, template_id, agency_price_monthly, platform_price_monthly, status, activated_channel").eq("agency_id", agency.id).in("status", ["active", "trial"]),
      supabase.from("platform_templates").select("id, name"),
    ]);

    const templateMap = new Map((templatesRes.data || []).map(t => [t.id, t.name]));
    const clientsMap = new Map<string, string>();
    (clientsRes.data || []).forEach(c => clientsMap.set(c.id, c.client_name));

    // Enrich clients
    const clientTemplateCount = new Map<string, number>();
    const clientMRR = new Map<string, number>();
    (subsRes.data || []).forEach(s => {
      clientTemplateCount.set(s.client_id, (clientTemplateCount.get(s.client_id) || 0) + 1);
      clientMRR.set(s.client_id, (clientMRR.get(s.client_id) || 0) + (s.agency_price_monthly || 0));
    });

    setDetailClients((clientsRes.data || []).map(c => ({
      ...c,
      templates_count: clientTemplateCount.get(c.id) || 0,
      mrr: clientMRR.get(c.id) || 0,
    })));

    setDetailTemplates((subsRes.data || []).map(s => ({
      template_name: templateMap.get(s.template_id) || "—",
      client_name: clientsMap.get(s.client_id) || "—",
      agency_price: s.agency_price_monthly || 0,
      platform_price: s.platform_price_monthly || 0,
      status: s.status || "—",
      channel: s.activated_channel,
    })));

    setDetailLoading(false);
  };

  const filtered = agencies.filter(a => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (a.agency_name || "").toLowerCase().includes(s) || (a.email || "").toLowerCase().includes(s);
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center justify-between">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar agência..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button size="sm" variant="outline" onClick={fetchAgencies} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Atualizar
        </Button>
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
                <TableHead>Clientes ativos</TableHead>
                <TableHead>MRR Agência</TableHead>
                <TableHead>Asaas</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin inline mr-2" />Carregando...
                </TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhuma agência encontrada</TableCell></TableRow>
              ) : filtered.map(a => {
                const tier = TIER_BADGES[a.tier] || TIER_BADGES.starter;
                const progress = getTierProgress(a.tier, a.active_clients_count || 0);
                const nextTier = a.tier === "starter" ? "Explorer" : a.tier === "explorer" ? "Hack" : null;
                return (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {a.logo_url ? (
                          <img src={a.logo_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                            <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                        )}
                        <span className="font-medium">{a.agency_name || "Sem nome"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{a.email || "—"}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge className={`${tier.className} border-0 text-xs`}>{tier.label}</Badge>
                        {nextTier && (
                          <div className="text-[10px] text-muted-foreground">
                            {a.active_clients_count || 0}/{progress.target} → {nextTier}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{a.active_clients_count || 0}</TableCell>
                    <TableCell className="font-medium">R$ {(a.mrr || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      {a.asaas_api_key ? (
                        <Badge className="bg-green-500/10 text-green-600 border-0 text-xs"><CheckCircle className="w-3 h-3 mr-1" />Conectado</Badge>
                      ) : (
                        <Badge className="bg-red-500/10 text-red-500 border-0 text-xs"><XCircle className="w-3 h-3 mr-1" />Não configurado</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{relativeDate(a.created_at)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="text-xs" onClick={() => openDetail(a)}>
                        <Eye className="w-4 h-4 mr-1" /> Ver detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail side panel */}
      <Sheet open={!!selectedAgency} onOpenChange={o => !o && setSelectedAgency(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {selectedAgency?.agency_name || "Agência"}
            </SheetTitle>
          </SheetHeader>

          {selectedAgency && (
            <div className="space-y-5 mt-4">
              {/* Basic info */}
              <div className="space-y-2">
                <p className="text-sm"><span className="text-muted-foreground">E-mail:</span> {selectedAgency.email || "—"}</p>
                <div className="flex items-center gap-2">
                  <Badge className={`${TIER_BADGES[selectedAgency.tier]?.className} border-0`}>
                    {TIER_BADGES[selectedAgency.tier]?.label}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{selectedAgency.active_clients_count || 0} clientes ativos</span>
                </div>
                <Progress value={getTierProgress(selectedAgency.tier, selectedAgency.active_clients_count || 0).pct} className="h-2" />
                {selectedAgency.asaas_wallet_id && (
                  <p className="text-xs text-muted-foreground">Asaas Wallet: {selectedAgency.asaas_wallet_id.slice(0, 8)}••••</p>
                )}
              </div>

              <Separator />

              {/* Financial summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-lg font-bold">R$ {((selectedAgency.mrr || 0) + (selectedAgency.platformRevenue || 0)).toFixed(0)}</p>
                  <p className="text-[10px] text-muted-foreground">MRR Total</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">R$ {(selectedAgency.platformRevenue || 0).toFixed(0)}</p>
                  <p className="text-[10px] text-muted-foreground">Receita Plataforma</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">R$ {(selectedAgency.mrr || 0).toFixed(0)}</p>
                  <p className="text-[10px] text-muted-foreground">Lucro Agência</p>
                </div>
              </div>

              <Separator />

              {/* Clients */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Clientes ({detailClients.length})</h3>
                {detailLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : detailClients.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum cliente.</p>
                ) : (
                  <div className="space-y-2">
                    {detailClients.map(c => (
                      <div key={c.id} className="flex items-center justify-between text-sm border rounded-md px-3 py-2">
                        <div>
                          <p className="font-medium">{c.client_name}</p>
                          <p className="text-xs text-muted-foreground">{c.templates_count} template(s)</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={c.status === "active" ? "default" : "secondary"} className="text-xs">
                            {c.status === "active" ? "Ativo" : c.status || "—"}
                          </Badge>
                          <p className="text-xs font-medium mt-1">R$ {c.mrr.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Templates */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Templates ativos ({detailTemplates.length})</h3>
                {detailTemplates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum template ativo.</p>
                ) : (
                  <div className="space-y-2">
                    {detailTemplates.map((t, i) => (
                      <div key={i} className="text-sm border rounded-md px-3 py-2">
                        <div className="flex justify-between">
                          <span className="font-medium">{t.template_name}</span>
                          <Badge variant="secondary" className="text-xs">{t.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t.client_name} · Agência: R${t.agency_price.toFixed(2)} · Plataforma: R${t.platform_price.toFixed(2)}
                          {t.channel && ` · ${t.channel}`}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AdminAgenciesTab;
