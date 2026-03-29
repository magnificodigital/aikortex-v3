import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GRAPH_API = "https://graph.facebook.com/v21.0";

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // ── GET: Webhook verification (Meta sends a GET to verify) ──
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    const VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN");
    if (!VERIFY_TOKEN) {
      console.error("WHATSAPP_VERIFY_TOKEN not configured");
      return new Response("Server error", { status: 500 });
    }

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("Webhook verified successfully");
      return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
    }

    return new Response("Forbidden", { status: 403 });
  }

  // ── POST: Incoming messages from WhatsApp ──
  if (req.method === "POST") {
    try {
      const body = await req.json();

      // Extract message data from webhook payload
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (!value) {
        return new Response(JSON.stringify({ status: "no_data" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Handle status updates (delivered, read, etc.)
      if (value.statuses) {
        console.log("Status update:", JSON.stringify(value.statuses));
        return new Response(JSON.stringify({ status: "status_received" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Handle incoming messages
      const messages = value.messages;
      if (!messages || messages.length === 0) {
        return new Response(JSON.stringify({ status: "no_messages" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const phoneNumberId = value.metadata?.phone_number_id;
      const contactInfo = value.contacts?.[0];

      for (const message of messages) {
        const incomingData = {
          wamid: message.id,
          from_number: message.from,
          phone_number_id: phoneNumberId,
          contact_name: contactInfo?.profile?.name || message.from,
          message_type: message.type,
          content: extractContent(message),
          raw_payload: message,
          timestamp: message.timestamp
            ? new Date(parseInt(message.timestamp) * 1000).toISOString()
            : new Date().toISOString(),
          direction: "incoming",
          status: "received",
        };

        // Store in whatsapp_messages table
        const { error } = await supabase
          .from("whatsapp_messages")
          .insert(incomingData);

        if (error) {
          console.error("Error storing message:", error);
        }

        console.log(`Received ${message.type} from ${message.from}: ${incomingData.content}`);
      }

      return new Response(JSON.stringify({ status: "ok", count: messages.length }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (e) {
      console.error("Webhook error:", e);
      // Always return 200 to Meta to avoid retries
      return new Response(JSON.stringify({ status: "error", message: String(e) }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  return new Response("Method not allowed", { status: 405 });
});

/** Extract readable content from different message types */
function extractContent(message: any): string {
  switch (message.type) {
    case "text":
      return message.text?.body || "";
    case "image":
      return message.image?.caption || "[Imagem]";
    case "video":
      return message.video?.caption || "[Vídeo]";
    case "audio":
      return "[Áudio]";
    case "document":
      return message.document?.filename || "[Documento]";
    case "location":
      return `[Localização: ${message.location?.latitude}, ${message.location?.longitude}]`;
    case "contacts":
      return `[Contato: ${message.contacts?.[0]?.name?.formatted_name || ""}]`;
    case "sticker":
      return "[Sticker]";
    case "reaction":
      return `[Reação: ${message.reaction?.emoji || ""}]`;
    case "interactive":
      if (message.interactive?.type === "button_reply") {
        return message.interactive.button_reply?.title || "[Botão]";
      }
      if (message.interactive?.type === "list_reply") {
        return message.interactive.list_reply?.title || "[Lista]";
      }
      return "[Interativo]";
    case "button":
      return message.button?.text || "[Botão]";
    case "order":
      return "[Pedido]";
    default:
      return `[${message.type}]`;
  }
}
