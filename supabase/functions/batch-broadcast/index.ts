import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GRAPH_API = "https://graph.facebook.com/v21.0";
const MAX_CONCURRENT = 10;
const CREDITS_PER_AI_MSG = 5;

interface Contact {
  phone: string;
  name?: string;
  [key: string]: unknown;
}

function interpolateTemplate(template: string, contact: Contact): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(contact[key] ?? ""));
}

async function processChunk(
  contacts: Contact[],
  template: string,
  useAI: boolean,
  agentDbId: string | null,
  waToken: string,
  phoneNumberId: string,
  userId: string,
  supabase: any,
  accessToken: string,
): Promise<{ sent: number; failed: number; creditsUsed: number }> {
  let sent = 0;
  let failed = 0;
  let creditsUsed = 0;

  for (const contact of contacts) {
    try {
      let finalMessage = interpolateTemplate(template, contact);

      // AI personalization
      if (useAI && agentDbId) {
        try {
          const sessionResp = await supabase.functions.invoke("managed-session-chat", {
            body: {
              agent_db_id: agentDbId,
              message: `Personalize esta mensagem para ${contact.name || contact.phone}: ${finalMessage}. Responda APENAS com a mensagem personalizada, sem explicações.`,
              contact_identifier: `broadcast_${contact.phone}`,
              channel: "whatsapp",
              owner_user_id: userId,
            },
          });

          if (sessionResp.data?.reply) {
            finalMessage = sessionResp.data.reply;
            creditsUsed += CREDITS_PER_AI_MSG;
          }
        } catch (aiErr) {
          console.error(`AI personalization failed for ${contact.phone}:`, aiErr);
          // Fall back to template message
        }
      }

      // Send via WhatsApp Graph API
      const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: contact.phone,
        type: "text",
        text: { preview_url: false, body: finalMessage },
      };

      const resp = await fetch(`${GRAPH_API}/${phoneNumberId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${waToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await resp.json();

      if (resp.ok) {
        sent++;
        // Store sent message
        await supabase.from("whatsapp_messages").insert({
          wamid: data.messages?.[0]?.id || null,
          from_number: phoneNumberId,
          phone_number_id: phoneNumberId,
          to_number: contact.phone,
          message_type: "text",
          content: finalMessage,
          raw_payload: payload,
          direction: "outgoing",
          status: "sent",
          user_id: userId,
        }).catch(() => {});
      } else {
        failed++;
        console.error(`Send failed to ${contact.phone}:`, data.error?.message);
      }
    } catch (err) {
      failed++;
      console.error(`Error processing ${contact.phone}:`, err);
    }
  }

  return { sent, failed, creditsUsed };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Auth
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authorization required" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      contacts,
      message_template,
      use_ai_personalization = false,
      agent_db_id = null,
      phone_number_id,
    } = body;

    if (!contacts?.length || !message_template) {
      return new Response(JSON.stringify({ error: "contacts e message_template são obrigatórios" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get WhatsApp credentials
    const { data: keys } = await supabase
      .from("user_api_keys")
      .select("provider, api_key")
      .eq("user_id", user.id)
      .in("provider", ["whatsapp_access_token", "whatsapp_phone_number_id"]);

    const keyMap: Record<string, string> = {};
    (keys || []).forEach((k: any) => { keyMap[k.provider] = k.api_key; });

    const waToken = keyMap.whatsapp_access_token;
    const waPhoneId = phone_number_id || keyMap.whatsapp_phone_number_id;

    if (!waToken || !waPhoneId) {
      return new Response(JSON.stringify({ error: "Configure suas credenciais WABA em Configurações → Canais → WhatsApp" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check credits if AI
    if (use_ai_personalization) {
      const estimatedCredits = contacts.length * CREDITS_PER_AI_MSG;
      const { data: wallet } = await supabase
        .from("agency_wallets")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!wallet || wallet.balance < estimatedCredits) {
        return new Response(JSON.stringify({
          error: "Saldo de créditos insuficiente",
          required: estimatedCredits,
          available: wallet?.balance ?? 0,
        }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Process in chunks of MAX_CONCURRENT
    let totalSent = 0;
    let totalFailed = 0;
    let totalCredits = 0;

    for (let i = 0; i < contacts.length; i += MAX_CONCURRENT) {
      const chunk = contacts.slice(i, i + MAX_CONCURRENT);

      const promises = chunk.map((contact: Contact) =>
        processChunk(
          [contact], message_template, use_ai_personalization, agent_db_id,
          waToken, waPhoneId, user.id, supabase, token,
        )
      );

      const results = await Promise.allSettled(promises);
      for (const r of results) {
        if (r.status === "fulfilled") {
          totalSent += r.value.sent;
          totalFailed += r.value.failed;
          totalCredits += r.value.creditsUsed;
        } else {
          totalFailed += 1;
        }
      }

      // Small delay between chunks to avoid rate limits
      if (i + MAX_CONCURRENT < contacts.length) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    // Debit total credits
    if (totalCredits > 0) {
      const { data: wallet } = await supabase
        .from("agency_wallets")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();

      if (wallet) {
        const newBalance = Math.max(0, wallet.balance - totalCredits);
        await supabase
          .from("agency_wallets")
          .update({ balance: newBalance, updated_at: new Date().toISOString() })
          .eq("user_id", user.id);

        await supabase.from("credit_transactions").insert({
          user_id: user.id,
          type: "consumption",
          amount: -totalCredits,
          balance_after: newBalance,
          description: `Disparo em massa — ${totalSent} mensagens personalizadas com IA`,
          provider: "broadcast",
        });

        await supabase.rpc("add_to_wallet_consumed", {
          user_uuid: user.id,
          consumed: totalCredits,
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      sent: totalSent,
      failed: totalFailed,
      credits_used: totalCredits,
      total: contacts.length,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Broadcast error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
