import { useState } from "react";
import { NODE_CATEGORIES, NODE_TEMPLATES } from "@/types/flow-builder";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Zap, GitBranch, MessageSquare, Play, Bot, Plug, Clock } from "lucide-react";

const categoryIcons: Record<string, React.ReactNode> = {
  trigger: <Zap className="w-4 h-4" />,
  condition: <GitBranch className="w-4 h-4" />,
  message: <MessageSquare className="w-4 h-4" />,
  action: <Play className="w-4 h-4" />,
  agent: <Bot className="w-4 h-4" />,
  integration: <Plug className="w-4 h-4" />,
  delay: <Clock className="w-4 h-4" />,
};

interface Props {
  onAddNode: (nodeType: string, position?: { x: number; y: number }) => void;
}

export default function FlowBottomToolbar({ onAddNode }: Props) {
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const templates = openCategory
    ? NODE_TEMPLATES.filter((t) => t.category === openCategory)
    : [];

  const categoryLabel = openCategory
    ? NODE_CATEGORIES.find((c) => c.key === openCategory)?.label || ""
    : "";

  return (
    <>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-card/90 backdrop-blur-sm border border-border rounded-2xl px-3 py-2 shadow-lg">
        {NODE_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setOpenCategory(cat.key)}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all hover:bg-accent/60 text-muted-foreground hover:text-foreground"
            )}
            title={cat.label}
          >
            {categoryIcons[cat.key]}
            <span className="text-[9px] font-medium leading-none">{cat.label}</span>
          </button>
        ))}
      </div>

      <Dialog open={!!openCategory} onOpenChange={(open) => !open && setOpenCategory(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              {openCategory && categoryIcons[openCategory]}
              {categoryLabel}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 mt-2 max-h-[400px] overflow-y-auto">
            {templates.map((tpl) => (
              <button
                key={tpl.type}
                onClick={() => {
                  onAddNode(tpl.type);
                  setOpenCategory(null);
                }}
                className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-accent/40 transition-all text-left group"
              >
                <span className="text-xl flex-shrink-0">{tpl.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{tpl.label}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{tpl.description}</p>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
