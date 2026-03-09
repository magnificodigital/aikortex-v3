import { Circle, AlertTriangle, Clock } from "lucide-react";

const tasks = [
  { title: "Configurar pipeline ML", project: "FinanceAI", due: "Hoje", status: "urgent" },
  { title: "Revisar contrato SalesUp", project: "SalesUp", due: "Hoje", status: "today" },
  { title: "Deploy chatbot v2", project: "TechCorp", due: "Amanhã", status: "upcoming" },
  { title: "Apresentação DataViz", project: "DataViz", due: "Atrasada", status: "overdue" },
  { title: "Integrar API pagamentos", project: "HealthPlus", due: "Hoje", status: "today" },
];

const statusConfig: Record<string, { icon: typeof Circle; color: string; bg: string }> = {
  urgent: { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
  overdue: { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
  today: { icon: Clock, color: "text-[hsl(var(--warning))]", bg: "bg-[hsl(var(--warning)/.1)]" },
  upcoming: { icon: Circle, color: "text-muted-foreground", bg: "bg-accent" },
};

const TaskOverview = () => (
  <div className="glass-card rounded-xl">
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/50">
      <h2 className="text-sm font-semibold text-foreground">Minhas Tarefas</h2>
      <div className="flex items-center gap-2">
        <span className="text-[10px] bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-medium">1 atrasada</span>
        <span className="text-[10px] bg-[hsl(var(--warning)/.1)] text-[hsl(var(--warning))] px-2 py-0.5 rounded-full font-medium">3 hoje</span>
      </div>
    </div>
    <div className="p-2 space-y-0.5">
      {tasks.map((t, i) => {
        const sc = statusConfig[t.status];
        return (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/50 transition-colors">
            <div className={`w-6 h-6 rounded-md flex items-center justify-center ${sc.bg}`}>
              <sc.icon className={`w-3 h-3 ${sc.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{t.title}</p>
              <p className="text-[10px] text-muted-foreground">{t.project}</p>
            </div>
            <span className={`text-[10px] font-medium ${sc.color}`}>{t.due}</span>
          </div>
        );
      })}
    </div>
  </div>
);

export default TaskOverview;
