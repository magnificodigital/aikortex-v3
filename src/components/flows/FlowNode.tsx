import { memo } from "react";
import { Handle, Position, type NodeProps, useReactFlow } from "@xyflow/react";
import type { FlowNodeData } from "@/types/flow-builder";
import { cn } from "@/lib/utils";
import { Copy, Trash2 } from "lucide-react";

const categoryAccent: Record<string, string> = {
  trigger: "border-l-green-500",
  condition: "border-l-yellow-500",
  message: "border-l-blue-500",
  action: "border-l-purple-500",
  agent: "border-l-pink-500",
  integration: "border-l-cyan-500",
  delay: "border-l-orange-500",
};

const categoryIconBg: Record<string, string> = {
  trigger: "bg-green-500/15 text-green-400",
  condition: "bg-yellow-500/15 text-yellow-400",
  message: "bg-blue-500/15 text-blue-400",
  action: "bg-purple-500/15 text-purple-400",
  agent: "bg-pink-500/15 text-pink-400",
  integration: "bg-cyan-500/15 text-cyan-400",
  delay: "bg-orange-500/15 text-orange-400",
};

const handleColors: Record<string, string> = {
  trigger: "!bg-green-500",
  condition: "!bg-yellow-500",
  message: "!bg-blue-500",
  action: "!bg-purple-500",
  agent: "!bg-pink-500",
  integration: "!bg-cyan-500",
  delay: "!bg-orange-500",
};

/** Pretty-print config keys for display */
const CONFIG_LABELS: Record<string, string> = {
  channel: "Canal",
  keyword: "Palavra-chave",
  url: "URL",
  method: "Método",
  cron: "Expressão Cron",
  event: "Evento",
  formId: "Formulário",
  text: "Texto",
  variable: "Variável",
  validation: "Validação",
  expression: "Expressão",
  splitPercentage: "Divisão %",
  imageUrl: "Imagem URL",
  caption: "Legenda",
  tag: "Tag",
  value: "Valor",
  to: "Para",
  subject: "Assunto",
  body: "Corpo",
  department: "Departamento",
  agentId: "Agente",
  model: "Modelo",
  temperature: "Temperatura",
  knowledgeBaseId: "Base",
  provider: "Provedor",
  action: "Ação",
  template: "Template",
  phone: "Telefone",
  spreadsheetId: "Planilha ID",
  range: "Range",
  webhookUrl: "Webhook URL",
  duration: "Duração",
  unit: "Unidade",
  datetime: "Data/Hora",
};

function FlowNode({ data, selected, id }: NodeProps) {
  const d = data as unknown as FlowNodeData;
  const isCondition = d.category === "condition";
  const { setNodes, setEdges, getNodes } = useReactFlow();

  const configEntries = Object.entries(d.config || {}).filter(
    ([, v]) => v !== "" && v !== undefined && v !== null && !Array.isArray(v) && typeof v !== "object"
  ).slice(0, 4);

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nodes = getNodes();
    const original = nodes.find((n) => n.id === id);
    if (!original) return;
    const newId = `node-dup-${Date.now()}`;
    const newNode = {
      ...original,
      id: newId,
      position: { x: original.position.x + 40, y: original.position.y + 60 },
      selected: false,
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
  };

  return (
    <div className="relative group">
      {/* Floating toolbar on selection */}
      {selected && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-0.5 bg-card border border-border rounded-lg shadow-lg px-1 py-0.5 nodrag nopan">
          <button onClick={handleDuplicate} className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="Duplicar">
            <Copy className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-border mx-0.5" />
          <button onClick={handleDelete} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Apagar">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div
        className={cn(
          "rounded-xl border border-border border-l-[4px] bg-card px-4 py-3 min-w-[240px] max-w-[300px] shadow-md transition-all cursor-pointer",
          categoryAccent[d.category] || "border-l-border",
          selected && "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-xl scale-[1.02]"
        )}
      >
      {/* Input handle */}
      {d.category !== "trigger" && (
        <Handle
          type="target"
          position={Position.Left}
          className={cn("!w-3 !h-3 !border-2 !border-card", handleColors[d.category])}
        />
      )}

      {/* Header — Sim Studio style with colored icon background */}
      <div className="flex items-center gap-2.5">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", categoryIconBg[d.category] || "bg-muted/60")}>
          <span className="text-base">{d.icon}</span>
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-foreground truncate">{d.label}</p>
          {d.description && configEntries.length > 0 && (
            <p className="text-[10px] text-muted-foreground truncate">{d.description}</p>
          )}
        </div>
      </div>

      {/* Config key-value rows — Sim Studio style with separator */}
      {configEntries.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-border/40 space-y-1.5">
          {configEntries.map(([key, val]) => (
            <div key={key} className="flex items-center justify-between gap-3">
              <span className="text-[11px] text-muted-foreground font-medium">
                {CONFIG_LABELS[key] || key}
              </span>
              <span className="text-[11px] text-foreground font-mono truncate max-w-[150px] text-right bg-muted/30 px-1.5 py-0.5 rounded">
                {String(val)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Description if no config */}
      {configEntries.length === 0 && d.description && (
        <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">{d.description}</p>
      )}

      {/* Output handles */}
      {isCondition ? (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="yes"
            className={cn("!w-3 !h-3 !border-2 !border-card !top-[30%]", handleColors[d.category])}
          />
          <Handle
            type="source"
            position={Position.Right}
            id="no"
            className={cn("!w-3 !h-3 !border-2 !border-card !top-[70%]", handleColors[d.category])}
          />
          <div className="absolute right-[-28px] flex flex-col justify-between h-full top-0 py-2 pointer-events-none">
            <span className="text-[9px] text-green-400 font-semibold">Sim</span>
            <span className="text-[9px] text-red-400 font-semibold">Não</span>
          </div>
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Right}
          className={cn("!w-3 !h-3 !border-2 !border-card", handleColors[d.category])}
        />
      )}
      </div>
    </div>
  );
}

export default memo(FlowNode);
