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
import { Save, Play, Undo2, Redo2, MoreHorizontal, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const nodeTypes: NodeTypes = {
  flowNode: FlowNode,
};

const defaultStartNode: Node = {
  id: "start-1",
  type: "flowNode",
  position: { x: 50, y: 200 },
  data: {
    label: "Início",
    category: "trigger",
    icon: "🚀",
    description: "Ponto de início do fluxo",
    config: {},
    color: "hsl(142, 71%, 45%)",
  } satisfies FlowNodeData,
};

let nodeIdCounter = 1;

type RightTab = "copilot" | "toolbar" | "editor";

interface FlowCanvasProps {
  initialNodes?: unknown[];
  initialEdges?: unknown[];
  flowName?: string;
  flowId?: string;
  onSave?: (name: string, nodes: unknown[], edges: unknown[], flowId?: string) => void;
}

function FlowCanvasInner({ initialNodes, initialEdges, flowName, flowId, onSave }: FlowCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const startNodes = initialNodes && (initialNodes as Node[]).length > 0
    ? (initialNodes as Node[])
    : [defaultStartNode];
  const [nodes, setNodes, onNodesChange] = useNodesState(startNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState((initialEdges as Edge[]) || []);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [rightTab, setRightTab] = useState<RightTab>("copilot");
  const [showRightPanel, setShowRightPanel] = useState(true);

  const onConnect = useCallback(
    (connection: Connection) => {
      const edge: Edge = {
        ...connection,
        id: `e-${connection.source}-${connection.target}`,
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

  const handleDeploy = () => {
    if (nodes.length < 2) {
      toast.error("Adicione pelo menos 2 blocos ao fluxo");
      return;
    }
    toast.success("Fluxo publicado com sucesso! 🚀");
  };

  const handleRun = () => {
    if (nodes.length < 2) {
      toast.error("Adicione pelo menos 2 blocos ao fluxo");
      return;
    }
    toast.info("Executando fluxo...");
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
      {/* Canvas area */}
      <div
        className="flex-1 relative"
        ref={reactFlowWrapper}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {/* Top right controls */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
          <div className="flex items-center gap-1 bg-card/90 backdrop-blur-sm border border-border rounded-lg px-1 py-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" title="Mais opções">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title="Chat"
              onClick={() => { setShowRightPanel(!showRightPanel); setRightTab("copilot"); }}
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs font-medium bg-card/90 backdrop-blur-sm"
            onClick={handleDeploy}
          >
            Deploy
          </Button>
          <Button
            size="sm"
            className="h-8 gap-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleRun}
          >
            <Play className="w-3.5 h-3.5 fill-current" /> Run
          </Button>
        </div>

        {/* Top left: undo/redo/save */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-card/90 backdrop-blur-sm border border-border rounded-lg px-1.5 py-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Desfazer">
            <Undo2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Refazer">
            <Redo2 className="w-3.5 h-3.5" />
          </Button>
          <div className="w-px h-5 bg-border mx-0.5" />
          <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={handleSave}>
            <Save className="w-3.5 h-3.5" /> Salvar
          </Button>
        </div>

        {/* Bottom toolbar — quick add nodes by category */}
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

      {/* Right panel with tabs */}
      {showRightPanel && (
        <div className="w-[300px] border-l border-border flex-shrink-0 flex flex-col bg-card h-full overflow-hidden">
          {/* Tab headers */}
          <div className="flex items-center border-b border-border px-1 flex-shrink-0">
            {(["copilot", "toolbar", "editor"] as RightTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setRightTab(tab)}
                className={cn(
                  "px-3 py-2.5 text-xs font-medium transition-colors relative",
                  rightTab === tab
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab === "copilot" ? "Copilot" : tab === "toolbar" ? "Toolbar" : "Editor"}
                {rightTab === tab && (
                  <div className="absolute bottom-0 left-1 right-1 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden">
            {rightTab === "copilot" && (
              <FlowCopilotPanel
                onClose={() => setShowRightPanel(false)}
                onAddNode={handleAddNode}
              />
            )}
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
                  <MessageSquare className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">Nenhum bloco selecionado</p>
                <p className="text-xs text-muted-foreground">Clique em um bloco no canvas para editá-lo aqui.</p>
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
