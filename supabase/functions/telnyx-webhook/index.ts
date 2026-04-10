import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const event = body.data?.event_type;
    const payload = body.data?.payload;

    const clientState = payload?.client_state
      ? JSON.parse(atob(payload.client_state))
      : null;

    const callControlId = payload?.call_control_id;

    switch (event) {
      case "call.initiated": {
        await telnyxCommand(callControlId, "answer", {});
        break;
      }

      case "call.answered": {
        if (!clientState?.agent_id) break;

        const { data: agent } = await supabase
          .from("user_agents")
          .select("*")
          .eq("id", clientState.agent_id)
          .single();

        if (!agent) break;

        const greeting =
          (agent.config as Record<string, unknown>)?.greeting as string ??
          `Olá! Sou ${agent.name}. Como posso te ajudar hoje?`;

        const audioUrl = await generateElevenLabsTTS(
          greeting,
          clientState.user_id,
          agent.voice_id
        );

        if (audioUrl) {
          await telnyxCommand(callControlId, "playback_start", { audio_url: audioUrl });
        }

        await telnyxCommand(callControlId, "transcription_start", {
          language: agent.voice_language ?? "pt-BR",
          transcription_engine: "A",
        });

        await supabase
          .from("call_logs")
          .update({ status: "in_progress" })
          .eq("telnyx_call_id", callControlId);

        break;
      }

      case "call.transcription": {
        const transcript = payload?.transcription_data?.transcript;
        if (!transcript || !clientState?.agent_id) break;

        const { data: agent } = await supabase
          .from("user_agents")
          .select("*")
          .eq("id", clientState.agent_id)
          .single();

        if (!agent) break;

        const aiResponse = await getAgentResponse(transcript, agent, clientState.user_id);

        if (aiResponse) {
          const audioUrl = await generateElevenLabsTTS(
            aiResponse,
            clientState.user_id,
            agent.voice_id
          );
          if (audioUrl) {
            await telnyxCommand(callControlId, "playback_start", { audio_url: audioUrl });
          }
        }

        // Append transcript entry
        const { data: callLog } = await supabase
          .from("call_logs")
          .select("transcript")
          .eq("telnyx_call_id", callControlId)
          .single();

        if (callLog) {
          const existing = Array.isArray(callLog.transcript) ? callLog.transcript : [];
          existing.push({ role: "user", content: transcript, ts: new Date().toISOString() });
          if (aiResponse) {
            existing.push({ role: "assistant", content: aiResponse, ts: new Date().toISOString() });
          }
          await supabase
            .from("call_logs")
            .update({ transcript: existing })
            .eq("telnyx_call_id", callControlId);
        }

        break;
      }

      case "call.hangup": {
        const duration =
          payload?.end_time && payload?.start_time
            ? Math.floor(
                (new Date(payload.end_time).getTime() -
                  new Date(payload.start_time).getTime()) /
                  1000
              )
            : 0;

        await supabase
          .from("call_logs")
          .update({
            status: "completed",
            duration_seconds: duration,
            ended_at: new Date().toISOString(),
          })
          .eq("telnyx_call_id", callControlId);

        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("telnyx-webhook error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function telnyxCommand(callControlId: string, command: string, params: object) {
  const apiKey = Deno.env.get("TELNYX_API_KEY") ?? "";
  const res = await fetch(
    `https://api.telnyx.com/v2/calls/${callControlId}/actions/${command}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    }
  );
  await res.text(); // consume
  return res;
}

async function generateElevenLabsTTS(
  text: string,
  userId: string,
  voiceId?: string | null
): Promise<string | null> {
  const { data: keyData } = await supabase
    .from("user_api_keys")
    .select("api_key")
    .eq("user_id", userId)
    .eq("provider", "elevenlabs")
    .single();

  const apiKey = keyData?.api_key ?? Deno.env.get("ELEVENLABS_API_KEY");
  if (!apiKey) return null;

  const voice = voiceId ?? "EXAVITQu4vr4xnSDxMaL";
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ text, model_id: "eleven_multilingual_v2" }),
    }
  );

  if (!res.ok) {
    await res.text();
    return null;
  }

  const audioBuffer = await res.arrayBuffer();
  const fileName = `tts/${Date.now()}.mp3`;
  const { data } = await supabase.storage
    .from("call-audio")
    .upload(fileName, audioBuffer, { contentType: "audio/mpeg", upsert: true });

  if (!data) return null;

  const { data: urlData } = supabase.storage.from("call-audio").getPublicUrl(fileName);
  return urlData.publicUrl;
}

async function getAgentResponse(
  userMessage: string,
  agent: Record<string, unknown>,
  userId: string
): Promise<string | null> {
  try {
    const res = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/agent-chat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({
          agent_id: agent.id,
          message: userMessage,
          user_id: userId,
          channel: "voice",
        }),
      }
    );
    const data = await res.json();
    return (data.response as string) ?? null;
  } catch {
    return null;
  }
}
