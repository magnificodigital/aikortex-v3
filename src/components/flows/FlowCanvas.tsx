import { useState, useCallback, useRef } from "react";
import {
  ReactFlow,
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
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { NODE_TEMPLATES, type FlowNodeData } from "@/types/flow-builder";
import FlowNode from "./FlowNode";
import FlowBottomToolbar from "./FlowBottomToolbar";
import FlowNodeConfig from "./FlowNodeConfig";
import { Button } from "@/components/ui/button";
import { Save, Play, Undo2, Redo2 } from "lucide-react";
import { toast } from "sonner";

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

interface FlowCanvasProps {
  initialNodes?: unknown[];
  initialEdges?: unknown[];
  flowName?: string;
  flowId?: string;
  onSave?: (name: string, nodes: unknown[], edges: unknown[], flowId?: string) => void;
}

export default function FlowCanvas({ initialNodes, initialEdges, flowName, flowId, onSave }: FlowCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const startNodes = initialNodes && (initialNodes as Node[]).length > 0
    ? (initialNodes as Node[])
    : [defaultStartNode];
  const [nodes, setNodes, onNodesChange] = useNodesState(startNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState((initialEdges as Edge[]) || []);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

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

  // Add node from bottom toolbar
  const handleAddNode = useCallback(
    (nodeType: string) => {
      const template = NODE_TEMPLATES.find((t) => t.type === nodeType);
      if (!template) return;

      // Place new node in center-ish of viewport
      const position = reactFlowInstance
        ? reactFlowInstance.screenToFlowPosition({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2 - 100,
          })
        : { x: 400, y: 250 };

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

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
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

  const handleTest = () => {
    if (nodes.length < 2) {
      toast.error("Adicione pelo menos 2 blocos ao fluxo");
      return;
    }
    toast.info("Simulação do fluxo iniciada...");
  };

  return (
    <div className="flex h-full">
      {/* Canvas */}
      <div className="flex-1 relative" ref={reactFlowWrapper}>
        {/* Top toolbar */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-card/90 backdrop-blur-sm border border-border rounded-xl px-2 py-1.5 shadow-lg">
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Desfazer">
            <Undo2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Refazer">
            <Redo2 className="w-3.5 h-3.5" />
          </Button>
          <div className="w-px h-5 bg-border mx-1" />
          <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={handleSave}>
            <Save className="w-3.5 h-3.5" /> Salvar
          </Button>
          <Button variant="default" size="sm" className="h-7 gap-1.5 text-xs" onClick={handleTest}>
            <Play className="w-3.5 h-3.5" /> Testar
          </Button>
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          snapToGrid
          snapGrid={[16, 16]}
          deleteKeyCode="Delete"
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
            className="!bg-card/90 !border-border !rounded-xl !shadow-lg [&>button]:!bg-transparent [&>button]:!border-border [&>button]:!text-foreground [&>button:hover]:!bg-accent"
            showInteractive={false}
          />
        </ReactFlow>

        {/* Bottom toolbar with category icons */}
        <FlowBottomToolbar onAddNode={handleAddNode} />
      </div>

      {/* Right config panel */}
      {selectedNode && (
        <div className="w-[280px] border-l border-border flex-shrink-0 overflow-hidden">
          <FlowNodeConfig
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
            onUpdate={updateNodeData}
            onDelete={deleteNode}
          />
        </div>
      )}
    </div>
  );
}
