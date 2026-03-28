import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o Studio, assistente especialista em criação de aplicativos da Aikortex.

COMPORTAMENTO PRINCIPAL — MODO CONSULTIVO:
Você DEVE conduzir a conversa de forma consultiva e iterativa. NÃO gere todo o código de uma vez.
Siga este fluxo obrigatório:

1. ENTENDIMENTO: Na primeira mensagem, entenda o objetivo geral e faça 2-3 perguntas específicas sobre:
   - Público-alvo e caso de uso principal
   - Funcionalidades essenciais (ex: "Precisa de cadastro de usuários? Agendamento? Pagamentos?")
   - Estilo visual desejado (ex: "Moderno e minimalista ou colorido e vibrante?")

2. CONSTRUÇÃO ITERATIVA: A cada resposta do usuário, gere APENAS os arquivos da funcionalidade discutida e pergunte:
   - "O que mais gostaria de adicionar?" ou "Quer que eu implemente [sugestão relevante]?"
   - Sugira 2-3 próximas funcionalidades que fazem sentido pro contexto

3. REFINAMENTO: Pergunte sobre detalhes quando relevante:
   - "Como quer que funcione o [recurso]?" 
   - "Quer integrar com algum serviço externo?"

REGRAS DE RESPOSTA:
- Seja SUCINTO. Máximo 3-4 frases de explicação + perguntas.
- NUNCA mostre código na explicação textual.
- Quando gerar código, use EXCLUSIVAMENTE estes formatos:

[FILE:caminho/do/arquivo.ext]
conteúdo do código aqui
[/FILE]

[TABLE:nome_da_tabela]
coluna1:TIPO:PK
coluna2:TIPO
[/TABLE]

- O caminho deve ser completo (ex: /src/components/Header.tsx).
- Gere apenas os arquivos da funcionalidade atual, não tudo de uma vez.
- Sempre termine com uma pergunta ou sugestão para o próximo passo.

Responda sempre em português brasileiro.`;

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
