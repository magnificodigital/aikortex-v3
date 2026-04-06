import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { UserPlus, Search, MoreHorizontal, Key } from "lucide-react";
import { ROLE_CONFIG } from "@/types/rbac";
import CreateUserDialog from "@/components/shared/CreateUserDialog";
import ResetPasswordDialog from "@/components/shared/ResetPasswordDialog";

interface UserRow {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  tenant_type: string;
  is_active: boolean;
  created_at: string;
  subscription?: { status: string; plan?: { name: string } | null } | null;
}

const AdminUsersTab = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<{ userId: string; name: string } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data: profiles } = await supabase.from("profiles").select("*");
    const { data: subs } = await supabase.from("subscriptions").select("user_id, status, plans:plan_id(name)") as any;

    const subMap: Record<string, any> = {};
    subs?.forEach((s: any) => { subMap[s.user_id] = { status: s.status, plan: s.plans }; });

    const merged = (profiles || []).map((p: any) => ({
      ...p,
      subscription: subMap[p.user_id] || null,
    }));
    setUsers(merged);
    setLoading(false);
  };

  const getRoleBadge = (role: string) => {
    const config = ROLE_CONFIG[role as keyof typeof ROLE_CONFIG];
    if (!config) return <Badge variant="secondary" className="text-xs">{role}</Badge>;
    return <Badge className={`${config.bg} ${config.color} border-0 text-xs`}>{config.label}</Badge>;
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
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <UserPlus className="w-4 h-4 mr-1.5" /> Novo Usuário
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum usuário encontrado</TableCell></TableRow>
              ) : filtered.map(u => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                  <TableCell>{getRoleBadge(u.role)}</TableCell>
                  <TableCell>{u.subscription?.plan?.name || "—"}</TableCell>
                  <TableCell>{getStatusBadge(u.subscription)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{new Date(u.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setResetTarget({ userId: u.user_id, name: u.full_name || "Usuário" })}>
                          <Key className="w-4 h-4 mr-2" /> Redefinir Senha
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CreateUserDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={fetchUsers}
        context="platform"
      />

      {resetTarget && (
        <ResetPasswordDialog
          open={!!resetTarget}
          onClose={() => setResetTarget(null)}
          userId={resetTarget.userId}
          userName={resetTarget.name}
        />
      )}
    </div>
  );
};

export default AdminUsersTab;
