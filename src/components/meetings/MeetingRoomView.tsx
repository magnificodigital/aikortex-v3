import { useEffect, useMemo, useRef, useState } from "react";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  useRoomContext,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { DisconnectReason, RoomEvent } from "livekit-client";
import { Button } from "@/components/ui/button";
import {
  Video,
  X,
  Share2,
  ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import FloatingParticipants from "./FloatingParticipants";

interface Props {
  token: string;
  serverUrl: string;
  meetingTitle: string;
  isHost: boolean;
  roomId: string;
  onLeave: () => void;
}

/* ── Background filter options ── */
const backgrounds = [
  { id: "none", label: "Nenhum", preview: null },
  { id: "blur-light", label: "Desfoque leve", preview: null },
  { id: "blur-heavy", label: "Desfoque forte", preview: null },
  { id: "gradient-blue", label: "Azul", preview: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
  { id: "gradient-green", label: "Verde", preview: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)" },
  { id: "gradient-sunset", label: "Pôr do sol", preview: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" },
  { id: "gradient-dark", label: "Escuro", preview: "linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 100%)" },
];

const shouldLeaveOnDisconnect = (reason?: DisconnectReason) => {
  if (reason === undefined) return true;

  return [
    DisconnectReason.DUPLICATE_IDENTITY,
    DisconnectReason.PARTICIPANT_REMOVED,
    DisconnectReason.ROOM_DELETED,
    DisconnectReason.ROOM_CLOSED,
    DisconnectReason.USER_REJECTED,
  ].includes(reason);
};

/* ── Inner component with room context ── */
const MeetingInner = ({ meetingTitle, isHost, roomId, onLeave }: Omit<Props, "token" | "serverUrl">) => {
  const room = useRoomContext();
  const [showBgDialog, setShowBgDialog] = useState(false);
  const [activeBg, setActiveBg] = useState("none");
  const leavingRef = useRef(false);

  // Listen for room disconnection (host ends meeting) — ignore user-initiated disconnects
  useEffect(() => {
    const handleDisconnected = (reason?: DisconnectReason) => {
      if (leavingRef.current) return;

      if (reason === DisconnectReason.CLIENT_INITIATED) {
        return;
      }

      if (!shouldLeaveOnDisconnect(reason)) {
        toast.warning("A conexão oscilou, mas a reunião continuará ativa quando a reconexão terminar.");
        return;
      }

      toast.info("A reunião foi encerrada");
      onLeave();
    };
    room.on(RoomEvent.Disconnected, handleDisconnected);
    return () => { room.off(RoomEvent.Disconnected, handleDisconnected); };
  }, [room, onLeave]);

  // Mark leaving when the LiveKit ControlBar's Leave button is clicked
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const leaveBtn = document.querySelector('.lk-disconnect-button');
      if (leaveBtn && !leaveBtn.getAttribute('data-patched')) {
        leaveBtn.setAttribute('data-patched', 'true');
        leaveBtn.addEventListener('click', () => {
          leavingRef.current = true;
          setTimeout(() => onLeave(), 500);
        }, { once: true });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [onLeave]);

  const copyLink = () => {
    const link = `${window.location.origin}/meetings/${roomId}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado!");
  };

  const applyBackground = (bgId: string) => {
    setActiveBg(bgId);
    setShowBgDialog(false);
    toast.success(`Fundo "${backgrounds.find(b => b.id === bgId)?.label}" aplicado`);
  };

  return (
    <div className="flex flex-col bg-[#111] text-white overflow-hidden lk-meeting-container" style={{ height: "100dvh" }}>
      {/* Header */}
      <div className="h-12 flex items-center justify-between px-4 bg-[#1a1a1a] border-b border-white/10 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Video className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold truncate">{meetingTitle}</span>
          {isHost && (
            <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
              Anfitrião
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-white/70 hover:text-white hover:bg-white/10"
            onClick={() => setShowBgDialog(true)}
          >
            <ImageIcon className="w-3.5 h-3.5" /> Aparência
          </Button>
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-white/70 hover:text-white hover:bg-white/10" onClick={copyLink}>
            <Share2 className="w-3.5 h-3.5" /> Compartilhar
          </Button>
        </div>
      </div>

      {/* Main content — VideoConference includes its own control bar */}
      <div className="flex-1 overflow-hidden relative">
        <VideoConference />
        <FloatingParticipants />
      </div>

      {/* Background filter dialog */}
      <Dialog open={showBgDialog} onOpenChange={setShowBgDialog}>
        <DialogContent className="sm:max-w-md bg-[#1a1a1a] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <ImageIcon className="w-5 h-5 text-primary" /> Filtros e Cenários de Fundo
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3 pt-2">
            {backgrounds.map((bg) => (
              <button
                key={bg.id}
                onClick={() => applyBackground(bg.id)}
                className={`relative rounded-lg border-2 p-3 text-center text-xs transition-all hover:scale-105 ${
                  activeBg === bg.id
                    ? "border-primary bg-primary/20"
                    : "border-white/10 hover:border-white/30"
                }`}
              >
                <div
                  className="w-full h-12 rounded-md mb-2 flex items-center justify-center"
                  style={{
                    background: bg.preview || (bg.id.includes("blur") ? "rgba(255,255,255,0.1)" : "transparent"),
                  }}
                >
                  {bg.id === "none" && <X className="w-5 h-5 text-white/40" />}
                  {bg.id === "blur-light" && <div className="w-full h-full rounded-md backdrop-blur-sm bg-white/5" />}
                  {bg.id === "blur-heavy" && <div className="w-full h-full rounded-md backdrop-blur-md bg-white/10" />}
                </div>
                <span className="text-white/80">{bg.label}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const MeetingRoomView = ({ token, serverUrl, meetingTitle, isHost, roomId, onLeave }: Props) => {
  const roomOptions = useMemo(
    () => ({
      disconnectOnPageLeave: false,
    }),
    []
  );

  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect={true}
      options={roomOptions}
      onDisconnected={() => {
        // handled by MeetingInner's RoomEvent listener
      }}
      onError={(e) => {
        console.error("LiveKit error:", e);
        toast.error("Erro na conexão da reunião");
      }}
      data-lk-theme="default"
      style={{ height: "100dvh" }}
    >
      <MeetingInner
        meetingTitle={meetingTitle}
        isHost={isHost}
        roomId={roomId}
        onLeave={onLeave}
      />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
};

export default MeetingRoomView;
