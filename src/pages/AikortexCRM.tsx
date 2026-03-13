import DashboardLayout from "@/components/DashboardLayout";
import { Contact, Users, TrendingUp, BarChart3, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const AikortexCRM = () => {
  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[hsl(199,89%,48%)] flex items-center justify-center shadow-sm">
              <Contact className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">CRM</h1>
              <p className="text-xs text-muted-foreground">Gerencie leads e oportunidades</p>
            </div>
          </div>
          <Button className="gap-2"><Plus className="w-4 h-4" /> Novo Lead</Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Leads ativos", value: "0", icon: Users },
            { label: "Em negociação", value: "0", icon: TrendingUp },
            { label: "Taxa de conversão", value: "0%", icon: BarChart3 },
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
          <Contact className="w-10 h-10 text-muted-foreground/40" />
          <h3 className="text-sm font-semibold text-foreground">Nenhum lead cadastrado</h3>
          <p className="text-xs text-muted-foreground max-w-sm">
            Seus leads capturados pelos agentes de IA aparecerão aqui. Crie seus agentes primeiro na aba Agentes.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AikortexCRM;
