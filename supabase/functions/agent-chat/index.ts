import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Map short UI model names to full gateway/API model names
const MODEL_MAP: Record<string, { gateway: string; openai?: string }> = {
  "gemini-2.5-flash": { gateway: "google/gemini-2.5-flash" },
  "gemini-2.5-pro": { gateway: "google/gemini-2.5-pro" },
  "gemini-3-flash-preview": { gateway: "google/gemini-3-flash-preview" },
  "gpt-5": { gateway: "openai/gpt-5", openai: "gpt-4o" },
  "gpt-5-mini": { gateway: "openai/gpt-5-mini", openai: "gpt-4o-mini" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, provider, model } = await req.json();

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
    const modelMapping = MODEL_MAP[model] || null;

    // Try user's own API key first
    const { data: keyData } = await supabase
      .from("user_api_keys")
      .select("api_key")
      .eq("provider", selectedProvider)
      .eq("user_id", user.id)
      .maybeSingle();

    let apiUrl: string;
    let apiKey: string;
    let apiModel: string;
    let headers: Record<string, string>;

    if (keyData?.api_key) {
      if (selectedProvider === "openai") {
        apiUrl = "https://api.openai.com/v1/chat/completions";
        apiKey = keyData.api_key;
        // Use OpenAI-native model name
        apiModel = modelMapping?.openai || model || "gpt-4o-mini";
        headers = {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        };
      } else if (selectedProvider === "anthropic") {
        apiUrl = "https://api.anthropic.com/v1/messages";
        apiKey = keyData.api_key;
        apiModel = model || "claude-3-haiku-20240307";
        headers = {
          "x-api-key": apiKey,
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
        };
      } else {
        // User key for other providers — still use Lovable gateway
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
      // No user key — use Lovable AI gateway
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

    const systemPrompt = `Você é um agente de IA inteligente e prestativo. Responda sempre em português brasileiro. Seja direto, profissional e use markdown quando apropriado.`;

    const body: Record<string, unknown> = {
      model: apiModel,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      stream: true,
    };

    console.log(`Using provider=${selectedProvider}, model=${apiModel}, hasUserKey=${!!keyData?.api_key}`);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 401) {
        return new Response(JSON.stringify({ error: "Chave de API inválida. Verifique sua configuração em Integrações." }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos na sua conta." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI API error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA. Verifique sua chave de API." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
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
