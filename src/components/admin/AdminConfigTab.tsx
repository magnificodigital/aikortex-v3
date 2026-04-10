import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Save } from "lucide-react";
import { toast } from "sonner";

interface ConfigField {
  key: string;
  label: string;
  placeholder?: string;
  description: string;
}

const FIELDS: ConfigField[] = [
  {
    key: "openrouter_api_key",
    label: "OpenRouter API Key",
    placeholder: "sk-or-...",
    description: "Usada por todos os usuários Starter/Pro para modelos gratuitos (Gemini, Llama, etc.)",
  },
  {
    key: "elevenlabs_api_key",
    label: "ElevenLabs API Key",
    placeholder: "xi-...",
    description: "Voz padrão da plataforma para agentes de voz",
  },
  {
    key: "telnyx_api_key",
    label: "Telnyx API Key",
    placeholder: "KEY...",
    description: "Telefonia para webhook de chamadas inbound/outbound",
  },
  {
    key: "telnyx_connection_id",
    label: "Telnyx Connection ID",
    placeholder: "Ex: 1234567890",
    description: "ID da conexão SIP no painel Telnyx",
  },
];

const AdminConfigTab = () => {
  const { user } = useAuth();
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());
  const [visibleFields, setVisibleFields] = useState<Set<string>>(new Set());
  const [savingKey, setSavingKey] = useState<string | null>(null);
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

  const saveField = async (field: ConfigField) => {
    const value = configValues[field.key];
    if (!value) {
      toast.error("Insira um valor antes de salvar");
      return;
    }
    setSavingKey(field.key);
    try {
      const { error } = await (supabase.from("platform_config" as any) as any).upsert(
        {
          key: field.key,
          value,
          description: field.description,
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
      toast.success(`${field.label} salva com sucesso`);
    } finally {
      setSavingKey(null);
    }
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
        <h2 className="text-lg font-semibold text-foreground">Chaves de API da Plataforma</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure as chaves centralizadas usadas automaticamente para usuários Starter/Pro. Usuários Elite usam suas próprias chaves em Integrações.
        </p>
      </div>

      <div className="space-y-4">
        {FIELDS.map((field) => {
          const isConfigured = savedKeys.has(field.key) && !!configValues[field.key];
          const isVisible = visibleFields.has(field.key);

          return (
            <Card key={field.key} className="border-border">
              <CardContent className="pt-5 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">{field.label}</Label>
                  <Badge
                    variant={isConfigured ? "default" : "secondary"}
                    className={`text-[10px] ${isConfigured ? "bg-green-500/10 text-green-600 border-0" : "bg-muted text-muted-foreground border-0"}`}
                  >
                    {isConfigured ? "Configurado" : "Não configurado"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{field.description}</p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={isVisible ? "text" : "password"}
                      value={configValues[field.key] || ""}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      placeholder={field.placeholder || `Insira ${field.label}`}
                      className="pr-10 font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => toggleVisibility(field.key)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <Button
                    onClick={() => saveField(field)}
                    disabled={savingKey === field.key}
                    size="sm"
                    className="gap-1.5 shrink-0"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {savingKey === field.key ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AdminConfigTab;
