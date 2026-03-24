import { AgentRecommendation } from "@/types/agent-builder";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

import avatar1 from "@/assets/avatars/avatar-1.png";
import avatar2 from "@/assets/avatars/avatar-2.png";
import avatar3 from "@/assets/avatars/avatar-3.png";
import avatar8 from "@/assets/avatars/avatar-8.png";
import avatar9 from "@/assets/avatars/avatar-9.png";

interface Props {
  selected: AgentRecommendation | null;
  onSelect: (agent: AgentRecommendation | null) => void;
  onNext: () => void;
}

const AGENT_CARDS = [
  {
    id: "sdr-1",
    name: "Agente SDR",
    description: "Qualifica leads inbound, responde em segundos e agenda reuniões com o time comercial 24/7.",
    avatar: avatar1,
    type: "SDR" as const,
    highlight: true,
  },
  {
    id: "bdr-1",
    name: "Agente BDR",
    description: "Prospecta leads outbound, pesquisa empresas-alvo e gera oportunidades via abordagem personalizada.",
    avatar: avatar2,
    type: "BDR" as const,
    highlight: true,
  },
  {
    id: "sac-1",
    name: "Agente SAC",
    description: "Atende clientes automaticamente, resolve dúvidas e reduz tickets com suporte inteligente.",
    avatar: avatar3,
    type: "SAC" as const,
    highlight: true,
  },
  {
    id: "social-1",
    name: "Social Media Manager",
    description: "Planeja conteúdo semanal, escreve na sua voz, responde DMs e acompanha o que funciona.",
    avatar: avatar8,
    type: "Custom" as const,
    highlight: true,
  },
  {
    id: "custom-1",
    name: "Agente Personalizado",
    description: "Configure um agente sob medida com total liberdade: objetivos, canais, integrações e comportamento.",
    avatar: avatar9,
    type: "Custom" as const,
    highlight: true,
  },
];

const StepAgents = ({ selected, onSelect, onNext }: Props) => {
  const handleSelect = (card: typeof AGENT_CARDS[0]) => {
    if (selected?.id === card.id) {
      onSelect(null);
    } else {
      onSelect({
        id: card.id,
        type: card.type,
        name: card.name,
        objective: card.description,
        targetAudience: "",
        benefits: [],
        exampleConversation: [],
        selected: true,
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground bg-muted px-3 py-1.5 rounded-lg">Templates</span>
        <button className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
          Browse all <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {AGENT_CARDS.map((card) => {
          const active = selected?.id === card.id;
          return (
            <button
              key={card.id}
              onClick={() => handleSelect(card)}
              className={`text-left rounded-xl border p-5 transition-all duration-200 space-y-4 ${
                active
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <img
                src={card.avatar}
                alt={card.name}
                loading="lazy"
                width={48}
                height={48}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-foreground">{card.name}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {card.description}
                </p>
              </div>
              <div className="flex items-center gap-1.5 pt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                <span className="text-xs text-muted-foreground">Template</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-muted-foreground">
          {!selected ? "Selecione um agente para continuar" : `${selected.name} selecionado`}
        </p>
        <Button onClick={onNext} disabled={!selected} className="gap-2">
          Continuar <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default StepAgents;
