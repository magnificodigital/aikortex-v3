import DashboardLayout from "@/components/DashboardLayout";
import { MessageSquare, Search, Inbox, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";

const AikortexMessages = () => {
  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Mensagens</h1>
              <p className="text-xs text-muted-foreground">Conversas dos seus agentes com leads e clientes</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar conversas..." className="pl-9" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total de conversas", value: "0", icon: MessageSquare },
            { label: "Não lidas", value: "0", icon: Inbox },
            { label: "Tempo médio resposta", value: "—", icon: Clock },
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
          <MessageSquare className="w-10 h-10 text-muted-foreground/40" />
          <h3 className="text-sm font-semibold text-foreground">Nenhuma mensagem ainda</h3>
          <p className="text-xs text-muted-foreground max-w-sm">
            As conversas dos seus agentes com leads e clientes aparecerão aqui em tempo real.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AikortexMessages;
