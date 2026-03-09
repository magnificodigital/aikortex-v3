import DashboardLayout from "@/components/DashboardLayout";
import { Bot } from "lucide-react";

const Aikortex = () => (
  <DashboardLayout>
    <div className="p-6 lg:p-8 max-w-7xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Bot className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Aikortex</h1>
          <p className="text-sm text-muted-foreground">Motor de automação, CRM e agentes IA</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { title: "CRM", desc: "Gestão de leads e pipelines de vendas" },
          { title: "Automação", desc: "Automação de marketing e processos" },
          { title: "Agentes de IA", desc: "Criação e gestão de agentes inteligentes" },
          { title: "Mensagens", desc: "Central de comunicação multicanal" },
        ].map((item) => (
          <div key={item.title} className="glass-card rounded-lg p-5">
            <h3 className="text-sm font-semibold text-foreground mb-1">{item.title}</h3>
            <p className="text-xs text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </DashboardLayout>
);

export default Aikortex;
