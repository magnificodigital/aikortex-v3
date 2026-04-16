const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const AI_GATEWAY_URL = 'https://kbknehyfksugykrovfxs.supabase.co/functions/v1/ai-gateway'

const systemPrompt = `Você é um assistente de criação de fluxos de automação para a plataforma Aikortex, usada por agências de marketing no Brasil. Ajude o usuário a criar fluxos de automação fazendo perguntas para entender o objetivo. Quando tiver informações suficientes, gere o fluxo como JSON dentro de um bloco de código assim:
\`\`\`json
{
  "nodes": [
    { "id": "1", "type": "trigger", "position": {"x": 100, "y": 100}, "data": {"label": "WhatsApp Recebido", "config": {}} },
    { "id": "2", "type": "condition", "position": {"x": 100, "y": 250}, "data": {"label": "Lead qualificado?", "config": {}} },
    { "id": "3", "type": "action", "position": {"x": 100, "y": 400}, "data": {"label": "Registrar no CRM", "config": {}} }
  ],
  "edges": [
    { "id": "e1-2", "source": "1", "target": "2" },
    { "id": "e2-3", "source": "2", "target": "3" }
  ]
}
\`\`\`
Sempre responda em português do Brasil. Seja conversacional e útil.`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { messages } = await req.json()

    const response = await fetch(AI_GATEWAY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        system: systemPrompt,
        module: 'flow',
        mode: 'chat',
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      return new Response(JSON.stringify({ error: errText }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const data = await response.json()

    // Wrap in OpenAI-compatible format for the frontend
    const result = {
      choices: [{ message: { content: data.content || '' } }],
      model: data.model || '',
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erro desconhecido'
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
