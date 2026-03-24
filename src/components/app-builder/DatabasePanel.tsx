import { useState } from "react";
import { Database, RefreshCw, Plus, Download, Code2, Search, ArrowUpDown, Table as TableIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface DemoTable {
  name: string;
  columns: { name: string; type: string; isPK?: boolean }[];
  rows: Record<string, string>[];
}

const DEMO_TABLES: DemoTable[] = [
  {
    name: "profiles",
    columns: [
      { name: "id", type: "TEXT", isPK: true },
      { name: "user_id", type: "TEXT" },
      { name: "full_name", type: "TEXT" },
      { name: "avatar_url", type: "TEXT" },
      { name: "created_at", type: "TIMESTAMP" },
    ],
    rows: [],
  },
  {
    name: "projects",
    columns: [
      { name: "id", type: "TEXT", isPK: true },
      { name: "name", type: "TEXT" },
      { name: "description", type: "TEXT" },
      { name: "status", type: "TEXT" },
      { name: "created_at", type: "TIMESTAMP" },
    ],
    rows: [],
  },
  {
    name: "tasks",
    columns: [
      { name: "id", type: "TEXT", isPK: true },
      { name: "title", type: "TEXT" },
      { name: "project_id", type: "TEXT" },
      { name: "assignee_id", type: "TEXT" },
      { name: "status", type: "TEXT" },
    ],
    rows: [],
  },
  {
    name: "users",
    columns: [
      { name: "id", type: "TEXT", isPK: true },
      { name: "email", type: "TEXT" },
      { name: "created_at", type: "TIMESTAMP" },
    ],
    rows: [],
  },
];

const DatabasePanel = () => {
  const [selectedTable, setSelectedTable] = useState<string>(DEMO_TABLES[0].name);
  const [search, setSearch] = useState("");

  const table = DEMO_TABLES.find((t) => t.name === selectedTable) || DEMO_TABLES[0];

  return (
    <div className="flex-1 flex bg-background overflow-hidden">
      {/* Left — Tables list */}
      <div className="w-[200px] min-w-[180px] border-r border-border flex flex-col bg-card/50">
        <div className="flex items-center justify-between px-3 py-3 border-b border-border">
          <span className="text-sm font-semibold text-foreground">Tables</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" title="Atualizar">
            <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {DEMO_TABLES.map((t) => (
            <button
              key={t.name}
              onClick={() => setSelectedTable(t.name)}
              className={cn(
                "flex items-center gap-2 w-full text-left px-3 py-2 text-xs transition-colors",
                selectedTable === t.name
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <TableIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Right — Table data viewer */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{table.name}</span>
            <span className="text-xs text-muted-foreground">
              {table.rows.length === 0 ? "No rows" : `${table.rows.length} rows`}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" title="Adicionar registro">
              <Plus className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" title="Importar">
              <Download className="w-3.5 h-3.5 rotate-180" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" title="Exportar">
              <Download className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" title="SQL">
              <Code2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs bg-muted/30 border-border"
            />
          </div>
        </div>

        {/* Table grid */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="w-10 px-3 py-2 text-left">
                  <Checkbox className="h-3.5 w-3.5" />
                </th>
                {table.columns.map((col) => (
                  <th key={col.name} className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate max-w-[120px]">{col.name}</span>
                      <span className="text-[10px] text-muted-foreground/60">({col.type})</span>
                      {col.isPK && (
                        <span className="text-[9px] font-semibold text-primary">PK</span>
                      )}
                      <ArrowUpDown className="w-3 h-3 text-muted-foreground/40 shrink-0 cursor-pointer hover:text-foreground" />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.length === 0 && (
                <tr>
                  <td
                    colSpan={table.columns.length + 1}
                    className="text-center py-16 text-sm text-muted-foreground"
                  >
                    No data found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DatabasePanel;
