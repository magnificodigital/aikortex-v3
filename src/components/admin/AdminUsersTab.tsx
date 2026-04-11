import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { UserPlus, Search, MoreHorizontal, Pencil, Trash2, Loader2, ShieldCheck, ShieldOff, KeyRound, Mail, RefreshCw } from "lucide-react";
import { ROLE_CONFIG } from "@/types/rbac";
import CreateUserDialog from "@/components/shared/CreateUserDialog";
import EditUserDialog from "@/components/admin/EditUserDialog";
import ResetPasswordDialog from "@/components/shared/ResetPasswordDialog";
import { useAuth } from "@/contexts/AuthContext";

interface UserRow {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  tenant_type: string;
  is_active: boolean;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  subscription?: { status: string; plan?: { name: string } | null; billing_cycle?: string } | null;
}

interface AgencyInfo {
  user_id: string;
  tier: string;
  active_clients_count: number | null;
}

const TIER_BADGES: Record<string, { label: string; className: string }> = {
  starter: { label: "Starter", className: "bg-muted text-muted-foreground" },
  explorer: { label: "Explorer", className: "bg-blue-500/10 text-blue-600" },
  hack: { label: "Hack", className: "bg-purple-500/10 text-purple-600" },
};

const getTierProgress = (tier: string, clients: number) => {
  if (tier === "hack") return null;
  if (tier === "explorer") return { target: 15, label: "Hack", remaining: Math.max(0, 15 - clients) };
  return { target: 5, label: "Explorer", remaining: Math.max(0, 5 - clients) };
};

const AdminUsersTab = () => {
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [agencies, setAgencies] = useState<AgencyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UserRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<UserRow | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [resetPwTarget, setResetPwTarget] = useState<UserRow | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setUsers([]);
      setLoading(false);
      return;
    }

    fetchUsers();
  }, [authLoading, user?.id]);

  const fetchUsers = async () => {
    if (authLoading || !user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("list-users");
      if (error || data?.error) {
        toast.error("Erro ao carregar usuários");
        setUsers([]);
      } else {
        setUsers(data?.users || []);
      }
    } catch {
      toast.error("Erro ao carregar usuários");
    }
    setLoading(false);
  };

  const getRoleBadge = (role: string) => {
    const config = ROLE_CONFIG[role as keyof typeof ROLE_CONFIG];
    if (!config) return <Badge variant="secondary" className="text-xs">{role}</Badge>;
    return <Badge className={`${config.bg} ${config.color} border-0 text-xs`}>{config.label}</Badge>;
  };

  const getStatusBadge = (sub: UserRow["subscription"], isActive: boolean) => {
    if (!isActive) return <Badge className="bg-red-500/10 text-red-600 border-0 text-xs">Inativo</Badge>;
    if (!sub) return <Badge variant="secondary" className="text-xs">Sem plano</Badge>;
    const colors: Record<string, string> = {
      trialing: "bg-yellow-500/10 text-yellow-600", active: "bg-green-500/10 text-green-600",
      past_due: "bg-red-500/10 text-red-600", canceled: "bg-muted text-muted-foreground",
      paused: "bg-orange-500/10 text-orange-600",
    };
    const labels: Record<string, string> = {
      trialing: "Trial", active: "Ativo", past_due: "Inadimplente", canceled: "Cancelado", paused: "Pausado",
    };
    return <Badge className={`${colors[sub.status] || ""} border-0 text-xs`}>{labels[sub.status] || sub.status}</Badge>;
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-user", { body: { user_id: deleteTarget.user_id } });
      if (error || data?.error) {
        toast.error(data?.error || "Erro ao excluir usuário");
      } else {
        toast.success("Usuário excluído com sucesso");
        setDeleteTarget(null);
        fetchUsers();
      }
    } catch { toast.error("Erro ao excluir usuário"); }
    finally { setDeleteLoading(false); }
  };

  const handleToggleActive = async () => {
    if (!toggleTarget) return;
    setToggleLoading(true);
    try {
      const newActive = !toggleTarget.is_active;
      const { data, error } = await supabase.functions.invoke("update-user", {
        body: { user_id: toggleTarget.user_id, is_active: newActive },
      });
      if (error || data?.error) {
        toast.error(data?.error || "Erro ao alterar status");
      } else {
        toast.success(newActive ? "Usuário ativado" : "Usuário desativado");
        setToggleTarget(null);
        fetchUsers();
      }
    } catch { toast.error("Erro ao alterar status"); }
    finally { setToggleLoading(false); }
  };

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase());
    
    let matchStatus = true;
    if (statusFilter === "active") matchStatus = u.is_active && u.subscription?.status === "active";
    else if (statusFilter === "trialing") matchStatus = u.subscription?.status === "trialing";
    else if (statusFilter === "canceled") matchStatus = u.subscription?.status === "canceled";
    else if (statusFilter === "inactive") matchStatus = !u.is_active;
    else if (statusFilter === "no_plan") matchStatus = !u.subscription;

    let matchRole = true;
    if (roleFilter !== "all") matchRole = u.role === roleFilter;

    return matchSearch && matchStatus && matchRole;
  });

  const isSelf = (u: UserRow) => u.user_id === user?.id;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 items-center flex-1 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou e-mail..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="trialing">Em Trial</SelectItem>
              <SelectItem value="canceled">Cancelados</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
              <SelectItem value="no_plan">Sem plano</SelectItem>
            </SelectContent>
          </Select>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Papel" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Papéis</SelectItem>
              <SelectItem value="platform_owner">Dono da Plataforma</SelectItem>
              <SelectItem value="platform_admin">Admin da Plataforma</SelectItem>
              <SelectItem value="agency_owner">Dono da Agência</SelectItem>
              <SelectItem value="agency_admin">Admin da Agência</SelectItem>
              <SelectItem value="agency_manager">Gerente</SelectItem>
              <SelectItem value="agency_member">Membro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={fetchUsers} disabled={loading || authLoading || !user}>
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Atualizar
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <UserPlus className="w-4 h-4 mr-1.5" /> Novo Usuário
          </Button>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        {filtered.length} de {users.length} usuário(s)
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Último login</TableHead>
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
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum usuário encontrado</TableCell></TableRow>
              ) : filtered.map(u => (
                <TableRow key={u.id} className={!u.is_active ? "opacity-50" : ""}>
                  <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.email || "—"}</TableCell>
                  <TableCell>{getRoleBadge(u.role)}</TableCell>
                  <TableCell>{u.subscription?.plan?.name || "—"}</TableCell>
                  <TableCell>{getStatusBadge(u.subscription, u.is_active)}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "Nunca"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {new Date(u.created_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditTarget(u)}>
                          <Pencil className="w-4 h-4 mr-2" /> Editar Usuário
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setResetPwTarget(u)}>
                          <KeyRound className="w-4 h-4 mr-2" /> Alterar Senha
                        </DropdownMenuItem>
                        {!isSelf(u) && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setToggleTarget(u)}>
                              {u.is_active ? (
                                <><ShieldOff className="w-4 h-4 mr-2" /> Desativar Conta</>
                              ) : (
                                <><ShieldCheck className="w-4 h-4 mr-2" /> Ativar Conta</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteTarget(u)}>
                              <Trash2 className="w-4 h-4 mr-2" /> Excluir Usuário
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CreateUserDialog open={createOpen} onClose={() => setCreateOpen(false)} onSuccess={fetchUsers} context="platform" />
      <EditUserDialog open={!!editTarget} onClose={() => setEditTarget(null)} onSuccess={fetchUsers} user={editTarget} />
      <ResetPasswordDialog
        open={!!resetPwTarget}
        onClose={() => setResetPwTarget(null)}
        userId={resetPwTarget?.user_id || ""}
        userName={resetPwTarget?.full_name || resetPwTarget?.email || ""}
      />

      {/* Toggle active dialog */}
      <AlertDialog open={!!toggleTarget} onOpenChange={(o) => !o && setToggleTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{toggleTarget?.is_active ? "Desativar" : "Ativar"} conta</AlertDialogTitle>
            <AlertDialogDescription>
              {toggleTarget?.is_active
                ? <>Tem certeza que deseja desativar <span className="font-medium">{toggleTarget?.full_name || toggleTarget?.email}</span>? O usuário não conseguirá mais acessar a plataforma.</>
                : <>Deseja reativar a conta de <span className="font-medium">{toggleTarget?.full_name || toggleTarget?.email}</span>?</>
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={toggleLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleActive} disabled={toggleLoading}>
              {toggleLoading && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              {toggleTarget?.is_active ? "Desativar" : "Ativar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <span className="font-medium">{deleteTarget?.full_name || deleteTarget?.email || "este usuário"}</span>?
              Esta ação é irreversível e removerá todos os dados associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} disabled={deleteLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteLoading && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminUsersTab;
