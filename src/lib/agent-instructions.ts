import type { AgentType } from "@/types/agent-builder";
import { AGENT_PRESETS } from "@/types/agent-presets";
import { getOperationalInstructions } from "@/lib/agent-operational-prompts";

interface InstructionSeed {
  agentType: AgentType;
  agentName?: string;
  companyName?: string;
  description?: string;
  objective?: string;
  toneOfVoice?: string;
  greetingMessage?: string;
  instructions?: string;
}

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, " ").trim();

const replaceTokens = (value: string, seed: InstructionSeed) => {
  const text = value?.trim();
  if (!text) return "";

  return text
    .replace(/\[Nome da Empresa\]/gi, seed.companyName || "[Nome da Empresa]")
    .replace(/\[Empresa\]/gi, seed.companyName || "[Empresa]")
    .replace(/\[Nome do Agente\]/gi, seed.agentName || "[Nome do Agente]")
    .replace(/\{\{?\s*company(_?name)?\s*\}?\}/gi, seed.companyName || "[Nome da Empresa]")
    .replace(/\{\{?\s*agent(_?name)?\s*\}?\}/gi, seed.agentName || "[Nome do Agente]");
};

const joinParagraphs = (...parts: Array<string | undefined>) => parts.filter(Boolean).join("\n\n");

export function hasStructuredInstructionSections(value?: string | null) {
  if (!value?.trim()) return false;
  return /^#\s*1\./m.test(value) && /^#\s*8\./m.test(value);
}

export function ensureStructuredInstructions(rawValue: string | undefined, seed: InstructionSeed) {
  const existingInstructions = replaceTokens(rawValue || "", seed);
  if (hasStructuredInstructionSections(existingInstructions)) return existingInstructions;

  const preset = AGENT_PRESETS[seed.agentType];
  const presetContext = preset?.context || {};
  const operationalInstructions = replaceTokens(getOperationalInstructions(seed.agentType), seed);

  const objective = replaceTokens(seed.objective || "", seed)
    || replaceTokens(seed.description || "", seed)
    || presetContext.painPoints
    || "Conduzir conversas úteis, objetivas e orientadas a resultado dentro do escopo configurado.";

  const audience = replaceTokens(seed.description || "", seed)
    || presetContext.targetAudienceDescription
    || "Adapte a linguagem ao perfil do usuário e mantenha contexto suficiente antes de avançar.";

  const tone = replaceTokens(seed.toneOfVoice || "", seed)
    || presetContext.toneOfVoice
    || "Profissional e amigável";

  const greeting = replaceTokens(seed.greetingMessage || "", seed);
  const identity = joinParagraphs(
    `Você é ${seed.agentName || `um agente ${seed.agentType}`}${seed.companyName ? ` da empresa ${seed.companyName}` : ""}.`,
    "Apresente-se sempre pelo nome configurado e mantenha consistência de personalidade durante toda a conversa.",
    greeting ? `Mensagem de abertura desejada: "${greeting}".` : undefined,
  );

  const stages = preset?.stages?.length
    ? preset.stages.map((stage, index) => `${index + 1}. ${stage.name} — ${stage.description}${stage.example ? ` Exemplo: \"${replaceTokens(stage.example, seed)}\".` : ""}`).join("\n")
    : "1. Saudação e contextualização.\n2. Entendimento da necessidade.\n3. Qualificação do contexto.\n4. Proposta do próximo passo.\n5. Encerramento cordial.";

  const flowExtras = seed.agentType === "SDR"
    ? "\n6. Qualificação BANT — confirme Budget, Authority, Need e Timeline antes de oferecer reunião ou proposta comercial."
    : "";

  const generalRules = [
    "- Faça uma pergunta por vez e confirme o que entendeu antes de avançar.",
    "- Use respostas curtas, claras e no idioma do usuário.",
    "- Nunca invente dados, preços, prazos ou políticas sem base de conhecimento.",
    "- Se faltar contexto crítico, peça esclarecimento antes de concluir.",
  ];

  if (seed.agentType === "SDR") {
    generalRules.push("- Em agentes SDR, a qualificação BANT é obrigatória antes do agendamento.");
  }

  const shouldIncludeRawContext = existingInstructions
    && normalizeWhitespace(existingInstructions) !== normalizeWhitespace(operationalInstructions);

  const behaviorRules = joinParagraphs(
    generalRules.join("\n"),
    operationalInstructions ? `Diretrizes operacionais obrigatórias:\n${operationalInstructions}` : undefined,
    shouldIncludeRawContext ? `Contexto adicional a preservar:\n${existingInstructions}` : undefined,
  );

  return `# 1. Identidade
${identity}

# 2. Objetivo Principal
${objective}

# 3. Público-Alvo
${audience}

# 4. Tom e Estilo de Comunicação
- Tom principal: ${tone}.
- Mantenha mensagens de até 2-3 linhas quando possível.
- Priorize clareza, contexto e próxima ação.
- Responda sempre no idioma do usuário.

# 5. Fluxo de Conversa
${stages}${flowExtras}

# 6. Regras de Comportamento
${behaviorRules}

# 7. Restrições
- Não execute ações fora do escopo configurado.
- Não compartilhe informações confidenciais ou de outros clientes.
- Não use placeholders como [Nome da Empresa] em produção.
- Quando não souber a resposta, informe a limitação e ofereça encaminhamento.

# 8. Encerramento
Finalize de forma cordial, recapitule o próximo passo e confirme claramente o que acontecerá em seguida.`;
}