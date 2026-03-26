import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useMeetings } from "@/hooks/use-meetings";
import { getLiveKitToken } from "@/lib/livekit";
import { toast } from "sonner";
import MeetingPreJoin from "@/components/meetings/MeetingPreJoin";
import MeetingRoomView from "@/components/meetings/MeetingRoomView";

export type MeetingState = "loading" | "pre-join" | "connecting" | "connected" | "error" | "ended";

const MeetingRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getMeetingByRoomId } = useMeetings();

  const [state, setState] = useState<MeetingState>("loading");
  const [error, setError] = useState<string>("");
  const [token, setToken] = useState("");
  const [wsUrl, setWsUrl] = useState("");
  const [meetingTitle, setMeetingTitle] = useState("Reunião");
  const [isHost, setIsHost] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [guestId] = useState(() => `guest-${crypto.randomUUID().slice(0, 8)}`);

  const isGuest = !user;
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!roomId) { navigate("/meetings"); return; }
    // Only run initialization once — prevent re-run when `user` ref changes (e.g. tab switch auth refresh)
    if (initializedRef.current) return;
    initializedRef.current = true;

    const load = async () => {
      try {
        const meeting = await getMeetingByRoomId(roomId);
        setMeetingTitle(meeting.title);
        if (meeting.status === "ended") {
          setState("ended");
          return;
        }
        setIsHost(!isGuest && meeting.host_user_id === user?.id);
        setDisplayName(
          isGuest
            ? ""
            : user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Participante"
        );
        setState("pre-join");
      } catch {
        // Meeting not found - allow pre-join anyway for guests
        setDisplayName(
          isGuest
            ? ""
            : user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Participante"
        );
        setState("pre-join");
      }
    };
    load();
  }, [roomId, user, isGuest, navigate, getMeetingByRoomId]);

  const handleJoin = useCallback(async (name: string) => {
    if (!roomId) return;
    setState("connecting");
    try {
      const identity = isGuest ? guestId : user!.id;
      const { token: t, url } = await getLiveKitToken(roomId, identity, name, isHost);
      setToken(t);
      setWsUrl(url);
      setState("connected");
    } catch (e: any) {
      setError(e.message || "Erro ao conectar na reunião");
      setState("error");
      toast.error("Não foi possível conectar à reunião");
    }
  }, [roomId, user, isHost, isGuest, guestId]);

  const handleLeave = useCallback(() => {
    if (isGuest) {
      window.close();
      // fallback if window.close doesn't work
      setState("ended");
    } else {
      navigate("/meetings");
    }
  }, [navigate, isGuest]);

  if (state === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">Carregando reunião...</p>
        </div>
      </div>
    );
  }

  if (state === "ended") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-bold text-foreground">Reunião Encerrada</h2>
          <p className="text-sm text-muted-foreground">Esta reunião já foi encerrada.</p>
          {!isGuest && (
            <button onClick={() => navigate("/meetings")} className="text-primary hover:underline text-sm">
              Voltar para reuniões
            </button>
          )}
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md px-4">
          <h2 className="text-xl font-bold text-destructive">Erro de Conexão</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
          <div className="flex gap-2 justify-center">
            <button onClick={() => setState("pre-join")} className="text-primary hover:underline text-sm">
              Tentar novamente
            </button>
            {!isGuest && (
              <button onClick={() => navigate("/meetings")} className="text-muted-foreground hover:underline text-sm">
                Voltar
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (state === "pre-join" || state === "connecting") {
    return (
      <MeetingPreJoin
        title={meetingTitle}
        defaultName={displayName}
        isConnecting={state === "connecting"}
        onJoin={handleJoin}
        onCancel={isGuest ? undefined : () => navigate("/meetings")}
        isGuest={isGuest}
      />
    );
  }

  return (
    <MeetingRoomView
      token={token}
      serverUrl={wsUrl}
      meetingTitle={meetingTitle}
      isHost={isHost}
      roomId={roomId!}
      onLeave={handleLeave}
    />
  );
};

export default MeetingRoom;
