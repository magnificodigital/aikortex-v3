import { type TaskEngineItem, STATUS_CONFIG, STATUSES, getProjectTasks, type UnifiedStatus } from "@/types/task-engine";
import { Progress } from "@/components/ui/progress";
import { Users, ListTodo, Calendar } from "lucide-react";

interface Props {
  projects: TaskEngineItem[];
  allItems: TaskEngineItem[];
  onSelect: (p: TaskEngineItem) => void;
}

const KANBAN_STATUSES: UnifiedStatus[] = ["planned", "in_progress", "review", "completed", "blocked"];

const ProjectKanban = ({ projects, allItems, onSelect }: Props) => (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
    {KANBAN_STATUSES.map((status) => {
      const cfg = STATUS_CONFIG[status];
      const items = projects.filter((p) => p.status === status);
      return (
        <div key={status} className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
              {cfg.label}
            </span>
            <span className="text-xs text-muted-foreground">{items.length}</span>
          </div>
          <div className="space-y-2">
            {items.map((p) => {
              const tasks = getProjectTasks(allItems, p.id);
              const done = tasks.filter((t) => t.status === "completed").length;
              const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
              return (
                <button
                  key={p.id}
                  onClick={() => onSelect(p)}
                  className="w-full text-left rounded-lg border border-border bg-card p-3.5 hover:shadow-md transition-all hover:border-primary/30 space-y-2.5"
                >
                  <p className="text-sm font-semibold text-foreground leading-tight">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{p.clientName}</p>
                  <Progress value={progress} className="h-1.5" />
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{p.team.length + 1}</span>
                    <span className="flex items-center gap-1"><ListTodo className="w-3 h-3" />{done}/{tasks.length}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(p.dueDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</span>
                  </div>
                </button>
              );
            })}
            {items.length === 0 && (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">Nenhum projeto</div>
            )}
          </div>
        </div>
      );
    })}
  </div>
);

export default ProjectKanban;
