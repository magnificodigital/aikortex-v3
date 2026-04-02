import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import type { AgentType } from "@/types/agent-builder";
import { CHANNELS_BY_AGENT_TYPE, TOOLS_BY_AGENT_TYPE } from "@/types/agent-builder";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User, Zap, Settings2, AlertTriangle,
  Upload, X, FileText, Image, File, Plus, Globe, Link2, Check, Camera,
  Webhook, KeyRound, Blocks, Eye, EyeOff, ExternalLink, Trash2, Settings, Rocket,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import VoiceConfigPanel, { type VoiceConfig, DEFAULT_VOICE_CONFIG } from "./VoiceConfigPanel";

const LLM_PROVIDER_MODELS: Record<string, { models: { value: string; label: string; desc: string }[]; capabilities: string[] }> = {
  OpenAI: {
    models: [
      { value: "gpt-5.2",       label: "GPT-5.2",        desc: "Mais recente. Raciocínio aprimorado." },
      { value: "gpt-5",         label: "GPT-5",           desc: "Poderoso. Raciocínio complexo e multimodal." },
      { value: "gpt-5-mini",    label: "GPT-5 Mini",      desc: "Equilíbrio entre custo e desempenho." },
      { value: "gpt-4o",        label: "GPT-4o",          desc: "Multimodal com visão e áudio." },
      { value: "gpt-4o-mini",   label: "GPT-4o Mini",     desc: "Versão leve do GPT-4o." },
      { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo",   desc: "Rápido e econômico." },
    ],
    capabilities: ["Chat e completions", "Visão (imagens)", "Function calling", "JSON mode"],
  },
  Anthropic: {
    models: [
      { value: "claude-4-sonnet",   label: "Claude 4 Sonnet",   desc: "Mais inteligente e versátil." },
      { value: "claude-3.5-sonnet", label: "Claude 3.5 Sonnet", desc: "Excelente raciocínio e código." },
      { value: "claude-3-opus",     label: "Claude 3 Opus",     desc: "Mais poderoso da família Claude 3." },
      { value: "claude-3-haiku",    label: "Claude 3 Haiku",    desc: "Rápido e econômico." },
    ],
    capabilities: ["Chat e completions", "Visão (imagens)", "Function calling", "Contexto de 200K tokens"],
  },
  Gemini: {
    models: [
      { value: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro",       desc: "Raciocínio de próxima geração." },
      { value: "gemini-2.5-pro",         label: "Gemini 2.5 Pro",        desc: "Top-tier com raciocínio avançado." },
      { value: "gemini-2.5-flash",       label: "Gemini 2.5 Flash",      desc: "Rápido e equilibrado." },
      { value: "gemini-2.5-flash-lite",  label: "Gemini 2.5 Flash Lite", desc: "Mais econômico." },
    ],
    capabilities: ["Chat e completions", "Visão (imagens e vídeo)", "Function calling", "Contexto de 1M tokens"],
  },
  ElevenLabs: {
    models: [
      { value: "eleven_multilingual_v2", label: "Multilingual v2", desc: "Voz multilíngue de alta qualidade." },
      { value: "eleven_turbo_v2_5",      label: "Turbo v2.5",      desc: "Baixa latência para tempo real." },
    ],
    capabilities: ["Text-to-speech", "Clonagem de voz", "Streaming de áudio"],
  },
  DeepSeek: {
    models: [
      { value: "deepseek-r1", label: "DeepSeek R1", desc: "Raciocínio avançado open-source." },
      { value: "deepseek-v3", label: "DeepSeek V3", desc: "Modelo geral de alta performance." },
    ],
    capabilities: ["Chat e completions", "Raciocínio avançado", "Geração de código"],
  },
};

const INTEGRATIONS = [
  { label: "OpenAI",           desc: "Modelos GPT para geração de texto e análise.",     logo: "https://cdn.simpleicons.org/openai" },
  { label: "Anthropic",        desc: "Modelos Claude para raciocínio avançado.",          logo: "https://cdn.simpleicons.org/anthropic" },
  { label: "Gemini",           desc: "IA multimodal do Google.",                          logo: "https://cdn.simpleicons.org/googlegemini" },
  { label: "ElevenLabs",       desc: "Geração de voz e text-to-speech.",                  logo: "https://cdn.simpleicons.org/elevenlabs" },
  { label: "DeepSeek",         desc: "Modelos open-source de alto desempenho.",           logo: "https://cdn.simpleicons.org/deepseek" },
  { label: "OpenRouter",       desc: "Acesso unificado a múltiplos LLMs.",                logo: "https://openrouter.ai/favicon.ico" },
  { label: "Google Calendar",  desc: "Ler e gerenciar eventos.",                          logo: "https://cdn.simpleicons.org/googlecalendar" },
  { label: "Google Sheets",    desc: "Ler e escrever planilhas.",                         logo: "https://cdn.simpleicons.org/googlesheets" },
  { label: "Google Drive",     desc: "Ler, enviar e gerenciar arquivos.",                 logo: "https://cdn.simpleicons.org/googledrive" },
  { label: "Calendly",         desc: "Agendamento automático.",                           logo: "https://cdn.simpleicons.org/calendly" },
  { label: "Outlook Calendar", desc: "Gerenciar calendário Microsoft.",                   logo: "https://cdn.simpleicons.org/microsoftoutlook" },
  { label: "Piperun",          desc: "CRM de vendas e automação.",                        logo: "https://www.piperun.com/wp-content/uploads/2023/07/favicon-piperun-crm.png" },
  { label: "HubSpot",          desc: "CRM, marketing e vendas.",                          logo: "https://cdn.simpleicons.org/hubspot" },
  { label: "RD Station",       desc: "Automação de marketing e CRM.",                     logo: "https://cdn.simpleicons.org/rdstation" },
];

const CHANNELS = [
  { value: "whatsapp",  label: "WhatsApp",  logo: "https://cdn.simpleicons.org/whatsapp" },
  { value: "instagram", label: "Instagram", logo: "https://cdn.simpleicons.org/instagram" },
  { value: "facebook",  label: "Facebook",  logo: "https://cdn.simpleicons.org/facebook" },
  { value: "linkedin",  label: "LinkedIn",  logo: "https://cdn.simpleicons.org/linkedin" },
  { value: "tiktok",    label: "TikTok",    logo: "https://cdn.simpleicons.org/tiktok" },
  { value: "website",   label: "WebSite",   logo: "" },
];

const SETTINGS_NAV = [
  { section: "AGENTE", items: [
    { key: "general",      icon: User,      label: "Identidade" },
    { key: "objective",    icon: Zap,       label: "Objetivo" },
    { key: "instructions", icon: Settings2, label: "Instruções" },
    { key: "files_nav",    icon: FileText,  label: "Arquivos" },
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
  temperature: 0.7, maxTokens: 2048, topP: 1,
  frequencyPenalty: 0, presencePenalty: 0,
  responseFormat: "text", stopSequences: [],
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
  voiceConfig?: VoiceConfig;
}

// FIX: presetData adicionada para receber dados do wizard
interface PresetData {
  name?: string;
  description?: string;
  objective?: string;
  instructions?: string;
  toneOfVoice?: string;
  greetingMessage?: string;
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
  onPublish?: () => void | Promise<void>;
  canPublish?: boolean;
  isSaving?: boolean;
  storagePrefix?: string;
  savedConfig?: Record<string, any> | null;
  // FIX: presetData — preenche campos quando IA estrutura o agente no wizard
  presetData?: PresetData;
  fieldUpdates?: Record<string, string>;
  onDeleteAgent?: () => void | Promise<void>;
}

interface KnowledgeFileLocal {
  id: string; name: string; size: number; type: string;
}

const PROVIDER_MAP: Record<string, string> = {
  "OpenAI": "openai", "Anthropic": "anthropic", "Gemini": "gemini",
  "ElevenLabs": "elevenlabs", "OpenRouter": "openrouter", "DeepSeek": "deepseek",
  "Google Calendar": "google_calendar", "Outlook Calendar": "outlook_calendar",
  "Calendly": "calendly", "Google Sheets": "google_sheets", "Google Drive": "google_drive",
  "Piperun": "piperun", "HubSpot": "hubspot", "RD Station": "rdstation",
};

const AgentRightPanel = ({
  agent, agentType, agentModel, onModelChange,
  activeTab, onTabChange, onApiKeysChanged,
  onConfigChange, onSaveAgent, onPublish, canPublish,
  isSaving, storagePrefix, savedConfig, presetData,
  fieldUpdates, onDeleteAgent,
}: Props) => {
  const [rightTab, setRightTab] = useState(activeTab || "agent");

  const relevantToolKeys    = TOOLS_BY_AGENT_TYPE[agentType]    || TOOLS_BY_AGENT_TYPE["Custom"];
  const relevantChannelKeys = CHANNELS_BY_AGENT_TYPE[agentType] || CHANNELS_BY_AGENT_TYPE["Custom"];

  const filteredIntegrations = useMemo(() => {
    const toolLabelMap: Record<string, string[]> = {
      openai: ["OpenAI"], anthropic: ["Anthropic"], gemini: ["Gemini"],
      elevenlabs: ["ElevenLabs"], google_calendar: ["Google Calendar"],
      outlook: ["Outlook Calendar"], piperun: ["Piperun"],
      rd_station: ["RD Station"], crm_generic: ["HubSpot"], deepseek: ["DeepSeek"],
    };
    const allowedLabels = new Set<string>(["OpenRouter"]);
    relevantToolKeys.forEach(key => (toolLabelMap[key] || []).forEach(l => allowedLabels.add(l)));
    if (relevantToolKeys.includes("google_calendar")) {
      ["Google Sheets", "Google Drive", "Calendly"].forEach(l => allowedLabels.add(l));
    }
    if (agentType === "Custom") {
      ["OpenAI", "Anthropic", "Gemini", "ElevenLabs", "DeepSeek"].forEach(l => allowedLabels.add(l));
    }
    return INTEGRATIONS.filter(i => allowedLabels.has(i.label));
  }, [relevantToolKeys, agentType]);

  const filteredChannels = useMemo(() => {
    if (agentType === "Custom") return CHANNELS;
    return CHANNELS.filter(ch => relevantChannelKeys.includes(ch.value as any));
  }, [relevantChannelKeys, agentType]);

  // ── Connector keys ──
  const [connectorDialog,     setConnectorDialog]     = useState<null | typeof INTEGRATIONS[0]>(null);
  const [connectorKeys,       setConnectorKeys]       = useState<Record<string, { key: string; configured: boolean }>>({});
  const [keyInput,            setKeyInput]            = useState("");
  const [showKey,             setShowKey]             = useState(false);
  const [savingKey,           setSavingKey]           = useState(false);
  const [selectedDialogModel, setSelectedDialogModel] = useState("");
  const currentIntegrationConfigured = connectorDialog ? !!connectorKeys[connectorDialog.label]?.configured : false;
  const shouldShowDialogModels = !!connectorDialog && !!LLM_PROVIDER_MODELS[connectorDialog.label] && currentIntegrationConfigured;

  useEffect(() => {
    const loadKeys = async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("user_api_keys").select("provider, api_key").eq("user_id", user.id);
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

  const handleTabChange = (tab: string) => { setRightTab(tab); onTabChange?.(tab); };
  useEffect(() => { if (activeTab && activeTab !== rightTab) setRightTab(activeTab); }, [activeTab]);

  const handleConnectIntegration = (integration: typeof INTEGRATIONS[0]) => {
    const existing = connectorKeys[integration.label];
    setKeyInput(existing?.configured ? existing.key : "");
    setShowKey(false);
    setSelectedDialogModel(LLM_PROVIDER_MODELS[integration.label]?.models[0]?.value || "");
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
      const { error } = await supabase.from("user_api_keys")
        .upsert({ user_id: user.id, provider, api_key: keyInput.trim() }, { onConflict: "user_id,provider" });
      if (error) { toast.error("Erro ao salvar chave."); return; }
      setConnectorKeys(prev => ({ ...prev, [connectorDialog.label]: { key: keyInput.trim(), configured: true } }));
      await onApiKeysChanged?.();
      if (selectedDialogModel && LLM_PROVIDER_MODELS[connectorDialog.label]) onModelChange(selectedDialogModel);
      setConnectorDialog(null);
      setKeyInput("");
      toast.success(`${connectorDialog.label} conectado com sucesso!`);
    } finally { setSavingKey(false); }
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
      setConnectorKeys(prev => { const next = { ...prev }; delete next[connectorDialog.label]; return next; });
      await onApiKeysChanged?.();
      setConnectorDialog(null);
      setKeyInput("");
      toast.success(`${connectorDialog.label} desconectado.`);
    } finally { setSavingKey(false); }
  };

  // ── Agent fields ──
  const [settingsNav, setSettingsNav] = useState("general");

  // FIX: ordem de prioridade — savedConfig > presetData > localStorage > default
  const resolveInitial = (key: string, fromSaved?: string, fromPreset?: string): string => {
    if (fromSaved)  return fromSaved;
    if (fromPreset) return fromPreset;
    if (storagePrefix) { try { const v = localStorage.getItem(`${storagePrefix}-${key}`); if (v) return v; } catch {} }
    return "";
  };

  const [agentName,           setAgentName]           = useState(() => resolveInitial("name",           savedConfig?.name,           presetData?.name)           || agent.name || "");
  const [agentDesc,           setAgentDesc]           = useState(() => resolveInitial("desc",           savedConfig?.description,    presetData?.description));
  const [agentObjective,      setAgentObjective]      = useState(() => resolveInitial("objective",      savedConfig?.objective,      presetData?.objective));
  const [agentInstructions,   setAgentInstructions]   = useState(() => resolveInitial("instructions",   savedConfig?.instructions,   presetData?.instructions));
  const [agentToneOfVoice,    setAgentToneOfVoice]    = useState(() => resolveInitial("toneOfVoice",    savedConfig?.toneOfVoice,    presetData?.toneOfVoice));
  const [agentGreetingMessage,setAgentGreetingMessage]= useState(() => resolveInitial("greetingMessage",savedConfig?.greetingMessage,presetData?.greetingMessage));

  const [knowledgeFiles,    setKnowledgeFiles]    = useState<KnowledgeFileLocal[]>(() => {
    if (savedConfig?.knowledgeFiles?.length)
      return savedConfig.knowledgeFiles.map((n: string, i: number) => ({ id: String(i), name: n, size: 0, type: "" }));
    return [];
  });
  const [urlInput,          setUrlInput]          = useState("");
  const [urls,              setUrls]              = useState<string[]>(() => savedConfig?.urls?.length     ? savedConfig.urls     : []);
  const [connectedChannels, setConnectedChannels] = useState<string[]>(() => savedConfig?.channels?.length ? savedConfig.channels : []);
  const [apiConfig,         setApiConfig]         = useState<ApiConfig>(() =>
    savedConfig?.apiConfig ? { ...DEFAULT_API_CONFIG, ...savedConfig.apiConfig } : DEFAULT_API_CONFIG
  );
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig>(() =>
    savedConfig?.voiceConfig ? { ...DEFAULT_VOICE_CONFIG, ...savedConfig.voiceConfig } : { ...DEFAULT_VOICE_CONFIG, agentName: agent.name }
  );

  const fileInputRef   = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(() => savedConfig?.avatarUrl || null);

  // FIX: quando presetData muda (wizard estruturou), atualizar campos
  useEffect(() => {
    if (!presetData) return;
    if (presetData.name)            setAgentName(presetData.name);
    if (presetData.description)     setAgentDesc(presetData.description);
    if (presetData.objective)       setAgentObjective(presetData.objective);
    if (presetData.instructions)    setAgentInstructions(presetData.instructions);
    if (presetData.toneOfVoice)     setAgentToneOfVoice(presetData.toneOfVoice);
    if (presetData.greetingMessage) setAgentGreetingMessage(presetData.greetingMessage);
  }, [presetData]);

  // FIX: fieldUpdates do chat — atualiza campos em tempo real
  useEffect(() => {
    if (!fieldUpdates) return;
    const map: Record<string, (v: string) => void> = {
      name:            setAgentName,
      description:     setAgentDesc,
      objective:       setAgentObjective,
      instructions:    setAgentInstructions,
      toneOfVoice:     setAgentToneOfVoice,
      greetingMessage: setAgentGreetingMessage,
    };
    Object.entries(fieldUpdates).forEach(([field, value]) => {
      if (field === "channels") {
        const chs = value.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
        setConnectedChannels(prev => Array.from(new Set([...prev, ...chs])));
      } else if (map[field]) {
        map[field](value);
      }
    });
  }, [fieldUpdates]);

  // Emitir config para o pai
  useEffect(() => {
    onConfigChange?.({
      name: agentName, description: agentDesc, objective: agentObjective,
      instructions: agentInstructions, toneOfVoice: agentToneOfVoice,
      greetingMessage: agentGreetingMessage,
      avatarUrl: avatarPreview || agent.avatar || "",
      channels: connectedChannels,
      integrations: Object.entries(connectorKeys).filter(([, v]) => v.configured).map(([k]) => k),
      knowledgeFiles: knowledgeFiles.map(f => f.name), urls, apiConfig,
      voiceConfig,
    });
  }, [agentName, agentDesc, agentObjective, agentInstructions, agentToneOfVoice, agentGreetingMessage,
      avatarPreview, connectedChannels, connectorKeys, knowledgeFiles, urls, apiConfig, voiceConfig]);

  // ── Helpers ──
  const handleFiles = (files: FileList) => {
    const newFiles: KnowledgeFileLocal[] = Array.from(files)
      .filter(f => f.size <= 10 * 1024 * 1024)
      .map(f => ({ id: crypto.randomUUID(), name: f.name, size: f.size, type: f.type }));
    setKnowledgeFiles(prev => [...prev, ...newFiles]);
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/"))      return <Image    className="w-4 h-4 text-primary shrink-0" />;
    if (type === "application/pdf")     return <FileText className="w-4 h-4 text-destructive shrink-0" />;
    return                                     <File     className="w-4 h-4 text-muted-foreground shrink-0" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0)         return "";
    if (bytes < 1024)        return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return                          `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
      if (!user) return;
      const ext  = file.name.split(".").pop() || "png";
      const path = `${user.id}/agent-avatar-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("agent-avatars").upload(path, file, { upsert: true });
      if (error) { toast.error("Erro ao enviar imagem."); return; }
      const { data: urlData } = supabase.storage.from("agent-avatars").getPublicUrl(path);
      if (urlData?.publicUrl) { setAvatarPreview(urlData.publicUrl); toast.success("Avatar atualizado!"); }
    } catch { toast.error("Erro ao enviar avatar."); }
  };

  const toggleChannel = (value: string) => {
    setConnectedChannels(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };

  const buildSavePayload = () => ({
    name: agentName, description: agentDesc, objective: agentObjective,
    instructions: agentInstructions, toneOfVoice: agentToneOfVoice,
    greetingMessage: agentGreetingMessage, avatarUrl: avatarPreview || agent.avatar || "",
    channels: connectedChannels,
    integrations: Object.entries(connectorKeys).filter(([, v]) => v.configured).map(([k]) => k),
    knowledgeFiles: knowledgeFiles.map(f => f.name), urls, apiConfig, voiceConfig,
    model: agentModel, agentType,
  });

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">

      {/* ── Top bar: Salvar + Publicar ── */}
      <div className="h-12 border-b border-border flex items-center justify-end px-4 gap-2 shrink-0">
        <Button
          variant="outline" size="sm" className="gap-1.5 text-xs h-8"
          disabled={!agentName.trim() || isSaving}
          onClick={() => onSaveAgent?.(buildSavePayload())}
        >
          {isSaving ? "Salvando..." : "💾 Salvar"}
        </Button>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  size="sm" className="gap-1.5 text-xs h-8"
                  disabled={!canPublish || isSaving}
                  onClick={() => onPublish?.()}
                >
                  <Rocket className="w-3.5 h-3.5" />
                  {isSaving ? "Publicando..." : "Publicar"}
                </Button>
              </span>
            </TooltipTrigger>
            {!canPublish && (
              <TooltipContent>
                <p className="text-xs">
                  {!agentName.trim() ? "Dê um nome ao agente para publicar" : "Configure uma API key em Integrações para publicar"}
                </p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      <Tabs value={rightTab} onValueChange={handleTabChange} className="flex flex-col flex-1 min-h-0">

        {/* ── Aba Agente ── */}
        <TabsContent value="agent" className="flex-1 mt-0 min-h-0 overflow-hidden">
          <div className="flex h-full">
            <div className="w-48 border-r border-border p-4 space-y-4 shrink-0">
              {SETTINGS_NAV.map((section) => (
                <div key={section.section}>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{section.section}</p>
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button key={item.key} onClick={() => setSettingsNav(item.key)}
                          className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                            settingsNav === item.key ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          }`}>
                          <Icon className="w-4 h-4" />{item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <ScrollArea className="flex-1">
              <div className="p-6 max-w-lg space-y-8">

                {/* Identidade */}
                {settingsNav === "general" && (
                  <>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">Identidade</h2>
                      <p className="text-sm text-muted-foreground mt-1">Identidade e propósito do agente.</p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-foreground">Avatar</h3>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden"
                          onClick={() => avatarInputRef.current?.click()}>
                          {avatarPreview ? (
                            <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                          ) : agent.avatar ? (
                            <img src={agent.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Camera className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <Button variant="outline" size="sm" onClick={() => avatarInputRef.current?.click()} className="text-xs">Enviar foto</Button>
                          <p className="text-[11px] text-muted-foreground mt-1">JPEG, PNG ou WebP · até 5 MB</p>
                        </div>
                        <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-foreground">Nome do agente</h3>
                      <Input value={agentName} onChange={(e) => setAgentName(e.target.value)} className="text-sm" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-foreground">Cargo / Função</h3>
                      <Input value={agentDesc} onChange={(e) => setAgentDesc(e.target.value)} placeholder="Ex: Especialista em qualificação de leads" className="text-sm" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-foreground">Tom de voz</h3>
                      <Select value={agentToneOfVoice} onValueChange={setAgentToneOfVoice}>
                        <SelectTrigger className="text-sm"><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Profissional e Amigável">Profissional e Amigável</SelectItem>
                          <SelectItem value="Formal">Formal</SelectItem>
                          <SelectItem value="Casual e Descontraído">Casual e Descontraído</SelectItem>
                          <SelectItem value="Empático e Acolhedor">Empático e Acolhedor</SelectItem>
                          <SelectItem value="Direto e Objetivo">Direto e Objetivo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-foreground">Mensagem de saudação</h3>
                      <Textarea value={agentGreetingMessage} onChange={(e) => setAgentGreetingMessage(e.target.value)}
                        placeholder="Ex: Olá! Sou a assistente virtual. Como posso te ajudar?" className="text-sm min-h-[80px]" />
                    </div>
                  </>
                )}

                {/* Objetivo */}
                {settingsNav === "objective" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-bold text-foreground">Objetivo</h2>
                      <p className="text-sm text-muted-foreground mt-1">Defina a missão principal do agente.</p>
                    </div>
                    <Textarea value={agentObjective} onChange={(e) => setAgentObjective(e.target.value)}
                      placeholder="Ex: Qualificar leads e agendar reuniões." className="text-sm min-h-[100px]" />
                  </div>
                )}

                {/* Instruções */}
                {settingsNav === "instructions" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-bold text-foreground">Instruções</h2>
                      <p className="text-sm text-muted-foreground mt-1">Regras e comportamento do agente.</p>
                    </div>
                    <Textarea value={agentInstructions} onChange={(e) => setAgentInstructions(e.target.value)}
                      placeholder="Ex: Sempre pergunte o nome antes de agendar." className="text-sm min-h-[140px]" />
                  </div>
                )}

                {/* Arquivos */}
                {settingsNav === "files_nav" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-bold text-foreground">Conhecimento</h2>
                      <p className="text-sm text-muted-foreground mt-1">Fontes de dados para alimentar o agente.</p>
                    </div>
                    <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files); }}>
                      <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm font-medium text-foreground">Arraste arquivos ou clique para enviar</p>
                      <p className="text-xs text-muted-foreground mt-1">PDFs, documentos, FAQ</p>
                      <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.txt,.md,.csv" className="hidden"
                        onChange={(e) => e.target.files && handleFiles(e.target.files)} />
                    </div>
                    {knowledgeFiles.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase">Arquivos enviados</p>
                        {knowledgeFiles.map((f) => (
                          <div key={f.id} className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2">
                            {getFileIcon(f.type)}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-foreground truncate">{f.name}</p>
                              {f.size > 0 && <p className="text-[11px] text-muted-foreground">{formatSize(f.size)}</p>}
                            </div>
                            <button onClick={() => setKnowledgeFiles(prev => prev.filter(x => x.id !== f.id))}
                              className="text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">URLs</p>
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <Link2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <Input value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
                            placeholder="https://exemplo.com/faq" className="pl-9"
                            onKeyDown={(e) => e.key === "Enter" && addUrl()} />
                        </div>
                        <Button size="sm" onClick={addUrl} disabled={!urlInput.trim()} className="gap-1 shrink-0"><Plus className="w-4 h-4" /></Button>
                      </div>
                      {urls.map((url, i) => (
                        <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2">
                          <Globe className="w-4 h-4 text-primary shrink-0" />
                          <p className="text-sm text-foreground truncate flex-1">{url}</p>
                          <button onClick={() => setUrls(urls.filter((_, j) => j !== i))}
                            className="text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>

        {/* ── Aba Voz ── */}
        <TabsContent value="voice" className="flex-1 mt-0 min-h-0 overflow-hidden">
          <VoiceConfigPanel config={voiceConfig} onChange={setVoiceConfig} />
        </TabsContent>

        {/* ── Aba Integrações ── */}
        <TabsContent value="connectors" className="flex-1 mt-0 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-foreground">Integrações</h2>
                <p className="text-sm text-muted-foreground mt-1">Conecte integrações para expandir as capacidades do agente.</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2"><Blocks className="w-4 h-4 text-primary" /><h3 className="text-sm font-semibold">MCPs</h3></div>
                <p className="text-xs text-muted-foreground">Conecte servidores MCP para estender o contexto.</p>
                <Button variant="outline" size="sm" className="text-xs gap-1.5"><Plus className="w-3 h-3" /> Adicionar MCP</Button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2"><KeyRound className="w-4 h-4 text-primary" /><h3 className="text-sm font-semibold">APIs</h3></div>
                <div className="space-y-1">
                  {filteredIntegrations.map((c) => {
                    const isConnected = connectorKeys[c.label]?.configured;
                    return (
                      <div key={c.label} className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <img src={c.logo} alt={c.label} className="w-7 h-7 rounded object-contain shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
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
                        <Button variant={isConnected ? "outline" : "ghost"} size="sm"
                          className={`text-xs gap-1 ${isConnected ? "" : "text-muted-foreground hover:text-foreground"}`}
                          onClick={() => handleConnectIntegration(c)}>
                          {isConnected ? <><Settings className="w-3 h-3" /> Gerenciar</> : "+ Conectar"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2"><Webhook className="w-4 h-4 text-primary" /><h3 className="text-sm font-semibold">Webhooks</h3></div>
                <Button variant="outline" size="sm" className="text-xs gap-1.5"><Plus className="w-3 h-3" /> Adicionar Webhook</Button>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* ── Aba Canais ── */}
        <TabsContent value="channels" className="flex-1 mt-0 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 max-w-lg space-y-6">
              <div>
                <h2 className="text-lg font-bold text-foreground">Canais</h2>
                <p className="text-sm text-muted-foreground mt-1">Onde seu agente será publicado.</p>
              </div>
              {filteredChannels.map((ch) => {
                const isSelected = connectedChannels.includes(ch.value);
                return (
                  <div key={ch.value} className={`flex items-center gap-4 rounded-xl border-2 p-4 transition-all ${isSelected ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                    {ch.logo ? (
                      <img src={ch.logo} alt={ch.label} className="w-8 h-8 rounded-lg object-contain shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    ) : <Globe className="w-8 h-8 text-primary shrink-0" />}
                    <span className="text-sm font-semibold text-foreground flex-1">{ch.label}</span>
                    <Button size="sm" variant={isSelected ? "default" : "outline"} onClick={() => toggleChannel(ch.value)} className="text-xs h-8 gap-1.5">
                      {isSelected ? <><Check className="w-3 h-3" /> Conectado</> : "Conectar"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* ── Aba Avançado ── */}
        <TabsContent value="advanced" className="flex-1 mt-0 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 max-w-lg space-y-8">
              <div>
                <h2 className="text-lg font-bold text-foreground">Configurações da API</h2>
                <p className="text-sm text-muted-foreground mt-1">Parâmetros avançados do LLM.</p>
              </div>
              {[
                { label: "Temperature",       key: "temperature",       min: 0,  max: 2,  step: 0.1  },
                { label: "Top P",             key: "topP",              min: 0,  max: 1,  step: 0.05 },
                { label: "Frequency Penalty", key: "frequencyPenalty",  min: -2, max: 2,  step: 0.1  },
                { label: "Presence Penalty",  key: "presencePenalty",   min: -2, max: 2,  step: 0.1  },
              ].map(({ label, key, min, max, step }) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">{label}</label>
                    <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">{(apiConfig as any)[key]}</span>
                  </div>
                  <input type="range" min={min} max={max} step={step} value={(apiConfig as any)[key]}
                    onChange={(e) => setApiConfig(prev => ({ ...prev, [key]: parseFloat(e.target.value) }))}
                    className="w-full accent-primary" />
                </div>
              ))}
              <div className="space-y-2">
                <label className="text-sm font-medium">Max Tokens</label>
                <Input type="number" min={1} max={128000} value={apiConfig.maxTokens}
                  onChange={(e) => setApiConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) || 2048 }))}
                  className="text-sm font-mono" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Formato de Resposta</label>
                <Select value={apiConfig.responseFormat} onValueChange={(v) => setApiConfig(prev => ({ ...prev, responseFormat: v as "text" | "json" }))}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Texto</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Stop Sequences</label>
                <Input value={apiConfig.stopSequences.join(", ")}
                  onChange={(e) => setApiConfig(prev => ({ ...prev, stopSequences: e.target.value ? e.target.value.split(",").map(s => s.trim()).filter(Boolean) : [] }))}
                  placeholder='Ex: "###", "FIM"' className="text-sm font-mono" />
              </div>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setApiConfig(DEFAULT_API_CONFIG)}>Restaurar padrões</Button>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* ── Aba Danger Zone ── */}
        <TabsContent value="danger" className="flex-1 mt-0 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 max-w-lg space-y-4">
              <h2 className="text-lg font-bold text-destructive">Danger Zone</h2>
              <p className="text-sm text-muted-foreground">Ações irreversíveis para este agente.</p>
              <div className="rounded-xl border-2 border-destructive/30 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Excluir agente</h3>
                <p className="text-xs text-muted-foreground">Esta ação não pode ser desfeita.</p>
                <Button variant="destructive" size="sm" onClick={() => onDeleteAgent?.()}>Excluir Agente</Button>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* ── Dialog de integração ── */}
      <Dialog open={!!connectorDialog} onOpenChange={(open) => { if (!open) { setConnectorDialog(null); setKeyInput(""); } }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              {connectorDialog && (
                <img src={connectorDialog.logo} alt={connectorDialog.label} className="w-8 h-8 rounded object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              )}
              <div>
                <DialogTitle className="text-base">
                  {connectorKeys[connectorDialog?.label || ""]?.configured ? "Gerenciar" : "Conectar"} {connectorDialog?.label}
                </DialogTitle>
                <DialogDescription className="text-xs mt-0.5">{connectorDialog?.desc}</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">API Key</label>
              <div className="relative">
                <Input type={showKey ? "text" : "password"} value={keyInput} onChange={(e) => setKeyInput(e.target.value)}
                  placeholder={`Cole sua ${connectorDialog?.label} API Key`} className="pr-10 text-sm font-mono" />
                <button type="button" onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {connectorDialog?.label === "OpenAI"     && (<>Encontre em <a href="https://platform.openai.com/api-keys"       target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">platform.openai.com <ExternalLink className="w-3 h-3" /></a></>)}
                {connectorDialog?.label === "Anthropic"  && (<>Encontre em <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">console.anthropic.com <ExternalLink className="w-3 h-3" /></a></>)}
                {connectorDialog?.label === "Gemini"     && (<>Encontre em <a href="https://aistudio.google.com/apikey"          target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">aistudio.google.com <ExternalLink className="w-3 h-3" /></a></>)}
                {connectorDialog?.label === "ElevenLabs" && (<>Encontre em <a href="https://elevenlabs.io/settings/api-keys"     target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">elevenlabs.io <ExternalLink className="w-3 h-3" /></a></>)}
                {connectorDialog?.label === "DeepSeek"   && (<>Encontre em <a href="https://platform.deepseek.com/api_keys"     target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">platform.deepseek.com <ExternalLink className="w-3 h-3" /></a></>)}
                {!["OpenAI","Anthropic","Gemini","ElevenLabs","DeepSeek"].includes(connectorDialog?.label || "") && <>Cole a chave de API fornecida pelo serviço.</>}
              </p>
            </div>
            {shouldShowDialogModels && (
              <div className="space-y-3">
                <label className="text-sm font-medium">Modelo padrão</label>
                <RadioGroup value={selectedDialogModel} onValueChange={setSelectedDialogModel} className="space-y-2">
                  {LLM_PROVIDER_MODELS[connectorDialog!.label].models.map((m) => (
                    <div key={m.value} className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer ${selectedDialogModel === m.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
                      onClick={() => setSelectedDialogModel(m.value)}>
                      <RadioGroupItem value={m.value} id={m.value} className="mt-0.5" />
                      <Label htmlFor={m.value} className="cursor-pointer flex-1">
                        <span className="text-sm font-medium">{m.label}</span>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{m.desc}</p>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}
            {connectorDialog && LLM_PROVIDER_MODELS[connectorDialog.label] && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Recursos</label>
                <div className="flex flex-wrap gap-1.5">
                  {LLM_PROVIDER_MODELS[connectorDialog.label].capabilities.map((cap) => (
                    <span key={cap} className="text-[11px] px-2 py-1 rounded-full bg-muted text-muted-foreground border border-border">{cap}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              {connectorKeys[connectorDialog?.label || ""]?.configured ? (
                <Button variant="destructive" size="sm" className="text-xs gap-1.5" onClick={handleDisconnect}><Trash2 className="w-3 h-3" /> Desconectar</Button>
              ) : <div />}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setConnectorDialog(null); setKeyInput(""); }}>Cancelar</Button>
                <Button size="sm" onClick={handleSaveKey} disabled={!keyInput.trim() || savingKey}>
                  {connectorKeys[connectorDialog?.label || ""]?.configured ? "Atualizar" : "Conectar"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgentRightPanel;
