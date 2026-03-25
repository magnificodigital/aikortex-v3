import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Workflow, Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import FlowCanvas from "@/components/flows/FlowCanvas";
import { Input } from "@/components/ui/input";

const AikortexAutomations = () => {
  const [isBuilding, setIsBuilding] = useState(false);
  const [flowName, setFlowName] = useState("Novo Fluxo");

  if (isBuilding) {
    return (
      <DashboardLayout>
        <div className="flex flex-col h-[calc(100vh-64px)]">
          {/* Top bar */}
          <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-card/50 backdrop-blur-sm flex-shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsBuilding(false)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
              <Workflow className="w-3.5 h-3.5 text-primary" />
            </div>
            <Input
              value={flowName}
              onChange={(e) => setFlowName(e.target.value)}
              className="h-8 w-[240px] text-sm font-medium bg-transparent border-transparent hover:border-border focus:border-border"
            />
          </div>
          {/* Canvas */}
          <div className="flex-1 overflow-hidden">
            <FlowCanvas />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Workflow className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Flows</h1>
              <p className="text-xs text-muted-foreground">Construtor visual de fluxos de automação</p>
            </div>
          </div>
          <Button className="gap-2" onClick={() => setIsBuilding(true)}>
            <Plus className="w-4 h-4" /> Novo Fluxo
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card p-12 flex flex-col items-center justify-center text-center space-y-3">
          <Workflow className="w-10 h-10 text-muted-foreground/40" />
          <h3 className="text-sm font-semibold text-foreground">Nenhum fluxo criado</h3>
          <p className="text-xs text-muted-foreground max-w-sm">
            Crie fluxos visuais arrastando blocos como mensagens, condições, agentes IA, integrações e muito mais. Conecte-os para criar automações poderosas.
          </p>
          <Button variant="outline" className="gap-2 mt-2" onClick={() => setIsBuilding(true)}>
            <Plus className="w-4 h-4" /> Criar primeiro fluxo
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AikortexAutomations;
