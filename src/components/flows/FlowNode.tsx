import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { FlowNodeData } from "@/types/flow-builder";
import { cn } from "@/lib/utils";

const categoryAccent: Record<string, string> = {
  trigger: "border-l-green-500",
  condition: "border-l-yellow-500",
  message: "border-l-blue-500",
  action: "border-l-purple-500",
  agent: "border-l-pink-500",
  integration: "border-l-cyan-500",
  delay: "border-l-orange-500",
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

function FlowNode({ data, selected }: NodeProps) {
  const d = data as unknown as FlowNodeData;
  const isCondition = d.category === "condition";

  // Get displayable config entries (non-empty, non-array, non-object)
  const configEntries = Object.entries(d.config || {}).filter(
    ([, v]) => v !== "" && v !== undefined && v !== null && !Array.isArray(v) && typeof v !== "object"
  ).slice(0, 3); // Show max 3 config fields

  return (
    <div
      className={cn(
        "rounded-xl border border-border border-l-[3px] bg-card px-4 py-3 min-w-[200px] max-w-[260px] shadow-md transition-all cursor-pointer",
        categoryAccent[d.category] || "border-l-border",
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg scale-[1.03]"
      )}
    >
      {/* Input handle */}
      {d.category !== "trigger" && (
        <Handle
          type="target"
          position={Position.Left}
          className={cn("!w-3 !h-3 !border-2 !border-background", handleColors[d.category])}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-2.5 mb-1">
        <span className="text-lg flex-shrink-0">{d.icon}</span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-foreground truncate">{d.label}</p>
        </div>
      </div>

      {/* Config details (Sim Studio style) */}
      {configEntries.length > 0 && (
        <div className="mt-2 pt-2 border-t border-border/50 space-y-1">
          {configEntries.map(([key, val]) => (
            <div key={key} className="flex items-center justify-between gap-2 text-[10px]">
              <span className="text-muted-foreground font-medium truncate">
                {CONFIG_LABELS[key] || key}
              </span>
              <span className="text-foreground/80 font-mono truncate max-w-[120px] text-right">
                {String(val)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Description if no config */}
      {configEntries.length === 0 && d.description && (
        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{d.description}</p>
      )}

      {/* Output handles */}
      {isCondition ? (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="yes"
            className={cn("!w-3 !h-3 !border-2 !border-background !top-[30%]", handleColors[d.category])}
          />
          <Handle
            type="source"
            position={Position.Right}
            id="no"
            className={cn("!w-3 !h-3 !border-2 !border-background !top-[70%]", handleColors[d.category])}
          />
          <div className="absolute right-[-28px] flex flex-col justify-between h-full top-0 py-2">
            <span className="text-[9px] text-green-400 font-medium">Sim</span>
            <span className="text-[9px] text-red-400 font-medium">Não</span>
          </div>
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Right}
          className={cn("!w-3 !h-3 !border-2 !border-background", handleColors[d.category])}
        />
      )}
    </div>
  );
}

export default memo(FlowNode);
