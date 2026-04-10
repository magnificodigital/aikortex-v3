import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  preview_url: string | null;
  category: string;
}

export function useElevenLabsVoices() {
  const [voices, setVoices] = useState<ElevenLabsVoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasKey, setHasKey] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVoices = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: keyData } = await supabase
      .from("user_api_keys")
      .select("api_key")
      .eq("user_id", user.id)
      .eq("provider", "elevenlabs")
      .single();

    if (!keyData) {
      setHasKey(false);
      setLoading(false);
      return;
    }

    setHasKey(true);

    try {
      const res = await fetch("https://api.elevenlabs.io/v1/voices", {
        headers: { "xi-api-key": keyData.api_key },
      });

      if (!res.ok) {
        setError("Erro ao buscar vozes da ElevenLabs");
        setLoading(false);
        return;
      }

      const data = await res.json();
      const mapped: ElevenLabsVoice[] = (data.voices || []).map((v: any) => ({
        voice_id: v.voice_id,
        name: v.name,
        preview_url: v.preview_url || null,
        category: v.category || "unknown",
      }));

      setVoices(mapped);
      if (mapped.length === 0) setError("Nenhuma voz encontrada na sua conta ElevenLabs");
    } catch {
      setError("Erro ao conectar com a ElevenLabs");
    }

    setLoading(false);
  }, []);

  useEffect(() => { fetchVoices(); }, [fetchVoices]);

  return { voices, loading, hasKey, error, refetch: fetchVoices };
}
