import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { FlowNodeData } from "@/types/flow-builder";
import { cn } from "@/lib/utils";

const categoryStyles: Record<string, string> = {
  trigger: "border-green-500/60 bg-green-500/10 shadow-green-500/10",
  condition: "border-yellow-500/60 bg-yellow-500/10 shadow-yellow-500/10",
  message: "border-blue-500/60 bg-blue-500/10 shadow-blue-500/10",
  action: "border-purple-500/60 bg-purple-500/10 shadow-purple-500/10",
  agent: "border-pink-500/60 bg-pink-500/10 shadow-pink-500/10",
  integration: "border-cyan-500/60 bg-cyan-500/10 shadow-cyan-500/10",
  delay: "border-orange-500/60 bg-orange-500/10 shadow-orange-500/10",
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

function FlowNode({ data, selected }: NodeProps) {
  const d = data as FlowNodeData;
  const isCondition = d.category === "condition";

  return (
    <div
      className={cn(
        "rounded-xl border-2 px-4 py-3 min-w-[180px] max-w-[220px] shadow-lg transition-all cursor-pointer backdrop-blur-sm",
        categoryStyles[d.category] || "border-border bg-card",
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105"
      )}
    >
      {d.category !== "trigger" && (
        <Handle
          type="target"
          position={Position.Top}
          className={cn("!w-3 !h-3 !border-2 !border-background", handleColors[d.category])}
        />
      )}

      <div className="flex items-center gap-2.5">
        <span className="text-xl flex-shrink-0">{d.icon}</span>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">{d.label}</p>
          <p className="text-[10px] text-muted-foreground truncate">{d.description}</p>
        </div>
      </div>

      {isCondition ? (
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            id="yes"
            className={cn("!w-3 !h-3 !border-2 !border-background !left-[30%]", handleColors[d.category])}
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="no"
            className={cn("!w-3 !h-3 !border-2 !border-background !left-[70%]", handleColors[d.category])}
          />
          <div className="flex justify-between mt-1.5 px-1">
            <span className="text-[9px] text-green-400 font-medium">Sim</span>
            <span className="text-[9px] text-red-400 font-medium">Não</span>
          </div>
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Bottom}
          className={cn("!w-3 !h-3 !border-2 !border-background", handleColors[d.category])}
        />
      )}
    </div>
  );
}

export default memo(FlowNode);
