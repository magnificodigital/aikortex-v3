import { Project } from "@/types/project";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Props {
  projects: Project[];
  onSelect: (p: Project) => void;
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

const ProjectList = ({ projects, onSelect }: Props) => (
  <div className="rounded-lg border border-border bg-card overflow-hidden">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Projeto</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Gerente</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Progresso</TableHead>
          <TableHead className="text-right">Prazo</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((p) => (
          <TableRow
            key={p.id}
            className="cursor-pointer hover:bg-accent/50"
            onClick={() => onSelect(p)}
          >
            <TableCell>
              <div>
                <p className="font-medium text-foreground text-sm">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.tasks.length} tarefas</p>
              </div>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">{p.client}</TableCell>
            <TableCell className="text-sm text-muted-foreground">{p.manager}</TableCell>
            <TableCell>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[p.status]}`}>
                {statusLabels[p.status]}
              </span>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2 w-28">
                <Progress value={p.progress} className="h-1.5 flex-1" />
                <span className="text-xs text-muted-foreground">{p.progress}%</span>
              </div>
            </TableCell>
            <TableCell className="text-right text-sm text-muted-foreground">
              {new Date(p.deadline).toLocaleDateString("pt-BR")}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

export default ProjectList;
