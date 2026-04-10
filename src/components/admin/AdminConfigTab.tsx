import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Save, Key, MessageSquare, Video } from "lucide-react";
import { toast } from "sonner";

interface ConfigField {
  key: string;
  label: string;
  placeholder?: string;
  description?: string;
}

interface ConfigSection {
  title: string;
  icon: React.ReactNode;
  description: string;
  fields: ConfigField[];
}

const SECTIONS: ConfigSection[] = [
  {
    title: "Chaves de IA (Gateway padrão)",
    icon: <Key className="w-5 h-5" />,
    description: "Chaves usadas como fallback quando o usuário não possui BYOK configurado.",
    fields: [
      { key: "OPENROUTER_API_KEY", label: "OpenRouter API Key", placeholder: "sk-or-...", description: "Usado como gateway principal para todos os modelos" },
      { key: "ANTHROPIC_API_KEY", label: "Anthropic API Key", placeholder: "sk-ant-...", description: "Necessário para Claude e Managed Agents" },
      { key: "OPENAI_API_KEY", label: "OpenAI API Key", placeholder: "sk-...", description: "Para modelos GPT" },
      { key: "GEMINI_API_KEY", label: "Gemini API Key", placeholder: "AIza...", description: "Para modelos Gemini do Google" },
    ],
  },
  {
    title: "WhatsApp Business",
    icon: <MessageSquare className="w-5 h-5" />,
    description: "Configurações de integração com a API do WhatsApp Business.",
    fields: [
      { key: "WHATSAPP_VERIFY_TOKEN", label: "Verify Token", description: "Token de verificação do webhook Meta" },
    ],
  },
  {
    title: "Voz e Vídeo",
    icon: <Video className="w-5 h-5" />,
    description: "Chaves para serviços de voz e videoconferência.",
    fields: [
      { key: "ELEVENLABS_API_KEY", label: "ElevenLabs API Key", description: "Para síntese de voz" },
      { key: "LIVEKIT_API_KEY", label: "LiveKit API Key" },
      { key: "LIVEKIT_API_SECRET", label: "LiveKit API Secret" },
      { key: "LIVEKIT_URL", label: "LiveKit URL", placeholder: "wss://..." },
    ],
  },
];

const AdminConfigTab = () => {
  const { user } = useAuth();
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());
  const [visibleFields, setVisibleFields] = useState<Set<string>>(new Set());
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("platform_config" as any)
      .select("key, value");

    if (!error && data) {
      const values: Record<string, string> = {};
      const keys = new Set<string>();
      for (const row of data as any[]) {
        values[row.key] = row.value;
        keys.add(row.key);
      }
      setConfigValues(values);
      setSavedKeys(keys);
    }
    setLoading(false);
  };

  const handleChange = (key: string, value: string) => {
    setConfigValues((prev) => ({ ...prev, [key]: value }));
  };

  const toggleVisibility = (key: string) => {
    setVisibleFields((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const saveSection = async (section: ConfigSection) => {
    setSavingSection(section.title);
    try {
      for (const field of section.fields) {
        const value = configValues[field.key];
        if (!value) continue;

        const { error } = await (supabase.from("platform_config" as any) as any).upsert(
          {
            key: field.key,
            value,
            description: field.description || field.label,
            is_secret: true,
            updated_at: new Date().toISOString(),
            updated_by: user?.id,
          },
          { onConflict: "key" }
        );

        if (error) {
          console.error(`Error saving ${field.key}:`, error);
          toast.error(`Erro ao salvar ${field.label}`);
          return;
        }
        setSavedKeys((prev) => new Set(prev).add(field.key));
      }
      toast.success("Configurações salvas com sucesso");
    } finally {
      setSavingSection(null);
    }
  };

  const getMaskedValue = (key: string) => {
    const value = configValues[key];
    if (!value) return "";
    if (visibleFields.has(key)) return value;
    return "•".repeat(Math.min(value.length, 32));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Configurações da Plataforma</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie as chaves de API e configurações globais do SaaS. Estas chaves são usadas como fallback quando o usuário não possui chave própria.
        </p>
      </div>

      {SECTIONS.map((section) => (
        <Card key={section.title} className="border-border">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                {section.icon}
              </div>
              <div>
                <CardTitle className="text-base">{section.title}</CardTitle>
                <CardDescription className="text-xs mt-0.5">{section.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {section.fields.map((field) => {
              const isConfigured = savedKeys.has(field.key) && !!configValues[field.key];
              const isVisible = visibleFields.has(field.key);

              return (
                <div key={field.key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">{field.label}</Label>
                    <Badge
                      variant={isConfigured ? "default" : "secondary"}
                      className={`text-[10px] ${isConfigured ? "bg-green-500/10 text-green-600 border-0" : "bg-muted text-muted-foreground border-0"}`}
                    >
                      {isConfigured ? "Configurado" : "Não configurado"}
                    </Badge>
                  </div>
                  {field.description && (
                    <p className="text-xs text-muted-foreground">{field.description}</p>
                  )}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={isVisible ? "text" : "password"}
                        value={isVisible ? (configValues[field.key] || "") : (configValues[field.key] ? getMaskedValue(field.key) : "")}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        placeholder={field.placeholder || `Insira ${field.label}`}
                        className="pr-10 font-mono text-xs"
                        onFocus={() => {
                          if (!isVisible && configValues[field.key]) {
                            setVisibleFields((prev) => new Set(prev).add(field.key));
                          }
                        }}
                        onBlur={() => {
                          setVisibleFields((prev) => {
                            const next = new Set(prev);
                            next.delete(field.key);
                            return next;
                          });
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => toggleVisibility(field.key)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="pt-2">
              <Button
                onClick={() => saveSection(section)}
                disabled={savingSection === section.title}
                size="sm"
                className="gap-2"
              >
                <Save className="w-3.5 h-3.5" />
                {savingSection === section.title ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminConfigTab;
