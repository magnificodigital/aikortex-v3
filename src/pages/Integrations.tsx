import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Plug, Brain, ExternalLink, Sparkles, Check, Eye, EyeOff, Trash2, KeyRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useApiKeys } from "@/hooks/use-api-keys";
import { toast } from "sonner";

const LLM_PROVIDERS = [
  {
    name: "Aikortex",
    provider: "aikortex",
    description: "IA nativa da plataforma para criação e estruturação de agentes e apps",
    logo: "",
    native: true,
  },
  {
    name: "OpenAI",
    provider: "openai",
    description: "GPT-4o, GPT-5 e modelos de linguagem avançados",
    logo: "https://cdn.worldvectorlogo.com/logos/openai-2.svg",
    native: false,
  },
  {
    name: "Anthropic",
    provider: "anthropic",
    description: "Claude 3.5, Claude 4 e modelos seguros de IA",
    logo: "https://cdn.worldvectorlogo.com/logos/anthropic-2.svg",
    native: false,
  },
  {
    name: "Google Gemini",
    provider: "gemini",
    description: "Gemini Pro, Flash e IA multimodal do Google",
    logo: "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
    native: false,
  },
  {
    name: "ElevenLabs",
    provider: "elevenlabs",
    description: "Voz IA, text-to-speech e clonagem de voz",
    logo: "https://images.seeklogo.com/logo-png/52/1/elevenlabs-logo-png_seeklogo-527765.png",
    native: false,
  },
  {
    name: "DeepSeek",
    provider: "deepseek",
    description: "Modelos de IA open-source de alto desempenho",
    logo: "https://registry.npmmirror.com/@lobehub/icons-static-png/1.24.0/files/dark/deepseek-color.png",
    native: false,
  },
];

const CHANNEL_INTEGRATIONS = [
  "WhatsApp", "Instagram", "Facebook", "TikTok", "Google", "Slack",
];

const Integrations = () => {
  const { keys, loading, saveKey, deleteKey } = useApiKeys();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<typeof LLM_PROVIDERS[0] | null>(null);
  const [apiKeyValue, setApiKeyValue] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);

  const openDialog = (provider: typeof LLM_PROVIDERS[0]) => {
    setSelectedProvider(provider);
    setApiKeyValue("");
    setShowKey(false);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedProvider || !apiKeyValue.trim()) return;
    setSaving(true);
    const ok = await saveKey(selectedProvider.provider, apiKeyValue.trim());
    setSaving(false);
    if (ok) {
      toast.success(`Chave da ${selectedProvider.name} salva com sucesso!`);
      setDialogOpen(false);
    }
  };

  const handleDelete = async (provider: string, name: string) => {
    const ok = await deleteKey(provider);
    if (ok) toast.success(`Chave da ${name} removida.`);
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Plug className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Integrações</h1>
            <p className="text-sm text-muted-foreground">Conexão com plataformas externas</p>
          </div>
        </div>

        {/* LLMs Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Modelos de IA (LLMs)</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {LLM_PROVIDERS.map((provider) => {
              const isConnected = provider.native || !!keys[provider.provider]?.configured;
              return (
                <Card
                  key={provider.name}
                  className={`p-4 flex items-start gap-4 transition-colors ${
                    isConnected ? "border-primary/40 bg-primary/5" : "border-border hover:border-primary/40"
                  }`}
                >
                  {provider.logo ? (
                    <img
                      src={provider.logo}
                      alt={provider.name}
                      className="w-10 h-10 rounded-lg object-contain shrink-0 bg-muted p-1"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{provider.name}</p>
                      {isConnected && (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0 gap-1">
                          <Check className="w-3 h-3" /> Conectado
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{provider.description}</p>
                    {!provider.native && (
                      <div className="mt-2 flex gap-2">
                        {isConnected ? (
                          <>
                            <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => openDialog(provider)}>
                              <KeyRound className="w-3 h-3 mr-1" /> Alterar chave
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs h-7 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(provider.provider, provider.name)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </>
                        ) : (
                          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => openDialog(provider)}>
                            <KeyRound className="w-3 h-3 mr-1" /> Conectar API Key
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Channels Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ExternalLink className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Canais e Plataformas</h2>
          </div>
          <div className="glass-card rounded-lg p-8 flex flex-col items-center justify-center text-center">
            <Plug className="w-10 h-10 text-muted-foreground mb-3" />
            <h3 className="text-base font-semibold text-foreground mb-1">Em breve</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {CHANNEL_INTEGRATIONS.join(", ")} e mais.
            </p>
          </div>
        </div>
      </div>

      {/* API Key Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedProvider?.logo ? (
                <img src={selectedProvider.logo} alt="" className="w-6 h-6 rounded object-contain" />
              ) : null}
              Conectar {selectedProvider?.name}
            </DialogTitle>
            <DialogDescription>
              Insira sua chave de API para utilizar os modelos da {selectedProvider?.name} nos seus agentes e apps.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                placeholder={`Cole sua API Key da ${selectedProvider?.name}`}
                value={apiKeyValue}
                onChange={(e) => setApiKeyValue(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Sua chave é armazenada de forma segura e nunca é compartilhada.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!apiKeyValue.trim() || saving}>
              {saving ? "Salvando..." : "Salvar chave"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Integrations;
