import { Project } from "@/types/project";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Users, FolderKanban } from "lucide-react";

interface Props {
  projects: Project[];
  onSelect: (p: Project) => void;
}

const columns: { status: Project["status"]; label: string; color: string }[] = [
  { status: "planning", label: "Planejamento", color: "bg-info/15 text-info" },
  { status: "active", label: "Ativo", color: "bg-primary/15 text-primary" },
  { status: "paused", label: "Pausado", color: "bg-warning/15 text-warning" },
  { status: "completed", label: "Concluído", color: "bg-success/15 text-success" },
];

const ProjectKanban = ({ projects, onSelect }: Props) => (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
    {columns.map((col) => {
      const items = projects.filter((p) => p.status === col.status);
      return (
        <div key={col.status} className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${col.color}`}>
              {col.label}
            </span>
            <span className="text-xs text-muted-foreground">{items.length}</span>
          </div>
          <div className="space-y-2">
            {items.map((p) => (
              <button
                key={p.id}
                onClick={() => onSelect(p)}
                className="w-full text-left rounded-lg border border-border bg-card p-3.5 hover:shadow-md transition-all hover:border-primary/30 space-y-2.5"
              >
                <p className="text-sm font-semibold text-foreground leading-tight">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.client}</p>
                <Progress value={p.progress} className="h-1.5" />
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {p.team.length}
                  </span>
                  <span className="flex items-center gap-1">
                    <FolderKanban className="w-3 h-3" />
                    {p.tasks.length}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(p.deadline).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                  </span>
                </div>
              </button>
            ))}
            {items.length === 0 && (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                Nenhum projeto
              </div>
            )}
          </div>
        </div>
      );
    })}
  </div>
);

export default ProjectKanban;
