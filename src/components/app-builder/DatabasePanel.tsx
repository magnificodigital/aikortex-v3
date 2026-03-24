import { Database, Table, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const DEMO_TABLES = [
  { name: "profiles", rows: 3, columns: ["id", "user_id", "full_name", "avatar_url", "created_at"] },
  { name: "projects", rows: 0, columns: ["id", "name", "description", "status", "created_at"] },
  { name: "tasks", rows: 0, columns: ["id", "title", "project_id", "assignee_id", "status"] },
];

const DatabasePanel = () => {
  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Banco de Dados</span>
        </div>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
          <Plus className="w-3 h-3" />
          Nova Tabela
        </Button>
      </div>

      {/* Tables list */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {DEMO_TABLES.map((table) => (
          <div
            key={table.name}
            className="rounded-lg border border-border bg-card p-3 hover:border-primary/30 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-2">
              <Table className="w-3.5 h-3.5 text-primary" />
              <span className="text-sm font-medium">{table.name}</span>
              <span className="text-[10px] text-muted-foreground ml-auto bg-muted px-1.5 py-0.5 rounded">
                {table.rows} registros
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {table.columns.map((col) => (
                <span key={col} className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                  {col}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DatabasePanel;
