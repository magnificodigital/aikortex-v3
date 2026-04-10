import { useState, useEffect, useRef, useCallback } from "react";
import { useConversation } from "@elevenlabs/react";
import { Phone, PhoneOff, Mic, MicOff, X, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  agentId: string;
  agentName: string;
  agentAvatar: string;
  agentPrompt?: string;
  agentGreeting?: string;
  voiceId?: string;
}

const BrowserCallWidget = ({
  open, onClose, agentId, agentName, agentAvatar,
  agentPrompt, agentGreeting, voiceId,
}: Props) => {
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "ended">("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [transcript, setTranscript] = useState<Array<{ role: string; text: string }>>([]);
  const [minimized, setMinimized] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const startRef = useRef(0);

  const conversation = useConversation({
    onConnect: () => {
      setStatus("connected");
      startRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startRef.current) / 1000));
      }, 1000);
    },
    onDisconnect: () => {
      setStatus("ended");
      if (timerRef.current) clearInterval(timerRef.current);
    },
    onMessage: (msg: any) => {
      if (msg.type === "user_transcript") {
        setTranscript(prev => [...prev, { role: "user", text: msg.user_transcription_event?.user_transcript || "" }]);
      } else if (msg.type === "agent_response") {
        setTranscript(prev => [...prev, { role: "agent", text: msg.agent_response_event?.agent_response || "" }]);
      }
    },
    onError: (err: any) => {
      toast.error(typeof err === "string" ? err : err?.message || "Erro na conexão de voz");
      setStatus("ended");
      if (timerRef.current) clearInterval(timerRef.current);
    },
  });

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const handleStart = useCallback(async () => {
    setStatus("connecting");
    setTranscript([]);
    setDuration(0);

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const { data, error } = await supabase.functions.invoke("elevenlabs-voice-session", {
        body: {
          agentName,
          agentPrompt,
          voiceId: voiceId || "EXAVITQu4vr4xnSDxMaL",
          firstMessage: agentGreeting,
          language: "pt",
        },
      });

      if (error || !data?.signed_url) {
        toast.error("Erro ao criar sessão de voz");
        setStatus("idle");
        return;
      }

      await conversation.startSession({ signedUrl: data.signed_url });
    } catch (err: any) {
      if (err?.name === "NotAllowedError") {
        toast.error("Permissão de microfone necessária.");
      } else {
        toast.error(err?.message || "Erro ao iniciar ligação.");
      }
      setStatus("idle");
    }
  }, [conversation, agentName, agentPrompt, agentGreeting, voiceId]);

  const handleEnd = useCallback(async () => {
    try { await conversation.endSession(); } catch { setStatus("ended"); if (timerRef.current) clearInterval(timerRef.current); }
  }, [conversation]);

  // Auto-start on open
  useEffect(() => {
    if (open && status === "idle") handleStart();
  }, [open]);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  if (!open) return null;

  return (
    <div className={`fixed bottom-6 right-6 z-50 bg-card border border-border rounded-2xl shadow-2xl transition-all ${
      minimized ? "w-[200px]" : "w-[340px]"
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          {agentAvatar && <img src={agentAvatar} alt="" className="w-7 h-7 rounded-full object-cover" />}
          <div>
            <p className="text-xs font-semibold text-foreground">{agentName}</p>
            <Badge variant="outline" className={`text-[9px] ${
              status === "connected" ? "border-emerald-500/30 text-emerald-500" :
              status === "connecting" ? "border-yellow-500/30 text-yellow-500 animate-pulse" :
              "border-border text-muted-foreground"
            }`}>
              {status === "idle" && "Pronto"}
              {status === "connecting" && "Conectando..."}
              {status === "connected" && (conversation.isSpeaking ? "Falando..." : "Ouvindo...")}
              {status === "ended" && "Encerrada"}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMinimized(!minimized)}>
            {minimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { handleEnd(); onClose(); }}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* Timer */}
          <div className="text-center py-4">
            <p className={`text-3xl font-mono font-light tabular-nums ${
              status === "connected" ? "text-foreground" : "text-muted-foreground/50"
            }`}>
              {formatTime(duration)}
            </p>
          </div>

          {/* Transcript */}
          <ScrollArea className="h-[120px] px-4">
            <div className="space-y-2">
              {transcript.slice(-6).map((t, i) => (
                <div key={i} className={`flex ${t.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-lg px-2.5 py-1.5 text-[11px] ${
                    t.role === "user" ? "bg-primary/10 border border-primary/20" : "bg-muted"
                  }`}>
                    {t.text}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3 py-4">
            {status === "connected" && (
              <Button
                variant="outline" size="icon"
                className={`h-10 w-10 rounded-full ${isMuted ? "bg-destructive/10 border-destructive/30 text-destructive" : ""}`}
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
            )}

            {(status === "idle" || status === "ended") && (
              <Button
                size="icon"
                className="h-12 w-12 rounded-full bg-emerald-500 hover:bg-emerald-600"
                onClick={handleStart}
              >
                <Phone className="w-5 h-5 text-white" />
              </Button>
            )}

            {(status === "connected" || status === "connecting") && (
              <Button
                size="icon"
                className="h-12 w-12 rounded-full bg-destructive hover:bg-destructive/90"
                onClick={handleEnd}
              >
                <PhoneOff className="w-5 h-5 text-white" />
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default BrowserCallWidget;
