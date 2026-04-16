const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://kbknehyfksugykrovfxs.supabase.co/functions/v1/ai-gateway";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { description, agent_type, language } = await req.json();

    const system = `Você é um especialista em configurar agentes de IA conversacionais.
Analise a descrição e retorne APENAS um JSON válido com exatamente estes campos:
{
  "agent_name": "string",
  "agent_type": "${agent_type || "Custom"}",
  "description": "string",
  "objective": "string",
  "tone": "professional_friendly" | "formal" | "casual" | "empathetic" | "direct",
  "language": "${language || "pt-BR"}",
  "greeting_message": "string",
  "instructions": "string",
  "channels": ["whatsapp"],
  "quick_replies": ["string", "string", "string"],
  "selected_features": ["string", "string"],
  "onboarding_level": "soft" | "none" | "strict"
}
Retorne SOMENTE o JSON, sem texto antes ou depois.`;

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
      const cleaned = data.content.replace(/^```json\s*/gm, "").replace(/```\s*$/gm, "").trim();
      structuredConfig = JSON.parse(cleaned);
    } catch {
      return new Response(JSON.stringify({ error: "Erro ao processar resposta da IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ structuredConfig }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
