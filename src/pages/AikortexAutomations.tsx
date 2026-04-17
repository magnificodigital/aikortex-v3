import { useState, useCallback, useEffect } from "react";
import ModuleGate from "@/components/shared/ModuleGate";
import { useLocation } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Workflow, Plus, ArrowLeft, Trash2, Pencil, Clock, MoreVertical, Power, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { SavedFlow, FlowFolder, FlowTemplate } from "@/types/flow-builder";
import { FLOW_TEMPLATES } from "@/types/flow-builder";
import FlowCanvas from "@/components/flows/FlowCanvas";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useFlows } from "@/hooks/use-flows";

const AikortexAutomations = () => {
  const location = useLocation();
  const { flows, isLoading, toggleFlow, deleteFlow } = useFlows();

  const [copilotPrompt, setCopilotPrompt] = useState<string | null>(null);
  const [buildingFlow, setBuildingFlow] = useState<{
    name: string;
    nodes?: unknown[];
    edges?: unknown[];
    flowId?: string;
  } | null>(null);

  // Folders still local (not in DB yet)
  const [folders, setFolders] = useState<FlowFolder[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("aikortex_folders") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const state = location.state as any;
    if (state?.initialPrompt && !buildingFlow) {
      setCopilotPrompt(state.initialPrompt);
      setBuildingFlow({ name: "Novo Fluxo" });
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const persistFolders = useCallback((next: FlowFolder[]) => {
    setFolders(next);
    localStorage.setItem("aikortex_folders", JSON.stringify(next));
  }, []);

  const handleSelectTemplate = (tpl: FlowTemplate) => {
    setBuildingFlow({ name: tpl.name, nodes: tpl.nodes, edges: tpl.edges });
  };

  const handleNewBlank = () => {
    setBuildingFlow({ name: "Novo Fluxo" });
  };

  const handleSkipToCanvas = () => {
    setBuildingFlow({ name: "Novo Fluxo" });
  };

  const handleOpenFlow = (flow: SavedFlow) => {
    setBuildingFlow({
      name: flow.name,
      nodes: flow.nodes,
      edges: flow.edges,
      flowId: flow.id,
    });
  };

  const handleSaveFlow = useCallback(
    (name: string, nodes: unknown[], edges: unknown[], flowId?: string) => {
      // This is called from FlowCanvas after it saves to DB
      toast.success("Fluxo salvo!");
    },
    []
  );

  const handleToggleFlow = (flowId: string) => {
    const flow = flows.find((f) => f.id === flowId);
    const newActive = flow?.status !== "active";
    toggleFlow.mutate(
      { flowId, isActive: newActive },
      {
        onSuccess: () => toast.success(newActive ? "Fluxo ativado" : "Fluxo pausado"),
      }
    );
  };

  const handleDeleteFlow = (flowId: string) => {
    deleteFlow.mutate(flowId);
  };

  // Folder CRUD
  const handleCreateFolder = (name: string) => {
    persistFolders([...folders, { id: `folder-${Date.now()}`, name, createdAt: new Date().toISOString() }]);
  };
  const handleRenameFolder = (folderId: string, name: string) => {
    persistFolders(folders.map((f) => (f.id === folderId ? { ...f, name } : f)));
  };
  const handleDeleteFolder = (folderId: string) => {
    persistFolders(folders.filter((f) => f.id !== folderId));
    toast.success("Pasta excluída");
  };
  const handleMoveFlow = (_flowId: string, _folderId: string | null) => {
    toast.info("Mover fluxo entre pastas (em breve)");
  };

  if (buildingFlow) {
    return (
      <ModuleGate moduleKey="aikortex.flows">
        <div className="flex flex-col h-screen">
          <div className="flex items-center gap-3 px-3 py-1.5 border-b border-border bg-card/80 backdrop-blur-sm flex-shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setBuildingFlow(null)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center">
              <Workflow className="w-3 h-3 text-primary" />
            </div>
            <Input
              value={buildingFlow.name}
              onChange={(e) => setBuildingFlow((p) => p && { ...p, name: e.target.value })}
              className="h-7 w-[200px] text-xs font-medium bg-transparent border-transparent hover:border-border focus:border-border"
            />
          </div>
          <div className="flex-1 overflow-hidden">
            <FlowCanvas
              initialNodes={buildingFlow.nodes}
              initialEdges={buildingFlow.edges}
              flowName={buildingFlow.name}
              flowId={buildingFlow.flowId}
              onSave={handleSaveFlow}
              flows={flows}
              onOpenFlow={handleOpenFlow}
              onNewFlow={handleNewBlank}
              initialPrompt={copilotPrompt || undefined}
            />
          </div>
        </div>
      </ModuleGate>
    );
  }

  return (
    <ModuleGate moduleKey="aikortex.flows">
      <DashboardLayout>
        <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Workflow className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Flows</h1>
                <p className="text-xs text-muted-foreground">Construtor visual de fluxos de automação</p>
              </div>
            </div>
            <Button className="gap-2" onClick={handleNewBlank}>
              <Plus className="w-4 h-4" /> Novo Fluxo
            </Button>
          </div>

          <Tabs defaultValue={flows.length > 0 ? "my-flows" : "templates"} className="space-y-4">
            <TabsList className="h-9">
              <TabsTrigger value="templates" className="text-xs">Templates</TabsTrigger>
              <TabsTrigger value="my-flows" className="text-xs">
                Meus Fluxos {flows.length > 0 && `(${flows.length})`}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="templates">
              <FlowTemplateGallery onSelect={handleSelectTemplate} />
            </TabsContent>

            <TabsContent value="my-flows">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                </div>
              ) : (
                <FlowList
                  flows={flows}
                  folders={folders}
                  onOpenFlow={handleOpenFlow}
                  onToggleFlow={handleToggleFlow}
                  onDeleteFlow={handleDeleteFlow}
                  onCreateFolder={handleCreateFolder}
                  onRenameFolder={handleRenameFolder}
                  onDeleteFolder={handleDeleteFolder}
                  onMoveFlow={handleMoveFlow}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ModuleGate>
  );
};

export default AikortexAutomations;
