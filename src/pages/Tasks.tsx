import DashboardLayout from "@/components/DashboardLayout";
import { CheckSquare } from "lucide-react";

const Tasks = () => (
  <DashboardLayout>
    <div className="p-6 lg:p-8 max-w-7xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <CheckSquare className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tarefas</h1>
          <p className="text-sm text-muted-foreground">Gestão de atividades da equipe</p>
        </div>
      </div>
      <div className="glass-card rounded-lg p-12 flex flex-col items-center justify-center text-center">
        <CheckSquare className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-2">Em breve</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Responsáveis, prazos, prioridades e status das tarefas.
        </p>
      </div>
    </div>
  </DashboardLayout>
);

export default Tasks;
