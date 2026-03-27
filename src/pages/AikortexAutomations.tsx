import { useState, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Workflow, Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import type { SavedFlow, FlowFolder, FlowTemplate } from "@/types/flow-builder";
import FlowCanvas from "@/components/flows/FlowCanvas";
import FlowTemplateGallery from "@/components/flows/FlowTemplateGallery";
import FlowList from "@/components/flows/FlowList";

const AikortexAutomations = () => {
  const [buildingFlow, setBuildingFlow] = useState<{
    name: string;
    nodes?: unknown[];
    edges?: unknown[];
    flowId?: string;
  } | null>(null);

  // Local state for flows & folders (persisted in localStorage)
  const [flows, setFlows] = useState<SavedFlow[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("aikortex_flows") || "[]");
    } catch {
      return [];
    }
  });
  const [folders, setFolders] = useState<FlowFolder[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("aikortex_folders") || "[]");
    } catch {
      return [];
    }
  });

  const persistFlows = useCallback((next: SavedFlow[]) => {
    setFlows(next);
    localStorage.setItem("aikortex_flows", JSON.stringify(next));
  }, []);

  const persistFolders = useCallback((next: FlowFolder[]) => {
    setFolders(next);
    localStorage.setItem("aikortex_folders", JSON.stringify(next));
  }, []);

  // ── Template click → open canvas with prebuilt nodes ──
  const handleSelectTemplate = (tpl: FlowTemplate) => {
    setBuildingFlow({ name: tpl.name, nodes: tpl.nodes, edges: tpl.edges });
  };

  // ── New blank flow ──
  const handleNewBlank = () => {
    setBuildingFlow({ name: "Novo Fluxo" });
  };

  // ── Open existing flow ──
  const handleOpenFlow = (flow: SavedFlow) => {
    setBuildingFlow({
      name: flow.name,
      nodes: flow.nodes,
      edges: flow.edges,
      flowId: flow.id,
    });
  };

  // ── Save flow from canvas ──
  const handleSaveFlow = useCallback(
    (name: string, nodes: unknown[], edges: unknown[], flowId?: string) => {
      const now = new Date().toISOString();
      if (flowId) {
        const updated = flows.map((f) =>
          f.id === flowId ? { ...f, name, nodes, edges, updatedAt: now } : f
        );
        persistFlows(updated);
      } else {
        const newFlow: SavedFlow = {
          id: `flow-${Date.now()}`,
          name,
          description: `${nodes.length} blocos`,
          status: "draft",
          folderId: null,
          nodes,
          edges,
          createdAt: now,
          updatedAt: now,
        };
        persistFlows([...flows, newFlow]);
      }
      toast.success("Fluxo salvo!");
    },
    [flows, persistFlows]
  );

  // ── Toggle status ──
  const handleToggleFlow = (flowId: string) => {
    const updated = flows.map((f) =>
      f.id === flowId
        ? { ...f, status: (f.status === "active" ? "paused" : "active") as SavedFlow["status"] }
        : f
    );
    persistFlows(updated);
    const flow = updated.find((f) => f.id === flowId);
    toast.success(flow?.status === "active" ? "Fluxo ativado" : "Fluxo pausado");
  };

  const handleDeleteFlow = (flowId: string) => {
    persistFlows(flows.filter((f) => f.id !== flowId));
    toast.success("Fluxo excluído");
  };

  // ── Folder CRUD ──
  const handleCreateFolder = (name: string) => {
    persistFolders([...folders, { id: `folder-${Date.now()}`, name, createdAt: new Date().toISOString() }]);
  };
  const handleRenameFolder = (folderId: string, name: string) => {
    persistFolders(folders.map((f) => (f.id === folderId ? { ...f, name } : f)));
  };
  const handleDeleteFolder = (folderId: string) => {
    persistFolders(folders.filter((f) => f.id !== folderId));
    // Move flows from deleted folder to root
    persistFlows(flows.map((f) => (f.folderId === folderId ? { ...f, folderId: null } : f)));
    toast.success("Pasta excluída");
  };
  const handleMoveFlow = (flowId: string, folderId: string | null) => {
    persistFlows(flows.map((f) => (f.id === flowId ? { ...f, folderId } : f)));
    toast.success("Fluxo movido");
  };

  // ── Building mode ──
  if (buildingFlow) {
    return (
      <div className="flex flex-col h-screen">
        <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-card/50 backdrop-blur-sm flex-shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setBuildingFlow(null)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
            <Workflow className="w-3.5 h-3.5 text-primary" />
          </div>
          <Input
            value={buildingFlow.name}
            onChange={(e) => setBuildingFlow((p) => p && { ...p, name: e.target.value })}
            className="h-8 w-[240px] text-sm font-medium bg-transparent border-transparent hover:border-border focus:border-border"
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
          />
        </div>
      </div>
    );
  }

  // ── Main list view ──
  return (
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

        <Tabs defaultValue="templates" className="space-y-4">
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
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AikortexAutomations;
