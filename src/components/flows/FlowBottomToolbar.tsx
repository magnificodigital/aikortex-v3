import { useState, useEffect, useCallback } from "react";
import { NODE_CATEGORIES, NODE_TEMPLATES, type FlowExecution } from "@/types/flow-builder";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Zap, Cpu, GitBranch, SlidersHorizontal, Send, Plug, FormInput, Target, BookOpen, Database, Code2, History, CheckCircle, XCircle, Loader2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const categoryIcons: Record<string, React.ReactNode> = {
  trigger: <Zap className="w-4 h-4" />,
  processing: <Cpu className="w-4 h-4" />,
  logic: <GitBranch className="w-4 h-4" />,
  control: <SlidersHorizontal className="w-4 h-4" />,
  output: <Send className="w-4 h-4" />,
  integration: <Plug className="w-4 h-4" />,
  data_capture: <FormInput className="w-4 h-4" />,
  crm_actions: <Target className="w-4 h-4" />,
  knowledge: <BookOpen className="w-4 h-4" />,
  database: <Database className="w-4 h-4" />,
  dev_advanced: <Code2 className="w-4 h-4" />,
};

interface Props {
  onAddNode: (nodeType: string, position?: { x: number; y: number }) => void;
  flowId?: string;
}

export default function FlowBottomToolbar({ onAddNode, flowId }: Props) {
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [executions, setExecutions] = useState<FlowExecution[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const templates = openCategory
    ? NODE_TEMPLATES.filter((t) => t.category === openCategory)
    : [];

  const categoryLabel = openCategory
    ? NODE_CATEGORIES.find((c) => c.key === openCategory)?.label || ""
    : "";

  const loadHistory = useCallback(async () => {
    if (!flowId) return;
    setLoadingHistory(true);
    const { data } = await supabase
      .from("flow_executions")
      .select("*")
      .eq("flow_id", flowId)
      .order("created_at", { ascending: false })
      .limit(10);
    setExecutions((data as unknown as FlowExecution[]) || []);
    setLoadingHistory(false);
  }, [flowId]);

  useEffect(() => {
    if (showHistory) loadHistory();
  }, [showHistory, loadHistory]);

  const statusIcon = (status: string) => {
    if (status === "completed") return <CheckCircle className="w-3.5 h-3.5 text-green-500" />;
    if (status === "failed") return <XCircle className="w-3.5 h-3.5 text-destructive" />;
    if (status === "running") return <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />;
    return <Clock className="w-3.5 h-3.5 text-muted-foreground" />;
  };

  const getDuration = (exec: FlowExecution) => {
    if (!exec.completed_at || !exec.started_at) return "—";
    const ms = new Date(exec.completed_at).getTime() - new Date(exec.started_at).getTime();
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

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
        {flowId && (
          <>
            <div className="w-px h-6 bg-border mx-1" />
            <button
              onClick={() => setShowHistory(true)}
              className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all hover:bg-accent/60 text-muted-foreground hover:text-foreground"
              title="Histórico"
            >
              <History className="w-4 h-4" />
              <span className="text-[9px] font-medium leading-none">Histórico</span>
            </button>
          </>
        )}
      </div>

      {/* Category dialog */}
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

      {/* History dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <History className="w-4 h-4" />
              Histórico de Execuções
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto space-y-2 mt-2">
            {loadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : executions.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Nenhuma execução encontrada.</p>
                <p className="text-[10px] text-muted-foreground">Execute o fluxo para ver o histórico aqui.</p>
              </div>
            ) : (
              executions.map((exec) => (
                <div key={exec.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card/40">
                  {statusIcon(exec.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground">{exec.flow_name || "Execução"}</span>
                      <Badge
                        variant={exec.status === "completed" ? "default" : exec.status === "failed" ? "destructive" : "secondary"}
                        className="text-[9px] px-1.5"
                      >
                        {exec.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                      <span>{exec.trigger_type}</span>
                      <span>•</span>
                      <span>{new Date(exec.started_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                      <span>•</span>
                      <span>{getDuration(exec)}</span>
                    </div>
                  </div>
                  {exec.error_message && (
                    <p className="text-[9px] text-destructive max-w-[150px] truncate" title={exec.error_message}>
                      {exec.error_message}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
