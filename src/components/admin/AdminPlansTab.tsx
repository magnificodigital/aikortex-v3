import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  is_active: boolean | null;
  is_featured: boolean | null;
  trial_days: number | null;
  features: any;
  limits: any;
}

const FEATURE_OPTIONS = [
  "Agentes de IA",
  "Flows de automação",
  "App Builder",
  "Templates",
  "Mensagens (WhatsApp/Web)",
  "Disparos em massa",
  "Clientes e Contratos",
  "Vendas e CRM",
  "Reuniões com vídeo",
  "Financeiro",
  "Equipe e Tarefas",
  "Agentes de Voz",
  "Automação Avançada",
  "Relatórios Customizados",
  "Acesso via API",
  "White-label",
  "Marketplace",
];

const LIMIT_FIELDS = [
  { key: "agents", label: "Máx. agentes" },
  { key: "flows", label: "Máx. fluxos" },
  { key: "contacts", label: "Máx. contatos" },
  { key: "team_members", label: "Máx. membros" },
  { key: "apps", label: "Máx. aplicativos" },
];

const emptyPlan = (): Partial<Plan> => ({
  name: "", slug: "", description: "", price_monthly: 0, price_yearly: 0,
  is_active: true, is_featured: false, trial_days: 7, features: [], limits: {},
});

const AdminPlansTab = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Plan>>(emptyPlan());

  useEffect(() => { fetchPlans(); }, []);

  const fetchPlans = async () => {
    setLoading(true);
    const { data } = await supabase.from("plans").select("*").order("price_monthly");
    setPlans((data as Plan[]) || []);
    setLoading(false);
  };

  const openNew = () => { setEditing(emptyPlan()); setSheetOpen(true); };
  const openEdit = (p: Plan) => { setEditing({ ...p }); setSheetOpen(true); };

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleSave = async () => {
    if (!editing.name || !editing.slug) { toast.error("Nome e slug são obrigatórios"); return; }
    const payload = {
      name: editing.name,
      slug: editing.slug,
      description: editing.description || null,
      price_monthly: editing.price_monthly || 0,
      price_yearly: editing.price_yearly || 0,
      is_active: editing.is_active ?? true,
      is_featured: editing.is_featured ?? false,
      trial_days: editing.trial_days ?? 7,
      features: editing.features || [],
      limits: editing.limits || {},
    };

    if (editing.id) {
      const { error } = await supabase.from("plans").update(payload).eq("id", editing.id);
      if (error) { toast.error("Erro ao atualizar plano"); return; }
      toast.success("Plano atualizado");
    } else {
      const { error } = await supabase.from("plans").insert(payload as any);
      if (error) { toast.error("Erro ao criar plano: " + error.message); return; }
      toast.success("Plano criado");
    }
    setSheetOpen(false);
    fetchPlans();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("plans").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir plano"); return; }
    toast.success("Plano excluído");
    fetchPlans();
  };

  const features = Array.isArray(editing.features) ? editing.features as string[] : [];
  const limits = (editing.limits || {}) as Record<string, number>;

  const toggleFeature = (f: string) => {
    const next = features.includes(f) ? features.filter(x => x !== f) : [...features, f];
    setEditing(prev => ({ ...prev, features: next }));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={openNew}><Plus className="w-4 h-4 mr-1.5" /> Novo Plano</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Mensal</TableHead>
                <TableHead>Anual</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Destaque</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : plans.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>R$ {Number(p.price_monthly).toFixed(2)}</TableCell>
                  <TableCell>R$ {Number(p.price_yearly).toFixed(2)}</TableCell>
                  <TableCell><Badge variant={p.is_active ? "default" : "secondary"} className="text-xs">{p.is_active ? "Ativo" : "Inativo"}</Badge></TableCell>
                  <TableCell>{p.is_featured ? "⭐" : "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
          <SheetHeader><SheetTitle>{editing.id ? "Editar Plano" : "Novo Plano"}</SheetTitle></SheetHeader>
          <div className="space-y-4 mt-4">
            <div><Label>Nome</Label><Input value={editing.name || ""} onChange={e => setEditing(prev => ({ ...prev, name: e.target.value, slug: prev.id ? prev.slug : generateSlug(e.target.value) }))} /></div>
            <div><Label>Slug</Label><Input value={editing.slug || ""} onChange={e => setEditing(prev => ({ ...prev, slug: e.target.value }))} /></div>
            <div><Label>Descrição</Label><Textarea value={editing.description || ""} onChange={e => setEditing(prev => ({ ...prev, description: e.target.value }))} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Preço mensal (R$)</Label><Input type="number" value={editing.price_monthly || 0} onChange={e => setEditing(prev => ({ ...prev, price_monthly: parseFloat(e.target.value) || 0 }))} /></div>
              <div><Label>Preço anual (R$)</Label><Input type="number" value={editing.price_yearly || 0} onChange={e => setEditing(prev => ({ ...prev, price_yearly: parseFloat(e.target.value) || 0 }))} /></div>
            </div>
            <div><Label>Dias de trial</Label><Input type="number" value={editing.trial_days ?? 7} onChange={e => setEditing(prev => ({ ...prev, trial_days: parseInt(e.target.value) || 0 }))} /></div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2"><Switch checked={editing.is_active ?? true} onCheckedChange={v => setEditing(prev => ({ ...prev, is_active: v }))} /><Label>Ativo</Label></div>
              <div className="flex items-center gap-2"><Switch checked={editing.is_featured ?? false} onCheckedChange={v => setEditing(prev => ({ ...prev, is_featured: v }))} /><Label>Destaque</Label></div>
            </div>

            <div>
              <Label className="mb-2 block">Funcionalidades do Plano</Label>
              <div className="space-y-2">
                {FEATURE_OPTIONS.map(f => (
                  <div key={f} className="flex items-center gap-2">
                    <Checkbox checked={features.includes(f)} onCheckedChange={() => toggleFeature(f)} />
                    <span className="text-sm">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Limites do Plano <span className="text-xs text-muted-foreground">(-1 = ilimitado)</span></Label>
              <div className="space-y-2">
                {LIMIT_FIELDS.map(l => (
                  <div key={l.key} className="flex items-center gap-3">
                    <Label className="w-32 text-xs">{l.label}</Label>
                    <Input type="number" className="w-24 h-8" value={limits[l.key] ?? 0} onChange={e => setEditing(prev => ({ ...prev, limits: { ...(prev.limits as any || {}), [l.key]: parseInt(e.target.value) } }))} />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={() => setSheetOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AdminPlansTab;
