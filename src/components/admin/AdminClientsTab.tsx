import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Search, Loader2, RefreshCw } from "lucide-react";

interface ClientRow {
  id: string;
  client_name: string;
  client_email: string | null;
  status: string | null;
  created_at: string | null;
  agency_id: string;
  agency_name: string;
  templates_count: number;
  mrr: number;
}

interface Agency {
  id: string;
  agency_name: string | null;
}

const AdminClientsTab = () => {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [agencyFilter, setAgencyFilter] = useState("all");

  useEffect(() => { fetchClients(); }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const [clientsRes, agenciesRes, subsRes] = await Promise.all([
        supabase.from("agency_clients").select("id, client_name, client_email, status, created_at, agency_id"),
        supabase.from("agency_profiles").select("id, agency_name"),
        supabase.from("client_template_subscriptions").select("client_id, agency_price_monthly, status").in("status", ["active", "trial"]),
      ]);

      const agenciesMap = new Map<string, string>();
      (agenciesRes.data || []).forEach(a => agenciesMap.set(a.id, a.agency_name || "Sem nome"));
      setAgencies(agenciesRes.data || []);

      // Count templates and MRR per client
      const templateCount = new Map<string, number>();
      const mrrMap = new Map<string, number>();
      (subsRes.data || []).forEach(s => {
        templateCount.set(s.client_id, (templateCount.get(s.client_id) || 0) + 1);
        mrrMap.set(s.client_id, (mrrMap.get(s.client_id) || 0) + (s.agency_price_monthly || 0));
      });

      setClients((clientsRes.data || []).map(c => ({
        ...c,
        agency_name: agenciesMap.get(c.agency_id) || "—",
        templates_count: templateCount.get(c.id) || 0,
        mrr: mrrMap.get(c.id) || 0,
      })));
    } catch {
      toast.error("Erro ao carregar clientes");
    }
    setLoading(false);
  };

  const filtered = clients.filter(c => {
    const matchSearch = !search || c.client_name.toLowerCase().includes(search.toLowerCase()) || (c.client_email || "").toLowerCase().includes(search.toLowerCase());
    const matchAgency = agencyFilter === "all" || c.agency_id === agencyFilter;
    return matchSearch && matchAgency;
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center flex-wrap justify-between">
        <div className="flex gap-2 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar cliente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={agencyFilter} onValueChange={setAgencyFilter}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Agência" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as agências</SelectItem>
              {agencies.map(a => (
                <SelectItem key={a.id} value={a.id}>{a.agency_name || "Sem nome"}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" variant="outline" onClick={fetchClients} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Atualizar
        </Button>
      </div>

      <div className="text-xs text-muted-foreground">{filtered.length} cliente(s)</div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Agência</TableHead>
                <TableHead>Templates ativos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>MRR</TableHead>
                <TableHead>Cadastro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin inline mr-2" />Carregando...
                </TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum cliente encontrado</TableCell></TableRow>
              ) : filtered.map(c => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{c.client_name}</div>
                      {c.client_email && <div className="text-xs text-muted-foreground">{c.client_email}</div>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{c.agency_name}</TableCell>
                  <TableCell>{c.templates_count}</TableCell>
                  <TableCell>
                    <Badge variant={c.status === "active" ? "default" : "secondary"} className="text-xs">
                      {c.status === "active" ? "Ativo" : c.status === "suspended" ? "Suspenso" : c.status || "—"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">R$ {c.mrr.toFixed(2)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {c.created_at ? new Date(c.created_at).toLocaleDateString("pt-BR") : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminClientsTab;
