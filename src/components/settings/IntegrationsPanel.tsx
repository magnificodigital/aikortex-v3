import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Check, Eye, EyeOff, ExternalLink, KeyRound, Blocks, Plus, Settings, Trash2, Webhook, Globe } from "lucide-react";
import { toast } from "sonner";

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

const PROVIDER_MAP: Record<string, string> = {
  "OpenAI": "openai", "Anthropic": "anthropic", "Gemini": "gemini",
  "ElevenLabs": "elevenlabs", "OpenRouter": "openrouter", "Gmail": "gmail",
  "Google Calendar": "google_calendar", "Outlook Calendar": "outlook_calendar",
  "Calendly": "calendly", "Google Sheets": "google_sheets",
  "Google Drive": "google_drive", "Piperun": "piperun",
  "HubSpot": "hubspot", "RD Station": "rdstation",
};

const CHANNELS = [
  { value: "whatsapp", label: "WhatsApp", logo: "https://cdn.simpleicons.org/whatsapp" },
  { value: "instagram", label: "Instagram", logo: "https://cdn.simpleicons.org/instagram" },
  { value: "facebook", label: "Facebook", logo: "https://cdn.simpleicons.org/facebook" },
  { value: "linkedin", label: "LinkedIn", logo: "https://cdn.simpleicons.org/linkedin" },
  { value: "tiktok", label: "TikTok", logo: "https://cdn.simpleicons.org/tiktok" },
  { value: "website", label: "WebSite", logo: "" },
];

export const IntegrationsPanel = () => {
  const [connectorDialog, setConnectorDialog] = useState<typeof INTEGRATIONS[0] | null>(null);
  const [connectorKeys, setConnectorKeys] = useState<Record<string, { key: string; configured: boolean }>>({});
  const [keyInput, setKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);

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

  const handleConnectIntegration = (integration: typeof INTEGRATIONS[0]) => {
    const existing = connectorKeys[integration.label];
    setKeyInput(existing?.configured ? existing.key : "");
    setShowKey(false);
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
      const { error } = await supabase.from("user_api_keys").upsert(
        { user_id: user.id, provider, api_key: keyInput.trim() },
        { onConflict: "user_id,provider" }
      );
      if (error) { toast.error("Erro ao salvar chave."); console.error(error); return; }
      setConnectorKeys(prev => ({ ...prev, [connectorDialog.label]: { key: keyInput.trim(), configured: true } }));
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
      setConnectorDialog(null);
      setKeyInput("");
      toast.success(`${connectorDialog.label} desconectado.`);
    } finally { setSavingKey(false); }
  };

  const connectedCount = Object.values(connectorKeys).filter(v => v.configured).length;

  return (
    <div className="space-y-8">
      {/* APIs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">APIs & Provedores de IA</h3>
          </div>
          <Badge variant="outline" className="text-xs">
            {connectedCount} conectadas
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">Conecte suas chaves de API para habilitar integrações.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
          {INTEGRATIONS.map((c) => {
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

      {/* MCPs */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Blocks className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">MCPs</h3>
        </div>
        <p className="text-xs text-muted-foreground">Conecte servidores MCP para estender o contexto.</p>
        <Button variant="outline" size="sm" className="text-xs gap-1.5">
          <Plus className="w-3 h-3" /> Adicionar MCP
        </Button>
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

      {/* Dialog */}
      <Dialog open={!!connectorDialog} onOpenChange={(open) => { if (!open) { setConnectorDialog(null); setKeyInput(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              {connectorDialog && (
                <img src={connectorDialog.logo} alt={connectorDialog.label} className="w-8 h-8 rounded object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              )}
              <div>
                <DialogTitle className="text-base">
                  {connectorKeys[connectorDialog?.label || ""]?.configured ? "Gerenciar" : "Conectar"} {connectorDialog?.label}
                </DialogTitle>
                <DialogDescription className="text-xs mt-0.5">{connectorDialog?.desc}</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 pt-2">
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
                <button type="button" onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {connectorDialog?.label === "OpenAI" && (<>Encontre sua API Key em <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">platform.openai.com <ExternalLink className="w-3 h-3" /></a></>)}
                {connectorDialog?.label === "Anthropic" && (<>Encontre sua API Key em <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">console.anthropic.com <ExternalLink className="w-3 h-3" /></a></>)}
                {connectorDialog?.label === "Gemini" && (<>Encontre sua API Key em <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">aistudio.google.com <ExternalLink className="w-3 h-3" /></a></>)}
                {connectorDialog?.label === "ElevenLabs" && (<>Encontre sua API Key em <a href="https://elevenlabs.io/settings/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">elevenlabs.io <ExternalLink className="w-3 h-3" /></a></>)}
                {!["OpenAI", "Anthropic", "Gemini", "ElevenLabs"].includes(connectorDialog?.label || "") && (<>Cole a chave de API fornecida pelo serviço.</>)}
              </p>
            </div>
            <div className="flex items-center justify-between pt-2">
              {connectorKeys[connectorDialog?.label || ""]?.configured ? (
                <Button variant="destructive" size="sm" className="text-xs gap-1.5" onClick={handleDisconnect}>
                  <Trash2 className="w-3 h-3" /> Desconectar
                </Button>
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

export const ChannelsPanel = () => {
  const [connectedChannels, setConnectedChannels] = useState<string[]>([]);

  const toggleChannel = (value: string) => {
    setConnectedChannels(prev =>
      prev.includes(value) ? prev.filter(c => c !== value) : [...prev, value]
    );
    const ch = CHANNELS.find(c => c.value === value);
    if (ch) {
      const wasConnected = connectedChannels.includes(value);
      toast.success(wasConnected ? `${ch.label} desconectado` : `${ch.label} conectado`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Canais de Comunicação</h3>
          <p className="text-xs text-muted-foreground mt-1">Configure onde seus agentes e automações vão operar.</p>
        </div>
        <Badge variant="outline" className="text-xs">
          {connectedChannels.length} conectados
        </Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CHANNELS.map((ch) => {
          const isSelected = connectedChannels.includes(ch.value);
          return (
            <div
              key={ch.value}
              className={`flex items-center gap-4 rounded-xl border-2 p-4 transition-all ${
                isSelected ? "border-primary bg-primary/5 shadow-md" : "border-border bg-card"
              }`}
            >
              {ch.logo ? (
                <img
                  src={ch.logo}
                  alt={ch.label}
                  className="w-8 h-8 rounded-lg object-contain shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
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
                {isSelected ? (
                  <><Check className="w-3 h-3" /> Conectado</>
                ) : (
                  "Conectar"
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
