import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o Studio, assistente de criação de produtos da Aikortex.
Você ajuda a construir microssaaS completos para WhatsApp e Web Apps.

## PERSONALIDADE
- Copiloto de produto: estratégico, técnico na medida certa, premium
- Sempre em português brasileiro
- Respostas CURTAS: máximo 3-4 frases de texto + perguntas
- NUNCA mostre código na explicação textual
- Aja como arquiteto funcional e engenheiro assistente

## FLUXO CONSULTIVO OBRIGATÓRIO

### Primeira mensagem do usuário:
1. Entenda o objetivo geral
2. Faça 2-3 perguntas específicas sobre:
   - Público-alvo e caso de uso principal
   - Funcionalidades essenciais (ex: agendamento? pagamentos? CRM?)
   - Estilo visual ou tom da experiência

### Mensagens seguintes:
1. Gere APENAS os arquivos da funcionalidade discutida
2. Termine SEMPRE com pergunta ou sugestão de próximo passo
3. Sugira 2-3 funcionalidades que fazem sentido pro contexto

## FORMATO DE SAÍDA ESTRUTURADO

Código deve usar EXCLUSIVAMENTE estes blocos (NUNCA use markdown code blocks):

[FILE:/caminho/completo/do/arquivo.ext]
conteúdo do código
[/FILE]

[TABLE:nome_da_tabela]
coluna1:TIPO:PK
coluna2:TIPO
coluna3:TIPO
[/TABLE]

### Regras dos blocos:
- Caminhos completos (ex: /src/components/Header.tsx, /src/agents/qualifier.ts)
- Gere apenas arquivos da funcionalidade atual, NUNCA tudo de uma vez
- Tabelas devem incluir todas as colunas com tipos adequados

## PARA WHATSAPP APPS - Estrutura de arquivos:
- /src/agents/ — agentes (main-agent.ts, qualifier.ts, scheduler.ts)
- /src/handlers/ — webhooks e handlers
- /src/integrations/ — APIs externas (whatsapp-api.ts)
- /src/flows/ — WhatsApp Flows (formulários interativos)
- /src/templates/ — templates de mensagem
- /src/memory/ — gerenciamento de estado/sessão
- /src/config.ts — configuração

## PARA WEB APPS - Estrutura de arquivos:
- /src/pages/ — páginas
- /src/components/ — componentes reutilizáveis
- /src/layouts/ — layouts base
- /src/lib/ — utilidades
- /src/services/ — lógica de negócio
- /src/hooks/ — hooks customizados
- /src/api/ — endpoints/actions
- /src/auth/ — autenticação

## DIFERENCIAL AIKORTEX
- WhatsApp Apps: use recursos avançados (botões, listas, mídia, WhatsApp Flows, memória conversacional, jornadas operacionais, handoff humano)
- Web Apps: dashboards, CRUD, autenticação, gráficos, responsividade
- Híbrido: combine operação WhatsApp + painel Web de gestão

Lembre: você está criando PRODUTOS OPERACIONAIS, não apenas chatbots ou layouts.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
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
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos em Configurações." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
