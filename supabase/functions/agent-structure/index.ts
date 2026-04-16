import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY_URL = "https://kbknehyfksugykrovfxs.supabase.co/functions/v1/ai-gateway";

function extractJsonFromResponse(response: string): unknown {
  let cleaned = response
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const jsonStart = cleaned.search(/[\{\[]/);
  const jsonEnd = cleaned.lastIndexOf(jsonStart !== -1 && cleaned[jsonStart] === '[' ? ']' : '}');

  if (jsonStart === -1 || jsonEnd === -1) throw new Error("No JSON found in response");

  return JSON.parse(cleaned.substring(jsonStart, jsonEnd + 1));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { description, agent_type, language } = await req.json();

    const systemPrompt = `Você é um especialista em configurar agentes de IA conversacionais.
Dado a descrição do usuário, gere uma configuração estruturada completa para o agente.
Adapte o tom, mensagem de saudação e funcionalidades ao tipo de agente (${agent_type || "Custom"}).
Idioma padrão: ${language || "pt-BR"}.
Seja criativo mas realista nas funcionalidades sugeridas.

Responda APENAS com um JSON válido, sem texto antes ou depois, sem markdown, seguindo EXATAMENTE este formato:

{
  "agent_name": "Nome do agente",
  "agent_type": "SDR | BDR | SAC | CS | Custom",
  "description": "Descrição curta do agente (1-2 frases)",
  "objective": "Objetivo principal do agente",
  "tone": "professional_friendly | formal | casual | empathetic | direct",
  "language": "pt-BR",
  "greeting_message": "Mensagem de saudação inicial",
  "instructions": "Instruções detalhadas de comportamento",
  "channels": ["whatsapp", "web"],
  "quick_replies": ["Opção 1", "Opção 2", "Opção 3"],
  "selected_features": ["feature1", "feature2", "feature3"],
  "onboarding_level": "none | soft | strict"
}

Retorne SOMENTE o JSON.`;

    const response = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: description }],
        system: systemPrompt,
        module: "agent",
        mode: "structure",
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.content;

    if (!content) {
      console.error("No content in response:", JSON.stringify(data).slice(0, 500));
      return new Response(JSON.stringify({ error: "IA não retornou configuração estruturada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let structuredConfig;
    try {
      structuredConfig = extractJsonFromResponse(content);
    } catch (e) {
      console.error("JSON parse error:", e, content.slice(0, 500));
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
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
