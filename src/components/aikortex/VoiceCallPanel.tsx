import { useState, useEffect, useCallback, useRef } from "react";
import { useConversation } from "@elevenlabs/react";
import {
  Phone, PhoneOff, Mic, MicOff, User, FileText, AlertTriangle, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type CallStatus = "idle" | "connecting" | "connected" | "ended";

interface VoiceCallPanelProps {
  agentName: string;
  agentAvatar: string;
  elevenLabsAgentId?: string;
  hasElevenLabsKey: boolean;
  onGoToIntegrations: () => void;
}

const VoiceCallPanel = ({
  agentName,
  agentAvatar,
  elevenLabsAgentId,
  hasElevenLabsKey,
  onGoToIntegrations,
}: VoiceCallPanelProps) => {
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [transcript, setTranscript] = useState<Array<{ role: string; text: string }>>([]);
  const [showTranscript, setShowTranscript] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const startTimeRef = useRef<number>(0);

  // Volume animation
  const [bars, setBars] = useState<number[]>(Array(20).fill(4));
  const animRef = useRef<ReturnType<typeof setInterval>>();

  const conversation = useConversation({
    onConnect: () => {
      setCallStatus("connected");
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    },
    onDisconnect: () => {
      setCallStatus("ended");
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
      console.error("ElevenLabs error:", err);
      toast.error(typeof err === "string" ? err : err?.message || "Erro na conexão de voz");
      setCallStatus("ended");
      if (timerRef.current) clearInterval(timerRef.current);
    },
  });

  // Animate voice bars when connected
  useEffect(() => {
    if (callStatus === "connected") {
      animRef.current = setInterval(() => {
        setBars(Array.from({ length: 20 }, () => {
          const isSpeaking = conversation.isSpeaking;
          const base = isSpeaking ? 20 : 8;
          const variance = isSpeaking ? 28 : 12;
          return Math.max(4, Math.random() * variance + base);
        }));
      }, 120);
      return () => { if (animRef.current) clearInterval(animRef.current); };
    } else {
      setBars(Array(20).fill(4));
    }
  }, [callStatus, conversation.isSpeaking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animRef.current) clearInterval(animRef.current);
    };
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const handleStart = useCallback(async () => {
    const agentId = elevenLabsAgentId || import.meta.env.VITE_ELEVENLABS_AGENT_ID;
    if (!agentId) {
      toast.error("Agent ID da ElevenLabs não configurado.");
      return;
    }

    setCallStatus("connecting");
    setTranscript([]);
    setDuration(0);

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await conversation.startSession({ agentId });
    } catch (err: any) {
      console.error("Failed to start voice:", err);
      if (err?.name === "NotAllowedError") {
        toast.error("Permissão de microfone necessária para usar voz.");
      } else {
        toast.error("Erro ao iniciar ligação.");
      }
      setCallStatus("idle");
    }
  }, [conversation, elevenLabsAgentId]);

  const handleEnd = useCallback(async () => {
    try {
      await conversation.endSession();
    } catch {
      setCallStatus("ended");
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [conversation]);

  const handleReset = () => {
    setCallStatus("idle");
    setDuration(0);
    setShowTranscript(false);
  };

  // No ElevenLabs key warning
  if (!hasElevenLabsKey && !import.meta.env.VITE_ELEVENLABS_AGENT_ID) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-[300px] space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-destructive" />
          </div>
          <h3 className="text-sm font-semibold">ElevenLabs não configurado</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Para usar o modo de voz, configure sua chave de API da ElevenLabs na aba de Integrações.
          </p>
          <Button size="sm" onClick={onGoToIntegrations} className="gap-1.5">
            <ExternalLink className="w-3.5 h-3.5" /> Ir para Integrações
          </Button>
        </div>
      </div>
    );
  }

  // Transcript view
  if (showTranscript) {
    return (
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4" /> Transcrição
          </h3>
          <Button variant="outline" size="sm" onClick={handleReset} className="text-xs h-7">
            Nova ligação
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-3">
          {transcript.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center pt-8">Nenhuma transcrição disponível.</p>
          ) : (
            transcript.map((t, i) => (
              <div key={i} className={`flex ${t.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs ${
                  t.role === "user"
                    ? "bg-primary/10 border border-primary/20 text-foreground"
                    : "bg-muted text-foreground"
                }`}>
                  <span className="text-[10px] text-muted-foreground block mb-0.5">
                    {t.role === "user" ? "Você" : agentName}
                  </span>
                  {t.text}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 relative"
      style={{
        background: "radial-gradient(ellipse at center, hsl(var(--primary) / 0.05) 0%, transparent 70%)",
      }}
    >
      {/* Status badge */}
      <Badge
        variant="outline"
        className={`absolute top-4 right-4 text-[10px] ${
          callStatus === "connected" ? "border-emerald-500/30 text-emerald-500" :
          callStatus === "connecting" ? "border-yellow-500/30 text-yellow-500 animate-pulse" :
          callStatus === "ended" ? "border-muted-foreground/30 text-muted-foreground" :
          "border-border text-muted-foreground"
        }`}
      >
        {callStatus === "idle" && "Aguardando"}
        {callStatus === "connecting" && "Conectando..."}
        {callStatus === "connected" && (conversation.isSpeaking ? "Falando..." : "Ouvindo...")}
        {callStatus === "ended" && "Encerrada"}
      </Badge>

      {/* Silhouette / avatar area */}
      <div className="relative mb-6">
        {callStatus === "connected" && (
          <>
            <div className="absolute -inset-4 rounded-full bg-primary/5 animate-pulse" />
            <div className="absolute -inset-8 rounded-full bg-primary/3 animate-ping" style={{ animationDuration: "3s" }} />
          </>
        )}
        <div className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${
          callStatus === "connected"
            ? "bg-gradient-to-br from-primary/20 to-emerald-500/10 shadow-xl shadow-primary/10"
            : "bg-muted/30"
        }`}>
          <User className={`w-16 h-16 transition-colors ${
            callStatus === "connected" ? "text-primary/40" : "text-muted-foreground/20"
          }`} />
        </div>
      </div>

      {/* Agent name */}
      <h3 className="text-sm font-semibold mb-1">{agentName}</h3>

      {/* Duration */}
      <p className={`text-2xl font-mono font-light mb-4 tabular-nums ${
        callStatus === "connected" ? "text-foreground" : "text-muted-foreground/50"
      }`}>
        {formatTime(duration)}
      </p>

      {/* Voice waveform */}
      <div className="flex items-center gap-[2px] h-12 w-full max-w-[240px] mb-8">
        {bars.map((h, i) => (
          <div
            key={i}
            className={`flex-1 rounded-full transition-all duration-100 ${
              callStatus === "connected"
                ? conversation.isSpeaking ? "bg-primary/50" : "bg-blue-400/40"
                : "bg-muted-foreground/10"
            }`}
            style={{ height: `${h}px` }}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        {callStatus === "connected" && (
          <Button
            variant="outline"
            size="icon"
            className={`h-12 w-12 rounded-full transition-all ${
              isMuted ? "bg-destructive/10 border-destructive/30 text-destructive" : ""
            }`}
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
        )}

        {callStatus === "idle" && (
          <Button
            size="icon"
            className="h-16 w-16 rounded-full bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"
            onClick={handleStart}
          >
            <Phone className="h-7 w-7 text-white" />
          </Button>
        )}

        {callStatus === "connecting" && (
          <Button
            size="icon"
            className="h-16 w-16 rounded-full bg-yellow-500 hover:bg-yellow-600 shadow-lg animate-pulse"
            disabled
          >
            <Phone className="h-7 w-7 text-white" />
          </Button>
        )}

        {callStatus === "connected" && (
          <Button
            size="icon"
            className="h-16 w-16 rounded-full bg-destructive hover:bg-destructive/90 shadow-lg shadow-destructive/20"
            onClick={handleEnd}
          >
            <PhoneOff className="h-7 w-7 text-white" />
          </Button>
        )}

        {callStatus === "ended" && (
          <div className="flex flex-col items-center gap-3">
            <p className="text-xs text-muted-foreground">
              Duração total: {formatTime(duration)}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleReset} className="text-xs h-8 gap-1">
                <Phone className="w-3.5 h-3.5" /> Nova ligação
              </Button>
              {transcript.length > 0 && (
                <Button size="sm" onClick={() => setShowTranscript(true)} className="text-xs h-8 gap-1">
                  <FileText className="w-3.5 h-3.5" /> Ver transcrição
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Hint text */}
      {callStatus === "idle" && (
        <p className="text-xs text-muted-foreground text-center mt-6 max-w-[260px]">
          Clique no botão acima para iniciar uma ligação de voz com o agente.
        </p>
      )}
    </div>
  );
};

export default VoiceCallPanel;
