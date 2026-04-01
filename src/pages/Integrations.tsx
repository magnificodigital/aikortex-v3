import DashboardLayout from "@/components/DashboardLayout";
import { Plug, Brain, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const LLM_PROVIDERS = [
  {
    name: "OpenAI",
    description: "GPT-4o, GPT-5 e modelos de linguagem avançados",
    logo: "https://cdn.worldvectorlogo.com/logos/openai-2.svg",
    status: "disponível",
  },
  {
    name: "Anthropic",
    description: "Claude 3.5, Claude 4 e modelos seguros de IA",
    logo: "https://cdn.worldvectorlogo.com/logos/anthropic-2.svg",
    status: "disponível",
  },
  {
    name: "Google Gemini",
    description: "Gemini Pro, Flash e IA multimodal do Google",
    logo: "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
    status: "disponível",
  },
  {
    name: "ElevenLabs",
    description: "Voz IA, text-to-speech e clonagem de voz",
    logo: "https://images.seeklogo.com/logo-png/52/1/elevenlabs-logo-png_seeklogo-527765.png",
    status: "disponível",
  },
  {
    name: "DeepSeek",
    description: "Modelos de IA open-source de alto desempenho",
    logo: "https://registry.npmmirror.com/@lobehub/icons-static-png/1.24.0/files/dark/deepseek-color.png",
    status: "disponível",
  },
];

const CHANNEL_INTEGRATIONS = [
  "WhatsApp", "Instagram", "Facebook", "TikTok", "Google", "Slack",
];

const Integrations = () => (
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
          {LLM_PROVIDERS.map((provider) => (
            <Card key={provider.name} className="p-4 flex items-start gap-4 border-border hover:border-primary/40 transition-colors">
              <img
                src={provider.logo}
                alt={provider.name}
                className="w-10 h-10 rounded-lg object-contain shrink-0 bg-muted p-1"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{provider.name}</p>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {provider.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{provider.description}</p>
              </div>
            </Card>
          ))}
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
  </DashboardLayout>
);

export default Integrations;
