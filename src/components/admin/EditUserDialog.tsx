import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Pencil, Eye, EyeOff, Loader2, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TIER_CONFIG, type PartnerTier } from "@/types/partner";
import { FEATURE_FLAG_LABELS, TIER_FEATURE_CONFIG, type FeatureFlag } from "@/types/rbac";

interface EditUserDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: {
    user_id: string;
    full_name: string | null;
    email?: string | null;
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

const TIERS: PartnerTier[] = ["bronze", "prata", "gold"];

interface PlanOption {
  id: string;
  name: string;
  slug: string;
}

interface PartnerTierData {
  id: string;
  tier: string;
  clients_served: number;
  revenue: number;
  solutions_published: number;
  certifications_earned: number;
  notes: string | null;
}

const EditUserDialog = ({ open, onClose, onSuccess, user }: EditUserDialogProps) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [currentEmail, setCurrentEmail] = useState("");
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

  // Agency / Partner tier state
  const [partnerData, setPartnerData] = useState<PartnerTierData | null>(null);
  const [agencyTier, setAgencyTier] = useState<PartnerTier>("bronze");
  const [clientsServed, setClientsServed] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [solutionsPublished, setSolutionsPublished] = useState(0);
  const [certificationsEarned, setCertificationsEarned] = useState(0);
  const [tierNote, setTierNote] = useState("");

  const isAgencyUser = user?.role?.startsWith("agency_") ?? false;

  useEffect(() => {
    if (open && user) {
      setFullName(user.full_name || "");
      setRole(user.role);
      setIsActive(user.is_active);
      setPassword("");
      setShowPassword(false);
      setError("");
      setActiveTab("info");
      setEmail(user.email || "");
      setCurrentEmail(user.email || "");
      setPartnerData(null);

      // Fetch plans
      supabase.from("plans").select("id, name, slug").eq("is_active", true).then(({ data }) => {
        setPlans(data || []);
      });

      // Fetch current subscription
      supabase.from("subscriptions").select("plan_id, billing_cycle").eq("user_id", user.user_id).maybeSingle().then(({ data }) => {
        setPlanId(data?.plan_id || "none");
        setBillingCycle(data?.billing_cycle || "monthly");
      });

      // Fetch partner tier data
      supabase
        .from("partner_tiers" as any)
        .select("*")
        .eq("user_id", user.user_id)
        .maybeSingle()
        .then(({ data }: any) => {
          if (data) {
            setPartnerData(data);
            setAgencyTier(data.tier as PartnerTier);
            setClientsServed(data.clients_served ?? 0);
            setRevenue(Number(data.revenue) ?? 0);
            setSolutionsPublished(data.solutions_published ?? 0);
            setCertificationsEarned(data.certifications_earned ?? 0);
            setTierNote("");
          } else {
            setPartnerData(null);
            setAgencyTier("bronze");
            setClientsServed(0);
            setRevenue(0);
            setSolutionsPublished(0);
            setCertificationsEarned(0);
            setTierNote("");
          }
        });
    }
  }, [open, user]);

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    setError("");

    try {
      const body: Record<string, any> = { user_id: user.user_id };

      if (fullName.trim() && fullName.trim() !== (user.full_name || "")) {
        body.full_name = fullName.trim();
      }
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedCurrentEmail = currentEmail.trim().toLowerCase();
      if (normalizedEmail && normalizedEmail !== normalizedCurrentEmail) body.email = normalizedEmail;
      if (password) {
        if (password.length < 8) {
          setError("Senha deve ter no mínimo 8 caracteres");
          setLoading(false);
          return;
        }
        body.password = password;
      }

      if (role !== user.role) body.role = role;
      if (isActive !== user.is_active) body.is_active = isActive;

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

      // Save partner tier changes if agency user
      if (isAgencyUser || role?.startsWith("agency_")) {
        if (partnerData) {
          // Update existing
          await supabase
            .from("partner_tiers" as any)
            .update({
              tier: agencyTier,
              clients_served: clientsServed,
              revenue: revenue,
              solutions_published: solutionsPublished,
              certifications_earned: certificationsEarned,
              tier_upgraded_at: agencyTier !== partnerData.tier ? new Date().toISOString() : undefined,
              notes: tierNote || partnerData.notes,
            } as any)
            .eq("id", partnerData.id);
        } else {
          // Create new tier record
          await supabase
            .from("partner_tiers" as any)
            .insert({
              user_id: user.user_id,
              tier: agencyTier,
              clients_served: clientsServed,
              revenue: revenue,
              solutions_published: solutionsPublished,
              certifications_earned: certificationsEarned,
              notes: tierNote || null,
            } as any);
        }
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

  const currentTierFeatures = TIER_FEATURE_CONFIG[agencyTier]?.features ?? [];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
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
            <TabsTrigger value="agency" className="flex-1 text-xs">Agência</TabsTrigger>
          </TabsList>

          {/* Tab: Dados */}
          <TabsContent value="info" className="space-y-4 mt-4">
            <div>
              <Label>Nome completo</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nome completo" />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario@email.com" />
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

          {/* Tab: Acesso */}
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

          {/* Tab: Plano */}
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

          {/* Tab: Agência */}
          <TabsContent value="agency" className="space-y-4 mt-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Tier de Parceiro</span>
            </div>

            <div>
              <Label>Tier atual</Label>
              <Select value={agencyTier} onValueChange={(v) => setAgencyTier(v as PartnerTier)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIERS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {TIER_CONFIG[t].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Métricas da Agência</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Clientes atendidos</Label>
                  <Input type="number" min={0} value={clientsServed} onChange={(e) => setClientsServed(Number(e.target.value))} />
                </div>
                <div>
                  <Label className="text-xs">Faturamento (R$)</Label>
                  <Input type="number" min={0} value={revenue} onChange={(e) => setRevenue(Number(e.target.value))} />
                </div>
                <div>
                  <Label className="text-xs">Soluções publicadas</Label>
                  <Input type="number" min={0} value={solutionsPublished} onChange={(e) => setSolutionsPublished(Number(e.target.value))} />
                </div>
                <div>
                  <Label className="text-xs">Certificações</Label>
                  <Input type="number" min={0} value={certificationsEarned} onChange={(e) => setCertificationsEarned(Number(e.target.value))} />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Módulos Aikortex</p>
              <div className="flex flex-wrap gap-1.5">
                {(["module.agents", "module.flows", "module.apps", "module.templates", "module.messages", "module.broadcasts"] as FeatureFlag[]).map((flag) => {
                  const active = currentTierFeatures.includes(flag);
                  return (
                    <Badge key={flag} variant={active ? "default" : "outline"} className={`text-xs ${active ? "bg-primary/15 text-primary border-primary/20" : "opacity-50"}`}>
                      {active ? "✓" : "✗"} {FEATURE_FLAG_LABELS[flag]}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Módulos de Gestão</p>
              <div className="flex flex-wrap gap-1.5">
                {(["module.clients", "module.contracts", "module.sales", "module.crm", "module.meetings", "module.financial", "module.team", "module.tasks"] as FeatureFlag[]).map((flag) => {
                  const active = currentTierFeatures.includes(flag);
                  return (
                    <Badge key={flag} variant={active ? "default" : "outline"} className={`text-xs ${active ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/20" : "opacity-50"}`}>
                      {active ? "✓" : "✗"} {FEATURE_FLAG_LABELS[flag]}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Funcionalidades Avançadas</p>
              <div className="flex flex-wrap gap-1.5">
                {(["feature.ai_agents", "feature.voice_agents", "feature.saas_builder", "feature.advanced_automation", "feature.marketplace_access", "feature.custom_reports", "feature.api_access", "feature.white_label", "feature.event_speaker", "feature.media_participation"] as FeatureFlag[]).map((flag) => {
                  const active = currentTierFeatures.includes(flag);
                  return (
                    <Badge key={flag} variant={active ? "default" : "outline"} className={`text-xs ${active ? "bg-amber-500/15 text-amber-600 border-amber-500/20" : "opacity-50"}`}>
                      {active ? "✓" : "✗"} {FEATURE_FLAG_LABELS[flag]}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-xs">Nota interna (opcional)</Label>
              <Input
                value={tierNote}
                onChange={(e) => setTierNote(e.target.value)}
                placeholder="Motivo da alteração de tier..."
              />
            </div>
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
