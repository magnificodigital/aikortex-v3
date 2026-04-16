const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://kbknehyfksugykrovfxs.supabase.co/functions/v1/ai-gateway";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { description, agent_type, language } = await req.json();

    const system = `Você é um especialista em configurar agentes de IA conversacionais para agências de marketing brasileiras.
Analise a descrição do usuário e retorne APENAS um JSON válido, sem texto antes ou depois, sem markdown, sem blocos de código.
O JSON deve ter exatamente estes campos:
{
  "agent_name": "nome criativo para o agente",
  "agent_type": "${agent_type || "Custom"}",
  "description": "descrição clara do agente em 1-2 frases",
  "objective": "objetivo principal e mensurável do agente",
  "tone": "Profissional e Amigável",
  "language": "${language || "pt-BR"}",
  "greeting_message": "mensagem de saudação natural, calorosa e contextual ao negócio",
  "instructions": "## Identidade\\nDescreva quem é o agente, seu nome, empresa e papel.\\n\\n## Objetivo\\nDescreva claramente o objetivo principal do agente e os resultados esperados.\\n\\n## Comportamento e Tom\\nExplique como o agente deve se comunicar: linguagem usada, nível de formalidade, empatia e postura.\\n\\n## Fluxo de Atendimento\\n1. Passo 1 do atendimento\\n2. Passo 2 do atendimento\\n3. Passo 3 do atendimento\\n4. Passo 4 do atendimento\\n5. Passo 5 do atendimento\\n\\n## Qualificação e Perguntas-Chave\\nListe as perguntas que o agente deve fazer para qualificar ou entender o cliente.\\n\\n## Regras e Limites\\n- O que o agente NUNCA deve fazer\\n- Como escalar para humano quando necessário\\n- Horários de atendimento (se aplicável)\\n\\n## Respostas a Objeções Comuns\\nComo lidar com as principais objeções ou dúvidas frequentes.",
  "channels": ["whatsapp"],
  "quick_replies": ["opção contextual 1", "opção contextual 2", "opção contextual 3"],
  "urls": ["https://site-exemplo.com/sobre", "https://site-exemplo.com/produtos"],
  "selected_features": ["qualificacao_leads", "agendamento", "escalacao_humano"],
  "onboarding_level": "soft"
}
IMPORTANTE:
- O campo "tone" deve ser EXATAMENTE um destes valores: "Profissional e Amigável", "Formal", "Casual e Descontraído", "Empático e Acolhedor", "Direto e Objetivo"
- O campo "instructions" deve ser rico, com 6-8 seções usando os títulos ## acima, adaptados ao contexto específico do agente descrito
- O campo "urls" deve conter 2-3 URLs de exemplo baseadas no domínio/nicho do agente (use URLs plausíveis para o negócio)
- Valores válidos para onboarding_level: none, soft, strict
RETORNE SOMENTE O JSON.`;

    const resp = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: description }],
        system,
        module: "agent",
        mode: "structure",
      }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      return new Response(JSON.stringify({ error: err.error || "Erro no serviço de IA" }), {
        status: resp.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();

    let structuredConfig;
    try {
      const cleaned = (data.content || "")
        .replace(/^```json\s*/gm, "")
        .replace(/^```\s*/gm, "")
        .replace(/```\s*$/gm, "")
        .trim();
      structuredConfig = JSON.parse(cleaned);
    } catch {
      console.error("JSON parse error, content:", data.content?.slice(0, 300));
      return new Response(JSON.stringify({ error: "Erro ao processar resposta da IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ structuredConfig }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("agent-structure error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
