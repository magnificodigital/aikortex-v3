import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://kbknehyfksugykrovfxs.supabase.co/functions/v1/ai-gateway";

// ── SSE helpers ───────────────────────────────────────────────────────────
function streamText(text: string): ReadableStream {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(ctrl) {
      const words = text.split(" ");
      for (let i = 0; i < words.length; i++) {
        const chunk = i === words.length - 1 ? words[i] : words[i] + " ";
        const payload = JSON.stringify({ choices: [{ delta: { content: chunk } }] });
        ctrl.enqueue(encoder.encode(`data: ${payload}\n\n`));
      }
      ctrl.enqueue(encoder.encode("data: [DONE]\n\n"));
      ctrl.close();
    },
  });
}

// ── Lead extractor — runs after every response ────────────────────────────
// Uses a fast structured call to extract any lead info from the conversation
async function extractAndSaveLead(
  messages: Array<{ role: string; content: string }>,
  agentResponse: string,
  ctx: { supabase: ReturnType<typeof createClient>; userId: string; agentId?: string }
): Promise<void> {
  try {
    // Build a compact conversation for extraction
    const convo = messages
      .filter(m => m.role === "user")
      .map(m => m.content)
      .join(" | ");

    const extractPrompt = `Analise esta conversa e extraia dados do lead se houver NOME + (EMAIL ou TELEFONE).
Conversa do usuário: "${convo}"
Última resposta do agente: "${agentResponse.slice(0, 200)}"

Retorne APENAS JSON válido:
{"found": true/false, "name": "", "email": "", "phone": "", "company": "", "notes": "", "temperature": "frio|morno|quente"}

Se não encontrou dados suficientes, retorne: {"found": false}
RETORNE SOMENTE O JSON.`;

    const resp = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: extractPrompt }],
        module: "agent",
        mode: "structure",
      }),
    });

    if (!resp.ok) return;

    const data = await resp.json();
    const raw = (data.content || "")
      .replace(/^```json\s*/gm, "").replace(/^```\s*/gm, "").replace(/```\s*$/gm, "").trim();

    let extracted: Record<string, unknown>;
    try { extracted = JSON.parse(raw); } catch { return; }

    if (!extracted.found || !extracted.name) return;

    // Save to leads table
    const leadData = {
      user_id:     ctx.userId,
      agent_id:    ctx.agentId || null,
      name:        String(extracted.name  || ""),
      email:       String(extracted.email || ""),
      phone:       String(extracted.phone || ""),
      company:     String(extracted.company || ""),
      notes:       String(extracted.notes || ""),
      temperature: ["frio","morno","quente"].includes(String(extracted.temperature))
                     ? String(extracted.temperature) : "morno",
      stage:       "lead",
      source:      "manual",
      value:       0,
      tags:        [],
      activities: [{
        id: crypto.randomUUID(),
        type: "note",
        description: "Lead capturado automaticamente pelo agente de IA.",
        createdAt: new Date().toISOString(),
        createdBy: "Agente IA",
      }],
    };

    if (leadData.email) {
      await ctx.supabase.from("leads")
        .upsert(leadData, { onConflict: "user_id,email" });
    } else {
      // No email — just insert (can't upsert without unique key)
      const { data: existing } = await ctx.supabase.from("leads")
        .select("id").eq("user_id", ctx.userId).ilike("name", leadData.name).maybeSingle();
      if (!existing) {
        await ctx.supabase.from("leads").insert(leadData);
      }
    }

    console.log("Lead saved:", leadData.name);
  } catch (e) {
    console.error("extractAndSaveLead error:", e);
  }
}

// ── Main handler ──────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const {
      messages = [],
      agentConfig,
      agentId,
      contactId = "browser-test",
      channel = "chat",
    } = body;

    const supabaseUrl     = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // Use service role to bypass RLS — safe because this is server-side only
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Accept userId from frontend (passed from Lovable auth session)
    const userId = body.userId || "anonymous";

    // Build system prompt
    const agentName    = agentConfig?.name         || "Assistente";
    const instructions = agentConfig?.instructions || "";
    const objective    = agentConfig?.objective    || "";
    const tone         = agentConfig?.toneOfVoice  || "Profissional e Amigável";

    const system = `Você é ${agentName}, um agente de IA da plataforma Aikortex.

## Objetivo
${objective}

## Instruções
${instructions}

## Tom de voz
${tone}

## Regras
- Seja natural e conversacional
- Colete nome, email ou telefone, empresa e interesse do lead durante a conversa
- Quando o lead quiser agendar, ofereça horários disponíveis
- Responda sempre em português do Brasil`;

    // Call gateway for the conversation (reliable, works without API key)
    const resp = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        system,
        module: "agent",
        mode: "chat",
      }),
    });

    const gatewayData = await resp.json();
    const finalContent = gatewayData.content || "Desculpe, ocorreu um erro.";

    // After responding, extract lead data in background (non-blocking)
    if (userId !== "anonymous") {
      const ctx = { supabase, userId, agentId };

      // Run extraction + conversation persistence in background
      Promise.all([
        extractAndSaveLead(messages, finalContent, ctx),
        agentId ? supabase.from("conversations").upsert({
          user_id:    userId,
          agent_id:   agentId,
          contact_id: contactId,
          channel,
          messages:   [...messages, { role: "assistant", content: finalContent }],
        }, { onConflict: "agent_id,contact_id,channel" }) : Promise.resolve(),
      ]).catch(e => console.error("background tasks error:", e));
    }

    // Return as SSE stream
    return new Response(streamText(finalContent), {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (e) {
    console.error("agent-runtime error:", e);
    const msg = e instanceof Error ? e.message : "Erro desconhecido";
    return new Response(streamText(`⚠️ ${msg}`), {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  }
});
