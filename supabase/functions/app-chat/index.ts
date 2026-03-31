import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/* ── Structuring prompt: AI generates structured JSON from user description ── */

function buildStructuringPrompt(appType: string, language: string) {
  return `Você é um arquiteto de produto especializado em apps para ${appType === "whatsapp" ? "WhatsApp" : "Web"}.

Sua ÚNICA tarefa é analisar a descrição do usuário e retornar um JSON estruturado que define completamente o app a ser construído.

REGRAS:
- Retorne APENAS um bloco JSON válido, sem texto antes ou depois
- Infira o máximo possível da descrição: nome, funcionalidades, tom, mensagem inicial
- Se algo não for mencionado, use valores padrão inteligentes
- O JSON deve seguir EXATAMENTE este formato:

\`\`\`json
{
  "app_type": "${appType}",
  "app_name": "Nome do App",
  "app_description": "Descrição completa e detalhada",
  "tone": "professional_friendly",
  "language": "${language}",
  "intro_message": "Mensagem de boas-vindas contextual",
  "max_turn_messages": 2,
  "onboarding_level": "soft",
  "selected_features": ["feature1", "feature2", "feature3"],
  "business_context": "Contexto de negócio inferido",
  "constraints": "Restrições identificadas ou padrão"
}
\`\`\`

Valores válidos para "tone": "professional_friendly", "formal", "casual", "empathetic", "direct"
Valores válidos para "onboarding_level": "none", "soft", "strict"
Valores válidos para "language": "pt-BR", "en", "es"

Retorne SOMENTE o JSON.`;
}

/* ── Runtime App State prompt ── */

function buildAppStatePrompt(ctx?: Record<string, string>) {
  const appType = ctx?.app_type || "web";
  const appName = ctx?.app_name || "Meu App";
  const appDesc = ctx?.app_description || "";
  const tone = ctx?.tone || "professional_friendly";
  const language = ctx?.language || "pt-BR";
  const introMessage = ctx?.intro_message || "";
  const maxMessages = ctx?.max_turn_messages || "2";
  const onboarding = ctx?.onboarding_level || "soft";
  const features = ctx?.selected_features || "";
  const bizContext = ctx?.business_context || "";
  const constraints = ctx?.constraints || "";
  const isPatch = ctx?.is_patch === "true";
  const currentState = ctx?.current_state || "";

  const isWhatsApp = appType === "whatsapp";

  return `Você é o motor de geração do Aikortex Studio. Sua função é gerar um estado de aplicação renderizável em formato JSON.

# CONTEXTO ATIVO
- Tipo: ${isWhatsApp ? "WhatsApp App" : "Web App"}
- Nome: ${appName}
- Descrição: ${appDesc}
- Tom de voz: ${tone}
- Idioma: ${language}
- Mensagem inicial: ${introMessage}
- Máx. msgs/turno: ${maxMessages}
- Onboarding: ${onboarding}
${features ? `- Funcionalidades: ${features}` : ""}
${bizContext ? `- Contexto: ${bizContext}` : ""}
${constraints ? `- Restrições: ${constraints}` : ""}

# REGRA PRINCIPAL
Retorne APENAS um JSON válido no formato app_state. NENHUM texto fora do JSON.
Não use markdown. Não explique. Não escreva "Aqui está". SOMENTE o JSON.

# FORMATO app_state OBRIGATÓRIO

{
  "app_state": {
    "app_meta": {
      "type": "${appType}",
      "name": "${appName}",
      "description": "",
      "tone": "${tone}",
      "language": "${language}",
      "status": "draft"
    },
    "preview": {
      "type": "${appType}",
      "title": "",
      "subtitle": "",
      "layout": {},
      "screen_data": {},
      "interactions": []
    },
    "agent_config": {
      "intro_message": "",
      "max_turn_messages": ${maxMessages},
      "onboarding_level": "${onboarding}",
      "personality_rules": [],
      "conversation_rules": [],
      "cta_primary": "",
      "quick_replies": []
    },
    "flows": [],
    "database": {
      "tables": []
    },
    "files": [],
    "ui_modules": [],
    "runtime": {
      "render_ready": true,
      "mocked": true,
      "warnings": [],
      "next_build_targets": []
    }
  },
  "chat_summary": ""
}

# REGRAS DOS CAMPOS

## app_meta
- description: descrição completa do app baseada no contexto

## preview
${isWhatsApp ? `### WhatsApp App preview.screen_data DEVE conter:
- "bot_name": nome do bot
- "bot_status": "online"
- "greeting": mensagem de boas-vindas conversacional e contextual
- "quick_replies": array de 2-4 botões de resposta rápida (texto limpo, sem underscores)
- "conversation_flow": array de objetos {trigger, response, suggestions} para simular conversa
- "stages": array de etapas do fluxo (ex: ["Saudação", "Coleta de dados", "Confirmação"])
` : `### Web App preview.screen_data DEVE conter:
- "nav_items": array de {label, icon} para sidebar
- "metrics": array de {label, value, change} para cards
- "active_page": nome da página ativa
- "page_title": título da seção
- "table_data": {name, columns: string[], sample_rows: number} quando relevante
- "chart_data": {title, type} quando relevante
`}

## agent_config
- Preencha com dados conversacionais reais e contextuais
- quick_replies: texto limpo, humanizado (sem underscores, sem snake_case)
- personality_rules: regras de personalidade do agente
- conversation_rules: regras de como o agente deve conduzir a conversa

## flows
- Pelo menos 1 fluxo principal para WhatsApp Apps
- Cada step deve ter: {id, type, action, description}

## database.tables
- Apenas tabelas relevantes ao produto
- Cada coluna: {name, type, required}
- Tipos válidos: UUID, TEXT, INTEGER, BOOLEAN, TIMESTAMP, JSONB, FLOAT

## files
- Arquivos reais que compõem o app
- Cada arquivo: {path, type, purpose, content_summary}
${isWhatsApp ? `- Estrutura: /src/agents/, /src/handlers/, /src/integrations/, /src/flows/, /src/templates/, /src/memory/, /src/config.ts` : `- Estrutura: /src/pages/, /src/components/, /src/layouts/, /src/lib/, /src/services/, /src/hooks/, /src/api/`}

## ui_modules
- Módulos de interface identificáveis
- Cada módulo: {id, name, type, description}

## runtime
- render_ready: true quando o preview pode renderizar
- mocked: true quando dados são simulados

## chat_summary
- Uma mensagem curta (2-3 frases) resumindo o que foi criado/atualizado
- Em português brasileiro
- Tom consultivo e premium
- Termine com pergunta ou sugestão de próximo passo
- NÃO inclua código, schemas ou blocos técnicos

${isPatch ? `
# MODO PATCH
Você NÃO deve reconstruir o app do zero.
Aplique APENAS as mudanças necessárias no estado atual.
Preserve a arquitetura existente.
${currentState ? `\nEstado atual do app:\n${currentState}` : ""}
` : `
# MODO CREATE
Crie a V1 mais sólida possível.
Priorize clareza, renderização e coerência.
Entregue um app com cara de produto real.
`}

RETORNE SOMENTE O JSON. NADA MAIS.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, appContext, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Mode: "structure" = generate structured JSON from description
    // Mode: "build" = generate full app_state JSON (non-streaming)
    // Mode: default = conversational patch (non-streaming JSON)
    const isStructureMode = mode === "structure";
    const isBuildMode = mode === "build" || (!isStructureMode && !mode);

    const systemPrompt = isStructureMode
      ? buildStructuringPrompt(appContext?.app_type || "web", appContext?.language || "pt-BR")
      : buildAppStatePrompt(appContext);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: false,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos em Configurações." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";

    if (isStructureMode) {
      return new Response(JSON.stringify({ structuredConfig: content }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build/patch mode: return app_state JSON
    return new Response(JSON.stringify({ appStateRaw: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
