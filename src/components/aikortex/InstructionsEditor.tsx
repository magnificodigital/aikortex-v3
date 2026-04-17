import { useEffect, useMemo, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Target, Users, MessageSquare, ListOrdered, ShieldAlert, Ban, CheckCircle2, User } from "lucide-react";

interface Section {
  key: string;
  title: string;
  icon: typeof Target;
  description: string;
  placeholder: string;
}

const SECTIONS: Section[] = [
  {
    key: "identity",
    title: "1. Identidade",
    icon: User,
    description: "Quem é o agente, sua personalidade e como deve se apresentar.",
    placeholder: "Você é um assistente de IA profissional. Apresente-se sempre pelo nome configurado e mantenha consistência de personalidade em todas as interações.",
  },
  {
    key: "objective",
    title: "2. Objetivo Principal",
    icon: Target,
    description: "Missão central do agente — qual problema ele resolve.",
    placeholder: "Descreva a missão principal: qualificar leads, agendar reuniões, prestar suporte ao cliente ou tirar dúvidas sobre produtos.",
  },
  {
    key: "audience",
    title: "3. Público-Alvo",
    icon: Users,
    description: "Com quem o agente conversa e como adaptar a linguagem.",
    placeholder: "Defina com quem o agente irá conversar (ex: leads inbound, clientes ativos, prospects B2B). Adapte a linguagem ao perfil do interlocutor.",
  },
  {
    key: "tone",
    title: "4. Tom e Estilo de Comunicação",
    icon: MessageSquare,
    description: "Como o agente deve falar — registro, comprimento das mensagens.",
    placeholder: "- Mantenha tom profissional, amigável e empático.\n- Use frases curtas e objetivas (máximo 2-3 linhas por mensagem).\n- Evite jargões técnicos desnecessários.\n- Responda sempre no idioma do usuário.",
  },
  {
    key: "flow",
    title: "5. Fluxo de Conversa",
    icon: ListOrdered,
    description: "Etapas que o agente deve seguir, em ordem.",
    placeholder: "1. Saudação inicial e apresentação.\n2. Descoberta da necessidade (faça uma pergunta por vez).\n3. Qualificação ou aprofundamento do contexto.\n4. Apresentação da solução ou próximo passo.\n5. Confirmação e encerramento cordial.",
  },
  {
    key: "rules",
    title: "6. Regras de Comportamento",
    icon: ShieldAlert,
    description: "Comportamentos obrigatórios e proibidos.",
    placeholder: "- NUNCA invente informações que não estejam na base de conhecimento.\n- Sempre confirme dados sensíveis antes de prosseguir.\n- Se não souber a resposta, ofereça encaminhar para um humano.\n- Não compartilhe informações confidenciais ou de outros clientes.",
  },
  {
    key: "constraints",
    title: "7. Restrições",
    icon: Ban,
    description: "O que o agente NÃO pode fazer.",
    placeholder: "- Não emita opiniões pessoais sobre temas polêmicos (política, religião).\n- Não faça promessas de prazo, preço ou resultados sem validação.\n- Não execute ações fora do escopo configurado.",
  },
  {
    key: "closing",
    title: "8. Encerramento",
    icon: CheckCircle2,
    description: "Como finalizar a conversa.",
    placeholder: "Sempre finalize de forma cordial, agradeça o contato e indique o próximo passo claro (ex: \"vou agendar sua reunião\", \"um especialista entrará em contato\").",
  },
];

interface Props {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Parses a single text blob (sections separated by `# N. Title`) into a Record<sectionKey, content>.
 * Robust: matches by section number rather than exact title to allow user edits.
 */
function parseInstructions(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!text?.trim()) return result;

  // Split on lines starting with `# N.`
  const parts = text.split(/^#\s*(\d+)\.\s*([^\n]+)\n?/gm);
  // parts = [pre, num, title, content, num, title, content, ...]
  for (let i = 1; i < parts.length; i += 3) {
    const num = parts[i];
    const content = (parts[i + 2] || "").trim();
    const section = SECTIONS[parseInt(num, 10) - 1];
    if (section) result[section.key] = content;
  }
  return result;
}

function serializeInstructions(sections: Record<string, string>): string {
  return SECTIONS.map((s) => {
    const content = sections[s.key]?.trim() || s.placeholder;
    return `# ${s.title}\n${content}`;
  }).join("\n\n");
}

const InstructionsEditor = ({ value, onChange }: Props) => {
  // Initialize per-section state once from value
  const initial = useMemo(() => parseInstructions(value), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [sections, setSections] = useState<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    SECTIONS.forEach((s) => { out[s.key] = initial[s.key] ?? ""; });
    return out;
  });

  // Re-sync when external value changes substantially (e.g., wizard completion)
  useEffect(() => {
    const parsed = parseInstructions(value);
    // Only update if at least one section differs from current
    const differs = SECTIONS.some((s) => (parsed[s.key] ?? "") !== (sections[s.key] ?? ""));
    if (differs && Object.keys(parsed).length > 0) {
      const next: Record<string, string> = {};
      SECTIONS.forEach((s) => { next[s.key] = parsed[s.key] ?? sections[s.key] ?? ""; });
      setSections(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const updateSection = (key: string, content: string) => {
    const next = { ...sections, [key]: content };
    setSections(next);
    onChange(serializeInstructions(next));
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-foreground">Instruções</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Edite cada seção do prompt do agente separadamente. Estrutura baseada nas melhores práticas de engenharia de prompt.
        </p>
      </div>

      <div className="space-y-3">
        {SECTIONS.map(({ key, title, icon: Icon, description, placeholder }) => (
          <div key={key} className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-start gap-3 px-4 pt-3 pb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <Label className="text-sm font-semibold text-foreground">{title}</Label>
                <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
              </div>
            </div>
            <div className="px-4 pb-3">
              <Textarea
                value={sections[key] ?? ""}
                onChange={(e) => updateSection(key, e.target.value)}
                placeholder={placeholder}
                className="text-sm min-h-[100px] leading-relaxed"
              />
            </div>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground">
        Dica: deixe campos em branco para usar o conteúdo padrão sugerido. Quanto mais específico, melhor o desempenho do agente.
      </p>
    </div>
  );
};

export default InstructionsEditor;
