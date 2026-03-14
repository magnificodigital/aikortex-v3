import DashboardLayout from "@/components/DashboardLayout";
import { Workflow, Plus, Zap, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const AikortexAutomations = () => {
  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Workflow className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Automações</h1>
              <p className="text-xs text-muted-foreground">Fluxos automatizados de trabalho</p>
            </div>
          </div>
          <Button className="gap-2"><Plus className="w-4 h-4" /> Nova Automação</Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Automações ativas", value: "0", icon: Zap },
            { label: "Execuções hoje", value: "0", icon: Clock },
            { label: "Taxa de sucesso", value: "0%", icon: CheckCircle2 },
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

        <div className="rounded-xl border border-border bg-card p-12 flex flex-col items-center justify-center text-center space-y-3">
          <Workflow className="w-10 h-10 text-muted-foreground/40" />
          <h3 className="text-sm font-semibold text-foreground">Nenhuma automação criada</h3>
          <p className="text-xs text-muted-foreground max-w-sm">
            Crie fluxos de automação para conectar seus agentes com ações automáticas como envio de emails, notificações e atualizações de CRM.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AikortexAutomations;
