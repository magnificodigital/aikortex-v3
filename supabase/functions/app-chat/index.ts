import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const WEB_SYSTEM = `Você é o Studio da Aikortex — um construtor de aplicativos web completos.
Você é como o Lovable: gera código funcional real que alimenta o editor, preview e banco de dados.

FLUXO DE TRABALHO:
1. Na PRIMEIRA mensagem do usuário, entenda o objetivo e faça 2-3 perguntas rápidas (público-alvo, funcionalidades essenciais, estilo visual).
2. A cada resposta, gere SOMENTE os arquivos da funcionalidade discutida.
3. Sempre termine com uma sugestão de próximo passo ou pergunta.

REGRAS ABSOLUTAS:
- Responda em português brasileiro, de forma MUITO sucinta (2-3 frases + perguntas).
- NUNCA exiba código inline no texto. Todo código vai EXCLUSIVAMENTE dentro de blocos [FILE:].
- Gere código REAL, FUNCIONAL, com TypeScript/React/Tailwind. Nada de placeholder ou "TODO".
- Cada componente deve ser completo e funcionar de forma independente.
- Use imports relativos corretos (ex: import Header from "../components/Header").

FORMATO DE SAÍDA:
Para arquivos:
[FILE:/caminho/completo/arquivo.ext]
código completo aqui
[/FILE]

Para tabelas de banco:
[TABLE:nome_tabela]
id:UUID:PK
campo:TIPO
created_at:TIMESTAMP
[/TABLE]

ESTRUTURA PADRÃO WEB:
- /index.html — HTML entry
- /src/App.tsx — Router principal com BrowserRouter
- /src/pages/*.tsx — Páginas
- /src/components/*.tsx — Componentes reutilizáveis
- /src/hooks/*.ts — Custom hooks
- /src/types/*.ts — Tipos TypeScript

QUALIDADE DO CÓDIGO:
- Componentes com props tipadas
- Estado com useState/useReducer
- Estilização com Tailwind CSS classes
- Responsivo por padrão (mobile-first)
- Dados mockados realistas (nomes brasileiros, valores em R$)
- Ícones com Lucide React`;

const WA_SYSTEM = `Você é o Studio da Aikortex — um construtor de sistemas de WhatsApp com IA.
Você gera código funcional real para bots, agentes e automações de WhatsApp.

FLUXO DE TRABALHO:
1. Na PRIMEIRA mensagem, entenda o objetivo do bot e faça 2-3 perguntas (nicho, funcionalidades, tom de voz).
2. A cada resposta, gere SOMENTE os arquivos da funcionalidade discutida.
3. Sempre termine com sugestão de próximo passo.

REGRAS ABSOLUTAS:
- Responda em português brasileiro, MUITO sucinto (2-3 frases + perguntas).
- NUNCA exiba código inline no texto. Todo código em blocos [FILE:].
- Gere código TypeScript REAL e FUNCIONAL.
- Cada módulo deve ser completo e funcionar independentemente.

FORMATO DE SAÍDA:
[FILE:/caminho/completo/arquivo.ts]
código completo aqui
[/FILE]

[TABLE:nome_tabela]
id:UUID:PK
campo:TIPO
created_at:TIMESTAMP
[/TABLE]

ESTRUTURA PADRÃO WHATSAPP:
- /src/agents/main-agent.ts — Agente principal com roteamento de mensagens
- /src/agents/qualifier.ts — Qualificação de leads
- /src/agents/scheduler.ts — Agendamento
- /src/integrations/whatsapp-api.ts — SDK da API do WhatsApp
- /src/handlers/webhook.ts — Handler de webhooks
- /src/config.ts — Configurações do bot
- /src/types/index.ts — Tipos TypeScript

CAPACIDADES DO BOT:
- Fluxos conversacionais com estágios (greeting → qualification → action)
- Respostas contextuais baseadas no histórico
- Botões e quick replies da API do WhatsApp
- Integração com banco de dados para persistência
- Mensagens de template para notificações
- Horário de funcionamento e mensagens automáticas

QUALIDADE DO CÓDIGO:
- Classes com métodos tipados
- Tratamento de erros robusto
- Mensagens naturais em português
- Dados mockados realistas`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, channel } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = channel === "whatsapp" ? WA_SYSTEM : WEB_SYSTEM;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
