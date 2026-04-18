import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FREE_MODELS = [
  "qwen/qwen3-30b-a3b:free",
  "google/gemma-3-27b-it:free",
  "google/gemma-3-12b-it:free",
  "deepseek/deepseek-chat-v3-0324:free",
  "deepseek/deepseek-r1:free",
  "qwen/qwen3-14b:free",
];

// Free models via OpenRouter (system key)
async function callOpenRouter(
  messages: Array<{ role: string; content: string }>,
  system: string,
): Promise<string> {
  const apiKey = Deno.env.get("OPENROUTER_API_KEY") ?? "";
  if (!apiKey) return "";
  const fullMessages = system ? [{ role: "system", content: system }, ...messages] : messages;
  for (const model of FREE_MODELS) {
    try {
      const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://aikortex.com",
          "X-Title": "Aikortex",
        },
        body: JSON.stringify({ model, messages: fullMessages, stream: false, max_tokens: 4096 }),
      });
      if ([400, 404, 429, 500, 502, 503].includes(resp.status)) continue;
      if (!resp.ok) continue;
      const data = await resp.json();
      const content = data?.choices?.[0]?.message?.content || "";
      if (content) return content;
    } catch { continue; }
  }
  return "";
}

// BYOK: call provider API directly with user's own key
async function callByok(
  messages: Array<{ role: string; content: string }>,
  system: string,
  provider: string,
  model: string,
  apiKey: string,
): Promise<string> {
  const fullMessages = system ? [{ role: "system", content: system }, ...messages] : messages;
  try {
    let url = "";
    let headers: Record<string, string> = { "Content-Type": "application/json" };
    let body: Record<string, unknown> = { model, messages: fullMessages, max_tokens: 4096 };

    if (provider === "anthropic") {
      url = "https://api.anthropic.com/v1/messages";
      headers = { ...headers, "x-api-key": apiKey, "anthropic-version": "2023-06-01" };
      body = {
        model,
        max_tokens: 4096,
        system,
        messages: messages.filter(m => m.role !== "system"),
      };
      const resp = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
      if (!resp.ok) return "";
      const data = await resp.json();
      return data?.content?.[0]?.text || "";
    }

    if (provider === "openai") {
      url = "https://api.openai.com/v1/chat/completions";
      headers = { ...headers, "Authorization": `Bearer ${apiKey}` };
    }

    if (provider === "gemini") {
      url = `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`;
      headers = { ...headers, "Authorization": `Bearer ${apiKey}` };
    }

    if (!url) return "";
    const resp = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
    if (!resp.ok) return "";
    const data = await resp.json();
    return data?.choices?.[0]?.message?.content || "";
  } catch { return ""; }
}

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

// ── Wizard setup prompt builder ───────────────────────────────────────────
function buildWizardPrompt(agentType: string): string {
  const typeLabel: Record<string, string> = {
    sdr: "SDR (Sales Development Representative)",
    sac: "SAC / Atendimento ao Cliente",
    custom: "Personalizado",
    support: "Suporte Técnico",
    marketing: "Marketing / Conteúdo",
  };

  const label = typeLabel[agentType?.toLowerCase()] || agentType || "IA";

  const questions: Record<string, string[]> = {
    sdr: [
      "o nome do agente",
      "a empresa ou negócio que ele vai representar",
      "os produtos ou serviços que ele deve conhecer e apresentar",
      "quem é o cliente ideal (perfil ICP: segmento, porte, cargo do decisor)",
      "o tom de comunicação (ex: formal, consultivo, descontraído)",
      "alguma regra ou restrição importante (o que ele NUNCA deve dizer ou fazer)",
    ],
    sac: [
      "o nome do agente",
      "a empresa ou negócio que ele vai representar",
      "os principais produtos ou serviços sobre os quais vai dar suporte",
      "os tipos de dúvidas ou problemas mais comuns que ele vai resolver",
      "o tom de comunicação (ex: empático, direto, técnico)",
      "alguma regra importante (ex: nunca prometer prazos sem confirmar)",
    ],
  };

  const qs = questions[agentType?.toLowerCase()] || [
    "o nome do agente",
    "a empresa ou negócio que ele vai representar",
    "o objetivo principal do agente",
    "o público-alvo que ele vai atender",
    "o tom de comunicação desejado",
    "alguma regra ou restrição importante",
  ];

  return `Você é um assistente de configuração da plataforma Aikortex. Sua missão é ajudar o usuário a configurar um agente de ${label} fazendo perguntas simples e objetivas.

## Regras do wizard
- Faça UMA pergunta por vez, na ordem abaixo
- Seja amigável e dê exemplos quando útil
- Após receber todas as respostas, gere o JSON de configuração
- Nunca pule perguntas — todas são necessárias

## Perguntas (em ordem)
${qs.map((q, i) => `${i + 1}. Pergunte sobre ${q}`).join("\n")}

## Início
Apresente-se brevemente e faça a primeira pergunta.

## Ao finalizar todas as perguntas
Gere um resumo amigável do agente configurado e então exiba o bloco JSON abaixo com a configuração completa:

\`\`\`agent-config
{
  "name": "...",
  "role": "${agentType || "custom"}",
  "companyName": "...",
  "objective": "...",
  "instructions": "...",
  "toneOfVoice": "...",
  "description": "..."
}
\`\`\`

O campo "instructions" deve ser DETALHADO — inclua: contexto do negócio, fluxo de conversa, regras, restrições e comportamentos específicos do agente. Mínimo 5 parágrafos.

Responda SEMPRE em português do Brasil.`;
}

// ── System prompt builder ─────────────────────────────────────────────────
function buildSystemPrompt(agentConfig: Record<string, any>): string {
  const name        = agentConfig?.name         || "Assistente";
  const role        = (agentConfig?.role        || "").toLowerCase();
  const objective   = agentConfig?.objective    || "";
  const instructions = agentConfig?.instructions || "";
  const tone        = agentConfig?.toneOfVoice  || "Profissional e Amigável";
  const company     = agentConfig?.companyName  || "";

  const isSdr = role.includes("sdr") || role.includes("vendas") || role.includes("sales") ||
                objective.toLowerCase().includes("qualific") ||
                objective.toLowerCase().includes("lead") ||
                instructions.toLowerCase().includes("bant");

  if (isSdr) {
    return `Você é ${name}, agente de SDR (Sales Development Representative)${company ? ` da ${company}` : ""}.

## Seu objetivo
${objective || "Qualificar leads, coletar dados de contato e agendar reuniões com leads qualificados."}

## Método de qualificação: BANT
Conduza a conversa de forma natural para descobrir:
- **Budget (Orçamento):** O lead tem budget disponível? Qual o porte da empresa?
- **Authority (Autoridade):** É o tomador de decisão? Quem mais está envolvido?
- **Need (Necessidade):** Qual problema quer resolver? Qual a dor principal?
- **Timeline (Prazo):** Quando pretende implementar? Há urgência?

## Fluxo da conversa
1. Apresente-se brevemente e pergunte o nome do lead
2. Entenda o contexto e a dor principal (Need)
3. Explore o porte/budget de forma natural ("qual o tamanho da sua equipe?")
4. Confirme se é o decisor ou se há outros envolvidos (Authority)
5. Entenda o prazo e urgência (Timeline)
6. Se qualificado (pelo menos 3 de 4 critérios BANT), proponha uma reunião
7. Colete email/WhatsApp para confirmar o agendamento

## Instruções específicas
${instructions}

## Tom de voz
${tone}

## Regras obrigatórias
- Seja natural e conversacional — NUNCA pareça um formulário
- Faça UMA pergunta por vez, nunca várias ao mesmo tempo
- Ouça ativamente e faça perguntas de aprofundamento
- Quando o lead demonstrar interesse em agendar, peça email e telefone
- Registre mentalmente os dados BANT ao longo da conversa
- Responda SEMPRE em português do Brasil
- Nunca invente horários de agenda — apenas manifeste interesse em agendar e colete os dados`;
  }

  // Generic / SAC / Custom prompt
  return `Você é ${name}${company ? `, agente de IA da ${company}` : ", um agente de IA"}.

## Objetivo
${objective}

## Instruções
${instructions}

## Tom de voz
${tone}

## Regras
- Seja natural e conversacional
- Colete nome, email ou telefone e empresa do lead durante a conversa quando pertinente
- Responda sempre em português do Brasil`;
}

// ── Lead extractor — runs after every response ────────────────────────────
async function extractAndSaveLead(
  messages: Array<{ role: string; content: string }>,
  agentResponse: string,
  agentConfig: Record<string, any>,
  ctx: { supabase: ReturnType<typeof createClient>; userId: string; agentId?: string }
): Promise<void> {
  try {
    const role = (agentConfig?.role || "").toLowerCase();
    const isSdr = role.includes("sdr") || role.includes("vendas") || role.includes("sales");

    const fullConvo = messages
      .map(m => `${m.role === "user" ? "Lead" : "Agente"}: ${m.content}`)
      .join("\n");

    const extractPrompt = isSdr
      ? `Analise esta conversa de SDR e extraia todos os dados disponíveis do lead.

CONVERSA COMPLETA:
${fullConvo}
ÚLTIMA RESPOSTA DO AGENTE: ${agentResponse.slice(0, 300)}

Retorne APENAS JSON válido com esta estrutura:
{
  "found": true,
  "name": "nome completo ou vazio",
  "email": "email ou vazio",
  "phone": "telefone/whatsapp ou vazio",
  "company": "empresa ou vazio",
  "notes": "resumo da conversa em 1-2 frases",
  "temperature": "frio|morno|quente",
  "bant_budget": "o que foi dito sobre orçamento/porte ou vazio",
  "bant_authority": "é decisor? quem mais decide? ou vazio",
  "bant_need": "qual a dor/necessidade principal ou vazio",
  "bant_timeline": "prazo/urgência mencionado ou vazio",
  "wants_meeting": true,
  "bant_score": 0
}

Regras:
- "temperature": "quente" se 3+ critérios BANT respondidos e quer agendar, "morno" se 1-2 critérios, "frio" se nenhum
- "bant_score": conte quantos dos 4 critérios BANT foram respondidos (0-4)
- "wants_meeting": true se o lead demonstrou interesse em agendar
- Se não há nome nem contato, retorne: {"found": false}
RETORNE SOMENTE O JSON.`
      : `Analise esta conversa e extraia dados do lead se houver NOME + (EMAIL ou TELEFONE).
Conversa: "${messages.filter(m => m.role === "user").map(m => m.content).join(" | ")}"
Última resposta: "${agentResponse.slice(0, 200)}"

Retorne APENAS JSON:
{"found": true/false, "name": "", "email": "", "phone": "", "company": "", "notes": "", "temperature": "frio|morno|quente"}
RETORNE SOMENTE O JSON.`;

    const rawContent = await callOpenRouter(
      [{ role: "user", content: extractPrompt }],
      "Você é um extrator de dados estruturados. Retorne SEMPRE JSON válido, sem texto extra."
    );
    if (!rawContent) return;

    const raw = rawContent
      .replace(/^```json\s*/gm, "").replace(/^```\s*/gm, "").replace(/```\s*$/gm, "").trim();

    let extracted: Record<string, unknown>;
    try { extracted = JSON.parse(raw); } catch { return; }

    if (!extracted.found || !extracted.name) return;

    const bantNotes = [
      extracted.bant_need     ? `Necessidade: ${extracted.bant_need}` : "",
      extracted.bant_budget   ? `Budget: ${extracted.bant_budget}` : "",
      extracted.bant_authority ? `Autoridade: ${extracted.bant_authority}` : "",
      extracted.bant_timeline  ? `Prazo: ${extracted.bant_timeline}` : "",
    ].filter(Boolean).join(" | ");

    const leadData = {
      user_id:     ctx.userId,
      agent_id:    ctx.agentId || null,
      name:        String(extracted.name    || ""),
      email:       String(extracted.email   || ""),
      phone:       String(extracted.phone   || ""),
      company:     String(extracted.company || ""),
      notes:       bantNotes || String(extracted.notes || ""),
      temperature: ["frio","morno","quente"].includes(String(extracted.temperature))
                     ? String(extracted.temperature) : "morno",
      stage:       extracted.wants_meeting ? "opportunity" : "lead",
      source:      "agent",
      value:       0,
      tags:        extracted.wants_meeting ? ["quer-agendar"] : [],
      activities: [{
        id: crypto.randomUUID(),
        type: "note",
        description: `Lead qualificado pelo agente SDR. Score BANT: ${extracted.bant_score ?? 0}/4.${extracted.wants_meeting ? " Lead quer agendar reunião." : ""}`,
        createdAt: new Date().toISOString(),
        createdBy: agentConfig?.name || "Agente IA",
      }],
    };

    const leadsTable = ctx.supabase.from("leads") as any;
    if (leadData.email) {
      await leadsTable.upsert(leadData, { onConflict: "user_id,email" });
    } else {
      const { data: existing } = await leadsTable
        .select("id").eq("user_id", ctx.userId).ilike("name", leadData.name).maybeSingle();
      if (!existing) {
        await leadsTable.insert(leadData);
      } else {
        // Update existing lead with latest qualification data
        await leadsTable
          .update({
            notes: leadData.notes,
            temperature: leadData.temperature,
            stage: leadData.stage,
            tags: leadData.tags,
          })
          .eq("id", existing.id);
      }
    }

    console.log(`Lead saved: ${leadData.name} | BANT: ${extracted.bant_score ?? 0}/4 | ${leadData.temperature}`);
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
      agentConfig = {},
      agentId,
      contactId = "browser-test",
      channel = "chat",
    } = body;

    const supabaseUrl    = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase       = createClient(supabaseUrl, serviceRoleKey);

    const userId  = body.userId || "anonymous";
    const mode    = body.mode || "chat"; // "chat" | "wizard-setup"
    const system  = mode === "wizard-setup"
      ? buildWizardPrompt(body.agentType || agentConfig?.role || "custom")
      : buildSystemPrompt(agentConfig);
    const byokKey = body.byok_key || "";
    const byokProvider = body.provider || "";

    let finalContent = "";

    if (byokKey && byokProvider) {
      finalContent = await callByok(messages, system, byokProvider, body.model as string || "", byokKey);
    }

    if (!finalContent) {
      finalContent = await callOpenRouter(messages, system);
    }

    if (!finalContent) {
      finalContent = "Desculpe, o serviço de IA está temporariamente indisponível. Tente novamente em instantes.";
    }

    if (userId !== "anonymous" && mode !== "wizard-setup") {
      const ctx = { supabase: supabase as any, userId, agentId };
      Promise.all([
        extractAndSaveLead(messages, finalContent, agentConfig, ctx),
        agentId ? supabase.from("conversations").upsert({
          user_id:    userId,
          agent_id:   agentId,
          contact_id: contactId,
          channel,
          messages:   [...messages, { role: "assistant", content: finalContent }],
        }, { onConflict: "agent_id,contact_id,channel" }) : Promise.resolve(),
      ]).catch(e => console.error("background tasks error:", e));
    }

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
