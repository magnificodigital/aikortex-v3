import { useCallback, useState } from "react";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  ControlBar,
  useTracks,
  useParticipants,
  useRoomContext,
  GridLayout,
  ParticipantTile,
  Chat,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track, RoomEvent } from "livekit-client";
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
} from "lucide-react";
import { toast } from "sonner";

interface Props {
  token: string;
  serverUrl: string;
  meetingTitle: string;
  isHost: boolean;
  roomId: string;
  onLeave: () => void;
}

const MeetingRoomView = ({ token, serverUrl, meetingTitle, isHost, roomId, onLeave }: Props) => {
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);

  const copyLink = () => {
    const link = `${window.location.origin}/meetings/${roomId}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado!");
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
        <LiveKitRoom
          token={token}
          serverUrl={serverUrl}
          connect={true}
          onDisconnected={onLeave}
          onError={(e) => {
            console.error("LiveKit error:", e);
            toast.error("Erro na conexão da reunião");
          }}
          data-lk-theme="default"
          style={{ height: "100%" }}
        >
          <div className="flex h-full">
            {/* Video area */}
            <div className="flex-1 flex flex-col">
              <VideoConference />
            </div>

            {/* Side panels */}
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
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>

      {/* Bottom toolbar */}
      <div className="h-16 flex items-center justify-center gap-2 bg-[#1a1a1a] border-t border-white/10 shrink-0 px-4">
        <Button
          variant="ghost"
          size="sm"
          className={`h-10 px-4 gap-2 text-white/70 hover:text-white hover:bg-white/10 ${showParticipants ? "bg-white/10 text-white" : ""}`}
          onClick={() => { setShowParticipants(!showParticipants); setShowChat(false); }}
        >
          <Users className="w-4 h-4" /> Participantes
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={`h-10 px-4 gap-2 text-white/70 hover:text-white hover:bg-white/10 ${showChat ? "bg-white/10 text-white" : ""}`}
          onClick={() => { setShowChat(!showChat); setShowParticipants(false); }}
        >
          <MessageSquare className="w-4 h-4" /> Chat
        </Button>
        <div className="w-px h-6 bg-white/10 mx-2" />
        <Button
          variant="destructive"
          size="sm"
          className="h-10 px-6 gap-2"
          onClick={onLeave}
        >
          <PhoneOff className="w-4 h-4" /> Sair
        </Button>
      </div>
    </div>
  );
};

export default MeetingRoomView;
