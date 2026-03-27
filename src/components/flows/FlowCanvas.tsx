import { useState, useCallback, useRef } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
  type EdgeTypes,
  type ReactFlowInstance,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { NODE_TEMPLATES, type FlowNodeData } from "@/types/flow-builder";
import FlowNode from "./FlowNode";
import FlowEdge from "./FlowEdge";
import FlowNodeConfig from "./FlowNodeConfig";
import FlowCopilotPanel from "./FlowCopilotPanel";
import FlowNodePalette from "./FlowNodePalette";
import FlowBottomToolbar from "./FlowBottomToolbar";
import { Button } from "@/components/ui/button";
import {
  Play,
  Rocket,
  Trash2,
  Copy,
  Download,
  PanelLeft,
  PanelRight,
  MessageSquare,
  Wrench,
  Settings2,
  Database,
  ListChecks,
  ScrollText,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { SavedFlow } from "@/types/flow-builder";

const nodeTypes: NodeTypes = {
  flowNode: FlowNode,
};

const edgeTypes: EdgeTypes = {
  flowEdge: FlowEdge,
};

const defaultStartNode: Node = {
  id: "start-1",
  type: "flowNode",
  position: { x: 50, y: 200 },
  data: {
    label: "Chat",
    category: "trigger",
    icon: "💬",
    description: "Starts when a message is received",
    config: { channel: "any" },
    color: "#22c55e",
    nodeType: "trigger_chat",
  } satisfies FlowNodeData,
};

let nodeIdCounter = 1;

type RightTab = "toolbar" | "editor" | "database" | "tasks" | "logs";

const RIGHT_TABS: { id: RightTab; label: string; icon: React.ElementType }[] = [
  { id: "toolbar", label: "Blocos", icon: Wrench },
  { id: "editor", label: "Editor", icon: Settings2 },
  { id: "database", label: "Database", icon: Database },
  { id: "tasks", label: "Tarefas", icon: ListChecks },
  { id: "logs", label: "Logs", icon: ScrollText },
];

interface FlowCanvasProps {
  initialNodes?: unknown[];
  initialEdges?: unknown[];
  flowName?: string;
  flowId?: string;
  onSave?: (name: string, nodes: unknown[], edges: unknown[], flowId?: string) => void;
  flows?: SavedFlow[];
  onOpenFlow?: (flow: SavedFlow) => void;
  onNewFlow?: () => void;
}

function FlowCanvasInner({ initialNodes, initialEdges, flowName, flowId, onSave, flows = [], onOpenFlow, onNewFlow }: FlowCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const startNodes = initialNodes && (initialNodes as Node[]).length > 0
    ? (initialNodes as Node[])
    : [defaultStartNode];
  const [nodes, setNodes, onNodesChange] = useNodesState(startNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState((initialEdges as Edge[]) || []);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [rightTab, setRightTab] = useState<RightTab>("toolbar");
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [showLeftPanel, setShowLeftPanel] = useState(true);

  const onConnect = useCallback(
    (connection: Connection) => {
      const edge: Edge = {
        ...connection,
        id: `e-${connection.source}-${connection.target}`,
        type: "flowEdge",
        animated: true,
        style: { stroke: "hsl(var(--primary))", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "hsl(var(--primary))" },
      } as Edge;
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges]
  );

  const handleAddNode = useCallback(
    (nodeType: string, position?: { x: number; y: number }) => {
      const template = NODE_TEMPLATES.find((t) => t.type === nodeType);
      if (!template) return;

      const pos = position
        ? position
        : reactFlowInstance
          ? reactFlowInstance.screenToFlowPosition({
              x: window.innerWidth / 2 - 100,
              y: window.innerHeight / 2 - 100,
            })
          : { x: 400, y: 250 };

      nodeIdCounter++;
      const newNode: Node = {
        id: `node-${nodeIdCounter}-${Date.now()}`,
        type: "flowNode",
        position: pos,
        data: {
          label: template.label,
          category: template.category,
          icon: template.icon,
          description: template.description,
          config: { ...template.defaultConfig },
          color: template.color,
          nodeType: template.type,
        } satisfies FlowNodeData,
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [reactFlowInstance, setNodes]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setRightTab("editor");
    setShowRightPanel(true);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const updateNodeData = useCallback(
    (nodeId: string, newData: Partial<FlowNodeData>) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, ...newData } } : n
        )
      );
      setSelectedNode((prev) =>
        prev && prev.id === nodeId ? { ...prev, data: { ...prev.data, ...newData } } : prev
      );
    },
    [setNodes]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      setSelectedNode(null);
    },
    [setNodes, setEdges]
  );

  const handleSave = () => {
    if (onSave) {
      onSave(flowName || "Novo Fluxo", nodes, edges, flowId);
    } else {
      toast.success("Fluxo salvo com sucesso!");
    }
  };

  const handleRun = () => {
    if (nodes.length < 2) {
      toast.error("Adicione pelo menos 2 blocos ao fluxo");
      return;
    }
    toast.info("Executando fluxo...");
  };

  const handleDeploy = () => {
    if (nodes.length < 2) {
      toast.error("Adicione pelo menos 2 blocos ao fluxo");
      return;
    }
    toast.success("Fluxo publicado com sucesso! 🚀");
  };

  const handleDeleteFlow = () => {
    toast.success("Fluxo excluído");
  };

  const handleDuplicate = () => {
    if (onSave) {
      onSave(`${flowName || "Novo Fluxo"} (cópia)`, nodes, edges);
    }
    toast.success("Fluxo duplicado");
  };

  const handleExport = () => {
    const data = JSON.stringify({ nodes, edges, name: flowName }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${flowName || "flow"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Fluxo exportado");
  };

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const nodeType = event.dataTransfer.getData("application/reactflow");
      if (!nodeType || !reactFlowInstance) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const template = NODE_TEMPLATES.find((t) => t.type === nodeType);
      if (!template) return;

      nodeIdCounter++;
      const newNode: Node = {
        id: `node-${nodeIdCounter}-${Date.now()}`,
        type: "flowNode",
        position,
        data: {
          label: template.label,
          category: template.category,
          icon: template.icon,
          description: template.description,
          config: { ...template.defaultConfig },
          color: template.color,
          nodeType: template.type,
        } satisfies FlowNodeData,
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [reactFlowInstance, setNodes]
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  return (
    <div className="flex h-full">
      {/* LEFT — Copilot */}
      {showLeftPanel && (
        <div className="w-[300px] border-r border-border flex-shrink-0 flex flex-col bg-card h-full overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">Copilot</span>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowLeftPanel(false)}>
              <PanelLeft className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">
            <FlowCopilotPanel
              onClose={() => setShowLeftPanel(false)}
              onAddNode={handleAddNode}
            />
          </div>
        </div>
      )}

      {/* CENTER — Canvas */}
      <div className="flex-1 relative flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-card/80 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-1">
            {!showLeftPanel && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowLeftPanel(true)} title="Copilot">
                <PanelLeft className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 text-[11px]"
              onClick={handleRun}
            >
              <Play className="w-3 h-3 fill-current" /> Run
            </Button>
            <Button
              size="sm"
              className="h-7 gap-1.5 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleDeploy}
            >
              <Rocket className="w-3 h-3" /> Deploy
            </Button>
            <div className="w-px h-5 bg-border mx-0.5" />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDuplicate} title="Duplicar">
              <Copy className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleExport} title="Exportar">
              <Download className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={handleDeleteFlow} title="Excluir">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
            <div className="w-px h-5 bg-border mx-0.5" />
            {!showRightPanel && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowRightPanel(true)} title="Painel direito">
                <PanelRight className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative" ref={reactFlowWrapper} onDrop={handleDrop} onDragOver={handleDragOver}>
          <FlowBottomToolbar onAddNode={handleAddNode} />

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={(instance) => setReactFlowInstance(instance as unknown as ReactFlowInstance)}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            snapToGrid
            snapGrid={[16, 16]}
            deleteKeyCode={["Delete", "Backspace"]}
            multiSelectionKeyCode="Shift"
            selectionOnDrag
            panOnScroll
            zoomOnDoubleClick
            edgesReconnectable
            connectionLineStyle={{ stroke: "hsl(var(--primary))", strokeWidth: 2 }}
            proOptions={{ hideAttribution: true }}
            className="bg-background [&_.react-flow__attribution]:!hidden"
            defaultEdgeOptions={{
              type: "flowEdge",
              animated: true,
              style: { stroke: "hsl(var(--primary))", strokeWidth: 2 },
              markerEnd: { type: MarkerType.ArrowClosed, color: "hsl(var(--primary))" },
            }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="hsl(var(--muted-foreground) / 0.15)" />
            <Controls
              className="!bg-card/90 !border-border !rounded-lg !shadow-lg [&>button]:!bg-transparent [&>button]:!border-border [&>button]:!text-foreground [&>button:hover]:!bg-accent"
              showInteractive={false}
            />
          </ReactFlow>
        </div>
      </div>

      {/* RIGHT — Toolbar / Editor / Database / Tasks / Logs */}
      {showRightPanel && (
        <div className="w-[300px] border-l border-border flex-shrink-0 flex flex-col bg-card h-full overflow-hidden">
          {/* Vertical icon tabs */}
          <div className="flex items-center border-b border-border">
            {RIGHT_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setRightTab(tab.id)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-0.5 py-2 text-[9px] font-medium transition-colors relative",
                  rightTab === tab.id
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title={tab.label}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {rightTab === tab.id && (
                  <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            ))}
            <button
              onClick={() => setShowRightPanel(false)}
              className="px-2 py-2 text-muted-foreground hover:text-foreground transition-colors"
              title="Fechar"
            >
              <PanelRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden">
            {rightTab === "toolbar" && (
              <FlowNodePalette />
            )}
            {rightTab === "editor" && selectedNode && (
              <FlowNodeConfig
                node={selectedNode}
                onClose={() => setSelectedNode(null)}
                onUpdate={updateNodeData}
                onDelete={deleteNode}
              />
            )}
            {rightTab === "editor" && !selectedNode && (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-3">
                  <Settings2 className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">Nenhum bloco selecionado</p>
                <p className="text-xs text-muted-foreground">Clique em um bloco no canvas para editá-lo aqui.</p>
              </div>
            )}
            {rightTab === "database" && (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-3">
                  <Database className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">Base de Dados</p>
                <p className="text-xs text-muted-foreground">Gerencie tabelas e variáveis do fluxo.</p>
              </div>
            )}
            {rightTab === "tasks" && (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-3">
                  <ListChecks className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">Tarefas Agendadas</p>
                <p className="text-xs text-muted-foreground">Visualize e gerencie tarefas programadas.</p>
              </div>
            )}
            {rightTab === "logs" && (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-3">
                  <ScrollText className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">Logs de Execução</p>
                <p className="text-xs text-muted-foreground">Histórico de execuções e erros do fluxo.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function FlowCanvas(props: FlowCanvasProps) {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
