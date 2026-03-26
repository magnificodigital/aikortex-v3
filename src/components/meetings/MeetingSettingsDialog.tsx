import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Settings,
  ImageIcon,
  X,
  Mic,
  Video,
  MonitorSpeaker,
} from "lucide-react";

/* ── Background / virtual scenery options ── */
const backgrounds = [
  { id: "none", label: "Nenhum", preview: null },
  { id: "blur-light", label: "Desfoque leve", preview: null },
  { id: "blur-heavy", label: "Desfoque forte", preview: null },
  { id: "gradient-blue", label: "Azul", preview: "linear-gradient(135deg,#667eea,#764ba2)" },
  { id: "gradient-green", label: "Verde", preview: "linear-gradient(135deg,#11998e,#38ef7d)" },
  { id: "gradient-sunset", label: "Pôr do sol", preview: "linear-gradient(135deg,#f093fb,#f5576c)" },
  { id: "gradient-dark", label: "Escuro", preview: "linear-gradient(135deg,#0c0c0c,#1a1a2e)" },
  { id: "gradient-ocean", label: "Oceano", preview: "linear-gradient(135deg,#2193b0,#6dd5ed)" },
  { id: "gradient-forest", label: "Floresta", preview: "linear-gradient(135deg,#134e5e,#71b280)" },
  { id: "gradient-rose", label: "Rosé", preview: "linear-gradient(135deg,#ee9ca7,#ffdde1)" },
  { id: "gradient-night", label: "Noite", preview: "linear-gradient(135deg,#0f2027,#203a43,#2c5364)" },
  { id: "gradient-fire", label: "Fogo", preview: "linear-gradient(135deg,#f12711,#f5af19)" },
  { id: "gradient-lavender", label: "Lavanda", preview: "linear-gradient(135deg,#c471f5,#fa71cd)" },
  { id: "gradient-arctic", label: "Ártico", preview: "linear-gradient(135deg,#e6dada,#274046)" },
  { id: "gradient-gold", label: "Dourado", preview: "linear-gradient(135deg,#f7971e,#ffd200)" },
  { id: "gradient-midnight", label: "Meia-noite", preview: "linear-gradient(135deg,#232526,#414345)" },
  { id: "gradient-tropical", label: "Tropical", preview: "linear-gradient(135deg,#f857a6,#ff5858)" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MeetingSettingsDialog = ({ open, onOpenChange }: Props) => {
  const [activeBg, setActiveBg] = useState("none");
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [echoCancellation, setEchoCancellation] = useState(true);
  const [mirrorVideo, setMirrorVideo] = useState(true);
  const [hdVideo, setHdVideo] = useState(false);

  const applyBackground = (bgId: string) => {
    setActiveBg(bgId);
    // Background processing would be applied to the video track here
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-[#1a1a1a] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Settings className="w-5 h-5 text-primary" /> Configurações da Reunião
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="backgrounds" className="w-full">
          <TabsList className="w-full bg-white/5 border border-white/10">
            <TabsTrigger value="backgrounds" className="flex-1 text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60">
              <ImageIcon className="w-3.5 h-3.5 mr-1.5" /> Fundos
            </TabsTrigger>
            <TabsTrigger value="audio" className="flex-1 text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60">
              <Mic className="w-3.5 h-3.5 mr-1.5" /> Áudio
            </TabsTrigger>
            <TabsTrigger value="video" className="flex-1 text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60">
              <Video className="w-3.5 h-3.5 mr-1.5" /> Vídeo
            </TabsTrigger>
          </TabsList>

          {/* Backgrounds Tab */}
          <TabsContent value="backgrounds" className="mt-4">
            <p className="text-xs text-white/50 mb-3">Escolha um cenário de fundo para sua câmera</p>
            <div className="grid grid-cols-4 gap-2 max-h-[300px] overflow-y-auto pr-1">
              {backgrounds.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => applyBackground(bg.id)}
                  className={`relative rounded-lg border-2 p-2 text-center text-[10px] transition-all hover:scale-105 ${
                    activeBg === bg.id
                      ? "border-primary bg-primary/20"
                      : "border-white/10 hover:border-white/30"
                  }`}
                >
                  <div
                    className="w-full h-10 rounded-md mb-1.5 flex items-center justify-center"
                    style={{
                      background: bg.preview || (bg.id.includes("blur") ? "rgba(255,255,255,0.08)" : "transparent"),
                    }}
                  >
                    {bg.id === "none" && <X className="w-4 h-4 text-white/40" />}
                    {bg.id === "blur-light" && <div className="w-full h-full rounded-md backdrop-blur-sm bg-white/5" />}
                    {bg.id === "blur-heavy" && <div className="w-full h-full rounded-md backdrop-blur-md bg-white/10" />}
                  </div>
                  <span className="text-white/70 leading-tight block">{bg.label}</span>
                </button>
              ))}
            </div>
          </TabsContent>

          {/* Audio Tab */}
          <TabsContent value="audio" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm text-white">Supressão de ruído</Label>
                <p className="text-[10px] text-white/40">Remove ruídos de fundo automaticamente</p>
              </div>
              <Switch checked={noiseSuppression} onCheckedChange={setNoiseSuppression} />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm text-white">Cancelamento de eco</Label>
                <p className="text-[10px] text-white/40">Evita que o áudio do alto-falante volte pelo microfone</p>
              </div>
              <Switch checked={echoCancellation} onCheckedChange={setEchoCancellation} />
            </div>
          </TabsContent>

          {/* Video Tab */}
          <TabsContent value="video" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm text-white">Espelhar vídeo</Label>
                <p className="text-[10px] text-white/40">Inverte horizontalmente sua câmera</p>
              </div>
              <Switch checked={mirrorVideo} onCheckedChange={setMirrorVideo} />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm text-white">Vídeo em HD</Label>
                <p className="text-[10px] text-white/40">Qualidade mais alta (usa mais internet)</p>
              </div>
              <Switch checked={hdVideo} onCheckedChange={setHdVideo} />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default MeetingSettingsDialog;
