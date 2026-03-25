import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User, Target, MessageSquare, Layers, BookOpen, Settings2,
  MonitorSmartphone, Puzzle, Rocket, AlertTriangle,
} from "lucide-react";
import type {
  BusinessContext, AgentRecommendation, DeployChannel, ExternalTool,
  AgentIntent, ConversationStage, AgentAdvancedConfig, CRMProvider,
} from "@/types/agent-builder";
import StepContext from "./StepContext";
import StepChannels from "./StepChannels";
import StepIntegrations from "./StepIntegrations";
import StepLaunch from "./StepLaunch";

const CONNECTORS = [
  { icon: "📝", label: "Notion", desc: "Read/write Notion pages and databases." },
  { icon: "💬", label: "Slack", desc: "Send messages to Slack channels." },
  { icon: "🎮", label: "Discord", desc: "Post to Discord servers." },
  { icon: "🔶", label: "HubSpot", desc: "Access CRM and contacts." },
  { icon: "📊", label: "Airtable", desc: "Read/write bases, tables, and records." },
  { icon: "🔗", label: "LinkedIn", desc: "Access profile and create posts." },
  { icon: "☁️", label: "Salesforce", desc: "Access CRM contacts and opportunities." },
  { icon: "📧", label: "Gmail", desc: "Read, send and compose emails." },
  { icon: "📁", label: "Google Drive", desc: "Read, upload and manage files." },
  { icon: "📅", label: "Google Calendar", desc: "Read and manage calendar events." },
  { icon: "📄", label: "Google Docs", desc: "Create and edit documents." },
];

type SettingsNavKey = "identidade" | "objetivo" | "intencoes" | "estagios" | "avancado" | "channels" | "integrations";

const SETTINGS_NAV = [
  {
    items: [
      { key: "identidade" as SettingsNavKey, icon: User, label: "Identidade" },
      { key: "objetivo" as SettingsNavKey, icon: Target, label: "Objetivo" },
      { key: "intencoes" as SettingsNavKey, icon: MessageSquare, label: "Ações" },
      { key: "estagios" as SettingsNavKey, icon: Layers, label: "Estágios" },
      { key: "avancado" as SettingsNavKey, icon: Settings2, label: "Avançado" },
    ],
  },
];

interface Props {
  context: BusinessContext;
  onContextChange: (ctx: BusinessContext) => void;
  selectedAgent: AgentRecommendation | null;
  selectedChannels: DeployChannel[];
  onToggleChannel: (ch: DeployChannel) => void;
  selectedTools: ExternalTool[];
  onToggleTool: (tool: ExternalTool) => void;
  selectedCRM: CRMProvider | null;
  onSelectCRM: (crm: CRMProvider | null) => void;
  intents: AgentIntent[];
  onIntentsChange: (intents: AgentIntent[]) => void;
  stages: ConversationStage[];
  onStagesChange: (stages: ConversationStage[]) => void;
  advancedConfig: AgentAdvancedConfig;
  onAdvancedConfigChange: (cfg: AgentAdvancedConfig) => void;
}

const WizardRightPanel = ({
  context, onContextChange,
  selectedAgent, selectedChannels, onToggleChannel,
  selectedTools, onToggleTool,
  selectedCRM, onSelectCRM,
  intents, onIntentsChange,
  stages, onStagesChange,
  advancedConfig, onAdvancedConfigChange,
}: Props) => {
  const [rightTab, setRightTab] = useState("settings");
  const [settingsNav, setSettingsNav] = useState<SettingsNavKey>("identidade");

  const isContextSection = ["identidade", "objetivo", "intencoes", "estagios", "conhecimento", "avancado"].includes(settingsNav);

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Tabs value={rightTab} onValueChange={setRightTab} className="flex flex-col h-full">
        <div className="border-b border-border px-4">
          <TabsList className="bg-transparent h-11 gap-0 p-0">
            {["connectors", "secrets", "files", "terminal", "settings"].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 text-sm capitalize"
              >
                {tab === "connectors" ? "Connectors" : tab === "secrets" ? "Secrets" : tab === "files" ? "Files" : tab === "terminal" ? "Terminal" : "Settings"}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Connectors */}
        <TabsContent value="connectors" className="flex-1 mt-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6">
              <h2 className="text-lg font-bold text-foreground">Connectors</h2>
              <p className="text-sm text-muted-foreground mt-1 mb-6">
                Link workspace OAuth connectors so your agent can use them in tasks.
              </p>
              <div className="space-y-1">
                {CONNECTORS.map((c) => (
                  <div key={c.label} className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{c.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{c.label}</p>
                        <p className="text-xs text-muted-foreground">{c.desc}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground gap-1">
                      + Connect
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Secrets */}
        <TabsContent value="secrets" className="flex-1 mt-0">
          <div className="p-6 text-center text-muted-foreground">
            <p className="text-sm">No secrets configured yet.</p>
            <Button variant="outline" size="sm" className="mt-4">Add Secret</Button>
          </div>
        </TabsContent>

        {/* Files */}
        <TabsContent value="files" className="flex-1 mt-0">
          <div className="p-6 text-center text-muted-foreground">
            <p className="text-sm">No files uploaded yet.</p>
            <Button variant="outline" size="sm" className="mt-4">Upload File</Button>
          </div>
        </TabsContent>

        {/* Terminal */}
        <TabsContent value="terminal" className="flex-1 mt-0">
          <div className="h-full bg-muted p-4 font-mono text-xs text-primary">
            <p>$ agent status</p>
            <p className="text-muted-foreground">Agent "{selectedAgent?.name || "Agent"}" is configuring.</p>
            <p className="text-muted-foreground">Step: {settingsNav}</p>
            <p className="mt-2">$ _</p>
          </div>
        </TabsContent>

        {/* Settings — with sidebar navigation */}
        <TabsContent value="settings" className="flex-1 mt-0 overflow-hidden">
          <div className="flex h-full">
            {/* Sidebar */}
            <div className="w-48 border-r border-border p-4 space-y-4 shrink-0">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Settings</p>
              {SETTINGS_NAV.map((section) => (
                <div key={section.section}>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{section.section}</p>
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.key}
                          onClick={() => setSettingsNav(item.key)}
                          className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                            settingsNav === item.key
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
              <div className="p-6">
                {isContextSection && (
                  <StepContextInline
                    activeSection={settingsNav as "identidade" | "objetivo" | "intencoes" | "estagios" | "conhecimento" | "avancado"}
                    context={context}
                    onChange={onContextChange}
                    advancedConfig={advancedConfig}
                    onAdvancedConfigChange={onAdvancedConfigChange}
                    intents={intents}
                    onIntentsChange={onIntentsChange}
                    stages={stages}
                    onStagesChange={onStagesChange}
                  />
                )}

                {settingsNav === "channels" && (
                  <div className="max-w-lg">
                    <h2 className="text-lg font-bold text-foreground">Canais</h2>
                    <p className="text-sm text-muted-foreground mt-1 mb-6">Onde seu agente vai operar?</p>
                    <StepChannels
                      selected={selectedChannels}
                      onToggle={onToggleChannel}
                      onNext={() => setSettingsNav("integrations")}
                      onBack={() => setSettingsNav("avancado")}
                      agentType={selectedAgent?.type || null}
                    />
                  </div>
                )}

                {settingsNav === "integrations" && (
                  <div className="max-w-lg">
                    <h2 className="text-lg font-bold text-foreground">Integrações</h2>
                    <p className="text-sm text-muted-foreground mt-1 mb-6">Conecte ferramentas externas.</p>
                    <StepIntegrations
                      selected={selectedTools}
                      onToggle={onToggleTool}
                      onNext={() => setSettingsNav("launch")}
                      onBack={() => setSettingsNav("channels")}
                      agentType={selectedAgent?.type || null}
                    />
                  </div>
                )}

                {settingsNav === "launch" && (
                  <div className="max-w-lg">
                    <StepLaunch
                      context={context}
                      agent={selectedAgent}
                      selectedChannels={selectedChannels}
                      onToggleChannel={onToggleChannel}
                      selectedCRM={selectedCRM}
                      onSelectCRM={onSelectCRM}
                      onBack={() => setSettingsNav("integrations")}
                    />
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

/* Inline version of StepContext that renders only the active section without header/footer */
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Upload, X, FileText, Image, File, Plus, Check, GripVertical, Trash2,
  ChevronDown, ChevronUp, Shield, ArrowRightLeft, Ban, Clock, Volume2, Sparkles, Mic,
} from "lucide-react";
import { useRef } from "react";
import {
  KnowledgeFile, MANDATORY_INTENTS, CUSTOM_INTENT_SUGGESTIONS,
  MessageSize, CreativityLevel, AgentIntent as AgentIntentType, ConversationStage as ConversationStageType,
} from "@/types/agent-builder";
import { MOCK_CLIENTS } from "@/types/client";

const TONES = [
  "Profissional e amigável", "Formal e corporativo", "Casual e descontraído",
  "Consultivo e técnico", "Empático e acolhedor",
];
const COMM_STYLES = [
  "Respostas curtas e diretas", "Respostas detalhadas e explicativas",
  "Tom consultivo com perguntas", "Conversacional e natural",
];
const ELEVENLABS_VOICES = [
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", style: "Feminina, suave e natural" },
  { id: "CwhRBWXzGAHq8TQ4Fs17", name: "Roger", style: "Masculina, profissional" },
  { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie", style: "Masculina, amigável" },
  { id: "SAz9YHcvj6GT2YYXdXww", name: "River", style: "Neutra, moderna" },
];
const INDUSTRIES = [
  "Tecnologia", "SaaS", "E-commerce", "Marketing Digital", "Consultoria",
  "Educação", "Saúde", "Financeiro", "Imobiliário", "Varejo", "Outro",
];
const INTENT_ICONS: Record<string, typeof Shield> = {
  end_conversation: Ban, transfer_human: ArrowRightLeft,
  invalid_content: AlertTriangle, response_limit: Clock,
};

interface InlineProps {
  activeSection: "identidade" | "objetivo" | "intencoes" | "estagios" | "conhecimento" | "avancado";
  context: BusinessContext;
  onChange: (ctx: BusinessContext) => void;
  advancedConfig: AgentAdvancedConfig;
  onAdvancedConfigChange: (cfg: AgentAdvancedConfig) => void;
  intents: AgentIntentType[];
  onIntentsChange: (intents: AgentIntentType[]) => void;
  stages: ConversationStageType[];
  onStagesChange: (stages: ConversationStageType[]) => void;
}

const StepContextInline = ({
  activeSection, context, onChange,
  advancedConfig, onAdvancedConfigChange,
  intents, onIntentsChange,
  stages, onStagesChange,
}: InlineProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedIntent, setExpandedIntent] = useState<string | null>(null);
  const [newIntentName, setNewIntentName] = useState("");
  const [newIntentAction, setNewIntentAction] = useState("");
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [newStageName, setNewStageName] = useState("");

  const update = (field: keyof BusinessContext, value: string) =>
    onChange({ ...context, [field]: value });

  const handleFiles = (files: FileList) => {
    const newFiles: KnowledgeFile[] = Array.from(files)
      .filter((f) => f.size <= 10 * 1024 * 1024)
      .map((f) => ({ id: crypto.randomUUID(), name: f.name, size: f.size, type: f.type }));
    onChange({ ...context, knowledgeFiles: [...context.knowledgeFiles, ...newFiles] });
  };
  const removeFile = (id: string) => onChange({ ...context, knowledgeFiles: context.knowledgeFiles.filter((f) => f.id !== id) });
  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <Image className="w-4 h-4 text-primary shrink-0" />;
    if (type === "application/pdf") return <FileText className="w-4 h-4 text-destructive shrink-0" />;
    return <File className="w-4 h-4 text-muted-foreground shrink-0" />;
  };
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  const customIntents = intents.filter((i) => !i.isMandatory);
  const canAddIntent = customIntents.length < 10;
  const addCustomIntent = () => {
    if (!newIntentName.trim() || !canAddIntent) return;
    onIntentsChange([...intents, { id: crypto.randomUUID(), name: newIntentName.trim(), description: "", triggers: [], action: newIntentAction.trim() || newIntentName.trim(), isMandatory: false }]);
    setNewIntentName(""); setNewIntentAction("");
  };
  const addSuggestedIntent = (s: { name: string; action: string }) => {
    if (!canAddIntent || intents.some((i) => i.name === s.name)) return;
    onIntentsChange([...intents, { id: crypto.randomUUID(), name: s.name, description: "", triggers: [], action: s.action, isMandatory: false }]);
  };
  const removeIntent = (id: string) => onIntentsChange(intents.filter((i) => i.id !== id));
  const canAddStage = stages.length < 10;
  const addStage = () => {
    if (!newStageName.trim() || !canAddStage) return;
    onStagesChange([...stages, { id: crypto.randomUUID(), name: newStageName.trim(), description: "", example: "", order: stages.length + 1 }]);
    setNewStageName("");
  };
  const removeStage = (id: string) => onStagesChange(stages.filter((s) => s.id !== id).map((s, i) => ({ ...s, order: i + 1 })));
  const moveStage = (id: string, direction: "up" | "down") => {
    const idx = stages.findIndex((s) => s.id === id);
    if ((direction === "up" && idx === 0) || (direction === "down" && idx === stages.length - 1)) return;
    const ns = [...stages]; const si = direction === "up" ? idx - 1 : idx + 1;
    [ns[idx], ns[si]] = [ns[si], ns[idx]];
    onStagesChange(ns.map((s, i) => ({ ...s, order: i + 1 })));
  };
  const updateStage = (id: string, field: keyof ConversationStageType, value: string) =>
    onStagesChange(stages.map((s) => s.id === id ? { ...s, [field]: value } : s));

  const SECTION_TITLES: Record<string, { title: string; desc: string }> = {
    identidade: { title: "Identidade", desc: "Identidade, propósito e modelo de IA do agente." },
    objetivo: { title: "Objetivo", desc: "O que este agente faz e qual o resultado esperado." },
    intencoes: { title: "Intenções", desc: "Ações que o agente pode realizar durante a conversa." },
    estagios: { title: "Estágios", desc: "Fluxo de conversa que o agente segue." },
    conhecimento: { title: "Conhecimento", desc: "Fontes de dados para alimentar o agente." },
    avancado: { title: "Avançado", desc: "Configurações de comportamento e limites." },
  };

  const info = SECTION_TITLES[activeSection];

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">{info.title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{info.desc}</p>
      </div>

      {activeSection === "identidade" && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Nome do agente</h3>
            <Input value={context.agentName} onChange={(e) => update("agentName", e.target.value)} placeholder="Ex: Ivy, Sofia, Max..." />
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Cargo / Função</h3>
            <Input value={context.mainProduct} onChange={(e) => update("mainProduct", e.target.value)} placeholder="Ex: SDR, Atendente, Consultor..." />
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Empresa</h3>
            <Select
              value={context.companyName ? MOCK_CLIENTS.find(c => c.companyName === context.companyName)?.id || "" : ""}
              onValueChange={(clientId) => {
                const client = MOCK_CLIENTS.find(c => c.id === clientId);
                if (client) {
                  onChange({ ...context, companyName: client.companyName, website: client.website ? `https://${client.website}` : "", industry: client.industry || "" });
                }
              }}
            >
              <SelectTrigger><SelectValue placeholder="Escolha um cliente cadastrado" /></SelectTrigger>
              <SelectContent>
                {MOCK_CLIENTS.filter(c => c.status === "active" || c.status === "onboarding").map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.companyName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Tom de voz</h3>
            <Select value={context.toneOfVoice} onValueChange={(v) => update("toneOfVoice", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Mensagem de saudação</h3>
            <Textarea
              value={context.greetingMessage}
              onChange={(e) => update("greetingMessage", e.target.value)}
              placeholder="Ex: Olá! 👋 Sou a Ivy, assistente virtual..."
              className="min-h-[80px]"
            />
          </div>
        </div>
      )}

      {activeSection === "objetivo" && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">O que este agente faz?</h3>
            <p className="text-xs text-muted-foreground">Define o propósito principal. Carregado no system prompt.</p>
            <Textarea value={context.targetAudienceDescription} onChange={(e) => update("targetAudienceDescription", e.target.value)} placeholder="Ex: Este agente conversa com visitantes do site para entender seu interesse..." className="min-h-[100px]" />
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Resultado esperado</h3>
            <Textarea value={context.painPoints} onChange={(e) => update("painPoints", e.target.value)} placeholder="Ex: Lead qualificado com reunião agendada..." className="min-h-[80px]" />
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Público atendido</h3>
            <Textarea value={context.knowledgeSources} onChange={(e) => update("knowledgeSources", e.target.value)} placeholder="Ex: PMEs de tecnologia, decisores C-level..." className="min-h-[80px]" />
          </div>
        </div>
      )}

      {activeSection === "intencoes" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Intenções obrigatórias</p>
            {MANDATORY_INTENTS.map((intent) => {
              const Icon = INTENT_ICONS[intent.id] || Shield;
              const isExpanded = expandedIntent === intent.id;
              return (
                <div key={intent.id} className="rounded-lg border border-border bg-muted/20">
                  <button onClick={() => setExpandedIntent(isExpanded ? null : intent.id)} className="w-full flex items-center gap-3 px-4 py-3 text-left">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-primary" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{intent.name}</span>
                        <Badge variant="outline" className="text-[9px]">Obrigatória</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">{intent.description}</p>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-3 space-y-2 border-t border-border pt-3">
                      <div className="space-y-1"><Label className="text-[11px]">Quando ativar:</Label><div className="flex flex-wrap gap-1">{intent.triggers.map((t) => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}</div></div>
                      <div className="space-y-1"><Label className="text-[11px]">Ação:</Label><p className="text-xs text-foreground">{intent.action}</p></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Personalizadas</p>
              <span className="text-[10px] text-muted-foreground">{customIntents.length}/10</span>
            </div>
            {customIntents.map((intent) => (
              <div key={intent.id} className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
                <Sparkles className="w-4 h-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-foreground">{intent.name}</p><p className="text-[11px] text-muted-foreground">{intent.action}</p></div>
                <button onClick={() => removeIntent(intent.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            <div className="flex flex-wrap gap-1.5">
              {CUSTOM_INTENT_SUGGESTIONS.filter((s) => !intents.some((i) => i.name === s.name)).map((s) => (
                <button key={s.name} onClick={() => addSuggestedIntent(s)} disabled={!canAddIntent} className="text-[11px] px-2.5 py-1 rounded-full border border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground transition-all disabled:opacity-50">+ {s.name}</button>
              ))}
            </div>
            {canAddIntent && (
              <div className="flex gap-2 pt-1">
                <Input placeholder="Nome" value={newIntentName} onChange={(e) => setNewIntentName(e.target.value)} className="flex-1" />
                <Input placeholder="Ação" value={newIntentAction} onChange={(e) => setNewIntentAction(e.target.value)} className="flex-1" />
                <Button size="sm" onClick={addCustomIntent} disabled={!newIntentName.trim()} className="gap-1 shrink-0"><Plus className="w-4 h-4" /></Button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeSection === "estagios" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Ordem da conversa.</p>
            <span className="text-[10px] text-muted-foreground">{stages.length}/10</span>
          </div>
          {stages.map((stage, idx) => {
            const isExp = expandedStage === stage.id;
            return (
              <div key={stage.id} className="rounded-lg border border-border bg-card">
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <GripVertical className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center shrink-0">{idx + 1}</span>
                  <button onClick={() => setExpandedStage(isExp ? null : stage.id)} className="flex-1 text-left">
                    <span className="text-sm font-medium text-foreground">{stage.name}</span>
                  </button>
                  <div className="flex items-center gap-1">
                    <button onClick={() => moveStage(stage.id, "up")} disabled={idx === 0} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronUp className="w-3.5 h-3.5" /></button>
                    <button onClick={() => moveStage(stage.id, "down")} disabled={idx === stages.length - 1} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5" /></button>
                    <button onClick={() => removeStage(stage.id)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                {isExp && (
                  <div className="px-4 pb-3 space-y-2 border-t border-border pt-3">
                    <Input value={stage.description} onChange={(e) => updateStage(stage.id, "description", e.target.value)} placeholder="Descrição..." />
                    <Textarea value={stage.example} onChange={(e) => updateStage(stage.id, "example", e.target.value)} placeholder="Exemplo..." rows={2} />
                  </div>
                )}
              </div>
            );
          })}
          {canAddStage && (
            <div className="flex gap-2">
              <Input placeholder="Novo estágio..." value={newStageName} onChange={(e) => setNewStageName(e.target.value)} />
              <Button size="sm" onClick={addStage} disabled={!newStageName.trim()} className="gap-1 shrink-0"><Plus className="w-4 h-4" /></Button>
            </div>
          )}
        </div>
      )}

      {activeSection === "conhecimento" && (
        <div className="space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); }}
            onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files) handleFiles(e.dataTransfer.files); }}
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
          >
            <Upload className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-foreground">Arraste arquivos ou clique para enviar</p>
            <p className="text-[11px] text-muted-foreground mt-1">PDFs, documentos, FAQ, Notion, Google Drive</p>
          </div>
          <input ref={fileInputRef} type="file" multiple accept=".pdf,.txt,.md,.doc,.docx,.png,.jpg,.jpeg,.webp" className="hidden" onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ""; }} />
          {context.knowledgeFiles.length > 0 && (
            <div className="space-y-1.5">
              {context.knowledgeFiles.map((file) => (
                <div key={file.id} className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm">
                  {getFileIcon(file.type)}<span className="flex-1 truncate text-foreground">{file.name}</span>
                  <span className="text-[10px] text-muted-foreground">{formatSize(file.size)}</span>
                  <button onClick={() => removeFile(file.id)} className="text-muted-foreground hover:text-destructive"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          )}
          <div className="space-y-1.5">
            <Label>URL do FAQ</Label>
            <Input value={context.faqUrl} onChange={(e) => update("faqUrl", e.target.value)} placeholder="https://suaempresa.com/faq" />
          </div>
        </div>
      )}

      {activeSection === "avancado" && (
        <div className="space-y-5">
          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
            <div className="flex items-center justify-between"><div><Label className="text-sm font-medium">Max respostas</Label><p className="text-[11px] text-muted-foreground">Evita loops.</p></div><Badge variant="outline" className="text-sm font-mono">{advancedConfig.maxResponses}</Badge></div>
            <Slider value={[advancedConfig.maxResponses]} onValueChange={([v]) => onAdvancedConfigChange({ ...advancedConfig, maxResponses: v })} min={10} max={100} step={5} />
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
            <Label className="text-sm font-medium">Tamanho das mensagens</Label>
            <div className="grid grid-cols-3 gap-2">
              {([{ value: "short" as MessageSize, label: "Curtas" }, { value: "medium" as MessageSize, label: "Médias" }, { value: "long" as MessageSize, label: "Longas" }]).map((opt) => (
                <button key={opt.value} onClick={() => onAdvancedConfigChange({ ...advancedConfig, messageSize: opt.value })} className={`rounded-lg border p-3 text-center transition-all ${advancedConfig.messageSize === opt.value ? "border-primary bg-primary/5 text-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/40"}`}>
                  <p className="text-xs font-medium">{opt.label}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3">
            <div><Label className="text-sm font-medium">Responder na transferência</Label></div>
            <Switch checked={advancedConfig.respondOnTransfer} onCheckedChange={(v) => onAdvancedConfigChange({ ...advancedConfig, respondOnTransfer: v })} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3">
            <div className="flex items-center gap-2"><Mic className="w-4 h-4 text-primary" /><Label className="text-sm font-medium">Responder em áudio</Label></div>
            <Switch checked={advancedConfig.respondInAudio} onCheckedChange={(v) => onAdvancedConfigChange({ ...advancedConfig, respondInAudio: v })} />
          </div>
        </div>
      )}
    </div>
  );
};

export default WizardRightPanel;
