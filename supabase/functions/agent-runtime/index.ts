import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://kbknehyfksugykrovfxs.supabase.co/functions/v1/ai-gateway";

// Models with good tool calling support (tried in order)
const TOOL_MODELS = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "qwen/qwen3-235b-a22b:free",
  "google/gemma-3-27b-it:free",
];

// ── SSE helpers ───────────────────────────────────────────────────────────
function sseChunk(content: string): Uint8Array {
  const payload = JSON.stringify({ choices: [{ delta: { content } }] });
  return new TextEncoder().encode(`data: ${payload}\n\n`);
}

function sseDone(): Uint8Array {
  return new TextEncoder().encode("data: [DONE]\n\n");
}

function streamText(text: string): ReadableStream {
  return new ReadableStream({
    start(ctrl) {
      // Send in small chunks to feel like streaming
      const words = text.split(" ");
      for (let i = 0; i < words.length; i++) {
        const chunk = i === words.length - 1 ? words[i] : words[i] + " ";
        ctrl.enqueue(sseChunk(chunk));
      }
      ctrl.enqueue(sseDone());
      ctrl.close();
    },
  });
}

// ── Tool definitions ──────────────────────────────────────────────────────
const TOOLS = [
  {
    type: "function",
    function: {
      name: "save_lead",
      description: "Salva um lead no CRM assim que tiver nome + email ou telefone. Use imediatamente ao coletar esses dados.",
      parameters: {
        type: "object",
        properties: {
          name:        { type: "string",  description: "Nome completo" },
          email:       { type: "string",  description: "Email" },
          phone:       { type: "string",  description: "Telefone" },
          company:     { type: "string",  description: "Empresa" },
          position:    { type: "string",  description: "Cargo" },
          notes:       { type: "string",  description: "Resumo do interesse e conversa" },
          temperature: { type: "string",  enum: ["frio","morno","quente"] },
          value:       { type: "number",  description: "Valor estimado do negócio em R$" },
          tags:        { type: "array",   items: { type: "string" } },
          stage:       { type: "string",  enum: ["lead","em_atendimento","qualificado","agendado","negociacao"] },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_calendar_availability",
      description: "Verifica horários disponíveis para reunião quando o lead quiser agendar.",
      parameters: {
        type: "object",
        properties: {
          days_ahead: { type: "number", description: "Dias à frente (padrão 7)" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "book_meeting",
      description: "Agenda reunião quando lead confirmar horário.",
      parameters: {
        type: "object",
        properties: {
          attendee_name:  { type: "string" },
          attendee_email: { type: "string" },
          datetime:       { type: "string", description: "ISO 8601" },
          title:          { type: "string" },
          duration_min:   { type: "number" },
        },
        required: ["attendee_name", "datetime", "title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "qualify_lead",
      description: "Registra qualificação BANT após coletar todas as informações.",
      parameters: {
        type: "object",
        properties: {
          lead_name:  { type: "string" },
          budget:     { type: "string" },
          authority:  { type: "string" },
          need:       { type: "string" },
          timeline:   { type: "string" },
          bant_score: { type: "number", description: "Score 0-100" },
        },
        required: ["lead_name", "need", "bant_score"],
      },
    },
  },
];

// ── Tool executor ──────────────────────────────────────────────────────────
async function executeTool(
  name: string,
  args: Record<string, unknown>,
  ctx: { supabase: ReturnType<typeof createClient>; userId: string; agentId?: string }
): Promise<string> {

  if (name === "save_lead") {
    const leadData = {
      user_id:   ctx.userId,
      agent_id:  ctx.agentId || null,
      name:      String(args.name  || ""),
      email:     String(args.email || ""),
      phone:     String(args.phone || ""),
      company:   String(args.company  || ""),
      position:  String(args.position || ""),
      notes:     String(args.notes || ""),
      temperature: String(args.temperature || "morno"),
      value:     Number(args.value || 0),
      tags:      (args.tags as string[]) || [],
      stage:     String(args.stage || "lead"),
      source:    "manual",
      activities: [{
        id: crypto.randomUUID(),
        type: "note",
        description: `Lead capturado pelo agente de IA. ${args.notes || ""}`.trim(),
        createdAt: new Date().toISOString(),
        createdBy: "Agente IA",
      }],
    };

    // Upsert: update if same user+email already exists, otherwise insert
    const upsertQuery = leadData.email
      ? ctx.supabase.from("leads").upsert(leadData, { onConflict: "user_id,email" }).select("id").single()
      : ctx.supabase.from("leads").insert(leadData).select("id").single();

    const { data, error } = await upsertQuery;
    if (error) {
      console.error("save_lead error:", error);
      return JSON.stringify({ success: false, error: error.message });
    }
    return JSON.stringify({ success: true, lead_id: data?.id });
  }

  if (name === "check_calendar_availability") {
    const slots: string[] = [];
    const now = new Date();
    for (let d = 1; slots.length < 6; d++) {
      const day = new Date(now);
      day.setDate(now.getDate() + d);
      if (day.getDay() === 0 || day.getDay() === 6) continue;
      const label = day.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" });
      slots.push(`${label} às 10h`, `${label} às 14h`, `${label} às 16h`);
    }
    return JSON.stringify({ available_slots: slots.slice(0, 6) });
  }

  if (name === "book_meeting") {
    const { attendee_name, datetime, title } = args;
    let dateLabel = String(datetime || "");
    try {
      dateLabel = new Date(String(datetime)).toLocaleString("pt-BR", {
        weekday: "long", day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit",
      });
    } catch { /* keep raw */ }
    return JSON.stringify({
      success: true,
      message: `Reunião "${title}" agendada para ${dateLabel} com ${attendee_name}.`,
    });
  }

  if (name === "qualify_lead") {
    const { lead_name, budget, authority, need, timeline, bant_score } = args;
    const score = Number(bant_score || 0);
    const stage = score >= 70 ? "qualificado" : "em_atendimento";
    await ctx.supabase.from("leads")
      .update({ stage, temperature: score >= 70 ? "quente" : "morno" })
      .eq("user_id", ctx.userId)
      .ilike("name", String(lead_name));
    return JSON.stringify({ success: true, stage, bant_score: score });
  }

  return JSON.stringify({ error: `Unknown tool: ${name}` });
}

// ── Agentic loop ──────────────────────────────────────────────────────────
async function runAgentLoop(
  messages: Array<{ role: string; content: string }>,
  system: string,
  tools: typeof TOOLS,
  ctx: { supabase: ReturnType<typeof createClient>; userId: string; agentId?: string },
  apiKey: string,
): Promise<{ content: string; toolsUsed: string[] }> {

  const history = [{ role: "system", content: system }, ...messages];
  const toolsUsed: string[] = [];

  for (let iteration = 0; iteration < 5; iteration++) {
    let resp: Response | null = null;

    // Try models in order until one works
    for (const model of TOOL_MODELS) {
      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://aikortex.com",
          "X-Title": "Aikortex",
        },
        body: JSON.stringify({
          model,
          messages: history,
          tools,
          tool_choice: "auto",
          max_tokens: 1024,
        }),
      });
      if (r.status !== 429 && r.status !== 503) { resp = r; break; }
    }

    if (!resp || !resp.ok) {
      // All models failed — fallback to gateway without tools
      const fb = await fetch(GATEWAY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, system, module: "agent", mode: "chat" }),
      });
      const fbData = await fb.json();
      return { content: fbData.content || "Desculpe, ocorreu um erro.", toolsUsed };
    }

    const data = await resp.json();
    const msg = data.choices?.[0]?.message;
    if (!msg) break;

    history.push(msg);

    // No tool calls → done
    if (!msg.tool_calls?.length) {
      return { content: msg.content || "", toolsUsed };
    }

    // Execute tools
    const results = await Promise.all(
      msg.tool_calls.map(async (tc: { id: string; function: { name: string; arguments: string } }) => {
        toolsUsed.push(tc.function.name);
        const args = JSON.parse(tc.function.arguments || "{}");
        const result = await executeTool(tc.function.name, args, ctx);
        return { role: "tool" as const, tool_call_id: tc.id, content: result };
      })
    );

    history.push(...results);
  }

  return { content: "Desculpe, não consegui completar a ação.", toolsUsed };
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

    const authHeader = req.headers.get("Authorization");
    const supabaseUrl  = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey  = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const orKey        = Deno.env.get("OPENROUTER_API_KEY") ?? "";

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: authHeader ? { Authorization: authHeader } : {} },
    });

    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id ?? "anonymous";

    // Build system prompt
    const agentName   = agentConfig?.name         || "Assistente";
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
- Seja natural e conversacional, nunca mencione ferramentas ou APIs
- Quando coletar nome + email ou telefone, use IMEDIATAMENTE save_lead
- Quando o lead quiser agendar, use check_calendar_availability
- Quando confirmarem horário, use book_meeting
- Após qualificar completamente (BANT), use qualify_lead
- Responda sempre em português do Brasil`;

    const enabledTools = (agentConfig?.tools_enabled as string[] | undefined) || ["save_lead", "check_calendar_availability", "book_meeting", "qualify_lead"];
    const activeTools  = TOOLS.filter(t => enabledTools.includes(t.function.name));

    let finalContent: string;
    let toolsUsed: string[] = [];

    if (orKey) {
      const result = await runAgentLoop(messages, system, activeTools, { supabase, userId, agentId }, orKey);
      finalContent = result.content;
      toolsUsed    = result.toolsUsed;
    } else {
      // No key — use gateway (no tools)
      const fb = await fetch(GATEWAY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, system, module: "agent", mode: "chat" }),
      });
      const fbData = await fb.json();
      finalContent = fbData.content || "";
    }

    // Persist conversation history (best-effort)
    if (userId !== "anonymous" && agentId) {
      supabase.from("conversations").upsert({
        user_id:    userId,
        agent_id:   agentId,
        contact_id: contactId,
        channel,
        messages:   [...messages, { role: "assistant", content: finalContent }],
      }, { onConflict: "agent_id,contact_id,channel" }).then(() => {});
    }

    // Return as SSE stream (compatible with use-agent-chat.ts)
    return new Response(streamText(finalContent), {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (e) {
    console.error("agent-runtime error:", e);
    const msg = e instanceof Error ? e.message : "Erro desconhecido";
    // Even on error, return as SSE so frontend can display it
    return new Response(streamText(`⚠️ ${msg}`), {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  }
});
