import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Plus } from "lucide-react";
import { ProjectStatus } from "@/types/project";

interface ProjectFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  statusFilter: ProjectStatus | "all";
  onStatusChange: (val: ProjectStatus | "all") => void;
  onNewProject?: () => void;
}

const statuses: { value: ProjectStatus | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "planning", label: "Planejamento" },
  { value: "active", label: "Ativo" },
  { value: "paused", label: "Pausado" },
  { value: "completed", label: "Concluído" },
];

const ProjectFilters = ({ search, onSearchChange, statusFilter, onStatusChange, onNewProject }: ProjectFiltersProps) => (
  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
    <div className="relative flex-1 w-full sm:max-w-xs">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        placeholder="Buscar projetos..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-9 h-9 bg-card border-border"
      />
    </div>
    <div className="flex items-center gap-1.5 flex-wrap">
      {statuses.map((s) => (
        <button
          key={s.value}
          onClick={() => onStatusChange(s.value)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            statusFilter === s.value
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-accent"
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
    <Button size="sm" className="ml-auto gap-1.5">
      <Plus className="w-4 h-4" />
      Novo Projeto
    </Button>
  </div>
);

export default ProjectFilters;
