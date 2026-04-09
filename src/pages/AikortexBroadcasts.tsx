import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ModuleGate from "@/components/shared/ModuleGate";
import { Send, Plus, Users, CheckCircle2, Sparkles, AlertTriangle, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useCredits } from "@/hooks/use-credits";
import { useUserAgents } from "@/hooks/use-user-agents";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CREDITS_PER_AI_MSG = 5;

const AikortexBroadcasts = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [template, setTemplate] = useState("Olá {{name}}, ");
  const [contactsText, setContactsText] = useState("");
  const [useAI, setUseAI] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState("");
  const [lastResult, setLastResult] = useState<{ sent: number; failed: number; credits_used: number } | null>(null);

  const { balance, isLoading: creditsLoading } = useCredits();
  const { agents } = useUserAgents();

  const parsedContacts = contactsText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(",").map((p) => p.trim());
      return { phone: parts[0], name: parts[1] || parts[0] };
    });

  const contactCount = parsedContacts.length;
  const estimatedCredits = useAI ? contactCount * CREDITS_PER_AI_MSG : 0;
  const hasEnoughCredits = !useAI || balance >= estimatedCredits;

  const handleSend = async () => {
    if (!contactCount || !template.trim()) return;

    setSending(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const resp = await supabase.functions.invoke("batch-broadcast", {
        body: {
          contacts: parsedContacts,
          message_template: template,
          use_ai_personalization: useAI,
          agent_db_id: useAI ? selectedAgent : undefined,
        },
      });

      if (resp.error) throw new Error(resp.error.message);

      const result = resp.data;
      setLastResult(result);
      toast.success(`Disparo concluído: ${result.sent} enviados, ${result.failed} falhas`);
      setDialogOpen(false);
      setContactsText("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao realizar disparo");
    } finally {
      setSending(false);
    }
  };

  return (
    <ModuleGate moduleKey="aikortex.disparos">
      <DashboardLayout>
        <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Send className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Disparos</h1>
                <p className="text-xs text-muted-foreground">Envios em massa para leads e clientes</p>
              </div>
            </div>
            <Button className="gap-2" onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4" /> Novo Disparo
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Disparos enviados", value: lastResult ? String(lastResult.sent) : "0", icon: Send },
              { label: "Destinatários alcançados", value: lastResult ? String(lastResult.sent) : "0", icon: Users },
              { label: "Créditos usados", value: lastResult ? String(lastResult.credits_used) : "0", icon: Coins },
            ].map((m) => (
              <div key={m.label} className="rounded-xl border border-border bg-card p-5 space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <m.icon className="w-4 h-4" />
                  <span className="text-xs font-medium">{m.label}</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{m.value}</p>
              </div>
            ))}
          </div>

          {!lastResult && (
            <div className="rounded-xl border border-border bg-card p-12 flex flex-col items-center justify-center text-center space-y-3">
              <Send className="w-10 h-10 text-muted-foreground/40" />
              <h3 className="text-sm font-semibold text-foreground">Nenhum disparo realizado</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Crie campanhas de disparo em massa via WhatsApp, Email ou outros canais conectados aos seus agentes.
              </p>
            </div>
          )}
        </div>

        {/* Dialog Novo Disparo */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Novo Disparo</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Contatos */}
              <div className="space-y-2">
                <Label>Contatos (um por linha: telefone, nome)</Label>
                <Textarea
                  placeholder={"5511999990001, João\n5511999990002, Maria"}
                  rows={5}
                  value={contactsText}
                  onChange={(e) => setContactsText(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {contactCount} contato{contactCount !== 1 ? "s" : ""} detectado{contactCount !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Template */}
              <div className="space-y-2">
                <Label>Mensagem (use {"{{name}}"} para personalizar)</Label>
                <Textarea
                  rows={3}
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  placeholder="Olá {{name}}, temos uma oferta especial para você!"
                />
              </div>

              {/* IA Toggle */}
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Personalizar com IA</p>
                    <p className="text-xs text-muted-foreground">Cada mensagem será reescrita pelo agente</p>
                  </div>
                </div>
                <Switch checked={useAI} onCheckedChange={setUseAI} />
              </div>

              {/* Agent selector + estimativa */}
              {useAI && (
                <div className="space-y-3 rounded-lg border border-border p-3 bg-muted/30">
                  <div className="space-y-1.5">
                    <Label>Agente de personalização</Label>
                    <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar agente" />
                      </SelectTrigger>
                      <SelectContent>
                        {agents.map((a) => (
                          <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Estimativa:</span>
                    <Badge variant="secondary">{estimatedCredits} créditos para {contactCount} contatos</Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Saldo atual:</span>
                    <span className={`font-medium ${hasEnoughCredits ? "text-foreground" : "text-destructive"}`}>
                      {creditsLoading ? "..." : `${balance} créditos`}
                    </span>
                  </div>

                  {!hasEnoughCredits && (
                    <div className="flex items-center gap-2 text-xs text-destructive">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Saldo insuficiente. Recarregue seus créditos antes de continuar.
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button
                onClick={handleSend}
                disabled={sending || !contactCount || !template.trim() || (useAI && !selectedAgent) || !hasEnoughCredits}
                className="gap-2"
              >
                {sending ? "Enviando..." : <><Send className="w-4 h-4" /> Enviar Disparo</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ModuleGate>
  );
};

export default AikortexBroadcasts;
