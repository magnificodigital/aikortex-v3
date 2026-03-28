import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  ArrowUp,
  MessageSquare,
  Globe,
  Sparkles,
  Heart,
  Target,
  GraduationCap,
  Dumbbell,
  Building2,
  Users,
  BookOpen,
  Headphones,
  ShoppingBag,
  Briefcase,
  Hotel,
  LayoutGrid,
  Lightbulb,
  Layers,
  Zap,
  Bot,
  Phone,
  Monitor,
  ChevronRight,
} from "lucide-react";

/* ─── App type ─── */
type AppChannel = "whatsapp" | "web";

/* ─── Categories ─── */
const categories = [
  { id: "all", label: "Todos", icon: LayoutGrid },
  { id: "health", label: "Saúde & Performance", icon: Heart },
  { id: "sales", label: "Vendas & Conversão", icon: Target },
  { id: "crm", label: "CRM Conversacional", icon: Users },
  { id: "education", label: "Educação & Treinamento", icon: GraduationCap },
  { id: "ops", label: "Operações & CS", icon: Briefcase },
  { id: "content", label: "Conteúdo & Comunidade", icon: BookOpen },
  { id: "services", label: "Serviços Especializados", icon: Building2 },
  { id: "hospitality", label: "Hospitalidade", icon: Hotel },
];

/* ─── Showcase apps ─── */
const showcaseApps = [
  {
    name: "CliniFlow",
    category: "health",
    categoryLabel: "Saúde & Relacionamento",
    description: "Sistema conversacional para clínicas e consultórios que organiza triagem, agendamento, confirmações e reativação de pacientes.",
    icon: Heart,
    channels: ["whatsapp", "web"] as AppChannel[],
  },
  {
    name: "LeadOrbit",
    category: "sales",
    categoryLabel: "Vendas & Conversão",
    description: "Sistema de qualificação e avanço de leads para negócios de serviço, com acompanhamento e follow-up automatizado.",
    icon: Target,
    channels: ["whatsapp"] as AppChannel[],
  },
  {
    name: "EstatePilot",
    category: "crm",
    categoryLabel: "CRM Conversacional",
    description: "Solução para imobiliárias e corretores que entende perfil do comprador, organiza oportunidades e acelera visitas.",
    icon: Building2,
    channels: ["whatsapp", "web"] as AppChannel[],
  },
  {
    name: "NutriPath",
    category: "health",
    categoryLabel: "Saúde & Performance",
    description: "App de acompanhamento nutricional que coleta objetivos, envia plano alimentar e acompanha aderência.",
    icon: Heart,
    channels: ["whatsapp"] as AppChannel[],
  },
  {
    name: "TrainSphere",
    category: "health",
    categoryLabel: "Performance & Fitness",
    description: "Sistema conversacional para evolução física, com onboarding, rotina de treino, check-ins e ajustes contínuos.",
    icon: Dumbbell,
    channels: ["whatsapp"] as AppChannel[],
  },
  {
    name: "SkillLoop",
    category: "education",
    categoryLabel: "Educação & Treinamento",
    description: "App de aprendizado guiado com microlições, exercícios, adaptação por nível e reforço contínuo.",
    icon: GraduationCap,
    channels: ["whatsapp", "web"] as AppChannel[],
  },
  {
    name: "CloserOS",
    category: "sales",
    categoryLabel: "Vendas & Fechamento",
    description: "Sistema de recuperação e fechamento comercial que trata objeções, aquece leads e conduz até a conversão.",
    icon: ShoppingBag,
    channels: ["whatsapp"] as AppChannel[],
  },
  {
    name: "OnboardFlow",
    category: "ops",
    categoryLabel: "Operações & Customer Success",
    description: "App de onboarding que guia novos clientes, organiza setup e acelera ativação inicial.",
    icon: Briefcase,
    channels: ["whatsapp", "web"] as AppChannel[],
  },
  {
    name: "CaseRoute",
    category: "services",
    categoryLabel: "Serviços Especializados",
    description: "Sistema de triagem e organização inicial para escritórios e profissionais jurídicos.",
    icon: Building2,
    channels: ["whatsapp"] as AppChannel[],
  },
  {
    name: "HostMind",
    category: "hospitality",
    categoryLabel: "Hospitalidade & Concierge",
    description: "App conversacional para hotéis e turismo, com suporte ao hóspede, roteiros e recomendações.",
    icon: Hotel,
    channels: ["whatsapp", "web"] as AppChannel[],
  },
  {
    name: "PulseBoard",
    category: "content",
    categoryLabel: "Conteúdo & Comunidade",
    description: "Sistema de curadoria e distribuição de conteúdo personalizado com recorrência e adaptação por interesse.",
    icon: BookOpen,
    channels: ["web"] as AppChannel[],
  },
  {
    name: "MentorGrid",
    category: "education",
    categoryLabel: "Consultoria & Programas",
    description: "App para mentorias e acompanhamento de alunos, com metas, check-ins, tarefas e evolução contínua.",
    icon: GraduationCap,
    channels: ["whatsapp", "web"] as AppChannel[],
  },
];

const placeholders = [
  "Quero criar um sistema conversacional para minha clínica que faça triagem, agende pacientes, confirme consultas e reative quem parou de voltar.",
  "Preciso de um app para acompanhamento nutricional que colete objetivos, envie plano alimentar e acompanhe aderência ao longo da semana.",
  "Quero um sistema para qualificar leads da minha imobiliária, entender perfil do comprador, organizar follow-up e atualizar o pipeline.",
];

const Apps = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [channel, setChannel] = useState<AppChannel>("whatsapp");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [placeholderIdx] = useState(() => Math.floor(Math.random() * placeholders.length));

  const filteredApps = selectedCategory === "all"
    ? showcaseApps
    : showcaseApps.filter((a) => a.category === selectedCategory);

  const handleCreate = (text?: string) => {
    const t = (text || prompt).trim();
    if (!t) return;
    navigate("/app-builder", { state: { initialPrompt: t, channel } });
  };

  const handleUseTemplate = (app: typeof showcaseApps[0]) => {
    const templatePrompt = `Crie um app semelhante ao ${app.name}: ${app.description}`;
    setPrompt(templatePrompt);
    setChannel(app.channels.includes("whatsapp") ? "whatsapp" : "web");
    navigate("/app-builder", { state: { initialPrompt: templatePrompt, channel: app.channels[0] } });
  };

  return (
    <DashboardLayout>
      <div className="min-h-[calc(100vh-3.5rem)] overflow-y-auto">
        {/* ═══ HERO ═══ */}
        <section className="relative overflow-hidden">
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "radial-gradient(hsl(var(--primary)) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }} />

          <div className="relative max-w-5xl mx-auto px-6 pt-16 pb-12 text-center">
            {/* Concept badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-card/60 backdrop-blur mb-6">
              <Layers className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">
                Agentes executam tarefas. Apps entregam soluções completas.
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight mb-4">
              Crie sistemas inteligentes para
              <br />
              <span className="text-primary">operações reais</span>
            </h1>
            <p className="text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Desenvolva sistemas conversacionais completos para nichos específicos — com lógica de negócio,
              memória, automações e experiência pronta para WhatsApp e Web.
            </p>

            {/* ═══ CHANNEL SELECTOR ═══ */}
            <div className="flex justify-center gap-3 mb-6">
              <button
                onClick={() => setChannel("whatsapp")}
                className={`group flex items-center gap-3 px-6 py-4 rounded-xl border-2 transition-all w-64 text-left ${
                  channel === "whatsapp"
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                    : "border-border bg-card hover:border-primary/30"
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  channel === "whatsapp" ? "bg-green-500/15 text-green-500" : "bg-muted text-muted-foreground"
                }`}>
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">WhatsApp App</p>
                  <p className="text-[11px] text-muted-foreground leading-tight">Conversacional, operacional, ágil</p>
                </div>
              </button>

              <button
                onClick={() => setChannel("web")}
                className={`group flex items-center gap-3 px-6 py-4 rounded-xl border-2 transition-all w-64 text-left ${
                  channel === "web"
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                    : "border-border bg-card hover:border-primary/30"
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  channel === "web" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                }`}>
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Web App</p>
                  <p className="text-[11px] text-muted-foreground leading-tight">Dashboard, portal, sistema visual</p>
                </div>
              </button>
            </div>

            {/* ═══ PROMPT BOX ═══ */}
            <div className="max-w-2xl mx-auto">
              <div className="rounded-2xl border border-border bg-card shadow-xl shadow-black/5 overflow-hidden">
                <div className="px-5 pt-4 pb-1">
                  <p className="text-xs font-semibold text-foreground text-left mb-0.5">Descreva o app que você quer criar</p>
                  <p className="text-[11px] text-muted-foreground text-left">Transforme uma necessidade operacional em um sistema funcional.</p>
                </div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={placeholders[placeholderIdx]}
                  className="w-full bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/60 px-5 py-3 min-h-[100px]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleCreate(); }
                  }}
                />
                <div className="flex items-center justify-between px-4 pb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] gap-1 px-2.5 py-0.5">
                      {channel === "whatsapp" ? <Phone className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
                      {channel === "whatsapp" ? "WhatsApp" : "Web"}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    className="h-9 px-5 rounded-full gap-1.5"
                    disabled={!prompt.trim()}
                    onClick={() => handleCreate()}
                  >
                    Criar App
                    <ArrowUp className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* ═══ WHAT THE SYSTEM GENERATES ═══ */}
            <div className="max-w-2xl mx-auto mt-6">
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  { icon: Lightbulb, label: "Objetivo do app" },
                  { icon: Layers, label: "Jornada principal" },
                  { icon: Bot, label: "Agentes internos" },
                  { icon: Zap, label: "Automações" },
                  { icon: MessageSquare, label: "Etapas da conversa" },
                ].map((item) => (
                  <span key={item.label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 text-[11px] text-muted-foreground">
                    <item.icon className="w-3 h-3" />
                    {item.label}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground/60 mt-2">O sistema estrutura automaticamente todos os componentes do seu app.</p>
            </div>
          </div>
        </section>

        {/* ═══ APPS VS AGENTS — Differentiator ═══ */}
        <section className="max-w-5xl mx-auto px-6 pb-12">
          <div className="rounded-2xl border border-border bg-card/50 p-6 flex flex-col md:flex-row gap-6">
            <div className="flex-1 p-5 rounded-xl bg-primary/5 border border-primary/10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                  <Layers className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-foreground">Apps</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                Sistemas conversacionais completos, orientados a nichos e jornadas de negócio. Podem ser compostos por múltiplos agentes internos.
              </p>
              <div className="space-y-1.5">
                {["Sistema de triagem completo", "Onboarding + acompanhamento", "CRM conversacional por vertical"].map((t) => (
                  <div key={t} className="flex items-center gap-2 text-[11px] text-foreground/80">
                    <ChevronRight className="w-3 h-3 text-primary" />
                    {t}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 p-5 rounded-xl bg-muted/30 border border-border">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <Bot className="w-4 h-4 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-bold text-foreground">Agentes</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                Inteligências especializadas que executam funções específicas dentro de um App ou de forma independente.
              </p>
              <div className="space-y-1.5">
                {["Qualificador de leads", "Agente de agendamento", "Resposta a objeções"].map((t) => (
                  <div key={t} className="flex items-center gap-2 text-[11px] text-foreground/80">
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="text-center text-[11px] text-muted-foreground mt-3">
            <Sparkles className="w-3 h-3 inline mr-1" />
            Um app de clínica pode usar um agente de triagem, um de agendamento, um de confirmação e um de reativação — tudo orquestrado automaticamente.
          </p>
        </section>

        {/* ═══ SHOWCASE ═══ */}
        <section className="max-w-5xl mx-auto px-6 pb-16">
          <div className="text-center mb-8">
            <h2 className="text-xl lg:text-2xl font-bold text-foreground mb-2">
              Veja o tipo de app que você pode criar
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              De saúde e educação até vendas, operações e conteúdo — transforme fluxos de negócio em experiências conversacionais reais.
            </p>
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                  selectedCategory === cat.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
                }`}
              >
                <cat.icon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            ))}
          </div>

          {/* App cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredApps.map((app) => (
              <div
                key={app.name}
                className="group rounded-xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer"
                onClick={() => handleUseTemplate(app)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <app.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex gap-1">
                    {app.channels.map((ch) => (
                      <span
                        key={ch}
                        className={`w-6 h-6 rounded-md flex items-center justify-center ${
                          ch === "whatsapp" ? "bg-green-500/10 text-green-500" : "bg-primary/10 text-primary"
                        }`}
                      >
                        {ch === "whatsapp" ? <Phone className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                      </span>
                    ))}
                  </div>
                </div>

                <h3 className="text-sm font-bold text-foreground mb-1">{app.name}</h3>
                <p className="text-[10px] text-primary/70 font-medium mb-2">{app.categoryLabel}</p>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">{app.description}</p>

                <div className="flex items-center text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Criar semelhante
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ WhatsApp emphasis CTA ═══ */}
        <section className="max-w-5xl mx-auto px-6 pb-16">
          <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-green-500/15 flex items-center justify-center mx-auto mb-4">
              <Phone className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">
              Transforme o WhatsApp em um canal operacional
            </h3>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-6">
              Crie sistemas que rodam onde o cliente já está: na conversa. Qualifique leads, faça onboarding,
              agende, colete dados e opere fluxos reais — tudo pelo WhatsApp.
            </p>
            <Button
              className="rounded-full gap-2"
              onClick={() => { setChannel("whatsapp"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            >
              <Phone className="w-4 h-4" />
              Criar WhatsApp App
            </Button>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default Apps;
