import { type Node } from "@xyflow/react";
import type { FlowNodeData } from "@/types/flow-builder";
import { AGENT_TEMPLATES } from "@/types/agent-builder";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Trash2 } from "lucide-react";

interface Props {
  node: Node;
  onClose: () => void;
  onUpdate: (nodeId: string, data: Partial<FlowNodeData>) => void;
  onDelete: (nodeId: string) => void;
}

export default function FlowNodeConfig({ node, onClose, onUpdate, onDelete }: Props) {
  const data = node.data as unknown as FlowNodeData;
  const config = data.config || {};

  const updateConfig = (key: string, value: unknown) => {
    onUpdate(node.id, { config: { ...config, [key]: value } });
  };

  return (
    <div className="h-full flex flex-col bg-card/80 backdrop-blur-sm">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg">{data.icon}</span>
          <div className="min-w-0">
            <p className="text-xs font-bold text-foreground truncate">{data.label}</p>
            <p className="text-[10px] text-muted-foreground">{data.category}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <div className="space-y-2">
          <Label className="text-xs">Block name</Label>
          <Input
            value={data.label}
            onChange={(e) => onUpdate(node.id, { label: e.target.value })}
            className="h-8 text-xs"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Description</Label>
          <Input
            value={data.description}
            onChange={(e) => onUpdate(node.id, { description: e.target.value })}
            className="h-8 text-xs"
          />
        </div>

        {renderConfigFields(data.nodeType || "", config, updateConfig)}
      </div>

      <div className="p-3 border-t border-border">
        <Button
          variant="destructive"
          size="sm"
          className="w-full gap-2 text-xs"
          onClick={() => onDelete(node.id)}
        >
          <Trash2 className="w-3.5 h-3.5" /> Delete block
        </Button>
      </div>
    </div>
  );
}

function renderConfigFields(
  nodeType: string,
  config: Record<string, unknown>,
  updateConfig: (key: string, value: unknown) => void
) {
  // ── Agent ──
  if (nodeType === "agent") {
    const LLM_MODELS = [
      { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
      { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
      { value: "gemini-3-flash-preview", label: "Gemini 3 Flash" },
      { value: "gpt-5", label: "GPT-5" },
      { value: "gpt-5-mini", label: "GPT-5 Mini" },
    ];
    return (
      <>
        <div className="space-y-2">
          <Label className="text-xs">Model</Label>
          <Select value={(config.model as string) || "gemini-2.5-flash"} onValueChange={(v) => updateConfig("model", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {LLM_MODELS.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">System Prompt</Label>
          <Textarea value={(config.systemPrompt as string) || ""} onChange={(e) => updateConfig("systemPrompt", e.target.value)} className="text-xs min-h-[80px]" placeholder="You are a helpful assistant..." />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Temperature</Label>
          <Input type="number" step="0.1" min="0" max="2" value={(config.temperature as number) ?? 0.7} onChange={(e) => updateConfig("temperature", parseFloat(e.target.value))} className="h-8 text-xs" />
        </div>
      </>
    );
  }

  // ── Function ──
  if (nodeType === "function") {
    return (
      <>
        <div className="space-y-2">
          <Label className="text-xs">Language</Label>
          <Select value={(config.language as string) || "javascript"} onValueChange={(v) => updateConfig("language", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="javascript">JavaScript</SelectItem>
              <SelectItem value="typescript">TypeScript</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Code</Label>
          <Textarea value={(config.code as string) || ""} onChange={(e) => updateConfig("code", e.target.value)} className="text-xs min-h-[120px] font-mono" placeholder="// Your code here..." />
        </div>
      </>
    );
  }

  // ── API ──
  if (nodeType === "api") {
    return (
      <>
        <div className="space-y-2">
          <Label className="text-xs">URL</Label>
          <Input value={(config.url as string) || ""} onChange={(e) => updateConfig("url", e.target.value)} className="h-8 text-xs" placeholder="https://..." />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Method</Label>
          <Select value={(config.method as string) || "GET"} onValueChange={(v) => updateConfig("method", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Body (JSON)</Label>
          <Textarea value={(config.body as string) || ""} onChange={(e) => updateConfig("body", e.target.value)} className="text-xs min-h-[60px] font-mono" placeholder='{"key": "value"}' />
        </div>
      </>
    );
  }

  // ── Condition ──
  if (nodeType === "condition") {
    return (
      <div className="space-y-2">
        <Label className="text-xs">Expression</Label>
        <Textarea value={(config.expression as string) || ""} onChange={(e) => updateConfig("expression", e.target.value)} className="text-xs min-h-[60px] font-mono" placeholder='{{variable}} == "value"' />
        <p className="text-[9px] text-muted-foreground">True exits left, False exits right</p>
      </div>
    );
  }

  // ── Router ──
  if (nodeType === "router") {
    return (
      <>
        <div className="space-y-2">
          <Label className="text-xs">Model</Label>
          <Select value={(config.model as string) || "gemini-2.5-flash"} onValueChange={(v) => updateConfig("model", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
              <SelectItem value="gpt-5-mini">GPT-5 Mini</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Routing Instructions</Label>
          <Textarea value={(config.instructions as string) || ""} onChange={(e) => updateConfig("instructions", e.target.value)} className="text-xs min-h-[80px]" placeholder="Route questions to Agent A, commands to Agent B..." />
        </div>
      </>
    );
  }

  // ── Evaluator ──
  if (nodeType === "evaluator") {
    return (
      <>
        <div className="space-y-2">
          <Label className="text-xs">Model</Label>
          <Select value={(config.model as string) || "gemini-2.5-flash"} onValueChange={(v) => updateConfig("model", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
              <SelectItem value="gpt-5-mini">GPT-5 Mini</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Evaluation Criteria</Label>
          <Textarea value={(config.criteria as string) || ""} onChange={(e) => updateConfig("criteria", e.target.value)} className="text-xs min-h-[60px]" placeholder="Score the response quality on a scale of 1-10..." />
        </div>
      </>
    );
  }

  // ── Variables ──
  if (nodeType === "variables") {
    return (
      <>
        <div className="space-y-2">
          <Label className="text-xs">Variable Name</Label>
          <Input value={(config.variable as string) || ""} onChange={(e) => updateConfig("variable", e.target.value)} className="h-8 text-xs" placeholder="my_variable" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Value</Label>
          <Input value={(config.value as string) || ""} onChange={(e) => updateConfig("value", e.target.value)} className="h-8 text-xs" placeholder="Value or {{other_var}}" />
        </div>
      </>
    );
  }

  // ── Wait ──
  if (nodeType === "wait") {
    return (
      <>
        <div className="space-y-2">
          <Label className="text-xs">Duration</Label>
          <Input type="number" value={(config.duration as number) || 5} onChange={(e) => updateConfig("duration", parseInt(e.target.value))} className="h-8 text-xs" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Unit</Label>
          <Select value={(config.unit as string) || "seconds"} onValueChange={(v) => updateConfig("unit", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="seconds">Seconds</SelectItem>
              <SelectItem value="minutes">Minutes</SelectItem>
              <SelectItem value="hours">Hours</SelectItem>
              <SelectItem value="days">Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </>
    );
  }

  // ── Human in the Loop ──
  if (nodeType === "human_in_loop") {
    return (
      <div className="space-y-2">
        <Label className="text-xs">Approval Message</Label>
        <Textarea value={(config.approvalMessage as string) || ""} onChange={(e) => updateConfig("approvalMessage", e.target.value)} className="text-xs min-h-[60px]" placeholder="Please review and approve..." />
      </div>
    );
  }

  // ── Loop ──
  if (nodeType === "loop") {
    return (
      <>
        <div className="space-y-2">
          <Label className="text-xs">Iterable Variable</Label>
          <Input value={(config.iterableVariable as string) || ""} onChange={(e) => updateConfig("iterableVariable", e.target.value)} className="h-8 text-xs" placeholder="{{items}}" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Max Iterations</Label>
          <Input type="number" value={(config.maxIterations as number) || 100} onChange={(e) => updateConfig("maxIterations", parseInt(e.target.value))} className="h-8 text-xs" />
        </div>
      </>
    );
  }

  // ── Parallel ──
  if (nodeType === "parallel") {
    return (
      <div className="space-y-2">
        <Label className="text-xs">Number of Branches</Label>
        <Input type="number" min="2" max="10" value={(config.branches as number) || 2} onChange={(e) => updateConfig("branches", parseInt(e.target.value))} className="h-8 text-xs" />
      </div>
    );
  }

  // ── Guardrails ──
  if (nodeType === "guardrails") {
    return (
      <div className="space-y-2">
        <Label className="text-xs">Validation Rules</Label>
        <Textarea value={(config.rulesText as string) || ""} onChange={(e) => updateConfig("rulesText", e.target.value)} className="text-xs min-h-[80px]" placeholder="No harmful content, must be in English..." />
      </div>
    );
  }

  // ── Response ──
  if (nodeType === "response") {
    return (
      <>
        <div className="space-y-2">
          <Label className="text-xs">Format</Label>
          <Select value={(config.format as string) || "json"} onValueChange={(v) => updateConfig("format", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="json">JSON</SelectItem>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="markdown">Markdown</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Template</Label>
          <Textarea value={(config.template as string) || ""} onChange={(e) => updateConfig("template", e.target.value)} className="text-xs min-h-[60px]" placeholder="{{result}}" />
        </div>
      </>
    );
  }

  // ── Triggers ──
  if (nodeType === "trigger_chat") {
    return (
      <div className="space-y-2">
        <Label className="text-xs">Channel</Label>
        <Select value={(config.channel as string) || "any"} onValueChange={(v) => updateConfig("channel", v)}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="website">Website</SelectItem>
            <SelectItem value="email">Email</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (nodeType === "trigger_webhook") {
    return (
      <div className="space-y-2">
        <Label className="text-xs">Method</Label>
        <Select value={(config.method as string) || "POST"} onValueChange={(v) => updateConfig("method", v)}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="POST">POST</SelectItem>
            <SelectItem value="GET">GET</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (nodeType === "trigger_schedule") {
    return (
      <>
        <div className="space-y-2">
          <Label className="text-xs">Frequency</Label>
          <Select value={(config.frequency as string) || "daily"} onValueChange={(v) => updateConfig("frequency", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="hourly">Hourly</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Time</Label>
          <Input value={(config.time as string) || "09:00"} onChange={(e) => updateConfig("time", e.target.value)} className="h-8 text-xs" placeholder="09:00" />
        </div>
      </>
    );
  }

  // ── Integration blocks ──
  if (nodeType === "integration_crm") {
    return (
      <>
        <div className="space-y-2">
          <Label className="text-xs">CRM Provider</Label>
          <Select value={(config.provider as string) || ""} onValueChange={(v) => updateConfig("provider", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select CRM" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="hubspot">HubSpot</SelectItem>
              <SelectItem value="pipedrive">Pipedrive</SelectItem>
              <SelectItem value="salesforce">Salesforce</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Action</Label>
          <Select value={(config.action as string) || "create_lead"} onValueChange={(v) => updateConfig("action", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="create_lead">Create Lead</SelectItem>
              <SelectItem value="update_lead">Update Lead</SelectItem>
              <SelectItem value="create_deal">Create Deal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </>
    );
  }

  if (nodeType === "integration_email") {
    return (
      <>
        <div className="space-y-2">
          <Label className="text-xs">To</Label>
          <Input value={(config.to as string) || ""} onChange={(e) => updateConfig("to", e.target.value)} className="h-8 text-xs" placeholder="email@example.com" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Subject</Label>
          <Input value={(config.subject as string) || ""} onChange={(e) => updateConfig("subject", e.target.value)} className="h-8 text-xs" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Body</Label>
          <Textarea value={(config.body as string) || ""} onChange={(e) => updateConfig("body", e.target.value)} className="text-xs min-h-[80px]" />
        </div>
      </>
    );
  }

  if (nodeType === "workflow_block") {
    return (
      <div className="space-y-2">
        <Label className="text-xs">Workflow ID</Label>
        <Input value={(config.workflowId as string) || ""} onChange={(e) => updateConfig("workflowId", e.target.value)} className="h-8 text-xs" placeholder="Select a workflow..." />
      </div>
    );
  }

  return (
    <p className="text-[10px] text-muted-foreground italic">Additional settings will be added soon.</p>
  );
}
