import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Users, UserPlus, Search, Eye } from "lucide-react";
import { ROLE_CONFIG, SystemRole } from "@/types/rbac";

interface UserRow {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  subscription?: { status: string; plan?: { name: string } | null } | null;
}

const AdminUsersTab = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("agency_member");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data: profiles } = await supabase.from("profiles").select("*");
    const { data: subs } = await supabase.from("subscriptions").select("user_id, status, plans:plan_id(name)") as any;

    const subMap: Record<string, any> = {};
    subs?.forEach((s: any) => { subMap[s.user_id] = { status: s.status, plan: s.plans }; });

    const merged = (profiles || []).map(p => ({
      ...p,
      subscription: subMap[p.user_id] || null,
    }));
    setUsers(merged);
    setLoading(false);
  };

  const getStatusBadge = (sub: UserRow["subscription"]) => {
    if (!sub) return <Badge variant="secondary" className="text-xs">Sem plano</Badge>;
    const colors: Record<string, string> = {
      trialing: "bg-yellow-500/10 text-yellow-600",
      active: "bg-green-500/10 text-green-600",
      past_due: "bg-red-500/10 text-red-600",
      canceled: "bg-muted text-muted-foreground",
      paused: "bg-orange-500/10 text-orange-600",
    };
    const labels: Record<string, string> = {
      trialing: "Trial", active: "Ativo", past_due: "Inadimplente", canceled: "Cancelado", paused: "Pausado",
    };
    return <Badge className={`${colors[sub.status] || ""} border-0 text-xs`}>{labels[sub.status] || sub.status}</Badge>;
  };

  const filtered = users.filter(u => {
    const matchSearch = !search || (u.full_name || "").toLowerCase().includes(search.toLowerCase());
    if (statusFilter === "all") return matchSearch;
    if (statusFilter === "no_plan") return matchSearch && !u.subscription;
    return matchSearch && u.subscription?.status === statusFilter;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 items-center flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar usuário..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="trialing">Em Trial</SelectItem>
              <SelectItem value="canceled">Cancelados</SelectItem>
              <SelectItem value="no_plan">Sem plano</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={() => setInviteOpen(true)}>
          <UserPlus className="w-4 h-4 mr-1.5" /> Convidar Usuário
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cadastro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhum usuário encontrado</TableCell></TableRow>
              ) : filtered.map(u => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                  <TableCell>{u.subscription?.plan?.name || "—"}</TableCell>
                  <TableCell>{getStatusBadge(u.subscription)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{new Date(u.created_at).toLocaleDateString("pt-BR")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Convidar Usuário</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>E-mail</Label>
              <Input placeholder="email@exemplo.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
            </div>
            <div>
              <Label>Papel</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(ROLE_CONFIG) as SystemRole[]).map(r => (
                    <SelectItem key={r} value={r}>{ROLE_CONFIG[r].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancelar</Button>
            <Button onClick={() => { toast.success("Convite enviado para " + inviteEmail); setInviteOpen(false); setInviteEmail(""); }}>Enviar Convite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsersTab;
