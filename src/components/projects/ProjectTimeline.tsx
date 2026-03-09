import { Project } from "@/types/project";

interface Props {
  projects: Project[];
  onSelect: (p: Project) => void;
}

const statusColors: Record<string, string> = {
  planning: "bg-info",
  active: "bg-primary",
  paused: "bg-warning",
  completed: "bg-success",
};

const ProjectTimeline = ({ projects, onSelect }: Props) => {
  const sorted = [...projects].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  // Calculate timeline range
  const allDates = sorted.flatMap((p) => [new Date(p.startDate).getTime(), new Date(p.deadline).getTime()]);
  const minDate = Math.min(...allDates);
  const maxDate = Math.max(...allDates);
  const range = maxDate - minDate || 1;

  const months: string[] = [];
  const d = new Date(minDate);
  while (d.getTime() <= maxDate) {
    months.push(d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }));
    d.setMonth(d.getMonth() + 1);
  }

  return (
    <div className="space-y-1">
      {/* Month headers */}
      <div className="flex items-center mb-4 ml-48">
        {months.map((m, i) => (
          <div
            key={i}
            className="text-[10px] text-muted-foreground font-medium uppercase"
            style={{ width: `${100 / months.length}%` }}
          >
            {m}
          </div>
        ))}
      </div>

      {sorted.map((p) => {
        const start = ((new Date(p.startDate).getTime() - minDate) / range) * 100;
        const width = Math.max(((new Date(p.deadline).getTime() - new Date(p.startDate).getTime()) / range) * 100, 3);

        return (
          <button
            key={p.id}
            onClick={() => onSelect(p)}
            className="flex items-center w-full group hover:bg-accent/30 rounded-md py-1.5 px-1 transition-colors"
          >
            <div className="w-48 shrink-0 pr-3">
              <p className="text-xs font-medium text-foreground truncate text-left">{p.name}</p>
              <p className="text-[10px] text-muted-foreground truncate text-left">{p.client}</p>
            </div>
            <div className="flex-1 relative h-6">
              <div
                className={`absolute top-1 h-4 rounded-full ${statusColors[p.status]} opacity-80 group-hover:opacity-100 transition-opacity`}
                style={{ left: `${start}%`, width: `${width}%` }}
              >
                <span className="absolute inset-0 flex items-center justify-center text-[9px] text-white font-medium">
                  {p.progress}%
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ProjectTimeline;
