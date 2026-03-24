import { AgentRecommendation } from "@/types/agent-builder";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

import avatar1 from "@/assets/avatars/avatar-1.png";
import avatar2 from "@/assets/avatars/avatar-2.png";
import avatar3 from "@/assets/avatars/avatar-3.png";
import avatar4 from "@/assets/avatars/avatar-4.png";
import avatar5 from "@/assets/avatars/avatar-5.png";
import avatar6 from "@/assets/avatars/avatar-6.png";
import avatar7 from "@/assets/avatars/avatar-7.png";
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
    name: "Assistente Pessoal Executivo",
    description: "Organiza sua rotina, captura tarefas e redige e-mails antes que você peça.",
    avatar: avatar1,
    type: "SDR" as const,
  },
  {
    id: "bdr-1",
    name: "Sales Development Rep",
    description: "Pesquisa prospects reais, escreve abordagens personalizadas e faz follow-up até...",
    avatar: avatar2,
    type: "BDR" as const,
  },
  {
    id: "sac-1",
    name: "Inbox Manager",
    description: "Triagem da sua inbox, redige respostas na sua voz e mostra só o que realmente...",
    avatar: avatar3,
    type: "SAC" as const,
  },
  {
    id: "cs-1",
    name: "Growth & Competitive Intelligence",
    description: "Monitora concorrentes semanalmente, acompanha mudanças de mercado e entrega briefings acionáveis.",
    avatar: avatar4,
    type: "CS" as const,
  },
  {
    id: "custom-5",
    name: "Software Engineer",
    description: "Revisa PRs, detecta bugs cedo e envia correções limpas sem precisar pedir.",
    avatar: avatar5,
    type: "Custom" as const,
  },
  {
    id: "custom-6",
    name: "Finance & Business Analyst",
    description: "Acompanha métricas-chave diariamente, sinaliza anomalias e entrega um snapshot semanal limpo.",
    avatar: avatar6,
    type: "Custom" as const,
  },
  {
    id: "custom-7",
    name: "Research Analyst",
    description: "Pesquisa rigorosamente, cruza referências e entrega insights claros com citações.",
    avatar: avatar7,
    type: "Custom" as const,
  },
  {
    id: "custom-8",
    name: "Social Media Manager",
    description: "Planeja conteúdo semanal, escreve na sua voz e acompanha o que funciona.",
    avatar: avatar8,
    type: "Custom" as const,
  },
  {
    id: "custom-9",
    name: "Customer Success Manager",
    description: "Detecta sinais de churn cedo, redige respostas empáticas e mantém cada cliente...",
    avatar: avatar9,
    type: "Custom" as const,
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
