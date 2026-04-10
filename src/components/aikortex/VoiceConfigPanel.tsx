import { useState, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus, Trash2, PhoneIncoming, PhoneOutgoing,
  Phone, MessageSquare, Webhook, Calendar, Clock,
  Play, Square, AlertTriangle, Loader2,
} from "lucide-react";
import { useElevenLabsVoices } from "@/hooks/use-elevenlabs-voices";

export interface VoiceConfig {
  agentName: string;
  voiceId: string;
  language: string;
  profile: string;
  companyInfo: string;
  tone: number;
  speed: number;
  volume: number;
  responsiveness: number;
  interruptionSensitivity: number;
  maxCallDuration: number;
  waitTime: number;
  endCallOnSilence: number;
  agentSpeaksFirst: boolean;
  confirmationPhrases: boolean;
  callType: "inbound" | "outbound";
  phoneNumber: string;
  ambientSound: string;
  keywords: string;
  pronunciations: Array<{ word: string; pronunciation: string }>;
  recordCalls: boolean;
  actions: string[];
}

export const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  agentName: "",
  voiceId: "EXAVITQu4vr4xnSDxMaL",
  language: "pt-BR",
  profile: "",
  companyInfo: "",
  tone: 1.0,
  speed: 1.0,
  volume: 1.0,
  responsiveness: 1.0,
  interruptionSensitivity: 0.86,
  maxCallDuration: 60,
  waitTime: 30,
  endCallOnSilence: 30,
  agentSpeaksFirst: true,
  confirmationPhrases: true,
  callType: "inbound",
  phoneNumber: "",
  ambientSound: "none",
  keywords: "",
  pronunciations: [],
  recordCalls: false,
  actions: [],
};

const FALLBACK_VOICES = [
  { voice_id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah" },
  { voice_id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura" },
  { voice_id: "IKne3meq5aSn9XLyUdCD", name: "Charlie" },
  { voice_id: "JBFqnCBsd6RMkjVDRZzb", name: "George" },
  { voice_id: "CwhRBWXzGAHq8TQ4Fs17", name: "Roger" },
  { voice_id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam" },
  { voice_id: "Xb7hH8MSUJpSbSDYk0k2", name: "Alice" },
  { voice_id: "XrExE9yKIg1WjnnlVkGX", name: "Matilda" },
  { voice_id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily" },
  { voice_id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel" },
];

const LANGUAGES = [
  { value: "pt-BR", label: "Português (Brasil)" },
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "it", label: "Italiano" },
];

const AMBIENT_SOUNDS = [
  { value: "none", label: "Nenhum" },
  { value: "office", label: "Escritório" },
  { value: "cafe", label: "Café" },
  { value: "nature", label: "Natureza" },
  { value: "outdoor", label: "Montanha ao Ar Livre" },
  { value: "rain", label: "Chuva" },
];

const CALL_ACTIONS = [
  { id: "end_call", label: "Encerrar chamada (condição)", icon: Phone },
  { id: "transfer", label: "Transferir para humano", icon: PhoneOutgoing },
  { id: "send_sms", label: "Enviar SMS", icon: MessageSquare },
  { id: "webhook", label: "Chamar Webhook", icon: Webhook },
  { id: "schedule_appointment", label: "Agendar compromisso", icon: Calendar },
  { id: "schedule_call", label: "Agendar ligação futura", icon: Clock },
];

interface Props {
  config: VoiceConfig;
  onChange: (config: VoiceConfig) => void;
}

const SliderField = ({
  label, value, min, max, step, onChange,
}: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <Label className="text-xs">{label}</Label>
      <span className="text-xs text-muted-foreground font-mono">{value.toFixed(2)}</span>
    </div>
    <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)} />
  </div>
);

const VoiceConfigPanel = ({ config, onChange }: Props) => {
  const { voices, loading: voicesLoading, hasKey, error: voicesError } = useElevenLabsVoices();
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const update = useCallback(<K extends keyof VoiceConfig>(key: K, value: VoiceConfig[K]) => {
    onChange({ ...config, [key]: value });
  }, [config, onChange]);

  const voiceList = hasKey && voices.length > 0
    ? voices.map(v => ({ voice_id: v.voice_id, name: v.name, preview_url: v.preview_url }))
    : FALLBACK_VOICES.map(v => ({ ...v, preview_url: null as string | null }));

  const playPreview = (voiceId: string, previewUrl: string | null) => {
    if (playingVoice === voiceId) {
      audioRef.current?.pause();
      setPlayingVoice(null);
      return;
    }
    if (!previewUrl) return;
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(previewUrl);
    audioRef.current = audio;
    setPlayingVoice(voiceId);
    audio.play();
    audio.onended = () => setPlayingVoice(null);
  };

  const addPronunciation = () => {
    update("pronunciations", [...config.pronunciations, { word: "", pronunciation: "" }]);
  };

  const removePronunciation = (idx: number) => {
    update("pronunciations", config.pronunciations.filter((_, i) => i !== idx));
  };

  const updatePronunciation = (idx: number, field: "word" | "pronunciation", value: string) => {
    const next = [...config.pronunciations];
    next[idx] = { ...next[idx], [field]: value };
    update("pronunciations", next);
  };

  const toggleAction = (actionId: string) => {
    const next = config.actions.includes(actionId)
      ? config.actions.filter(a => a !== actionId)
      : [...config.actions, actionId];
    update("actions", next);
  };

  const selectedVoice = voiceList.find(v => v.voice_id === config.voiceId);

  return (
    <ScrollArea className="flex-1">
      <div className="p-4 space-y-6">

        {/* ── Identidade de Voz ── */}
        <section className="space-y-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Identidade de Voz</h3>

          {!hasKey && !voicesLoading && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg border border-yellow-500/30 bg-yellow-500/5 text-xs text-yellow-600 dark:text-yellow-400">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>Configure sua chave ElevenLabs em <strong>Integrações</strong> para carregar suas vozes.</span>
            </div>
          )}

          {hasKey && voicesError && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg border border-yellow-500/30 bg-yellow-500/5 text-xs text-yellow-600 dark:text-yellow-400">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{voicesError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">Nome do Agente</Label>
            <Input value={config.agentName} onChange={e => update("agentName", e.target.value)} placeholder="Ex: Maia" className="h-8 text-xs" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Selecionar Voz</Label>
            {voicesLoading ? (
              <div className="flex items-center gap-2 h-8 text-xs text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Carregando vozes...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Select value={config.voiceId} onValueChange={v => update("voiceId", v)}>
                  <SelectTrigger className="h-8 text-xs flex-1"><SelectValue placeholder="Escolha uma voz" /></SelectTrigger>
                  <SelectContent>
                    {voiceList.map(v => <SelectItem key={v.voice_id} value={v.voice_id}>{v.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {selectedVoice?.preview_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5 text-xs gap-1.5 shrink-0"
                    onClick={() => playPreview(config.voiceId, selectedVoice.preview_url)}
                  >
                    {playingVoice === config.voiceId ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    {playingVoice === config.voiceId ? "Parar" : "Testar"}
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Idioma</Label>
            <Select value={config.language} onValueChange={v => update("language", v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Perfil</Label>
            <Textarea value={config.profile} onChange={e => update("profile", e.target.value)} placeholder="Ex: Concierge de Viagens" className="min-h-[60px] text-xs" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Informações da Empresa</Label>
            <Textarea value={config.companyInfo} onChange={e => update("companyInfo", e.target.value)} placeholder="Descreva sua empresa..." className="min-h-[60px] text-xs" />
          </div>
        </section>

        {/* ── Configurações de Voz ── */}
        <section className="space-y-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Configurações de Voz</h3>
          <SliderField label="Tom de Voz" value={config.tone} min={0.5} max={2.0} step={0.05} onChange={v => update("tone", v)} />
          <SliderField label="Velocidade da Voz" value={config.speed} min={0.5} max={2.0} step={0.05} onChange={v => update("speed", v)} />
          <SliderField label="Volume da Voz" value={config.volume} min={0} max={1} step={0.05} onChange={v => update("volume", v)} />
          <SliderField label="Responsividade" value={config.responsiveness} min={0} max={1} step={0.05} onChange={v => update("responsiveness", v)} />
          <SliderField label="Sensibilidade à Interrupção" value={config.interruptionSensitivity} min={0} max={1} step={0.01} onChange={v => update("interruptionSensitivity", v)} />
        </section>

        {/* ── Comportamento da Ligação ── */}
        <section className="space-y-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Comportamento da Ligação</h3>

          <div className="space-y-1.5">
            <Label className="text-xs">Duração Máxima</Label>
            <Select value={String(config.maxCallDuration)} onValueChange={v => update("maxCallDuration", Number(v))}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[15, 30, 45, 60, 90, 120].map(d => <SelectItem key={d} value={String(d)}>{d} min</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Tempo de Espera com beep</Label>
            <Select value={String(config.waitTime)} onValueChange={v => update("waitTime", Number(v))}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[15, 30, 45, 60].map(d => <SelectItem key={d} value={String(d)}>{d}s</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Encerrar após silêncio (segundos)</Label>
            <Input type="number" min={10} value={config.endCallOnSilence} onChange={e => update("endCallOnSilence", Math.max(10, Number(e.target.value)))} className="h-8 text-xs" />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs">Quem fala primeiro</Label>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] ${config.agentSpeaksFirst ? "text-primary font-medium" : "text-muted-foreground"}`}>Agente</span>
              <Switch checked={!config.agentSpeaksFirst} onCheckedChange={v => update("agentSpeaksFirst", !v)} />
              <span className={`text-[10px] ${!config.agentSpeaksFirst ? "text-primary font-medium" : "text-muted-foreground"}`}>Usuário</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label className="text-xs">Falas de Confirmação</Label>
              <p className="text-[10px] text-muted-foreground">Palavras como "aham", "entendi"</p>
            </div>
            <Switch checked={config.confirmationPhrases} onCheckedChange={v => update("confirmationPhrases", v)} />
          </div>
        </section>

        {/* ── Tipo de Ligação ── */}
        <section className="space-y-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tipo de Ligação</h3>
          <div className="flex gap-2">
            <Button
              variant={config.callType === "inbound" ? "default" : "outline"}
              size="sm"
              className="flex-1 h-8 text-xs gap-1.5"
              onClick={() => update("callType", "inbound")}
            >
              <PhoneIncoming className="w-3.5 h-3.5" /> Inbound
            </Button>
            <Button
              variant={config.callType === "outbound" ? "default" : "outline"}
              size="sm"
              className="flex-1 h-8 text-xs gap-1.5"
              onClick={() => update("callType", "outbound")}
            >
              <PhoneOutgoing className="w-3.5 h-3.5" /> Outbound
            </Button>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">
              {config.callType === "inbound" ? "Número para receber chamadas" : "Número de destino"}
            </Label>
            <Input value={config.phoneNumber} onChange={e => update("phoneNumber", e.target.value)} placeholder="+55 11 99999-9999" className="h-8 text-xs" />
          </div>
        </section>

        {/* ── Som do Ambiente ── */}
        <section className="space-y-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Som do Ambiente</h3>
          <Select value={config.ambientSound} onValueChange={v => update("ambientSound", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {AMBIENT_SOUNDS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </section>

        {/* ── Palavras-chave Otimizadas ── */}
        <section className="space-y-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Palavras-chave Otimizadas</h3>
          <Textarea
            value={config.keywords}
            onChange={e => update("keywords", e.target.value)}
            placeholder="Palavras separadas por vírgula..."
            className="min-h-[50px] text-xs"
          />
          <p className="text-[10px] text-muted-foreground">Nomes, marcas e termos técnicos para otimizar a transcrição.</p>
        </section>

        {/* ── Pronúncia Personalizada ── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Pronúncia Personalizada</h3>
            <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={addPronunciation}>
              <Plus className="w-3 h-3" /> Adicionar
            </Button>
          </div>
          {config.pronunciations.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input value={p.word} onChange={e => updatePronunciation(i, "word", e.target.value)} placeholder="Palavra" className="h-7 text-xs flex-1" />
              <span className="text-xs text-muted-foreground">→</span>
              <Input value={p.pronunciation} onChange={e => updatePronunciation(i, "pronunciation", e.target.value)} placeholder="Pronúncia" className="h-7 text-xs flex-1" />
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removePronunciation(i)}>
                <Trash2 className="w-3 h-3 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </section>

        {/* ── Ações da Ligação ── */}
        <section className="space-y-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Ações da Ligação</h3>
          <div className="grid grid-cols-2 gap-2">
            {CALL_ACTIONS.map(action => {
              const isActive = config.actions.includes(action.id);
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => toggleAction(action.id)}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border text-left text-[11px] transition-all ${
                    isActive
                      ? "border-primary/30 bg-primary/5 text-foreground"
                      : "border-border bg-card/50 text-muted-foreground hover:border-primary/20"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="leading-tight">{action.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Gravações ── */}
        <section className="space-y-3 pb-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Gravações</h3>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs">Gravar ligações</Label>
              <p className="text-[10px] text-muted-foreground">Salvar gravações para revisão</p>
            </div>
            <Switch checked={config.recordCalls} onCheckedChange={v => update("recordCalls", v)} />
          </div>
        </section>

      </div>
    </ScrollArea>
  );
};

export default VoiceConfigPanel;
