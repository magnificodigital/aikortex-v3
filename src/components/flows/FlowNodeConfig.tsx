import { type Node } from "@xyflow/react";
import type { FlowNodeData } from "@/types/flow-builder";
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
          <Label className="text-xs">Nome do bloco</Label>
          <Input
            value={data.label}
            onChange={(e) => onUpdate(node.id, { label: e.target.value })}
            className="h-8 text-xs"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Descrição</Label>
          <Input
            value={data.description}
            onChange={(e) => onUpdate(node.id, { description: e.target.value })}
            className="h-8 text-xs"
          />
        </div>

        {/* Dynamic config fields based on node type */}
        {renderConfigFields(node.type || "", config, updateConfig)}
      </div>

      <div className="p-3 border-t border-border">
        <Button
          variant="destructive"
          size="sm"
          className="w-full gap-2 text-xs"
          onClick={() => onDelete(node.id)}
        >
          <Trash2 className="w-3.5 h-3.5" /> Excluir bloco
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
  if (nodeType.startsWith("trigger_message")) {
    return (
      <>
        <div className="space-y-2">
          <Label className="text-xs">Canal</Label>
          <Select value={(config.channel as string) || "any"} onValueChange={(v) => updateConfig("channel", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Qualquer</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="website">Website</SelectItem>
              <SelectItem value="email">Email</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Palavra-chave (opcional)</Label>
          <Input value={(config.keyword as string) || ""} onChange={(e) => updateConfig("keyword", e.target.value)} className="h-8 text-xs" placeholder="Ex: comprar, ajuda..." />
        </div>
      </>
    );
  }

  if (nodeType.startsWith("message_text") || nodeType.startsWith("message_buttons")) {
    return (
      <div className="space-y-2">
        <Label className="text-xs">Texto da mensagem</Label>
        <Textarea
          value={(config.text as string) || ""}
          onChange={(e) => updateConfig("text", e.target.value)}
          className="text-xs min-h-[80px]"
          placeholder="Digite a mensagem... Use {{nome}} para variáveis"
        />
      </div>
    );
  }

  if (nodeType.startsWith("message_input")) {
    return (
      <>
        <div className="space-y-2">
          <Label className="text-xs">Salvar em variável</Label>
          <Input value={(config.variable as string) || ""} onChange={(e) => updateConfig("variable", e.target.value)} className="h-8 text-xs" placeholder="Ex: user_name" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Validação</Label>
          <Select value={(config.validation as string) || "text"} onValueChange={(v) => updateConfig("validation", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Texto</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="phone">Telefone</SelectItem>
              <SelectItem value="number">Número</SelectItem>
              <SelectItem value="cpf">CPF</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </>
    );
  }

  if (nodeType.startsWith("action_http")) {
    return (
      <>
        <div className="space-y-2">
          <Label className="text-xs">URL</Label>
          <Input value={(config.url as string) || ""} onChange={(e) => updateConfig("url", e.target.value)} className="h-8 text-xs" placeholder="https://..." />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Método</Label>
          <Select value={(config.method as string) || "GET"} onValueChange={(v) => updateConfig("method", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="GET">GET</SelectItem>
              <SelectItem value="POST">POST</SelectItem>
              <SelectItem value="PUT">PUT</SelectItem>
              <SelectItem value="DELETE">DELETE</SelectItem>
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

  if (nodeType.startsWith("action_email")) {
    return (
      <>
        <div className="space-y-2">
          <Label className="text-xs">Para</Label>
          <Input value={(config.to as string) || ""} onChange={(e) => updateConfig("to", e.target.value)} className="h-8 text-xs" placeholder="email@exemplo.com ou {{email}}" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Assunto</Label>
          <Input value={(config.subject as string) || ""} onChange={(e) => updateConfig("subject", e.target.value)} className="h-8 text-xs" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Corpo</Label>
          <Textarea value={(config.body as string) || ""} onChange={(e) => updateConfig("body", e.target.value)} className="text-xs min-h-[80px]" />
        </div>
      </>
    );
  }

  if (nodeType.startsWith("agent_ai")) {
    const AGENT_PRESETS = [
      { value: "sdr-1", label: "Agente SDR", icon: "📞" },
      { value: "bdr-1", label: "Agente BDR", icon: "🎯" },
      { value: "sac-1", label: "Agente SAC", icon: "🛟" },
      { value: "social-1", label: "Social Media Manager", icon: "📱" },
      { value: "custom-1", label: "Agente Personalizado", icon: "⚙️" },
    ];
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
          <Label className="text-xs">Agente</Label>
          <Select value={(config.agentId as string) || ""} onValueChange={(v) => updateConfig("agentId", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecionar agente" /></SelectTrigger>
            <SelectContent>
              {AGENT_PRESETS.map((a) => (
                <SelectItem key={a.value} value={a.value}>
                  <span className="flex items-center gap-2">{a.icon} {a.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Modelo LLM</Label>
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
          <Label className="text-xs">Temperatura</Label>
          <Input type="number" step="0.1" min="0" max="1" value={(config.temperature as number) || 0.7} onChange={(e) => updateConfig("temperature", parseFloat(e.target.value))} className="h-8 text-xs" />
        </div>
      </>
    );
  }

  if (nodeType.startsWith("delay_wait")) {
    return (
      <>
        <div className="space-y-2">
          <Label className="text-xs">Duração</Label>
          <Input type="number" value={(config.duration as number) || 5} onChange={(e) => updateConfig("duration", parseInt(e.target.value))} className="h-8 text-xs" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Unidade</Label>
          <Select value={(config.unit as string) || "seconds"} onValueChange={(v) => updateConfig("unit", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="seconds">Segundos</SelectItem>
              <SelectItem value="minutes">Minutos</SelectItem>
              <SelectItem value="hours">Horas</SelectItem>
              <SelectItem value="days">Dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </>
    );
  }

  if (nodeType.startsWith("integration_crm")) {
    return (
      <>
        <div className="space-y-2">
          <Label className="text-xs">CRM</Label>
          <Select value={(config.provider as string) || ""} onValueChange={(v) => updateConfig("provider", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecionar CRM" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="hubspot">HubSpot</SelectItem>
              <SelectItem value="pipedrive">Pipedrive</SelectItem>
              <SelectItem value="piperun">PipeRun</SelectItem>
              <SelectItem value="rd_station">RD Station</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Ação</Label>
          <Select value={(config.action as string) || "create_lead"} onValueChange={(v) => updateConfig("action", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="create_lead">Criar lead</SelectItem>
              <SelectItem value="update_lead">Atualizar lead</SelectItem>
              <SelectItem value="create_deal">Criar negócio</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </>
    );
  }

  if (nodeType.startsWith("condition_if")) {
    return (
      <div className="space-y-2">
        <Label className="text-xs">Condição</Label>
        <Textarea
          value={(config.expression as string) || ""}
          onChange={(e) => updateConfig("expression", e.target.value)}
          className="text-xs min-h-[60px] font-mono"
          placeholder='{{variavel}} == "valor"'
        />
        <p className="text-[9px] text-muted-foreground">Saída "Sim" à esquerda, "Não" à direita</p>
      </div>
    );
  }

  if (nodeType.startsWith("action_variable")) {
    return (
      <>
        <div className="space-y-2">
          <Label className="text-xs">Variável</Label>
          <Input value={(config.variable as string) || ""} onChange={(e) => updateConfig("variable", e.target.value)} className="h-8 text-xs" placeholder="nome_variavel" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Valor</Label>
          <Input value={(config.value as string) || ""} onChange={(e) => updateConfig("value", e.target.value)} className="h-8 text-xs" placeholder="Valor ou {{outra_variavel}}" />
        </div>
      </>
    );
  }

  return (
    <p className="text-[10px] text-muted-foreground italic">Configurações adicionais serão adicionadas em breve.</p>
  );
}
