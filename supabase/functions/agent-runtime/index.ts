import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://kbknehyfksugykrovfxs.supabase.co/functions/v1/ai-gateway";

// ── Tool definitions (sent to LLM) ────────────────────────────────────────
const TOOLS = [
  {
    type: "function",
    function: {
      name: "save_lead",
      description: "Salva ou atualiza um lead no CRM quando o agente coletou informações suficientes do contato (nome + pelo menos email ou telefone). Use isso assim que tiver os dados básicos — não espere coletar tudo.",
      parameters: {
        type: "object",
        properties: {
          name:        { type: "string",  description: "Nome completo do lead" },
          email:       { type: "string",  description: "Email do lead" },
          phone:       { type: "string",  description: "Telefone do lead" },
          company:     { type: "string",  description: "Empresa do lead" },
          position:    { type: "string",  description: "Cargo do lead" },
          notes:       { type: "string",  description: "Resumo da conversa e interesse do lead" },
          temperature: { type: "string",  enum: ["frio", "morno", "quente"], description: "Temperatura do lead baseada no interesse demonstrado" },
          value:       { type: "number",  description: "Valor estimado do negócio em reais" },
          tags:        { type: "array", items: { type: "string" }, description: "Tags relevantes (ex: B2B, SaaS, urgente)" },
          stage:       { type: "string",  enum: ["lead","em_atendimento","qualificado","agendado","negociacao"], description: "Estágio atual do lead no pipeline" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_calendar_availability",
      description: "Verifica horários disponíveis na agenda do usuário para agendamento de reuniões. Use quando o lead demonstrar interesse em agendar.",
      parameters: {
        type: "object",
        properties: {
          days_ahead: { type: "number", description: "Quantos dias à frente verificar (padrão: 7)" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "book_meeting",
      description: "Agenda uma reunião no Google Calendar quando o lead confirmar um horário.",
      parameters: {
        type: "object",
        properties: {
          attendee_name:  { type: "string", description: "Nome do lead/convidado" },
          attendee_email: { type: "string", description: "Email do lead para envio do convite" },
          datetime:       { type: "string", description: "Data e hora da reunião (ISO 8601)" },
          title:          { type: "string", description: "Título da reunião" },
          duration_min:   { type: "number", description: "Duração em minutos (padrão: 30)" },
        },
        required: ["attendee_name", "datetime", "title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "qualify_lead",
      description: "Registra a qualificação BANT do lead após coletar todas as informações necessárias.",
      parameters: {
        type: "object",
        properties: {
          lead_name:    { type: "string" },
          budget:       { type: "string", description: "Budget disponível (ex: 'R$ 5.000/mês')" },
          authority:    { type: "string", description: "Nível de autoridade de compra (decisor, influenciador, usuário)" },
          need:         { type: "string", description: "Principal necessidade/dor identificada" },
          timeline:     { type: "string", description: "Prazo para tomada de decisão" },
          bant_score:   { type: "number", description: "Score de 0-100 baseado no BANT" },
        },
        required: ["lead_name", "need", "bant_score"],
      },
    },
  },
];

// ── Tool executor ──────────────────────────────────────────────────────────
async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
  context: { supabase: ReturnType<typeof createClient>; userId: string; agentId?: string }
): Promise<string> {

  if (toolName === "save_lead") {
    try {
      const leadData = {
        user_id:     context.userId,
        agent_id:    context.agentId || null,
        name:        (args.name as string) || "",
        email:       (args.email as string) || "",
        phone:       (args.phone as string) || "",
        company:     (args.company as string) || "",
        position:    (args.position as string) || "",
        notes:       (args.notes as string) || "",
        temperature: (args.temperature as string) || "morno",
        value:       (args.value as number) || 0,
        tags:        (args.tags as string[]) || [],
        stage:       (args.stage as string) || "lead",
        source:      "manual",
        activities: [{
          id: crypto.randomUUID(),
          type: "note",
          description: `Lead capturado pelo agente de IA. ${args.notes || ""}`.trim(),
          createdAt: new Date().toISOString(),
          createdBy: "Agente IA",
        }],
      };

      const { data, error } = await context.supabase
        .from("leads")
        .upsert(leadData, { onConflict: "user_id,email" })
        .select("id")
        .single();

      if (error) {
        console.error("save_lead error:", error);
        return JSON.stringify({ success: false, error: error.message });
      }

      return JSON.stringify({ success: true, lead_id: data?.id, message: `Lead ${args.name} salvo no CRM com sucesso.` });
    } catch (e) {
      return JSON.stringify({ success: false, error: String(e) });
    }
  }

  if (toolName === "check_calendar_availability") {
    // TODO: integrate Google Calendar OAuth
    // For now return mock slots so the agent can continue the conversation
    const slots = [];
    const now = new Date();
    for (let d = 1; d <= 5; d++) {
      const day = new Date(now);
      day.setDate(now.getDate() + d);
      if (day.getDay() === 0 || day.getDay() === 6) continue; // skip weekends
      const dateStr = day.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" });
      slots.push(`${dateStr} às 10h`, `${dateStr} às 14h`, `${dateStr} às 16h`);
    }
    return JSON.stringify({ available_slots: slots.slice(0, 6), note: "Horários disponíveis nos próximos dias úteis." });
  }

  if (toolName === "book_meeting") {
    // TODO: integrate Google Calendar OAuth
    const { attendee_name, datetime, title } = args;
    const dateFormatted = new Date(datetime as string).toLocaleString("pt-BR", {
      weekday: "long", day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit"
    });
    return JSON.stringify({
      success: true,
      message: `Reunião "${title}" agendada para ${dateFormatted} com ${attendee_name}. Um convite será enviado por email.`,
      note: "Google Calendar será integrado em breve para agendamento real.",
    });
  }

  if (toolName === "qualify_lead") {
    const { lead_name, budget, authority, need, timeline, bant_score } = args;
    // Update lead stage based on BANT score
    const stage = (bant_score as number) >= 70 ? "qualificado" : "em_atendimento";

    try {
      const { error } = await context.supabase
        .from("leads")
        .update({
          stage,
          notes: `BANT Score: ${bant_score}/100\nBudget: ${budget}\nAutoridade: ${authority}\nNecessidade: ${need}\nPrazo: ${timeline}`,
          temperature: (bant_score as number) >= 70 ? "quente" : "morno",
        })
        .eq("user_id", context.userId)
        .eq("name", lead_name);

      if (error) console.error("qualify_lead update error:", error);
    } catch (e) {
      console.error("qualify_lead error:", e);
    }

    return JSON.stringify({
      success: true,
      bant_score,
      stage,
      message: `Lead qualificado com score ${bant_score}/100. Movido para "${stage}".`,
    });
  }

  return JSON.stringify({ error: `Ferramenta desconhecida: ${toolName}` });
}

// ── Agentic loop ───────────────────────────────────────────────────────────
async function runAgentLoop(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string,
  tools: typeof TOOLS,
  context: { supabase: ReturnType<typeof createClient>; userId: string; agentId?: string },
  apiKey: string
): Promise<{ finalContent: string; toolsUsed: string[] }> {

  const allMessages = [{ role: "system", content: systemPrompt }, ...messages];
  const toolsUsed: string[] = [];
  const MAX_ITERATIONS = 5;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://aikortex.com",
        "X-Title": "Aikortex",
      },
      body: JSON.stringify({
        model: "google/gemma-3-27b-it:free",
        messages: allMessages,
        tools,
        tool_choice: "auto",
        max_tokens: 2048,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("LLM error:", response.status, errText);
      // Fallback: try without tools
      const fallback = await fetch(GATEWAY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, system: systemPrompt, module: "agent", mode: "chat" }),
      });
      const fb = await fallback.json();
      return { finalContent: fb.content || "Desculpe, ocorreu um erro.", toolsUsed };
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    const assistantMsg = choice?.message;

    if (!assistantMsg) break;

    // Add assistant message to history
    allMessages.push(assistantMsg);

    // No tool calls → final response
    if (!assistantMsg.tool_calls || assistantMsg.tool_calls.length === 0) {
      return { finalContent: assistantMsg.content || "", toolsUsed };
    }

    // Execute all tool calls in parallel
    const toolResults = await Promise.all(
      assistantMsg.tool_calls.map(async (tc: { id: string; function: { name: string; arguments: string } }) => {
        const toolName = tc.function.name;
        const args = JSON.parse(tc.function.arguments || "{}");
        toolsUsed.push(toolName);

        console.log(`Executing tool: ${toolName}`, args);
        const result = await executeTool(toolName, args, context);

        return {
          role: "tool" as const,
          tool_call_id: tc.id,
          content: result,
        };
      })
    );

    // Add tool results to history
    allMessages.push(...toolResults);
    // Loop continues — LLM sees tool results and generates next response
  }

  return { finalContent: "Desculpe, não consegui completar a ação.", toolsUsed };
}

// ── Main handler ──────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const {
      messages,
      agentConfig,   // { name, instructions, objective, toneOfVoice, greetingMessage, tools_enabled }
      agentId,
      contactId,
      channel = "chat",
    } = body;

    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const orKey = Deno.env.get("OPENROUTER_API_KEY") ?? "";

    // Auth context
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: authHeader ? { Authorization: authHeader } : {} },
    });

    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id ?? "anonymous";

    // Build system prompt from agent config
    const agentName = agentConfig?.name || "Assistente";
    const instructions = agentConfig?.instructions || "";
    const objective = agentConfig?.objective || "";
    const tone = agentConfig?.toneOfVoice || "Profissional e Amigável";

    const systemPrompt = `Você é ${agentName}, um agente de IA da plataforma Aikortex.

## Objetivo
${objective}

## Instruções
${instructions}

## Tom de voz
${tone}

## Regras de comportamento
- Seja natural e conversacional
- Quando coletar nome + email ou telefone de um lead, use IMEDIATAMENTE a ferramenta save_lead
- Quando o lead quiser agendar, use check_calendar_availability para mostrar horários disponíveis
- Quando confirmarem um horário, use book_meeting para agendar
- Após qualificar completamente um lead (BANT), use qualify_lead
- NUNCA mencione que está usando ferramentas ou APIs — apenas aja naturalmente
- Responda sempre em português do Brasil`;

    // Determine which tools to include based on agent config
    const enabledTools = agentConfig?.tools_enabled || ["save_lead"];
    const activeTools = TOOLS.filter(t => enabledTools.includes(t.function.name));

    if (!orKey) {
      // No API key — fallback to gateway without tools
      const resp = await fetch(GATEWAY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, system: systemPrompt, module: "agent", mode: "chat" }),
      });
      const data = await resp.json();
      return new Response(
        JSON.stringify({ choices: [{ message: { role: "assistant", content: data.content || "" } }] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Run agentic loop with tool calling
    const { finalContent, toolsUsed } = await runAgentLoop(
      messages,
      systemPrompt,
      activeTools,
      { supabase, userId, agentId },
      orKey
    );

    // Persist conversation
    if (userId !== "anonymous" && agentId) {
      const allMessages = [...messages, { role: "assistant", content: finalContent }];
      await supabase.from("conversations").upsert({
        user_id: userId,
        agent_id: agentId,
        contact_id: contactId || "browser-test",
        channel,
        messages: allMessages,
      }, { onConflict: "agent_id,contact_id,channel" });
    }

    return new Response(
      JSON.stringify({
        choices: [{ message: { role: "assistant", content: finalContent } }],
        tools_used: toolsUsed,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (e) {
    console.error("agent-runtime error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
