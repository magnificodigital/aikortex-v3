import DashboardLayout from "@/components/DashboardLayout";
import { Send, Plus, Users, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const AikortexBroadcasts = () => {
  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(280,70%,50%)] to-[hsl(300,60%,50%)] flex items-center justify-center shadow-sm">
              <Send className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Disparos</h1>
              <p className="text-xs text-muted-foreground">Envios em massa para leads e clientes</p>
            </div>
          </div>
          <Button className="gap-2"><Plus className="w-4 h-4" /> Novo Disparo</Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Disparos enviados", value: "0", icon: Send },
            { label: "Destinatários alcançados", value: "0", icon: Users },
            { label: "Taxa de abertura", value: "0%", icon: CheckCircle2 },
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
          <Send className="w-10 h-10 text-muted-foreground/40" />
          <h3 className="text-sm font-semibold text-foreground">Nenhum disparo realizado</h3>
          <p className="text-xs text-muted-foreground max-w-sm">
            Crie campanhas de disparo em massa via WhatsApp, Email ou outros canais conectados aos seus agentes.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AikortexBroadcasts;
