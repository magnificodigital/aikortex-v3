import { Project } from "@/types/project";
import { FolderKanban, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

interface Props {
  projects: Project[];
}

const ProjectMetrics = ({ projects }: Props) => {
  const totalTasks = projects.reduce((s, p) => s + p.tasks.length, 0);
  const doneTasks = projects.reduce((s, p) => s + p.tasks.filter((t) => t.status === "done").length, 0);
  const overdueTasks = projects.reduce(
    (s, p) => s + p.tasks.filter((t) => t.status !== "done" && new Date(t.dueDate) < new Date()).length,
    0
  );
  const activeProjects = projects.filter((p) => p.status === "active").length;

  const metrics = [
    { label: "Projetos Ativos", value: activeProjects, icon: FolderKanban, color: "text-primary" },
    { label: "Tarefas Concluídas", value: `${doneTasks}/${totalTasks}`, icon: CheckCircle2, color: "text-success" },
    { label: "Tarefas Atrasadas", value: overdueTasks, icon: AlertTriangle, color: "text-warning" },
    { label: "Taxa de Conclusão", value: `${totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0}%`, icon: Clock, color: "text-info" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {metrics.map((m) => (
        <div key={m.label} className="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg bg-muted flex items-center justify-center ${m.color}`}>
            <m.icon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">{m.value}</p>
            <p className="text-[11px] text-muted-foreground">{m.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProjectMetrics;
