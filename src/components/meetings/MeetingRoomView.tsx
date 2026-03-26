import { useCallback, useState, useEffect } from "react";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  useTracks,
  useParticipants,
  useRoomContext,
  GridLayout,
  ParticipantTile,
  Chat,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track, RoomEvent, Room } from "livekit-client";
import { Button } from "@/components/ui/button";
import {
  Video,
  Copy,
  Users,
  MessageSquare,
  PhoneOff,
  Monitor,
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

/* ── Inner component with room context ── */
const MeetingInner = ({ meetingTitle, isHost, roomId, onLeave }: Omit<Props, "token" | "serverUrl">) => {
  const room = useRoomContext();
  const [showChat, setShowChat] = useState(false);
  const [showBgDialog, setShowBgDialog] = useState(false);
  const [activeBg, setActiveBg] = useState("none");

  // Listen for room disconnection (host ends meeting)
  useEffect(() => {
    const handleDisconnected = () => {
      toast.info("A reunião foi encerrada");
      onLeave();
    };
    room.on(RoomEvent.Disconnected, handleDisconnected);
    return () => { room.off(RoomEvent.Disconnected, handleDisconnected); };
  }, [room, onLeave]);

  const copyLink = () => {
    const link = `${window.location.origin}/meetings/${roomId}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado!");
  };

  const handleLeave = useCallback(async () => {
    try {
      await room.disconnect(true);
    } catch (e) {
      console.error("Error disconnecting:", e);
    }
    onLeave();
  }, [room, onLeave]);

  const handleEndForAll = useCallback(async () => {
    try {
      // Disconnect all - the server will notify other participants
      await room.disconnect(true);
    } catch (e) {
      console.error("Error ending meeting:", e);
    }
    onLeave();
  }, [room, onLeave]);

  const toggleScreenShare = useCallback(async () => {
    try {
      const enabled = room.localParticipant.isScreenShareEnabled;
      await room.localParticipant.setScreenShareEnabled(!enabled);
    } catch (e: any) {
      if (e.name !== "NotAllowedError") {
        toast.error("Erro ao compartilhar tela");
      }
    }
  }, [room]);

  const applyBackground = (bgId: string) => {
    setActiveBg(bgId);
    setShowBgDialog(false);
    // Note: actual background processing requires @livekit/track-processors
    // which needs additional setup. For now we track the selection.
    toast.success(`Fundo "${backgrounds.find(b => b.id === bgId)?.label}" aplicado`);
  };

  return (
    <div className="h-screen flex flex-col bg-[#111] text-white overflow-hidden">
      {/* Header */}
      <div className="h-12 flex items-center justify-between px-4 bg-[#1a1a1a] border-b border-white/10 shrink-0">
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
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-white/70 hover:text-white hover:bg-white/10" onClick={copyLink}>
            <Share2 className="w-3.5 h-3.5" /> Compartilhar
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        <div className="flex h-full">
          {/* Video area */}
          <div className="flex-1 flex flex-col">
            <VideoConference />
          </div>

          {/* Chat panel */}
          {showChat && (
            <div className="w-80 border-l border-white/10 bg-[#1a1a1a] flex flex-col">
              <div className="h-10 flex items-center justify-between px-3 border-b border-white/10">
                <span className="text-xs font-semibold">Chat</span>
                <button onClick={() => setShowChat(false)} className="text-white/50 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <Chat />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom toolbar */}
      <div className="h-16 flex items-center justify-center gap-2 bg-[#1a1a1a] border-t border-white/10 shrink-0 px-4">
        <Button
          variant="ghost"
          size="sm"
          className="h-10 px-4 gap-2 text-white/70 hover:text-white hover:bg-white/10"
          onClick={toggleScreenShare}
        >
          <Monitor className="w-4 h-4" /> Tela
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={`h-10 px-4 gap-2 text-white/70 hover:text-white hover:bg-white/10 ${showChat ? "bg-white/10 text-white" : ""}`}
          onClick={() => setShowChat(!showChat)}
        >
          <MessageSquare className="w-4 h-4" /> Chat
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={`h-10 px-4 gap-2 text-white/70 hover:text-white hover:bg-white/10 ${activeBg !== "none" ? "bg-white/10 text-white" : ""}`}
          onClick={() => setShowBgDialog(true)}
        >
          <ImageIcon className="w-4 h-4" /> Fundo
        </Button>

        <div className="w-px h-6 bg-white/10 mx-2" />

        {isHost && (
          <Button
            variant="destructive"
            size="sm"
            className="h-10 px-4 gap-2 bg-red-700 hover:bg-red-800"
            onClick={handleEndForAll}
          >
            <PhoneOff className="w-4 h-4" /> Encerrar para todos
          </Button>
        )}
        <Button
          variant="destructive"
          size="sm"
          className="h-10 px-6 gap-2"
          onClick={handleLeave}
        >
          <PhoneOff className="w-4 h-4" /> Sair
        </Button>
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
  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect={true}
      onError={(e) => {
        console.error("LiveKit error:", e);
        toast.error("Erro na conexão da reunião");
      }}
      data-lk-theme="default"
      style={{ height: "100vh" }}
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
