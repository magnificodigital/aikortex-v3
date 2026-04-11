import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Building2, Users, DollarSign, LayoutTemplate, TrendingUp, ArrowDownRight, BarChart3, Activity } from "lucide-react";

const AdminOverviewTab = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAgencies: 0,
    totalClients: 0,
    platformMRR: 0,
    templatesSold: 0,
    newThisMonth: 0,
    churnRate: 0,
    avgTicket: 0,
    tierBreakdown: { starter: 0, explorer: 0, hack: 0 },
  });
  const [recentEvents, setRecentEvents] = useState<any[]>([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [agenciesRes, clientsRes, subsRes, eventsRes, allSubsRes] = await Promise.all([
        supabase.from("agency_profiles").select("id, tier, active_clients_count, created_at"),
        supabase.from("agency_clients").select("id, status, created_at, agency_id"),
        supabase.from("client_template_subscriptions").select("id, agency_id, platform_price_monthly, agency_price_monthly, status").in("status", ["active", "trial"]),
        supabase.from("billing_events").select("id, event_type, amount, platform_amount, agency_amount, agency_id, client_id, description, created_at").order("created_at", { ascending: false }).limit(10),
        supabase.from("client_template_subscriptions").select("id, status"),
      ]);

      const agencies = agenciesRes.data || [];
      const clients = clientsRes.data || [];
      const activeSubs = subsRes.data || [];
      const allSubs = allSubsRes.data || [];

      const activeClients = clients.filter(c => c.status === "active");
      const platformMRR = activeSubs.reduce((sum, s) => sum + (s.platform_price_monthly || 0), 0);

      // New this month
      const newAgencies = agencies.filter(a => a.created_at && a.created_at >= monthStart).length;
      const newClients = clients.filter(c => c.created_at && c.created_at >= monthStart).length;

      // Churn
      const cancelled = allSubs.filter(s => s.status === "cancelled").length;
      const churnRate = allSubs.length > 0 ? (cancelled / allSubs.length) * 100 : 0;

      // Avg ticket per agency
      const agencyMRR = new Map<string, number>();
      activeSubs.forEach(s => {
        agencyMRR.set(s.agency_id, (agencyMRR.get(s.agency_id) || 0) + (s.platform_price_monthly || 0));
      });
      const avgTicket = agencyMRR.size > 0 ? platformMRR / agencyMRR.size : 0;

      // Tier breakdown
      const tierBreakdown = { starter: 0, explorer: 0, hack: 0 };
      agencies.forEach(a => {
        if (a.tier in tierBreakdown) tierBreakdown[a.tier as keyof typeof tierBreakdown]++;
      });

      // Enrich events with names
      const agencyIds = [...new Set((eventsRes.data || []).map(e => e.agency_id).filter(Boolean))];
      const clientIds = [...new Set((eventsRes.data || []).map(e => e.client_id).filter(Boolean))];
      
      const [agencyNames, clientNames] = await Promise.all([
        agencyIds.length > 0 ? supabase.from("agency_profiles").select("id, agency_name").in("id", agencyIds) : { data: [] },
        clientIds.length > 0 ? supabase.from("agency_clients").select("id, client_name").in("id", clientIds) : { data: [] },
      ]);

      const agencyMap = new Map((agencyNames.data || []).map(a => [a.id, a.agency_name || "Sem nome"]));
      const clientMap = new Map((clientNames.data || []).map(c => [c.id, c.client_name]));

      const enrichedEvents = (eventsRes.data || []).map(e => ({
        ...e,
        agency_name: agencyMap.get(e.agency_id) || "—",
        client_name: clientMap.get(e.client_id) || "—",
      }));

      setStats({
        totalAgencies: agencies.length,
        totalClients: activeClients.length,
        platformMRR,
        templatesSold: activeSubs.length,
        newThisMonth: newAgencies + newClients,
        churnRate,
        avgTicket,
        tierBreakdown,
      });
      setRecentEvents(enrichedEvents);
    } catch {
      console.error("Error loading overview");
    }
    setLoading(false);
  };

  const eventStatusBadge = (type: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      payment_received: { label: "Pago", cls: "bg-green-500/10 text-green-600" },
      payment_failed: { label: "Falhou", cls: "bg-red-500/10 text-red-600" },
      subscription_created: { label: "Nova", cls: "bg-blue-500/10 text-blue-600" },
      subscription_cancelled: { label: "Cancelada", cls: "bg-muted text-muted-foreground" },
      refund: { label: "Reembolso", cls: "bg-yellow-500/10 text-yellow-600" },
    };
    const cfg = map[type] || { label: type, cls: "bg-muted text-muted-foreground" };
    return <Badge className={`${cfg.cls} border-0 text-xs`}>{cfg.label}</Badge>;
  };

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalAgencies}</p>
              <p className="text-xs text-muted-foreground">Agências ativas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <Users className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalClients}</p>
              <p className="text-xs text-muted-foreground">Clientes ativos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">R$ {stats.platformMRR.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">MRR da plataforma</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
              <LayoutTemplate className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.templatesSold}</p>
              <p className="text-xs text-muted-foreground">Templates vendidos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">
              <TrendingUp className="h-5 w-5 text-cyan-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.newThisMonth}</p>
              <p className="text-xs text-muted-foreground">Novos este mês</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
              <ArrowDownRight className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.churnRate.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">Taxa de churn</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <BarChart3 className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">R$ {stats.avgTicket.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">Ticket médio/agência</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-2">Agências por tier</p>
            <div className="flex gap-2">
              <Badge className="bg-muted text-muted-foreground border-0 text-xs">Starter {stats.tierBreakdown.starter}</Badge>
              <Badge className="bg-blue-500/10 text-blue-600 border-0 text-xs">Explorer {stats.tierBreakdown.explorer}</Badge>
              <Badge className="bg-purple-500/10 text-purple-600 border-0 text-xs">Hack {stats.tierBreakdown.hack}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="w-4 h-4" /> Atividade recente
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum evento registrado</p>
          ) : (
            <div className="divide-y divide-border">
              {recentEvents.map(e => (
                <div key={e.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{e.agency_name}</span>
                    <span className="text-muted-foreground"> — {e.client_name}</span>
                    {e.description && <span className="text-muted-foreground"> — {e.description}</span>}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {e.platform_amount != null && <span className="font-medium">R$ {Number(e.platform_amount).toFixed(2)}</span>}
                    {eventStatusBadge(e.event_type)}
                    <span className="text-xs text-muted-foreground">
                      {e.created_at ? new Date(e.created_at).toLocaleDateString("pt-BR") : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOverviewTab;
