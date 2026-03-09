import { Project } from "@/types/project";
import { Calendar as CalendarIcon } from "lucide-react";

interface Props {
  projects: Project[];
  onSelect: (p: Project) => void;
}

const statusColors: Record<string, string> = {
  planning: "border-l-info",
  active: "border-l-primary",
  paused: "border-l-warning",
  completed: "border-l-success",
};

const ProjectCalendar = ({ projects, onSelect }: Props) => {
  const sorted = [...projects].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  const grouped = sorted.reduce<Record<string, Project[]>>((acc, p) => {
    const month = new Date(p.deadline).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    (acc[month] = acc[month] || []).push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([month, items]) => (
        <div key={month}>
          <h3 className="text-sm font-semibold text-foreground capitalize mb-3 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-primary" />
            {month}
          </h3>
          <div className="space-y-2">
            {items.map((p) => (
              <button
                key={p.id}
                onClick={() => onSelect(p)}
                className={`w-full text-left rounded-lg border border-border bg-card p-3 hover:shadow-md transition-all hover:border-primary/30 border-l-4 ${statusColors[p.status]}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.client} · {p.manager}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">
                      {new Date(p.deadline).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                    </p>
                    <p className="text-xs text-muted-foreground">{p.progress}%</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProjectCalendar;
