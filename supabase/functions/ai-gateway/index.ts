const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const OPENROUTER_KEY = () => Deno.env.get('OPENROUTER_API_KEY') ?? ''

// ── Model strategy per module ──────────────────────────────────────────────
const MODULE_MODELS: Record<string, string[]> = {
  // Conversational agents (SDR, SAC, Custom) — 8 fallbacks
  agent: [
    'meta-llama/llama-3.3-70b-instruct:free',
    'google/gemma-3-27b-it:free',
    'mistralai/mistral-7b-instruct:free',
    'microsoft/phi-4-reasoning-plus:free',
    'qwen/qwen3-8b:free',
    'google/gemma-4-31b-it:free',
    'deepseek/deepseek-r1-0528-qwen3-8b:free',
    'nvidia/nemotron-3-super-120b-a12b:free',
  ],
  // App Builder — code & JSON generation
  app: [
    'qwen/qwen3-coder:free',
    'openai/gpt-oss-120b:free',
    'microsoft/phi-4-reasoning-plus:free',
    'nousresearch/hermes-3-llama-3.1-405b:free',
    'qwen/qwen3-8b:free',
    'meta-llama/llama-3.3-70b-instruct:free',
  ],
  // Flow Copilot — reasoning + JSON
  flow: [
    'microsoft/phi-4-reasoning-plus:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'qwen/qwen3-8b:free',
    'nvidia/nemotron-3-super-120b-a12b:free',
    'google/gemma-3-27b-it:free',
    'mistralai/mistral-7b-instruct:free',
  ],
  // Multi-agent complex tasks
  multiagent: [
    'nvidia/nemotron-3-super-120b-a12b:free',
    'microsoft/phi-4-reasoning-plus:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'qwen/qwen3-8b:free',
    'nousresearch/hermes-3-llama-3.1-405b:free',
  ],
  // Structure/JSON extraction
  structure: [
    'microsoft/phi-4-reasoning-plus:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'qwen/qwen3-8b:free',
    'google/gemma-3-27b-it:free',
    'mistralai/mistral-7b-instruct:free',
    'deepseek/deepseek-r1-0528-qwen3-8b:free',
  ],
  // Default fallback
  default: [
    'meta-llama/llama-3.3-70b-instruct:free',
    'google/gemma-3-27b-it:free',
    'mistralai/mistral-7b-instruct:free',
    'qwen/qwen3-8b:free',
    'microsoft/phi-4-reasoning-plus:free',
    'google/gemma-4-31b-it:free',
    'deepseek/deepseek-r1-0528-qwen3-8b:free',
    'nvidia/nemotron-3-super-120b-a12b:free',
  ],
}

// BYOK providers via OpenRouter
const BYOK_MODELS: Record<string, Record<string, string>> = {
  openai: {
    fast: 'openai/gpt-4o-mini',
    smart: 'openai/gpt-4o',
  },
  gemini: {
    fast: 'google/gemini-2.0-flash-exp',
    smart: 'google/gemini-2.5-pro',
  },
  anthropic: {
    fast: 'anthropic/claude-3-5-haiku',
    smart: 'anthropic/claude-sonnet-4-5',
  },
  deepseek: {
    fast: 'deepseek/deepseek-chat',
    smart: 'deepseek/deepseek-r1',
  },
}

// ── Try models with automatic fallback ────────────────────────────────────
async function callWithFallback(
  messages: Array<{ role: string; content: string }>,
  models: string[],
  apiKey: string,
  options: { stream?: boolean; jsonMode?: boolean; maxTokens?: number }
): Promise<Response> {
  const body: Record<string, unknown> = {
    messages,
    stream: options.stream ?? false,
    max_tokens: options.maxTokens ?? 4096,
  }

  if (options.jsonMode && !options.stream) {
    body.response_format = { type: 'json_object' }
  }

  for (const model of models) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://aikortex.com',
        'X-Title': 'Aikortex',
      },
      body: JSON.stringify({ ...body, model }),
    })

    // Retry on rate limit, model not found, or service unavailable
    if (response.status === 429 || response.status === 400 || response.status === 404 || response.status === 503) {
      console.warn(`Model ${model} failed (${response.status}), trying next...`)
      continue
    }

    return response
  }

  // OpenRouter exhausted — try Groq as last resort (free, fast, reliable)
  const groqKey = Deno.env.get('GROQ_API_KEY') ?? ''
  if (groqKey) {
    const groqModels = ['llama-3.3-70b-versatile', 'llama3-70b-8192', 'gemma2-9b-it']
    for (const model of groqModels) {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...body, model, stream: false }),
      })
      if (r.ok) return r
    }
  }

  return new Response(JSON.stringify({ error: 'Serviço de IA temporariamente indisponível. Tente novamente em instantes.' }), {
    status: 429,
  })
}

// ── Main handler ──────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    const {
      messages,
      system,
      module = 'default',   // agent | app | flow | multiagent | default
      mode = 'chat',        // chat | structure | build | stream
      provider,             // byok: openai | gemini | anthropic | deepseek
      byok_key,             // user's own API key
      quality = 'fast',     // fast | smart (for byok)
      model_override,       // explicit model override
    } = body

    const orKey = OPENROUTER_KEY()
    if (!orKey) {
      return new Response(JSON.stringify({ error: 'Gateway não configurado.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Build messages with optional system prompt
    const finalMessages = system
      ? [{ role: 'system', content: system }, ...messages]
      : messages

    const isStream = mode === 'stream'
    const isJsonMode = mode === 'structure' || mode === 'build'

    // ── BYOK path ──
    if (byok_key && provider && BYOK_MODELS[provider]) {
      const model = model_override || BYOK_MODELS[provider][quality] || BYOK_MODELS[provider].fast

      const response = await callWithFallback(finalMessages, [model], byok_key, {
        stream: isStream,
        jsonMode: isJsonMode,
        maxTokens: isJsonMode ? 8192 : 4096,
      })

      return await buildResponse(response, isStream, corsHeaders)
    }

    // ── Free models path (with fallback) ──
    const models = model_override
      ? [model_override]
      : (MODULE_MODELS[module] ?? MODULE_MODELS.default)

    const response = await callWithFallback(finalMessages, models, orKey, {
      stream: isStream,
      jsonMode: isJsonMode,
      maxTokens: isJsonMode ? 8192 : 4096,
    })

    return await buildResponse(response, isStream, corsHeaders)

  } catch (e) {
    console.error('ai-gateway error:', e)
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Erro desconhecido' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

// ── Response builder ──────────────────────────────────────────────────────
async function buildResponse(
  response: Response,
  isStream: boolean,
  cors: Record<string, string>
): Promise<Response> {
  if (!response.ok) {
    let errMsg = 'Erro no serviço de IA'
    if (response.status === 402) errMsg = 'Créditos insuficientes. Verifique sua chave de API.'
    else if (response.status === 401) errMsg = 'Chave de API inválida.'
    else if (response.status === 429) errMsg = 'Limite atingido. Tente novamente em instantes.'

    const errText = await response.text().catch(() => '')
    console.error('AI error:', response.status, errText.slice(0, 200))

    return new Response(JSON.stringify({ error: errMsg }), {
      status: response.status,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  if (isStream) {
    return new Response(response.body, {
      headers: { ...cors, 'Content-Type': 'text/event-stream' },
    })
  }

  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content ?? ''
  const model = data?.model ?? ''

  return new Response(JSON.stringify({ content, model, usage: data.usage }), {
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}
