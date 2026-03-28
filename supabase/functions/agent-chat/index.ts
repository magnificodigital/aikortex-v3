import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Map short UI model names to full gateway/API model names
// OpenAI native model IDs: https://developers.openai.com/api/docs/models
const MODEL_MAP: Record<string, { gateway: string; openai?: string; anthropic?: string }> = {
  // Gemini models
  "gemini-3.1-pro-preview": { gateway: "google/gemini-3.1-pro-preview" },
  "gemini-3-flash-preview": { gateway: "google/gemini-3-flash-preview" },
  "gemini-2.5-pro": { gateway: "google/gemini-2.5-pro" },
  "gemini-2.5-flash": { gateway: "google/gemini-2.5-flash" },
  "gemini-2.5-flash-lite": { gateway: "google/gemini-2.5-flash-lite" },
  // OpenAI models — gateway names map to real OpenAI API model IDs
  "gpt-5.2": { gateway: "openai/gpt-5.2", openai: "gpt-4o" },
  "gpt-5": { gateway: "openai/gpt-5", openai: "gpt-4o" },
  "gpt-5-mini": { gateway: "openai/gpt-5-mini", openai: "gpt-4o-mini" },
  "gpt-5-nano": { gateway: "openai/gpt-5-nano", openai: "gpt-4o-mini" },
  "gpt-4o": { gateway: "openai/gpt-5", openai: "gpt-4o" },
  "gpt-4o-mini": { gateway: "openai/gpt-5-mini", openai: "gpt-4o-mini" },
  "gpt-4-turbo": { gateway: "openai/gpt-5", openai: "gpt-4-turbo" },
  "gpt-4": { gateway: "openai/gpt-5", openai: "gpt-4" },
  "gpt-3.5-turbo": { gateway: "openai/gpt-5-mini", openai: "gpt-3.5-turbo" },
  // Anthropic models
  "claude-4-sonnet": { gateway: "openai/gpt-5", anthropic: "claude-sonnet-4-20250514" },
  "claude-3.5-sonnet": { gateway: "openai/gpt-5", anthropic: "claude-3-5-sonnet-20241022" },
  "claude-3-opus": { gateway: "openai/gpt-5", anthropic: "claude-3-opus-20240229" },
  "claude-3-haiku": { gateway: "openai/gpt-5-mini", anthropic: "claude-3-haiku-20240307" },
};

const FREE_GATEWAY_MODELS = [
  "google/gemma-3-12b-it:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "mistralai/mistral-small-3.1-24b-instruct:free",
  "openai/gpt-oss-20b:free",
] as const;

const DEFAULT_FREE_GATEWAY_MODEL = FREE_GATEWAY_MODELS[0];

const PROVIDER_PREFIX_RULES: Record<string, string[]> = {
  openai: ["gpt-", "openai/"],
  anthropic: ["claude-", "anthropic/"],
  gemini: ["gemini-", "google/"],
  openrouter: ["/"],
};

function modelBelongsToProvider(provider: string, model?: string | null) {
  if (!model) return true;
  const prefixes = PROVIDER_PREFIX_RULES[provider];
  if (!prefixes) return true;
  if (provider === "openrouter") return model.includes("/");
  return prefixes.some((prefix) => model.startsWith(prefix));
}

function normalizeGatewayModel(model?: string | null) {
  if (!model) return DEFAULT_FREE_GATEWAY_MODEL;
  return FREE_GATEWAY_MODELS.includes(model as typeof DEFAULT_FREE_GATEWAY_MODEL)
    ? model
    : DEFAULT_FREE_GATEWAY_MODEL;
}

function validateOpenRouterApiKey(apiKey?: string | null) {
  const normalized = typeof apiKey === "string" ? apiKey.trim() : "";
  if (!normalized) {
    return { valid: false, normalized: "", error: "OpenRouter API key is required." };
  }

  if (!normalized.startsWith("sk-or-")) {
    return {
      valid: false,
      normalized,
      error: "Invalid OpenRouter API key format. Keys should start with 'sk-or-'.",
    };
  }

  return { valid: true, normalized };
}

function collectOpenRouterKeys(...keys: Array<string | null | undefined>) {
  const uniqueKeys: string[] = [];

  for (const key of keys) {
    const validation = validateOpenRouterApiKey(key);
    if (!validation.valid) continue;
    if (!uniqueKeys.includes(validation.normalized)) {
      uniqueKeys.push(validation.normalized);
    }
  }

  return uniqueKeys;
}

function buildAgentSystemPrompt(agentContext?: Record<string, unknown>) {
  if (!agentContext || typeof agentContext !== "object") return null;
  const name = typeof agentContext.name === "string" ? agentContext.name : "Agente";
  const description = typeof agentContext.description === "string" ? agentContext.description : "";
  const role = typeof agentContext.role === "string" ? agentContext.role : "";
  const objective = typeof agentContext.objective === "string" ? agentContext.objective : "";
  const instructions = typeof agentContext.instructions === "string" ? agentContext.instructions : "";
  const toneOfVoice = typeof agentContext.toneOfVoice === "string" ? agentContext.toneOfVoice : "";
  const greetingMessage = typeof agentContext.greetingMessage === "string" ? agentContext.greetingMessage : "";
  const memory = typeof agentContext.memory === "string" ? agentContext.memory : "";
  const channels = Array.isArray(agentContext.channels) ? agentContext.channels.join(", ") : "";
  const integrations = Array.isArray(agentContext.integrations) ? agentContext.integrations.join(", ") : "";
  const tools = Array.isArray(agentContext.tools) ? agentContext.tools.join(", ") : "";
  const knowledgeFiles = Array.isArray(agentContext.knowledgeFiles) ? agentContext.knowledgeFiles.join(", ") : "";
  const urls = Array.isArray(agentContext.urls) ? agentContext.urls.join(", ") : "";

  const sections = [
    `Você é o agente "${name}" e deve responder exatamente conforme a configuração recebida.`,
    role ? `Função: ${role}` : null,
    objective ? `Objetivo: ${objective}` : null,
    description ? `Descrição e instruções: ${description}` : null,
    instructions ? `Regras adicionais: ${instructions}` : null,
    toneOfVoice ? `Tom de voz: ${toneOfVoice}` : null,
    greetingMessage ? `Mensagem de saudação: ${greetingMessage}` : null,
    memory ? `Memória/contexto persistente: ${memory}` : null,
    channels ? `Canais habilitados: ${channels}` : null,
    integrations ? `Integrações habilitadas: ${integrations}` : null,
    tools ? `Ferramentas habilitadas: ${tools}` : null,
    knowledgeFiles ? `Arquivos de conhecimento: ${knowledgeFiles}` : null,
    urls ? `URLs de referência: ${urls}` : null,
    "Nunca responda como um assistente genérico se houver identidade configurada.",
    "Seja coerente com nome, papel, objetivo, tom e contexto do agente.",
    "Responda sempre em português brasileiro.",
  ].filter(Boolean);

  return sections.join("\n\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, provider, model, useGateway, gatewayModel, temperature, max_tokens, top_p, frequency_penalty, presence_penalty, response_format, stop, agentContext } = await req.json();

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Usuário não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const selectedProvider = provider || "openai";
    if (!useGateway && !modelBelongsToProvider(selectedProvider, model)) {
      return new Response(JSON.stringify({ error: `O modelo \"${model}\" não pertence ao provider \"${selectedProvider}\".` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const modelMapping = MODEL_MAP[model] || null;

    let apiUrl: string;
    let apiKey = "";
    let apiModel = modelMapping?.gateway || model || "google/gemini-3-flash-preview";
    let headers: Record<string, string>;
    let openRouterKeyCandidates: string[] = [];
    let gatewayModelCandidates: string[] = [];

    // If useGateway is true, use OpenRouter with stable free assistant defaults
    if (useGateway) {
      apiUrl = "https://openrouter.ai/api/v1/chat/completions";
      apiModel = normalizeGatewayModel(gatewayModel);
      headers = {
        "Content-Type": "application/json",
        "HTTP-Referer": "https://aikortex.lovable.app",
        "X-OpenRouter-Title": "Aikortex",
      };

      const { data: orKeyData } = await supabase
        .from("user_api_keys")
        .select("api_key")
        .eq("provider", "openrouter")
        .eq("user_id", user.id)
        .maybeSingle();

      const userOpenRouterKey = orKeyData?.api_key ?? "";
      const projectOpenRouterKey = Deno.env.get("OPENROUTER_API_KEY") || "";

      if (userOpenRouterKey) {
        const validation = validateOpenRouterApiKey(userOpenRouterKey);
        if (!validation.valid) {
          console.warn(`Ignoring invalid user OpenRouter key for user ${user.id}: ${validation.error}`);
        }
      }

      openRouterKeyCandidates = collectOpenRouterKeys(userOpenRouterKey, projectOpenRouterKey);
      gatewayModelCandidates = [
        apiModel,
        ...FREE_GATEWAY_MODELS.filter((candidate) => candidate !== apiModel),
      ];

      if (openRouterKeyCandidates.length === 0) {
        return new Response(JSON.stringify({ error: "Nenhuma chave válida do OpenRouter foi encontrada para o assistente de configuração." }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      apiKey = openRouterKeyCandidates[0];
      headers["Authorization"] = `Bearer ${apiKey}`;
    } else {
      // Try user's own API key first
      const { data: keyData } = await supabase
        .from("user_api_keys")
        .select("api_key")
        .eq("provider", selectedProvider)
        .eq("user_id", user.id)
        .maybeSingle();

      if (keyData?.api_key) {
        if (selectedProvider === "openai") {
          apiUrl = "https://api.openai.com/v1/chat/completions";
          apiKey = keyData.api_key;
          apiModel = modelMapping?.openai || model || "gpt-4o-mini";
          headers = {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          };
        } else if (selectedProvider === "anthropic") {
          apiUrl = "https://api.anthropic.com/v1/messages";
          apiKey = keyData.api_key;
          apiModel = modelMapping?.anthropic || model || "claude-3-haiku-20240307";
          headers = {
            "x-api-key": apiKey,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01",
          };
        } else if (selectedProvider === "gemini") {
          // Google Gemini uses generativelanguage API with API key
          const geminiModel = model?.replace("gemini-", "gemini-") || "gemini-2.5-flash";
          apiUrl = `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`;
          apiKey = keyData.api_key;
          apiModel = geminiModel;
          headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          };
        } else if (selectedProvider === "openrouter") {
          const validation = validateOpenRouterApiKey(keyData.api_key);
          if (!validation.valid) {
            return new Response(JSON.stringify({ error: "A chave do OpenRouter configurada é inválida. Ela deve começar com sk-or-." }), {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          apiUrl = "https://openrouter.ai/api/v1/chat/completions";
          apiKey = validation.normalized;
          apiModel = model || gatewayModel || "openai/gpt-5-mini";
          headers = {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://aikortex.lovable.app",
            "X-OpenRouter-Title": "Aikortex",
          };
        } else {
          const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
          if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
          apiUrl = "https://ai.gateway.lovable.dev/v1/chat/completions";
          apiKey = LOVABLE_API_KEY;
          apiModel = modelMapping?.gateway || model || "google/gemini-3-flash-preview";
          headers = {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          };
        }
      } else {
        if (provider && ["openai", "anthropic", "gemini", "openrouter"].includes(provider)) {
          return new Response(JSON.stringify({ error: `Nenhuma chave de API foi configurada para o provider \"${provider}\".` }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
        if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
        apiUrl = "https://ai.gateway.lovable.dev/v1/chat/completions";
        apiKey = LOVABLE_API_KEY;
        apiModel = modelMapping?.gateway || model || "google/gemini-3-flash-preview";
        headers = {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        };
      }
    }

    const defaultSystemPrompt = `Você é um agente de IA inteligente e prestativo. Responda sempre em português brasileiro. Seja direto, profissional e use markdown quando apropriado.`;
    const agentSystemPrompt = buildAgentSystemPrompt(agentContext);

    // If messages already contain a system prompt, use it; otherwise prepend default
    const hasSystemPrompt = messages.some((m: { role: string }) => m.role === "system");
    const finalMessages = hasSystemPrompt
      ? agentSystemPrompt
        ? messages.map((message: { role: string; content: string }, index: number) => index === 0 && message.role === "system"
          ? { ...message, content: `${agentSystemPrompt}\n\n${message.content}` }
          : message)
        : messages
      : [{ role: "system", content: agentSystemPrompt || defaultSystemPrompt }, ...messages];

    const body: Record<string, unknown> = {
      model: apiModel,
      messages: finalMessages,
      stream: true,
    };
    // Add optional API config params
    if (temperature !== undefined) body.temperature = temperature;
    if (max_tokens !== undefined) body.max_tokens = max_tokens;
    if (top_p !== undefined) body.top_p = top_p;
    if (frequency_penalty !== undefined) body.frequency_penalty = frequency_penalty;
    if (presence_penalty !== undefined) body.presence_penalty = presence_penalty;
    if (response_format) body.response_format = response_format;
    if (stop) body.stop = stop;

    console.log(`Using provider=${selectedProvider}, model=${apiModel}, useGateway=${useGateway}`);

    let response: Response | null = null;
    let lastErrorStatus = 0;
    let lastErrorText = "";
    const maxRetries = 3;

    if (useGateway) {
      gatewayAttempt:
      for (const candidateModel of gatewayModelCandidates) {
        for (let keyIndex = 0; keyIndex < openRouterKeyCandidates.length; keyIndex += 1) {
          const candidateKey = openRouterKeyCandidates[keyIndex];
          const requestHeaders = { ...headers, Authorization: `Bearer ${candidateKey}` };

          for (let attempt = 0; attempt <= maxRetries; attempt++) {
            response = await fetch(apiUrl, {
              method: "POST",
              headers: requestHeaders,
              body: JSON.stringify({ ...body, model: candidateModel }),
            });

            if (response.ok) {
              apiModel = candidateModel;
              apiKey = candidateKey;
              headers = requestHeaders;
              break gatewayAttempt;
            }

            if (response.status === 429 && attempt < maxRetries) {
              const retryAfter = parseInt(response.headers.get("retry-after") || "0", 10);
              const waitMs = Math.max((retryAfter || (attempt + 1) * 2) * 1000, 1000);
              console.log(`Rate limited (429), retrying in ${waitMs}ms (attempt ${attempt + 1}/${maxRetries})`);
              await new Promise((r) => setTimeout(r, waitMs));
              continue;
            }

            lastErrorStatus = response.status;
            lastErrorText = await response.text();
            console.error(`AI API error for model=${candidateModel}:`, response.status, lastErrorText);

            if (response.status === 401 && keyIndex < openRouterKeyCandidates.length - 1) {
              console.warn(`OpenRouter key failed for candidate ${keyIndex + 1}, trying fallback key`);
              break;
            }

            if (response.status === 404 && lastErrorText.includes("No endpoints found")) {
              console.warn(`OpenRouter model unavailable: ${candidateModel}. Trying next free model.`);
              break;
            }

            break gatewayAttempt;
          }

          if (response?.ok) break;
          if (lastErrorStatus === 404 && lastErrorText.includes("No endpoints found")) break;
        }

        if (response?.ok) break;
      }
    } else {
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        response = await fetch(apiUrl, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        });
        if (response.status !== 429 || attempt === maxRetries) break;
        const retryAfter = parseInt(response.headers.get("retry-after") || "0", 10);
        const waitMs = Math.max((retryAfter || (attempt + 1) * 2) * 1000, 1000);
        console.log(`Rate limited (429), retrying in ${waitMs}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise((r) => setTimeout(r, waitMs));
      }
    }

    if (!response?.ok) {
      const errorText = lastErrorText || await response?.text?.() || "";

      if (response?.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (response?.status === 401) {
        return new Response(JSON.stringify({ error: useGateway ? "Falha ao autenticar no OpenRouter. Atualize a chave configurada em Integrações." : "Chave de API inválida. Verifique sua configuração em Integrações." }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (response?.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos na sua conta." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (response?.status === 404 && errorText.includes("No endpoints found")) {
        return new Response(JSON.stringify({ error: "Os modelos gratuitos do OpenRouter ficaram indisponíveis no momento. O assistente tentou alternativas automaticamente. Tente novamente em instantes." }), {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.error("AI API error:", response?.status, errorText);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA. Tente novamente em instantes." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response!.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("agent-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
