import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import type { AgentType } from "@/types/agent-builder";
import { CHANNELS_BY_AGENT_TYPE, TOOLS_BY_AGENT_TYPE, EXTERNAL_TOOLS, DEPLOY_CHANNELS } from "@/types/agent-builder";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User, Zap, Monitor, MonitorSmartphone, Settings2, AlertTriangle,
  Upload, X, FileText, Image, File, Plus, Globe, Link2, Check, Camera,
  Webhook, KeyRound, Blocks, Eye, EyeOff, ExternalLink, Trash2, Settings,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const LLM_PROVIDER_MODELS: Record<string, { models: { value: string; label: string; desc: string }[]; capabilities: string[] }> = {
  OpenAI: {
    models: [
      { value: "gpt-5.2", label: "GPT-5.2", desc: "Mais recente. Raciocínio aprimorado e resolução de problemas complexos." },
      { value: "gpt-5", label: "GPT-5", desc: "Poderoso. Raciocínio complexo, contexto longo e multimodal." },
      { value: "gpt-5-mini", label: "GPT-5 Mini", desc: "Equilíbrio entre custo e desempenho." },
      { value: "gpt-5-nano", label: "GPT-5 Nano", desc: "Mais rápido e econômico para tarefas simples." },
      { value: "gpt-4o", label: "GPT-4o", desc: "Multimodal com visão e áudio." },
      { value: "gpt-4o-mini", label: "GPT-4o Mini", desc: "Versão leve do GPT-4o." },
      { value: "gpt-4-turbo", label: "GPT-4 Turbo", desc: "Contexto de 128K tokens com visão." },
      { value: "gpt-4", label: "GPT-4", desc: "Modelo clássico de raciocínio avançado." },
      { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo", desc: "Rápido e econômico para tarefas simples." },
    ],
    capabilities: ["Chat e completions", "Visão (imagens)", "Function calling", "JSON mode", "Embeddings", "Text-to-speech", "Speech-to-text"],
  },
  Anthropic: {
    models: [
      { value: "claude-4-sonnet", label: "Claude 4 Sonnet", desc: "Mais inteligente e versátil." },
      { value: "claude-3.5-sonnet", label: "Claude 3.5 Sonnet", desc: "Excelente raciocínio e código." },
      { value: "claude-3-opus", label: "Claude 3 Opus", desc: "Mais poderoso da família Claude 3." },
      { value: "claude-3-haiku", label: "Claude 3 Haiku", desc: "Rápido e econômico." },
    ],
    capabilities: ["Chat e completions", "Visão (imagens)", "Function calling", "Contexto de 200K tokens"],
  },
  Gemini: {
    models: [
      { value: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro", desc: "Mais recente. Raciocínio de próxima geração." },
      { value: "gemini-3-flash-preview", label: "Gemini 3 Flash", desc: "Rápido e capaz, próxima geração." },
      { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro", desc: "Top-tier com raciocínio avançado." },
      { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash", desc: "Rápido e equilibrado." },
      { value: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite", desc: "Mais econômico para tarefas simples." },
    ],
    capabilities: ["Chat e completions", "Visão (imagens e vídeo)", "Function calling", "Contexto de 1M tokens", "Geração de imagens"],
  },
};

const INTEGRATIONS = [
  { label: "OpenAI", desc: "Modelos GPT para geração de texto e análise.", logo: "https://cdn.simpleicons.org/openai" },
  { label: "Anthropic", desc: "Modelos Claude para raciocínio avançado.", logo: "https://cdn.simpleicons.org/anthropic" },
  { label: "Gemini", desc: "IA multimodal do Google.", logo: "https://cdn.simpleicons.org/googlegemini" },
  { label: "ElevenLabs", desc: "Geração de voz e text-to-speech.", logo: "https://cdn.simpleicons.org/elevenlabs" },
  { label: "OpenRouter", desc: "Acesso unificado a múltiplos LLMs.", logo: "https://openrouter.ai/favicon.ico" },
  { label: "Gmail", desc: "Ler, enviar e compor e-mails.", logo: "https://cdn.simpleicons.org/gmail" },
  { label: "Google Calendar", desc: "Ler e gerenciar eventos.", logo: "https://cdn.simpleicons.org/googlecalendar" },
  { label: "Outlook Calendar", desc: "Gerenciar calendário Microsoft.", logo: "https://cdn.simpleicons.org/microsoftoutlook" },
  { label: "Calendly", desc: "Agendamento automático de reuniões.", logo: "https://cdn.simpleicons.org/calendly" },
  { label: "Google Sheets", desc: "Ler e escrever planilhas.", logo: "https://cdn.simpleicons.org/googlesheets" },
  { label: "Google Drive", desc: "Ler, enviar e gerenciar arquivos.", logo: "https://cdn.simpleicons.org/googledrive" },
  { label: "Piperun", desc: "CRM de vendas e automação.", logo: "https://www.piperun.com/wp-content/uploads/2023/07/favicon-piperun-crm.png" },
  { label: "HubSpot", desc: "CRM, marketing e vendas.", logo: "https://cdn.simpleicons.org/hubspot" },
  { label: "RD Station", desc: "Automação de marketing e CRM.", logo: "https://cdn.simpleicons.org/rdstation" },
];

const CHANNELS = [
  { value: "whatsapp", label: "WhatsApp", logo: "https://cdn.simpleicons.org/whatsapp" },
  { value: "instagram", label: "Instagram", logo: "https://cdn.simpleicons.org/instagram" },
  { value: "facebook", label: "Facebook", logo: "https://cdn.simpleicons.org/facebook" },
  { value: "linkedin", label: "LinkedIn", logo: "https://cdn.simpleicons.org/linkedin" },
  { value: "tiktok", label: "TikTok", logo: "https://cdn.simpleicons.org/tiktok" },
  { value: "website", label: "WebSite", logo: "" },
];

const SETTINGS_NAV = [
  { section: "AGENTE", items: [
    { key: "general", icon: User, label: "Identidade" },
    { key: "objective", icon: Zap, label: "Objetivo" },
    { key: "instructions", icon: Settings2, label: "Instruções" },
    { key: "machine", icon: Monitor, label: "Machine" },
  ]},
  { section: "CONFIGURAÇÃO", items: [
    { key: "channels", icon: MonitorSmartphone, label: "Canais" },
    { key: "advanced", icon: Settings2, label: "Avançado" },
    { key: "danger", icon: AlertTriangle, label: "Danger Zone" },
  ]},
];

export interface ApiConfig {
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  responseFormat: "text" | "json";
  stopSequences: string[];
}

export const DEFAULT_API_CONFIG: ApiConfig = {
  temperature: 0.7,
  maxTokens: 2048,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
  responseFormat: "text",
  stopSequences: [],
};

export interface AgentConfig {
  name: string;
  description: string;
  objective: string;
  instructions: string;
  toneOfVoice: string;
  greetingMessage: string;
  avatarUrl: string;
  channels: string[];
  integrations: string[];
  knowledgeFiles: string[];
  urls: string[];
  apiConfig: ApiConfig;
}

interface Props {
  agent: { name: string; avatar: string };
  agentType: AgentType;
  agentModel: string;
  onModelChange: (model: string) => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onApiKeysChanged?: () => void | Promise<void>;
  onConfigChange?: (config: AgentConfig) => void;
  onSaveAgent?: (config: AgentConfig & { model: string; agentType: string }) => void | Promise<void>;
  isSaving?: boolean;
  /** Storage key prefix for persisting config across reloads */
  storagePrefix?: string;
}

interface KnowledgeFileLocal {
  id: string;
  name: string;
  size: number;
  type: string;
}

const PROVIDER_MAP: Record<string, string> = {
  "OpenAI": "openai",
  "Anthropic": "anthropic",
  "Gemini": "gemini",
  "ElevenLabs": "elevenlabs",
  "OpenRouter": "openrouter",
  "Gmail": "gmail",
  "Google Calendar": "google_calendar",
  "Outlook Calendar": "outlook_calendar",
  "Calendly": "calendly",
  "Google Sheets": "google_sheets",
  "Google Drive": "google_drive",
  "Piperun": "piperun",
  "HubSpot": "hubspot",
  "RD Station": "rdstation",
};

const MODEL_GATED_PROVIDERS = new Set(["OpenAI"]);

const AgentRightPanel = ({ agent, agentType, agentModel, onModelChange, activeTab, onTabChange, onApiKeysChanged, onConfigChange, onSaveAgent, isSaving, storagePrefix }: Props) => {
  const [rightTab, setRightTab] = useState(activeTab || "agent");

  // Filter integrations and channels by agent type
  const relevantToolKeys = TOOLS_BY_AGENT_TYPE[agentType] || TOOLS_BY_AGENT_TYPE["Custom"];
  const relevantChannelKeys = CHANNELS_BY_AGENT_TYPE[agentType] || CHANNELS_BY_AGENT_TYPE["Custom"];

  const filteredIntegrations = useMemo(() => {
    // Map EXTERNAL_TOOLS values to INTEGRATIONS labels
    const toolLabelMap: Record<string, string[]> = {
      openai: ["OpenAI"],
      anthropic: ["Anthropic"],
      gemini: ["Gemini"],
      elevenlabs: ["ElevenLabs"],
      google_calendar: ["Google Calendar"],
      outlook: ["Outlook Calendar"],
      piperun: ["Piperun"],
      rd_station: ["RD Station"],
      crm_generic: ["HubSpot"],
      deepseek: [],
    };
    const allowedLabels = new Set<string>();
    // Always include OpenRouter
    allowedLabels.add("OpenRouter");
    relevantToolKeys.forEach(key => {
      (toolLabelMap[key] || []).forEach(label => allowedLabels.add(label));
    });
    // For tools that also have calendar/productivity, add related ones
    if (relevantToolKeys.includes("google_calendar")) {
      allowedLabels.add("Google Sheets");
      allowedLabels.add("Google Drive");
      allowedLabels.add("Calendly");
    }
    if (relevantToolKeys.includes("outlook")) {
      allowedLabels.add("Gmail");
    }
    return INTEGRATIONS.filter(i => allowedLabels.has(i.label));
  }, [relevantToolKeys]);

  const filteredChannels = useMemo(() => {
    return CHANNELS.filter(ch => relevantChannelKeys.includes(ch.value as any));
  }, [relevantChannelKeys]);
  const [connectorDialog, setConnectorDialog] = useState<null | typeof INTEGRATIONS[0]>(null);
  const [connectorKeys, setConnectorKeys] = useState<Record<string, { key: string; configured: boolean }>>({});
  const [keyInput, setKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [selectedDialogModel, setSelectedDialogModel] = useState("");
  const currentIntegrationConfigured = connectorDialog ? !!connectorKeys[connectorDialog.label]?.configured : false;
  const shouldShowDialogModels = !!connectorDialog && !!LLM_PROVIDER_MODELS[connectorDialog.label] && (!MODEL_GATED_PROVIDERS.has(connectorDialog.label) || currentIntegrationConfigured);

  // Load existing keys from DB on mount
  useEffect(() => {
    const loadKeys = async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("user_api_keys")
        .select("provider, api_key")
        .eq("user_id", user.id);
      if (data) {
        const map: Record<string, { key: string; configured: boolean }> = {};
        data.forEach((row: any) => {
          const label = Object.entries(PROVIDER_MAP).find(([, v]) => v === row.provider)?.[0] || row.provider;
          map[label] = { key: row.api_key, configured: true };
        });
        setConnectorKeys(map);
      }
    };
    loadKeys();
  }, []);

  const handleTabChange = (tab: string) => {
    setRightTab(tab);
    onTabChange?.(tab);
  };

  useEffect(() => {
    if (activeTab && activeTab !== rightTab) {
      setRightTab(activeTab);
    }
  }, [activeTab]);

  const handleConnectIntegration = (integration: typeof INTEGRATIONS[0]) => {
    const existing = connectorKeys[integration.label];
    if (existing?.configured) {
      setKeyInput(existing.key);
    } else {
      setKeyInput("");
    }
    setShowKey(false);
    // Set default model for LLM providers
    const providerModels = LLM_PROVIDER_MODELS[integration.label];
    setSelectedDialogModel(providerModels?.models[0]?.value || "");
    setConnectorDialog(integration);
  };

  const handleSaveKey = async () => {
    if (!connectorDialog || !keyInput.trim()) return;
    setSavingKey(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Faça login para salvar chaves."); return; }

      const provider = PROVIDER_MAP[connectorDialog.label] || connectorDialog.label.toLowerCase();
      const { error } = await supabase
        .from("user_api_keys")
        .upsert(
          { user_id: user.id, provider, api_key: keyInput.trim() },
          { onConflict: "user_id,provider" }
        );

      if (error) { toast.error("Erro ao salvar chave."); console.error(error); return; }

      setConnectorKeys(prev => ({
        ...prev,
        [connectorDialog.label]: { key: keyInput.trim(), configured: true },
      }));
      await onApiKeysChanged?.();
      // Auto-select the chosen model for the agent
      if (selectedDialogModel && LLM_PROVIDER_MODELS[connectorDialog.label]) {
        onModelChange(selectedDialogModel);
      }
      setConnectorDialog(null);
      setKeyInput("");
      toast.success(`${connectorDialog.label} conectado com sucesso!`);
    } finally {
      setSavingKey(false);
    }
  };

  const handleDisconnect = async () => {
    if (!connectorDialog) return;
    setSavingKey(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const provider = PROVIDER_MAP[connectorDialog.label] || connectorDialog.label.toLowerCase();
      await supabase.from("user_api_keys").delete().eq("user_id", user.id).eq("provider", provider);

      setConnectorKeys(prev => {
        const next = { ...prev };
        delete next[connectorDialog.label];
        return next;
      });
      await onApiKeysChanged?.();
      setConnectorDialog(null);
      setKeyInput("");
      toast.success(`${connectorDialog.label} desconectado.`);
    } finally {
      setSavingKey(false);
    }
  };

  const [settingsNav, setSettingsNav] = useState("general");
  const [agentName, setAgentName] = useState(() => {
    if (storagePrefix) { try { return localStorage.getItem(`${storagePrefix}-name`) || agent.name; } catch {} }
    return agent.name;
  });
  const [agentDesc, setAgentDesc] = useState(() => {
    if (storagePrefix) { try { return localStorage.getItem(`${storagePrefix}-desc`) || ""; } catch {} }
    return "";
  });
  const [agentObjective, setAgentObjective] = useState(() => {
    if (storagePrefix) { try { return localStorage.getItem(`${storagePrefix}-objective`) || ""; } catch {} }
    return "";
  });
  const [agentInstructions, setAgentInstructions] = useState(() => {
    if (storagePrefix) { try { return localStorage.getItem(`${storagePrefix}-instructions`) || ""; } catch {} }
    return "";
  });
  const [agentToneOfVoice, setAgentToneOfVoice] = useState(() => {
    if (storagePrefix) { try { return localStorage.getItem(`${storagePrefix}-toneOfVoice`) || ""; } catch {} }
    return "";
  });
  const [agentGreetingMessage, setAgentGreetingMessage] = useState(() => {
    if (storagePrefix) { try { return localStorage.getItem(`${storagePrefix}-greetingMessage`) || ""; } catch {} }
    return "";
  });
  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFileLocal[]>(() => {
    if (storagePrefix) { try { const s = localStorage.getItem(`${storagePrefix}-files`); if (s) return JSON.parse(s); } catch {} }
    return [];
  });
  const [urlInput, setUrlInput] = useState("");
  const [urls, setUrls] = useState<string[]>(() => {
    if (storagePrefix) { try { const s = localStorage.getItem(`${storagePrefix}-urls`); if (s) return JSON.parse(s); } catch {} }
    return [];
  });
  const [connectedChannels, setConnectedChannels] = useState<string[]>(() => {
    if (storagePrefix) { try { const s = localStorage.getItem(`${storagePrefix}-channels`); if (s) return JSON.parse(s); } catch {} }
    return [];
  });
  const [apiConfig, setApiConfig] = useState<ApiConfig>(() => {
    if (storagePrefix) { try { const s = localStorage.getItem(`${storagePrefix}-apiConfig`); if (s) return JSON.parse(s); } catch {} }
    return DEFAULT_API_CONFIG;
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(() => {
    if (storagePrefix) { try { return localStorage.getItem(`${storagePrefix}-avatar`) || null; } catch {} }
    return null;
  });

  // Persist config to localStorage
  useEffect(() => {
    if (!storagePrefix) return;
    try {
      localStorage.setItem(`${storagePrefix}-name`, agentName);
      localStorage.setItem(`${storagePrefix}-desc`, agentDesc);
      localStorage.setItem(`${storagePrefix}-objective`, agentObjective);
      localStorage.setItem(`${storagePrefix}-instructions`, agentInstructions);
      localStorage.setItem(`${storagePrefix}-toneOfVoice`, agentToneOfVoice);
      localStorage.setItem(`${storagePrefix}-greetingMessage`, agentGreetingMessage);
      localStorage.setItem(`${storagePrefix}-files`, JSON.stringify(knowledgeFiles));
      localStorage.setItem(`${storagePrefix}-urls`, JSON.stringify(urls));
      localStorage.setItem(`${storagePrefix}-channels`, JSON.stringify(connectedChannels));
      localStorage.setItem(`${storagePrefix}-apiConfig`, JSON.stringify(apiConfig));
      if (avatarPreview) localStorage.setItem(`${storagePrefix}-avatar`, avatarPreview);
    } catch {}
  }, [storagePrefix, agentName, agentDesc, agentObjective, agentInstructions, agentToneOfVoice, agentGreetingMessage, knowledgeFiles, urls, connectedChannels, avatarPreview, apiConfig]);

  // Emit config changes to parent
  useEffect(() => {
    onConfigChange?.({
      name: agentName,
      description: agentDesc,
      objective: agentObjective,
      instructions: agentInstructions,
      toneOfVoice: agentToneOfVoice,
      greetingMessage: agentGreetingMessage,
      avatarUrl: avatarPreview || agent.avatar || "",
      channels: connectedChannels,
      integrations: Object.entries(connectorKeys).filter(([, v]) => v.configured).map(([k]) => k),
      knowledgeFiles: knowledgeFiles.map(f => f.name),
      urls,
      apiConfig,
    });
  }, [agentName, agentDesc, agentObjective, agentInstructions, agentToneOfVoice, agentGreetingMessage, avatarPreview, connectedChannels, connectorKeys, knowledgeFiles, urls, apiConfig]);

  const handleFiles = (files: FileList) => {
    const newFiles: KnowledgeFileLocal[] = Array.from(files)
      .filter((f) => f.size <= 10 * 1024 * 1024)
      .map((f) => ({ id: crypto.randomUUID(), name: f.name, size: f.size, type: f.type }));
    setKnowledgeFiles(prev => [...prev, ...newFiles]);
  };

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

  const addUrl = () => {
    if (urlInput.trim() && !urls.includes(urlInput.trim())) {
      setUrls([...urls, urlInput.trim()]);
      setUrlInput("");
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Faça login para enviar imagens."); return; }
      const ext = file.name.split(".").pop() || "png";
      const path = `${user.id}/agent-avatar-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("agent-avatars").upload(path, file, { upsert: true });
      if (error) { toast.error("Erro ao enviar imagem."); console.error(error); return; }
      const { data: urlData } = supabase.storage.from("agent-avatars").getPublicUrl(path);
      if (urlData?.publicUrl) {
        setAvatarPreview(urlData.publicUrl);
        toast.success("Avatar atualizado!");
      }
    } catch (err) {
      console.error("Avatar upload error:", err);
      toast.error("Erro ao enviar avatar.");
    }
  };

  const toggleChannel = (value: string) => {
    setConnectedChannels(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Tabs value={rightTab} onValueChange={handleTabChange} className="flex flex-col h-full">
        <div className="border-b border-border px-4">
          <TabsList className="bg-transparent h-11 gap-0 p-0">
            {[
              { value: "agent", label: "Agente" },
              { value: "connectors", label: "Integrações" },
              { value: "files", label: "Arquivos" },
              { value: "settings", label: "Canais" },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 text-sm"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Integrações — com sub-seções MCP, API, Webhook */}
        <TabsContent value="connectors" className="flex-1 mt-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-foreground">Integrações</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Conecte integrações para expandir as capacidades do seu agente.
                </p>
              </div>

              {/* MCPs */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Blocks className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">MCPs</h3>
                </div>
                <p className="text-xs text-muted-foreground">Conecte servidores MCP para estender o contexto do agente.</p>
                <Button variant="outline" size="sm" className="text-xs gap-1.5">
                  <Plus className="w-3 h-3" /> Adicionar MCP
                </Button>
              </div>

              {/* APIs */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">APIs</h3>
                </div>
                <p className="text-xs text-muted-foreground">Conecte APIs externas via chave de acesso.</p>
                <div className="space-y-1">
                  {filteredIntegrations.map((c) => {
                    const isConnected = connectorKeys[c.label]?.configured;
                    return (
                      <div key={c.label} className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <img
                            src={c.logo}
                            alt={c.label}
                            className="w-7 h-7 rounded object-contain shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-foreground">{c.label}</p>
                              {isConnected && (
                                <span className="flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                                  <Check className="w-2.5 h-2.5" /> Conectado
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{c.desc}</p>
                          </div>
                        </div>
                        <Button
                          variant={isConnected ? "outline" : "ghost"}
                          size="sm"
                          className={`text-xs gap-1 ${isConnected ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                          onClick={() => handleConnectIntegration(c)}
                        >
                          {isConnected ? (
                            <><Settings className="w-3 h-3" /> Gerenciar</>
                          ) : (
                            "+ Conectar"
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Webhooks */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Webhook className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Webhooks</h3>
                </div>
                <p className="text-xs text-muted-foreground">Configure webhooks para receber e enviar eventos em tempo real.</p>
                <Button variant="outline" size="sm" className="text-xs gap-1.5">
                  <Plus className="w-3 h-3" /> Adicionar Webhook
                </Button>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Arquivos - Knowledge */}
        <TabsContent value="files" className="flex-1 mt-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-foreground">Conhecimento</h2>
                <p className="text-sm text-muted-foreground mt-1">Fontes de dados para alimentar o agente.</p>
              </div>

              <div
                className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => { e.preventDefault(); e.stopPropagation(); if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files); }}
              >
                <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground">Arraste arquivos ou clique para enviar</p>
                <p className="text-xs text-muted-foreground mt-1">PDFs, documentos, FAQ, Notion, Google Drive</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.md,.csv,.json,.xlsx"
                  className="hidden"
                  onChange={(e) => e.target.files && handleFiles(e.target.files)}
                />
              </div>

              {knowledgeFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Arquivos enviados</p>
                  {knowledgeFiles.map((f) => (
                    <div key={f.id} className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2">
                      {getFileIcon(f.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{f.name}</p>
                        <p className="text-[11px] text-muted-foreground">{formatSize(f.size)}</p>
                      </div>
                      <button onClick={() => setKnowledgeFiles(prev => prev.filter(x => x.id !== f.id))} className="text-muted-foreground hover:text-destructive">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">URLs</p>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Link2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://exemplo.com/faq"
                      className="pl-9"
                      onKeyDown={(e) => e.key === "Enter" && addUrl()}
                    />
                  </div>
                  <Button size="sm" onClick={addUrl} disabled={!urlInput.trim()} className="gap-1 shrink-0">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {urls.map((url, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2">
                    <Globe className="w-4 h-4 text-primary shrink-0" />
                    <p className="text-sm text-foreground truncate flex-1">{url}</p>
                    <button onClick={() => setUrls(urls.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Agent — Settings with sidebar */}
        <TabsContent value="agent" className="flex-1 mt-0 overflow-hidden">
          <div className="flex h-full">
            <div className="w-48 border-r border-border p-4 space-y-4 shrink-0">
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

            <ScrollArea className="flex-1">
              <div className="p-6 max-w-lg space-y-8">
                {settingsNav === "general" && (
                  <>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">Identidade</h2>
                      <p className="text-sm text-muted-foreground mt-1">Identidade, propósito e modelo de IA do agente.</p>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-foreground">Avatar</h3>
                      <div className="flex items-center gap-4">
                        <div
                          className="w-16 h-16 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden"
                          onClick={() => avatarInputRef.current?.click()}
                        >
                          {avatarPreview ? (
                            <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                          ) : agent.avatar ? (
                            <img src={agent.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Camera className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <Button variant="outline" size="sm" onClick={() => avatarInputRef.current?.click()} className="text-xs">
                            Enviar foto
                          </Button>
                          <p className="text-[11px] text-muted-foreground mt-1">JPEG, PNG ou WebP · até 5 MB</p>
                        </div>
                        <input
                          ref={avatarInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={handleAvatarChange}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-foreground">Nome</h3>
                      <Input value={agentName} onChange={(e) => setAgentName(e.target.value)} className="text-sm" />
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-foreground">Descrição</h3>
                      <p className="text-xs text-muted-foreground">Define o papel e personalidade do agente. Carregado no system prompt.</p>
                      <Textarea
                        value={agentDesc}
                        onChange={(e) => setAgentDesc(e.target.value)}
                        placeholder="Ex: Um assistente de pesquisa que monitora concorrentes e envia briefings diários."
                        className="text-sm min-h-[100px]"
                      />
                    </div>

                    {/* Model — only show if user has at least one LLM key */}
                    {(() => {
                      const hasLLMKey = ["OpenAI", "Anthropic", "Gemini"].some(p => connectorKeys[p]?.configured);
                      if (!hasLLMKey) return (
                        <div className="space-y-2">
                          <h3 className="text-sm font-semibold text-foreground">Modelo</h3>
                          <p className="text-xs text-muted-foreground">Configure uma chave de API na aba <strong>Integrações</strong> para escolher o modelo de IA.</p>
                          <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => handleTabChange("connectors")}>
                            <KeyRound className="w-3 h-3" /> Ir para Integrações
                          </Button>
                        </div>
                      );
                      // Build available models from configured providers
                      const availableModels: { value: string; label: string }[] = [];
                      ["OpenAI", "Anthropic", "Gemini"].forEach(provider => {
                        if (connectorKeys[provider]?.configured && LLM_PROVIDER_MODELS[provider]) {
                          LLM_PROVIDER_MODELS[provider].models.forEach(m => availableModels.push({ value: m.value, label: m.label }));
                        }
                      });
                      return (
                        <div className="space-y-2">
                          <h3 className="text-sm font-semibold text-foreground">Modelo</h3>
                          <p className="text-xs text-muted-foreground">O modelo de IA usado pelo agente.</p>
                          <Select value={agentModel} onValueChange={onModelChange}>
                            <SelectTrigger className="text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {availableModels.map(m => (
                                <SelectItem key={m.value} value={m.value}>🤖 {m.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    })()}

                    {/* Save Agent Button */}
                    <div className="pt-4 border-t border-border">
                      <Button
                        className="w-full gap-2"
                        onClick={() => onSaveAgent?.({
                          name: agentName,
                          description: agentDesc,
                          objective: agentObjective,
                          instructions: agentInstructions,
                          toneOfVoice: agentToneOfVoice,
                          greetingMessage: agentGreetingMessage,
                          avatarUrl: avatarPreview || agent.avatar || "",
                          channels: connectedChannels,
                          integrations: Object.entries(connectorKeys).filter(([, v]) => v.configured).map(([k]) => k),
                          knowledgeFiles: knowledgeFiles.map(f => f.name),
                          urls,
                          apiConfig,
                          model: agentModel,
                          agentType: agentType,
                        })}
                        disabled={!agentName.trim() || isSaving}
                      >
                        {isSaving ? "Salvando..." : "💾 Salvar Agente"}
                      </Button>
                    </div>
                  </>
                )}

                {settingsNav === "objective" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-bold text-foreground">Objetivo</h2>
                      <p className="text-sm text-muted-foreground mt-1">Defina a missão principal do agente.</p>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-foreground">Missão / Objetivo</h3>
                      <p className="text-xs text-muted-foreground">O que o agente deve alcançar em cada interação.</p>
                      <Textarea
                        value={agentObjective}
                        onChange={(e) => setAgentObjective(e.target.value)}
                        placeholder="Ex: Qualificar leads e agendar reuniões com decisores."
                        className="text-sm min-h-[100px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-foreground">Mensagem de Saudação</h3>
                      <p className="text-xs text-muted-foreground">A primeira mensagem que o agente envia ao iniciar uma conversa.</p>
                      <Textarea
                        value={agentGreetingMessage}
                        onChange={(e) => setAgentGreetingMessage(e.target.value)}
                        placeholder="Ex: Olá! Sou o assistente da [empresa]. Como posso ajudar?"
                        className="text-sm min-h-[80px]"
                      />
                    </div>
                  </div>
                )}

                {settingsNav === "instructions" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-bold text-foreground">Instruções</h2>
                      <p className="text-sm text-muted-foreground mt-1">Regras e comportamento do agente.</p>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-foreground">Instruções / Regras</h3>
                      <p className="text-xs text-muted-foreground">Regras que o agente deve seguir. Ex: não dar descontos, sempre pedir e-mail.</p>
                      <Textarea
                        value={agentInstructions}
                        onChange={(e) => setAgentInstructions(e.target.value)}
                        placeholder="Ex: Sempre pergunte o nome e e-mail do lead antes de agendar. Nunca ofereça descontos sem aprovação."
                        className="text-sm min-h-[120px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-foreground">Tom de Voz</h3>
                      <p className="text-xs text-muted-foreground">Como o agente se comunica.</p>
                      <Textarea
                        value={agentToneOfVoice}
                        onChange={(e) => setAgentToneOfVoice(e.target.value)}
                        placeholder="Ex: Profissional, amigável, direto e empático."
                        className="text-sm min-h-[80px]"
                      />
                    </div>
                  </div>
                )}


                {settingsNav === "channels" && (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-lg font-bold text-foreground">Canais</h2>
                      <p className="text-sm text-muted-foreground mt-1">Onde seu agente opera.</p>
                    </div>
                    {filteredChannels.map((ch) => {
                      const isSelected = connectedChannels.includes(ch.value);
                      return (
                        <div
                          key={ch.value}
                          className={`flex items-center gap-4 rounded-xl border-2 p-4 transition-all ${
                            isSelected ? "border-primary bg-primary/5 shadow-md" : "border-border bg-card"
                          }`}
                        >
                          {ch.logo ? (
                            <img src={ch.logo} alt={ch.label} className="w-8 h-8 rounded-lg object-contain shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          ) : (
                            <Globe className="w-8 h-8 text-primary shrink-0" />
                          )}
                          <span className="text-sm font-semibold text-foreground flex-1">{ch.label}</span>
                          <Button
                            size="sm"
                            variant={isSelected ? "default" : "outline"}
                            onClick={() => toggleChannel(ch.value)}
                            className="shrink-0 text-xs h-8 gap-1.5"
                          >
                            {isSelected ? <><Check className="w-3 h-3" /> Conectado</> : "Conectar"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {settingsNav === "danger" && (
                  <div>
                    <h2 className="text-lg font-bold text-destructive">Danger Zone</h2>
                    <p className="text-sm text-muted-foreground mt-1">Ações irreversíveis para este agente.</p>
                    <Button variant="destructive" size="sm" className="mt-4">Excluir Agente</Button>
                  </div>
                )}

                {settingsNav === "advanced" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-bold text-foreground">Configurações da API</h2>
                      <p className="text-sm text-muted-foreground mt-1">Parâmetros avançados para controlar o comportamento do LLM.</p>
                    </div>

                    {/* Temperature */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-foreground">Temperature</label>
                        <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">{apiConfig.temperature}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={apiConfig.temperature}
                        onChange={(e) => setApiConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                        className="w-full accent-primary"
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Preciso (0)</span>
                        <span>Equilibrado (0.7)</span>
                        <span>Criativo (2)</span>
                      </div>
                    </div>

                    {/* Max Tokens */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Max Tokens</label>
                      <p className="text-[11px] text-muted-foreground">Número máximo de tokens na resposta.</p>
                      <Input
                        type="number"
                        min={1}
                        max={128000}
                        value={apiConfig.maxTokens}
                        onChange={(e) => setApiConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) || 2048 }))}
                        className="text-sm font-mono"
                      />
                    </div>

                    {/* Top P */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-foreground">Top P (Nucleus Sampling)</label>
                        <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">{apiConfig.topP}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={apiConfig.topP}
                        onChange={(e) => setApiConfig(prev => ({ ...prev, topP: parseFloat(e.target.value) }))}
                        className="w-full accent-primary"
                      />
                      <p className="text-[11px] text-muted-foreground">Controla a diversidade das respostas. Menor = mais focado.</p>
                    </div>

                    {/* Frequency Penalty */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-foreground">Frequency Penalty</label>
                        <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">{apiConfig.frequencyPenalty}</span>
                      </div>
                      <input
                        type="range"
                        min="-2"
                        max="2"
                        step="0.1"
                        value={apiConfig.frequencyPenalty}
                        onChange={(e) => setApiConfig(prev => ({ ...prev, frequencyPenalty: parseFloat(e.target.value) }))}
                        className="w-full accent-primary"
                      />
                      <p className="text-[11px] text-muted-foreground">Penaliza repetição de tokens frequentes. Positivo = menos repetição.</p>
                    </div>

                    {/* Presence Penalty */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-foreground">Presence Penalty</label>
                        <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">{apiConfig.presencePenalty}</span>
                      </div>
                      <input
                        type="range"
                        min="-2"
                        max="2"
                        step="0.1"
                        value={apiConfig.presencePenalty}
                        onChange={(e) => setApiConfig(prev => ({ ...prev, presencePenalty: parseFloat(e.target.value) }))}
                        className="w-full accent-primary"
                      />
                      <p className="text-[11px] text-muted-foreground">Incentiva novos tópicos. Positivo = mais diversidade temática.</p>
                    </div>

                    {/* Response Format */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Formato de Resposta</label>
                      <Select value={apiConfig.responseFormat} onValueChange={(v) => setApiConfig(prev => ({ ...prev, responseFormat: v as "text" | "json" }))}>
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Texto</SelectItem>
                          <SelectItem value="json">JSON</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[11px] text-muted-foreground">JSON mode força a saída em formato JSON válido.</p>
                    </div>

                    {/* Stop Sequences */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Stop Sequences</label>
                      <p className="text-[11px] text-muted-foreground">Sequências que encerram a geração. Separe por vírgulas.</p>
                      <Input
                        value={apiConfig.stopSequences.join(", ")}
                        onChange={(e) => setApiConfig(prev => ({
                          ...prev,
                          stopSequences: e.target.value ? e.target.value.split(",").map(s => s.trim()).filter(Boolean) : [],
                        }))}
                        placeholder='Ex: "###", "FIM"'
                        className="text-sm font-mono"
                      />
                    </div>

                    {/* Reset */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => setApiConfig(DEFAULT_API_CONFIG)}
                    >
                      Restaurar padrões
                    </Button>
                  </div>
                )}

                {settingsNav === "machine" && (
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Machine</h2>
                    <p className="text-sm text-muted-foreground mt-1">Configuração em breve.</p>
                  </div>
                )}

                {!["general", "objective", "instructions", "channels", "danger", "advanced", "machine"].includes(settingsNav) && (
                  <div>
                    <h2 className="text-lg font-bold text-foreground capitalize">{settingsNav}</h2>
                    <p className="text-sm text-muted-foreground mt-1">Configuração em breve.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>

        {/* Canais */}
        <TabsContent value="settings" className="flex-1 mt-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 max-w-lg space-y-6">
              <div>
                <h2 className="text-lg font-bold text-foreground">Canais</h2>
                <p className="text-sm text-muted-foreground mt-1">Onde seu agente será publicado e poderá interagir.</p>
              </div>
              {filteredChannels.map((ch) => {
                const isSelected = connectedChannels.includes(ch.value);
                return (
                  <div
                    key={ch.value}
                    className={`flex items-center gap-4 rounded-xl border-2 p-4 transition-all ${
                      isSelected ? "border-primary bg-primary/5 shadow-md" : "border-border bg-card"
                    }`}
                  >
                    {ch.logo ? (
                      <img src={ch.logo} alt={ch.label} className="w-8 h-8 rounded-lg object-contain shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      <Globe className="w-8 h-8 text-primary shrink-0" />
                    )}
                    <span className="text-sm font-semibold text-foreground flex-1">{ch.label}</span>
                    <Button
                      size="sm"
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => toggleChannel(ch.value)}
                      className="shrink-0 text-xs h-8 gap-1.5"
                    >
                      {isSelected ? <><Check className="w-3 h-3" /> Conectado</> : "Conectar"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Integration Config Dialog */}
      <Dialog open={!!connectorDialog} onOpenChange={(open) => { if (!open) { setConnectorDialog(null); setKeyInput(""); } }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              {connectorDialog && (
                <img
                  src={connectorDialog.logo}
                  alt={connectorDialog.label}
                  className="w-8 h-8 rounded object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              )}
              <div>
                <DialogTitle className="text-base">
                  {connectorKeys[connectorDialog?.label || ""]?.configured ? "Gerenciar" : "Conectar"} {connectorDialog?.label}
                </DialogTitle>
                <DialogDescription className="text-xs mt-0.5">
                  {connectorDialog?.desc}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            {/* API Key */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">API Key</label>
              <div className="relative">
                <Input
                  type={showKey ? "text" : "password"}
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder={`Cole sua ${connectorDialog?.label} API Key aqui`}
                  className="pr-10 text-sm font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {connectorDialog?.label === "OpenAI" && (
                  <>Encontre sua API Key em <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">platform.openai.com <ExternalLink className="w-3 h-3" /></a></>
                )}
                {connectorDialog?.label === "Anthropic" && (
                  <>Encontre sua API Key em <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">console.anthropic.com <ExternalLink className="w-3 h-3" /></a></>
                )}
                {connectorDialog?.label === "Gemini" && (
                  <>Encontre sua API Key em <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">aistudio.google.com <ExternalLink className="w-3 h-3" /></a></>
                )}
                {connectorDialog?.label === "ElevenLabs" && (
                  <>Encontre sua API Key em <a href="https://elevenlabs.io/settings/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">elevenlabs.io <ExternalLink className="w-3 h-3" /></a></>
                )}
                {!["OpenAI", "Anthropic", "Gemini", "ElevenLabs"].includes(connectorDialog?.label || "") && (
                  <>Cole a chave de API fornecida pelo serviço.</>
                )}
              </p>
            </div>

            {/* Model Selection — gated for providers that require API key first */}
            {connectorDialog && LLM_PROVIDER_MODELS[connectorDialog.label] && !shouldShowDialogModels && (
              <div className="space-y-2 rounded-lg border border-dashed border-border bg-muted/30 p-3">
                <label className="text-sm font-medium text-foreground">Modelo padrão</label>
                <p className="text-[11px] text-muted-foreground">
                  Os modelos da {connectorDialog.label} aparecem somente depois que a chave de API for conectada.
                </p>
              </div>
            )}

            {/* Model Selection — only for eligible LLM providers */}
            {shouldShowDialogModels && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Modelo padrão</label>
                <p className="text-[11px] text-muted-foreground -mt-1">Escolha o modelo que será usado pelo agente.</p>
                <RadioGroup value={selectedDialogModel} onValueChange={setSelectedDialogModel} className="space-y-2">
                  {LLM_PROVIDER_MODELS[connectorDialog.label].models.map((m) => (
                    <div key={m.value} className={`flex items-start gap-3 rounded-lg border p-3 transition-colors cursor-pointer ${selectedDialogModel === m.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`} onClick={() => setSelectedDialogModel(m.value)}>
                      <RadioGroupItem value={m.value} id={m.value} className="mt-0.5" />
                      <Label htmlFor={m.value} className="cursor-pointer flex-1">
                        <span className="text-sm font-medium text-foreground">{m.label}</span>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{m.desc}</p>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* Capabilities — only for LLM providers */}
            {connectorDialog && LLM_PROVIDER_MODELS[connectorDialog.label] && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Recursos disponíveis</label>
                <div className="flex flex-wrap gap-1.5">
                  {LLM_PROVIDER_MODELS[connectorDialog.label].capabilities.map((cap) => (
                    <span key={cap} className="text-[11px] px-2 py-1 rounded-full bg-muted text-muted-foreground border border-border">
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              {connectorKeys[connectorDialog?.label || ""]?.configured ? (
                <Button variant="destructive" size="sm" className="text-xs gap-1.5" onClick={handleDisconnect}>
                  <Trash2 className="w-3 h-3" /> Desconectar
                </Button>
              ) : (
                <div />
              )}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setConnectorDialog(null); setKeyInput(""); }}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleSaveKey} disabled={!keyInput.trim() || savingKey}>
                  {connectorKeys[connectorDialog?.label || ""]?.configured ? "Atualizar" : "Conectar"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Persistent Save Button */}
      <div className="border-t border-border px-4 py-3 shrink-0 bg-background">
        <Button
          className="w-full gap-2 h-10"
          onClick={() => onSaveAgent?.({
            name: agentName,
            description: agentDesc,
            objective: agentObjective,
            instructions: agentInstructions,
            toneOfVoice: agentToneOfVoice,
            greetingMessage: agentGreetingMessage,
            avatarUrl: avatarPreview || agent.avatar || "",
            channels: connectedChannels,
            integrations: Object.entries(connectorKeys).filter(([, v]) => v.configured).map(([k]) => k),
            knowledgeFiles: knowledgeFiles.map(f => f.name),
            urls,
            apiConfig,
            model: agentModel,
            agentType: agentType,
          })}
          disabled={!agentName.trim() || isSaving}
        >
          {isSaving ? "Salvando..." : "💾 Salvar Agente"}
        </Button>
      </div>
    </div>
  );
};

export default AgentRightPanel;
