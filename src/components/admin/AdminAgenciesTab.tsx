import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, Loader2, RefreshCw, Building2, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface AgencyRow {
  id: string;
  user_id: string;
  agency_name: string | null;
  tier: string;
  active_clients_count: number | null;
  created_at: string | null;
  email?: string;
  mrr?: number;
}

interface ClientRow {
  id: string;
  client_name: string;
  client_email: string | null;
  status: string | null;
  created_at: string | null;
}

const TIER_BADGES: Record<string, { label: string; className: string }> = {
  starter: { label: "Starter", className: "bg-muted text-muted-foreground" },
  explorer: { label: "Explorer", className: "bg-blue-500/10 text-blue-600" },
  hack: { label: "Hack", className: "bg-purple-500/10 text-purple-600" },
};

const AdminAgenciesTab = () => {
  const [agencies, setAgencies] = useState<AgencyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [detailAgency, setDetailAgency] = useState<AgencyRow | null>(null);
  const [detailClients, setDetailClients] = useState<ClientRow[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => { fetchAgencies(); }, []);

  const fetchAgencies = async () => {
    setLoading(true);
    try {
      const { data: agencyProfiles } = await supabase
        .from("agency_profiles")
        .select("id, user_id, agency_name, tier, active_clients_count, created_at");

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", (agencyProfiles || []).map(a => a.user_id));

      // Get emails from admin-get-users
      const { data: usersData } = await supabase.functions.invoke("admin-get-users");
      const usersMap = new Map<string, string>();
      (usersData?.users || []).forEach((u: any) => usersMap.set(u.user_id, u.email || ""));

      // Get MRR per agency
      const { data: subs } = await supabase
        .from("client_template_subscriptions")
        .select("agency_id, agency_price_monthly, status")
        .in("status", ["active", "trial"]);

      const mrrMap = new Map<string, number>();
      (subs || []).forEach((s: any) => {
        const current = mrrMap.get(s.agency_id) || 0;
        mrrMap.set(s.agency_id, current + (s.agency_price_monthly || 0));
      });

      setAgencies((agencyProfiles || []).map(a => ({
        ...a,
        email: usersMap.get(a.user_id) || "",
        mrr: mrrMap.get(a.id) || 0,
      })));
    } catch {
      toast.error("Erro ao carregar agências");
    }
    setLoading(false);
  };

  const openDetail = async (agency: AgencyRow) => {
    setDetailAgency(agency);
    setDetailLoading(true);
    const { data } = await supabase
      .from("agency_clients")
      .select("id, client_name, client_email, status, created_at")
      .eq("agency_id", agency.id)
      .order("created_at", { ascending: false });
    setDetailClients(data || []);
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
                <TableHead>MRR</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin inline mr-2" />Carregando...
                </TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma agência encontrada</TableCell></TableRow>
              ) : filtered.map(a => {
                const tier = TIER_BADGES[a.tier] || TIER_BADGES.starter;
                return (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.agency_name || "Sem nome"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{a.email || "—"}</TableCell>
                    <TableCell><Badge className={`${tier.className} border-0 text-xs`}>{tier.label}</Badge></TableCell>
                    <TableCell>{a.active_clients_count || 0}</TableCell>
                    <TableCell className="font-medium">R$ {(a.mrr || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {a.created_at ? new Date(a.created_at).toLocaleDateString("pt-BR") : "—"}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetail(a)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Agency detail dialog */}
      <Dialog open={!!detailAgency} onOpenChange={o => !o && setDetailAgency(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {detailAgency?.agency_name || "Agência"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-3 flex-wrap">
              <Badge className={`${TIER_BADGES[detailAgency?.tier || "starter"]?.className} border-0`}>
                {TIER_BADGES[detailAgency?.tier || "starter"]?.label}
              </Badge>
              <span className="text-sm text-muted-foreground">{detailAgency?.active_clients_count || 0} clientes ativos</span>
              <span className="text-sm font-medium">MRR: R$ {(detailAgency?.mrr || 0).toFixed(2)}</span>
            </div>

            <h3 className="text-sm font-semibold">Clientes desta agência</h3>
            {detailLoading ? (
              <div className="text-center py-4"><Loader2 className="w-5 h-5 animate-spin inline" /></div>
            ) : detailClients.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum cliente cadastrado.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cadastro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detailClients.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.client_name}</TableCell>
                      <TableCell className="text-muted-foreground">{c.client_email || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={c.status === "active" ? "default" : "secondary"} className="text-xs">
                          {c.status === "active" ? "Ativo" : c.status || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString("pt-BR") : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAgenciesTab;
