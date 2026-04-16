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
  "objective": "objetivo principal do agente",
  "tone": "professional_friendly",
  "language": "${language || "pt-BR"}",
  "greeting_message": "mensagem de saudação natural e contextual",
  "instructions": "instruções detalhadas de comportamento do agente",
  "channels": ["whatsapp"],
  "quick_replies": ["opção 1", "opção 2", "opção 3"],
  "selected_features": ["feature1", "feature2", "feature3"],
  "onboarding_level": "soft"
}
Valores válidos para tone: professional_friendly, formal, casual, empathetic, direct
Valores válidos para onboarding_level: none, soft, strict
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
