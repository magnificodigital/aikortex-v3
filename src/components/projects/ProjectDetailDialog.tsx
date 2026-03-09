import { Project } from "@/types/project";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckSquare, Users, Calendar, Package, BarChart3,
  Clock, AlertTriangle, CheckCircle2
} from "lucide-react";

interface Props {
  project: Project | null;
  open: boolean;
  onClose: () => void;
}

const statusLabels: Record<string, string> = {
  planning: "Planejamento",
  active: "Ativo",
  paused: "Pausado",
  completed: "Concluído",
};

const statusColors: Record<string, string> = {
  planning: "bg-info/15 text-info",
  active: "bg-primary/15 text-primary",
  paused: "bg-warning/15 text-warning",
  completed: "bg-success/15 text-success",
};

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-info/15 text-info",
  high: "bg-warning/15 text-warning",
  urgent: "bg-destructive/15 text-destructive",
};

const taskStatusLabels: Record<string, string> = {
  todo: "A fazer",
  in_progress: "Em progresso",
  review: "Revisão",
  done: "Concluído",
};

const deliverableTypeLabels: Record<string, string> = {
  campaign: "Campanha",
  automation: "Automação",
  ai_agent: "Agente IA",
  website: "Website",
  saas: "SaaS",
};

const ProjectDetailDialog = ({ project, open, onClose }: Props) => {
  if (!project) return null;

  const doneTasks = project.tasks.filter((t) => t.status === "done").length;
  const overdueTasks = project.tasks.filter(
    (t) => t.status !== "done" && new Date(t.dueDate) < new Date()
  ).length;
  const inProgressTasks = project.tasks.filter((t) => t.status === "in_progress").length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle className="text-lg">{project.name}</DialogTitle>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[project.status]}`}>
              {statusLabels[project.status]}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{project.client} · {project.manager}</p>
        </DialogHeader>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-2">
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <BarChart3 className="w-4 h-4 mx-auto text-primary mb-1" />
            <p className="text-lg font-bold text-foreground">{project.progress}%</p>
            <p className="text-[10px] text-muted-foreground">Progresso</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <CheckCircle2 className="w-4 h-4 mx-auto text-success mb-1" />
            <p className="text-lg font-bold text-foreground">{doneTasks}/{project.tasks.length}</p>
            <p className="text-[10px] text-muted-foreground">Concluídas</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <AlertTriangle className="w-4 h-4 mx-auto text-warning mb-1" />
            <p className="text-lg font-bold text-foreground">{overdueTasks}</p>
            <p className="text-[10px] text-muted-foreground">Atrasadas</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <Users className="w-4 h-4 mx-auto text-info mb-1" />
            <p className="text-lg font-bold text-foreground">{project.team.length}</p>
            <p className="text-[10px] text-muted-foreground">Membros</p>
          </div>
        </div>

        <Progress value={project.progress} className="h-2" />

        <Tabs defaultValue="tasks" className="mt-2">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="tasks">Tarefas</TabsTrigger>
            <TabsTrigger value="deliverables">Entregáveis</TabsTrigger>
            <TabsTrigger value="team">Equipe</TabsTrigger>
            <TabsTrigger value="details">Detalhes</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-2 mt-3">
            {project.tasks.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-3 rounded-md border border-border bg-card p-3"
              >
                <CheckSquare className={`w-4 h-4 shrink-0 ${t.status === "done" ? "text-success" : "text-muted-foreground"}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${t.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {t.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{t.assignee} · {t.group}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${priorityColors[t.priority]}`}>
                  {t.priority}
                </span>
                <span className="text-[11px] text-muted-foreground hidden sm:block">
                  {new Date(t.dueDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                </span>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="deliverables" className="space-y-2 mt-3">
            {project.deliverables.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-3 rounded-md border border-border bg-card p-3"
              >
                <Package className="w-4 h-4 text-primary shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{d.title}</p>
                  <p className="text-[11px] text-muted-foreground">{deliverableTypeLabels[d.type]}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  d.status === "approved" ? "bg-success/15 text-success" :
                  d.status === "delivered" ? "bg-primary/15 text-primary" :
                  d.status === "in_progress" ? "bg-warning/15 text-warning" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {d.status === "approved" ? "Aprovado" : d.status === "delivered" ? "Entregue" : d.status === "in_progress" ? "Em progresso" : "Pendente"}
                </span>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="team" className="mt-3">
            <div className="space-y-2">
              <div className="flex items-center gap-3 rounded-md border border-border bg-card p-3">
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary">
                  {project.manager.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{project.manager}</p>
                  <p className="text-[11px] text-muted-foreground">Gerente de Projeto</p>
                </div>
              </div>
              {project.team.map((member) => (
                <div key={member} className="flex items-center gap-3 rounded-md border border-border bg-card p-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                    {member.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{member}</p>
                    <p className="text-[11px] text-muted-foreground">Membro da equipe</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="details" className="mt-3 space-y-3">
            <div className="rounded-md border border-border bg-card p-4 space-y-3">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Descrição</p>
                <p className="text-sm text-foreground mt-1">{project.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Início</p>
                  <p className="text-sm text-foreground mt-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(project.startDate).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Prazo</p>
                  <p className="text-sm text-foreground mt-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(project.deadline).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectDetailDialog;
