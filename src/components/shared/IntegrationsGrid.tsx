import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Check, Eye, EyeOff, ExternalLink, KeyRound, Settings, Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface IntegrationProvider {
  label: string;
  provider: string;
  description: string;
  logo: string;
  native?: boolean;
  apiKeyUrl?: string;
  apiKeyUrlLabel?: string;
}

export const LLM_PROVIDERS: IntegrationProvider[] = [
  {
    label: "Aikortex",
    provider: "aikortex",
    description: "IA nativa da plataforma para criação e estruturação de agentes e apps",
    logo: "",
    native: true,
  },
  {
    label: "OpenAI",
    provider: "openai",
    description: "GPT-4o, GPT-5 e modelos de linguagem avançados",
    logo: "https://cdn.simpleicons.org/openai",
    apiKeyUrl: "https://platform.openai.com/api-keys",
    apiKeyUrlLabel: "platform.openai.com",
  },
  {
    label: "Anthropic",
    provider: "anthropic",
    description: "Claude 3.5, Claude 4 e modelos seguros de IA",
    logo: "https://cdn.simpleicons.org/anthropic",
    apiKeyUrl: "https://console.anthropic.com/settings/keys",
    apiKeyUrlLabel: "console.anthropic.com",
  },
  {
    label: "Google Gemini",
    provider: "gemini",
    description: "Gemini Pro, Flash e IA multimodal do Google",
    logo: "https://cdn.simpleicons.org/googlegemini",
    apiKeyUrl: "https://aistudio.google.com/apikey",
    apiKeyUrlLabel: "aistudio.google.com",
  },
  {
    label: "ElevenLabs",
    provider: "elevenlabs",
    description: "Voz IA, text-to-speech e clonagem de voz",
    logo: "https://cdn.simpleicons.org/elevenlabs",
    apiKeyUrl: "https://elevenlabs.io/settings/api-keys",
    apiKeyUrlLabel: "elevenlabs.io",
  },
  {
    label: "DeepSeek",
    provider: "deepseek",
    description: "Modelos de IA open-source de alto desempenho",
    logo: "https://registry.npmmirror.com/@lobehub/icons-static-png/1.24.0/files/dark/deepseek-color.png",
    apiKeyUrl: "https://platform.deepseek.com/api_keys",
    apiKeyUrlLabel: "platform.deepseek.com",
  },
];

export const SERVICE_PROVIDERS: IntegrationProvider[] = [
  { label: "Gmail", provider: "gmail", description: "Ler, enviar e compor e-mails.", logo: "https://cdn.simpleicons.org/gmail" },
  { label: "Google Calendar", provider: "google_calendar", description: "Ler e gerenciar eventos.", logo: "https://cdn.simpleicons.org/googlecalendar" },
  { label: "Outlook Calendar", provider: "outlook_calendar", description: "Gerenciar calendário Microsoft.", logo: "https://cdn.simpleicons.org/microsoftoutlook" },
  { label: "Calendly", provider: "calendly", description: "Agendamento automático de reuniões.", logo: "https://cdn.simpleicons.org/calendly" },
  { label: "Google Sheets", provider: "google_sheets", description: "Ler e escrever planilhas.", logo: "https://cdn.simpleicons.org/googlesheets" },
  { label: "Google Drive", provider: "google_drive", description: "Ler, enviar e gerenciar arquivos.", logo: "https://cdn.simpleicons.org/googledrive" },
  { label: "Piperun", provider: "piperun", description: "CRM de vendas e automação.", logo: "https://www.piperun.com/wp-content/uploads/2023/07/favicon-piperun-crm.png" },
  { label: "HubSpot", provider: "hubspot", description: "CRM, marketing e vendas.", logo: "https://cdn.simpleicons.org/hubspot" },
  { label: "RD Station", provider: "rdstation", description: "Automação de marketing e CRM.", logo: "https://cdn.simpleicons.org/rdstation" },
];

export const ALL_PROVIDERS = [...LLM_PROVIDERS, ...SERVICE_PROVIDERS];

const KEY_VALIDATORS: Partial<Record<string, (key: string) => boolean>> = {
  openai: (key) => key.startsWith("sk-"),
  openrouter: (key) => key.startsWith("sk-or-"),
  gemini: (key) => key.startsWith("AIza"),
};

function getKeyValidationError(provider: string, apiKey: string) {
  const normalizedKey = apiKey.trim();
  const validator = KEY_VALIDATORS[provider];

  if (!validator || validator(normalizedKey)) return null;

  if (provider === "openai") {
    return "A chave da OpenAI parece inválida. Ela deve começar com 'sk-'.";
  }

  if (provider === "openrouter") {
    return "A chave do OpenRouter parece inválida. Ela deve começar com 'sk-or-'.";
  }

  if (provider === "gemini") {
    return "A chave do Gemini parece inválida. Ela deve começar com 'AIza'.";
  }

  return "A chave informada parece inválida.";
}

interface IntegrationsGridProps {
  /** Which providers to show. Defaults to ALL_PROVIDERS */
  providers?: IntegrationProvider[];
  /** Filter to only specific provider keys */
  filterProviders?: string[];
  /** Grid columns class override */
  gridClassName?: string;
  /** Show section title */
  showTitle?: boolean;
  /** Custom title */
  title?: string;
  /** Custom subtitle */
  subtitle?: string;
}

export function IntegrationsGrid({
  providers,
  filterProviders,
  gridClassName = "grid grid-cols-1 md:grid-cols-2 gap-1",
  showTitle = true,
  title = "APIs & Provedores de IA",
  subtitle = "Conecte suas chaves de API para habilitar integrações.",
}: IntegrationsGridProps) {
  const [connectorKeys, setConnectorKeys] = useState<Record<string, { configured: boolean }>>({});
  const [loading, setLoading] = useState(true);
  const [dialogProvider, setDialogProvider] = useState<IntegrationProvider | null>(null);
  const [keyInput, setKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase.from("user_api_keys").select("provider").eq("user_id", user.id);
      const map: Record<string, { configured: boolean }> = {};
      data?.forEach((row: any) => {
        map[row.provider] = { configured: true };
      });
      setConnectorKeys(map);
      setLoading(false);
    };
    load();
  }, []);

  let displayProviders = providers || ALL_PROVIDERS;
  if (filterProviders) {
    displayProviders = displayProviders.filter(p => filterProviders.includes(p.provider));
  }

  const connectedCount = displayProviders.filter(p => p.native || connectorKeys[p.provider]?.configured).length;

  const openDialog = (provider: IntegrationProvider) => {
    setKeyInput("");
    setShowKey(false);
    setDialogProvider(provider);
  };

  const handleSave = async () => {
    if (!dialogProvider || !keyInput.trim()) return;
    const validationError = getKeyValidationError(dialogProvider.provider, keyInput);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Faça login para salvar chaves."); return; }
      const { error } = await supabase.from("user_api_keys").upsert(
        { user_id: user.id, provider: dialogProvider.provider, api_key: keyInput.trim() },
        { onConflict: "user_id,provider" }
      );
      if (error) { toast.error("Erro ao salvar chave."); console.error(error); return; }
      setConnectorKeys(prev => ({ ...prev, [dialogProvider.provider]: { configured: true } }));
      setDialogProvider(null);
      setKeyInput("");
      toast.success(`${dialogProvider.label} conectado com sucesso!`);
    } finally { setSaving(false); }
  };

  const handleDisconnect = async () => {
    if (!dialogProvider) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("user_api_keys").delete().eq("user_id", user.id).eq("provider", dialogProvider.provider);
      setConnectorKeys(prev => { const next = { ...prev }; delete next[dialogProvider.provider]; return next; });
      setDialogProvider(null);
      setKeyInput("");
      toast.success(`${dialogProvider.label} desconectado.`);
    } finally { setSaving(false); }
  };

  const isConnected = (p: IntegrationProvider) => p.native || !!connectorKeys[p.provider]?.configured;

  return (
    <>
      <div className="space-y-4">
        {showTitle && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>
              </div>
              <Badge variant="outline" className="text-xs">
                {connectedCount} conectadas
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </>
        )}
        <div className={gridClassName}>
          {displayProviders.map((p) => {
            const connected = isConnected(p);
            return (
              <div
                key={p.provider}
                className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {p.logo ? (
                    <img
                      src={p.logo}
                      alt={p.label}
                      className="w-7 h-7 rounded object-contain shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <div className="w-7 h-7 rounded bg-primary/10 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{p.label}</p>
                      {connected && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                          <Check className="w-2.5 h-2.5" /> {p.native ? "Nativo" : "Conectado"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{p.description}</p>
                  </div>
                </div>
                {!p.native && (
                  <Button
                    variant={connected ? "outline" : "ghost"}
                    size="sm"
                    className={`text-xs gap-1 shrink-0 ${connected ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    onClick={() => openDialog(p)}
                  >
                    {connected ? (
                      <><Settings className="w-3 h-3" /> Gerenciar</>
                    ) : (
                      "+ Conectar"
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* API Key Dialog */}
      <Dialog open={!!dialogProvider} onOpenChange={(open) => { if (!open) { setDialogProvider(null); setKeyInput(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              {dialogProvider?.logo && (
                <img src={dialogProvider.logo} alt={dialogProvider.label} className="w-8 h-8 rounded object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              )}
              <div>
                <DialogTitle className="text-base">
                  {connectorKeys[dialogProvider?.provider || ""]?.configured ? "Gerenciar" : "Conectar"} {dialogProvider?.label}
                </DialogTitle>
                <DialogDescription className="text-xs mt-0.5">{dialogProvider?.description}</DialogDescription>
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
                  placeholder={`Cole sua ${dialogProvider?.label} API Key aqui`}
                  className="pr-10 text-sm font-mono"
                />
                <button type="button" onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {dialogProvider?.apiKeyUrl && (
                <p className="text-[11px] text-muted-foreground">
                  Encontre sua API Key em{" "}
                  <a href={dialogProvider.apiKeyUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
                    {dialogProvider.apiKeyUrlLabel || dialogProvider.apiKeyUrl} <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              )}
              {!dialogProvider?.apiKeyUrl && (
                <p className="text-[11px] text-muted-foreground">Cole a chave de API fornecida pelo serviço.</p>
              )}
            </div>
            <div className="flex items-center justify-between pt-2">
              {connectorKeys[dialogProvider?.provider || ""]?.configured ? (
                <Button variant="destructive" size="sm" className="text-xs gap-1.5" onClick={handleDisconnect} disabled={saving}>
                  <Trash2 className="w-3 h-3" /> Desconectar
                </Button>
              ) : <div />}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setDialogProvider(null); setKeyInput(""); }}>Cancelar</Button>
                <Button size="sm" onClick={handleSave} disabled={!keyInput.trim() || saving}>
                  {connectorKeys[dialogProvider?.provider || ""]?.configured ? "Atualizar" : "Conectar"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default IntegrationsGrid;
