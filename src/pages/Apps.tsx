import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Phone,
  Monitor,
  Heart,
  Target,
  Building2,
  Users,
  GraduationCap,
  Dumbbell,
  Briefcase,
  BookOpen,
  Hotel,
  ShoppingBag,
  Globe,
} from "lucide-react";

type AppChannel = "whatsapp" | "web";

const showcaseApps = [
  { name: "CliniFlow", cat: "Saúde", desc: "Triagem, agendamento e reativação de pacientes.", icon: Heart, channels: ["whatsapp", "web"] as AppChannel[] },
  { name: "LeadOrbit", cat: "Vendas", desc: "Qualificação de leads com follow-up automatizado.", icon: Target, channels: ["whatsapp"] as AppChannel[] },
  { name: "EstatePilot", cat: "CRM", desc: "Perfil do comprador, oportunidades e follow-ups para imobiliárias.", icon: Building2, channels: ["whatsapp", "web"] as AppChannel[] },
  { name: "NutriPath", cat: "Saúde", desc: "Plano alimentar, aderência e acompanhamento nutricional.", icon: Heart, channels: ["whatsapp"] as AppChannel[] },
  { name: "TrainSphere", cat: "Fitness", desc: "Treino, check-ins e ajustes contínuos.", icon: Dumbbell, channels: ["whatsapp"] as AppChannel[] },
  { name: "SkillLoop", cat: "Educação", desc: "Microlições, exercícios e adaptação por nível.", icon: GraduationCap, channels: ["whatsapp", "web"] as AppChannel[] },
  { name: "CloserOS", cat: "Vendas", desc: "Recuperação comercial, objeções e fechamento.", icon: ShoppingBag, channels: ["whatsapp"] as AppChannel[] },
  { name: "OnboardFlow", cat: "Operações", desc: "Onboarding guiado e ativação de novos clientes.", icon: Briefcase, channels: ["whatsapp", "web"] as AppChannel[] },
  { name: "CaseRoute", cat: "Jurídico", desc: "Triagem e organização para escritórios jurídicos.", icon: Building2, channels: ["whatsapp"] as AppChannel[] },
  { name: "HostMind", cat: "Hotelaria", desc: "Suporte ao hóspede, roteiros e recomendações.", icon: Hotel, channels: ["whatsapp", "web"] as AppChannel[] },
  { name: "PulseBoard", cat: "Conteúdo", desc: "Curadoria e distribuição de conteúdo personalizado.", icon: BookOpen, channels: ["web"] as AppChannel[] },
  { name: "MentorGrid", cat: "Mentoria", desc: "Acompanhamento de alunos com metas e check-ins.", icon: GraduationCap, channels: ["whatsapp", "web"] as AppChannel[] },
];

const Apps = () => {
  const navigate = useNavigate();
  const [channel, setChannel] = useState<AppChannel>("whatsapp");

  const filtered = showcaseApps.filter((a) =>
    a.channels.includes(channel)
  );

  const handleUseTemplate = (app: typeof showcaseApps[0]) => {
    const prompt = `Crie um app semelhante ao ${app.name}: ${app.desc}`;
    navigate("/app-builder", { state: { initialPrompt: prompt, channel: app.channels[0] } });
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-1">Apps</h1>
          <p className="text-sm text-muted-foreground">
            Sistemas conversacionais completos para nichos específicos.
          </p>
        </div>

        {/* Channel toggle */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={() => setChannel("whatsapp")}
            className={`flex items-center gap-3 px-5 py-3.5 rounded-xl border-2 transition-all flex-1 max-w-xs ${
              channel === "whatsapp"
                ? "border-green-500 bg-green-500/5"
                : "border-border bg-card hover:border-border/80"
            }`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              channel === "whatsapp" ? "bg-green-500/15 text-green-500" : "bg-muted text-muted-foreground"
            }`}>
              <Phone className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">WhatsApp App</p>
              <p className="text-[11px] text-muted-foreground">Conversacional e operacional</p>
            </div>
          </button>

          <button
            onClick={() => setChannel("web")}
            className={`flex items-center gap-3 px-5 py-3.5 rounded-xl border-2 transition-all flex-1 max-w-xs ${
              channel === "web"
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:border-border/80"
            }`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              channel === "web" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
            }`}>
              <Monitor className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">Web App</p>
              <p className="text-[11px] text-muted-foreground">Dashboard, portal e sistema</p>
            </div>
          </button>
        </div>

        {/* Apps grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((app) => (
            <div
              key={app.name}
              onClick={() => handleUseTemplate(app)}
              className="group rounded-xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <app.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex gap-1">
                  {app.channels.map((ch) => (
                    <span key={ch} className={`w-6 h-6 rounded-md flex items-center justify-center ${
                      ch === "whatsapp" ? "bg-green-500/10 text-green-500" : "bg-primary/10 text-primary"
                    }`}>
                      {ch === "whatsapp" ? <Phone className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                    </span>
                  ))}
                </div>
              </div>
              <h3 className="text-sm font-bold text-foreground mb-0.5">{app.name}</h3>
              <p className="text-[10px] text-primary/70 font-medium mb-1.5">{app.cat}</p>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">{app.desc}</p>
              <div className="flex items-center text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Criar semelhante <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Apps;
