import { TaskEngineItem, STATUS_CONFIG, PRIORITY_CONFIG, STATUSES, getChildren } from "@/types/task-engine";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  items: TaskEngineItem[];
  onItemClick: (item: TaskEngineItem) => void;
}

const UnifiedKanban = ({ items, onItemClick }: Props) => {
  const tasks = items.filter((i) => i.task_type === "task");

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {STATUSES.map((status) => {
        const sc = STATUS_CONFIG[status];
        const columnTasks = tasks.filter((t) => t.status === status);
        return (
          <div key={status} className="space-y-2">
            <div className="flex items-center gap-2 px-2 py-1.5">
              <div className={`w-2 h-2 rounded-full ${sc.bg}`} />
              <span className="text-xs font-semibold text-foreground">{sc.label}</span>
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{columnTasks.length}</Badge>
            </div>
            <div className="space-y-2">
              {columnTasks.map((task) => {
                const pc = PRIORITY_CONFIG[task.priority];
                const subtasks = getChildren(items, task.id);
                const completedSubs = subtasks.filter((s) => s.status === "completed").length;
                return (
                  <div
                    key={task.id}
                    onClick={() => onItemClick(task)}
                    className="glass-card rounded-lg p-3 cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all space-y-2"
                  >
                    <p className="text-xs font-medium text-foreground leading-tight">{task.title}</p>
                    <p className="text-[10px] text-muted-foreground">{task.clientName}</p>
                    {subtasks.length > 0 && (
                      <div className="flex items-center gap-1">
                        <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${subtasks.length > 0 ? (completedSubs / subtasks.length) * 100 : 0}%` }} />
                        </div>
                        <span className="text-[9px] text-muted-foreground">{completedSubs}/{subtasks.length}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={`text-[9px] ${pc.color} ${pc.bg} border-0`}>{pc.label}</Badge>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[9px] text-muted-foreground">{format(new Date(task.dueDate), "dd MMM", { locale: ptBR })}</span>
                        <Avatar className="w-5 h-5">
                          <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                            {task.assignee.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default UnifiedKanban;
