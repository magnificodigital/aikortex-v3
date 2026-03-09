import DashboardLayout from "@/components/DashboardLayout";
import { Handshake } from "lucide-react";

const Partners = () => (
  <DashboardLayout>
    <div className="p-6 lg:p-8 max-w-7xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Handshake className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Partners</h1>
          <p className="text-sm text-muted-foreground">Ecossistema de agências parceiras</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { title: "Treinamentos", desc: "IA aplicada, automação, vendas e operação" },
          { title: "Evolução", desc: "Bronze → Silver → Gold → Elite" },
          { title: "Certificações", desc: "Agência certificada, especialista IA" },
          { title: "Marketplace", desc: "Agentes, automações, templates e SaaS" },
          { title: "Comunidade", desc: "Grupos, discussões e eventos" },
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

export default Partners;
