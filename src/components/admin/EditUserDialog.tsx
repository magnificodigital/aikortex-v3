import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Pencil, Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface EditUserDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: {
    user_id: string;
    full_name: string | null;
    role: string;
    tenant_type: string;
    is_active: boolean;
    subscription?: { status: string; plan?: { name: string } | null } | null;
  } | null;
}

const allRoles = [
  { value: "platform_owner", label: "Dono da Plataforma" },
  { value: "platform_admin", label: "Admin da Plataforma" },
  { value: "agency_owner", label: "Dono da Agência" },
  { value: "agency_admin", label: "Admin da Agência" },
  { value: "agency_manager", label: "Gerente" },
  { value: "agency_member", label: "Membro" },
];

interface PlanOption {
  id: string;
  name: string;
  slug: string;
}

const EditUserDialog = ({ open, onClose, onSuccess, user }: EditUserDialogProps) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [planId, setPlanId] = useState<string>("none");
  const [billingCycle, setBillingCycle] = useState<string>("monthly");
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("info");

  // Load user email from auth via edge function
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    if (open && user) {
      setFullName(user.full_name || "");
      setRole(user.role);
      setIsActive(user.is_active);
      setPassword("");
      setShowPassword(false);
      setError("");
      setActiveTab("info");
      setEmail("");
      setUserEmail("");

      // Fetch plans
      supabase.from("plans").select("id, name, slug").eq("is_active", true).then(({ data }) => {
        setPlans(data || []);
      });

      // Fetch current subscription
      supabase.from("subscriptions").select("plan_id, billing_cycle").eq("user_id", user.user_id).maybeSingle().then(({ data }) => {
        setPlanId(data?.plan_id || "none");
        setBillingCycle(data?.billing_cycle || "monthly");
      });
    }
  }, [open, user]);

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    setError("");

    try {
      const body: Record<string, any> = { user_id: user.user_id };

      // Info tab
      if (fullName.trim() && fullName.trim() !== (user.full_name || "")) {
        body.full_name = fullName.trim();
      }
      if (email.trim()) body.email = email.trim();
      if (password) {
        if (password.length < 8) {
          setError("Senha deve ter no mínimo 8 caracteres");
          setLoading(false);
          return;
        }
        body.password = password;
      }

      // Role & status
      if (role !== user.role) body.role = role;
      if (isActive !== user.is_active) body.is_active = isActive;

      // Plan
      const currentPlanId = planId === "none" ? null : planId;
      body.plan_id = currentPlanId;
      body.billing_cycle = billingCycle;

      const { data, error: fnError } = await supabase.functions.invoke("update-user", { body });

      if (fnError || data?.error) {
        const errMsg = typeof data?.error === "string" ? data.error : JSON.stringify(data?.error);
        setError(errMsg || "Erro ao atualizar usuário");
        setLoading(false);
        return;
      }

      toast.success("Usuário atualizado com sucesso");
      onClose();
      onSuccess();
    } catch {
      setError("Erro ao atualizar usuário");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-5 h-5 text-primary" />
            Editar Usuário
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="info" className="flex-1 text-xs">Dados</TabsTrigger>
            <TabsTrigger value="access" className="flex-1 text-xs">Acesso</TabsTrigger>
            <TabsTrigger value="plan" className="flex-1 text-xs">Plano</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-4">
            <div>
              <Label>Nome completo</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nome completo" />
            </div>
            <div>
              <Label>Novo e-mail (deixe vazio para manter)</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="novo@email.com" />
            </div>
            <div>
              <Label>Nova senha (deixe vazio para manter)</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="access" className="space-y-4 mt-4">
            <div>
              <Label>Função/Papel</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {allRoles.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Conta ativa</Label>
                <p className="text-xs text-muted-foreground">Desativar impede o login do usuário</p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </TabsContent>

          <TabsContent value="plan" className="space-y-4 mt-4">
            <div>
              <Label>Plano</Label>
              <Select value={planId} onValueChange={setPlanId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem plano</SelectItem>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {planId !== "none" && (
              <div>
                <Label>Ciclo de cobrança</Label>
                <Select value={billingCycle} onValueChange={setBillingCycle}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;
