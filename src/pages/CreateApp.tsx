import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Check, Loader2, Search, ChevronLeft, ChevronRight, MessageSquare, Database as DbIcon,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

/* ─── types ─── */
type Step = 1 | 2 | 3 | 4;
type OnboardingLevel = "none" | "soft" | "strict";
type AppChannel = "whatsapp" | "web";

interface CalibrationMsg {
  type: "client" | "agent";
  text: string;
}
interface CalibrationEvent {
  kind: "status" | "messages" | "result";
  label?: string;
  done?: boolean;
  messages?: CalibrationMsg[];
  success?: boolean;
}

/* ─── templates ─── */
const templates = [
  { name: "Qualificador de Leads", tag: "lead_qualifier", desc: "Qualifica leads automaticamente via WhatsApp, coletando informações essenciais." },
  { name: "Agendador de Consultas", tag: "appointment_scheduler", desc: "Agenda consultas e compromissos automaticamente via WhatsApp." },
  { name: "Suporte ao Cliente", tag: "customer_support", desc: "Atende clientes via WhatsApp, respondendo dúvidas e resolvendo problemas." },
  { name: "Rastreador de Pedidos", tag: "order_tracker", desc: "Permite que clientes acompanhem pedidos pelo WhatsApp." },
  { name: "Agente de FAQ", tag: "faq_agent", desc: "Responde perguntas frequentes sobre produtos, serviços e políticas." },
  { name: "Assistente de Pipeline", tag: "operations_manager", desc: "Assistente interno para equipes de vendas, consultando status do pipeline." },
  { name: "Controle Financeiro", tag: "finance_tracker", desc: "Controla gastos e receitas via WhatsApp. Analisa fotos de recibos." },
  { name: "Fluxo de Aprovação", tag: "operations_manager", desc: "Coordena solicitações internas de aprovação e registra decisões." },
  { name: "Onboarding de Clientes", tag: "onboarding", desc: "Guia novos clientes pelo processo de ativação da plataforma." },
];

const TEMPLATES_PER_PAGE = 6;

/* ─── step labels ─── */
const stepLabels = ["Descrever", "Personalizar", "Calibrar", "Criar"];

/* ─── component ─── */
const CreateApp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locState = location.state as any;
  const channel: AppChannel = locState?.channel || "whatsapp";

  const [step, setStep] = useState<Step>(1);

  // Step 1
  const [companyName, setCompanyName] = useState("");
  const [prompt, setPrompt] = useState(locState?.initialPrompt || "");
  const [templateSearch, setTemplateSearch] = useState("");
  const [templatePage, setTemplatePage] = useState(0);

  // Step 2
  const [appName, setAppName] = useState("");
  const [tone, setTone] = useState("professional_friendly");
  const [language, setLanguage] = useState("pt-BR");
  const [maxMessages, setMaxMessages] = useState(2);
  const [introMessage, setIntroMessage] = useState("");
  const [onboarding, setOnboarding] = useState<OnboardingLevel>("soft");

  // Step 3
  const [calibrating, setCalibrating] = useState(false);
  const [calibrationEvents, setCalibrationEvents] = useState<CalibrationEvent[]>([]);
  const [calibrationDone, setCalibrationDone] = useState(false);

  // Step 4
  const [creating, setCreating] = useState(false);

  /* ─── template filtering ─── */
  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
      t.tag.toLowerCase().includes(templateSearch.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filteredTemplates.length / TEMPLATES_PER_PAGE));
  const pagedTemplates = filteredTemplates.slice(
    templatePage * TEMPLATES_PER_PAGE,
    (templatePage + 1) * TEMPLATES_PER_PAGE
  );

  /* ─── handlers ─── */
  const handleGenerate = () => {
    if (prompt.length < 20) {
      toast.error("Descreva seu app com pelo menos 20 caracteres.");
      return;
    }
    // Auto-fill step 2 defaults based on prompt
    const inferredName = companyName
      ? `Assistente ${companyName}`
      : "Meu App WhatsApp";
    setAppName(inferredName);
    setIntroMessage(
      `Olá! Sou o assistente da ${companyName || "sua empresa"}. Como posso ajudar?`
    );
    setStep(2);
  };

  const handleUseTemplate = (t: (typeof templates)[0]) => {
    setPrompt(t.desc);
    setCompanyName("");
    setAppName(t.name);
    setIntroMessage(`Olá! Sou o ${t.name}. Como posso ajudar?`);
    setStep(2);
  };

  const handlePersonalizeDone = () => {
    if (!appName.trim()) {
      toast.error("Informe o nome do app.");
      return;
    }
    setStep(3);
    runCalibration();
  };

  const runCalibration = async () => {
    setCalibrating(true);
    setCalibrationEvents([]);
    setCalibrationDone(false);

    // Simulated calibration events
    const events: CalibrationEvent[] = [
      { kind: "status", label: "Calibração iniciada", done: true },
      { kind: "status", label: "Rodada 1 de 2", done: true },
      { kind: "status", label: "Gerando cenário de teste...", done: true },
      {
        kind: "messages",
        label: "Enviando mensagem de teste 1 de 2...",
        messages: [
          { type: "client", text: "Oi, gostaria de saber mais sobre os serviços." },
          { type: "agent", text: introMessage || "Olá! Como posso ajudar?" },
        ],
      },
      { kind: "status", label: "Analisando registros na base de dados..." },
      { kind: "status", label: "Gerando cenário de teste...", done: true },
      {
        kind: "messages",
        label: "Enviando mensagem de teste 2 de 2...",
        messages: [
          { type: "client", text: "Pode me dar mais detalhes, por favor." },
          { type: "agent", text: "Claro! Posso ajudar com mais informações. O que precisa saber?" },
        ],
      },
      { kind: "status", label: "Analisando registros na base de dados..." },
      { kind: "result", label: "Todos os testes passaram (2/2)", success: true },
    ];

    for (let i = 0; i < events.length; i++) {
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));
      setCalibrationEvents((prev) => [...prev, events[i]]);
    }

    setCalibrating(false);
    setCalibrationDone(true);
  };

  const handleFinishCalibration = () => {
    setStep(4);
    handleCreate();
  };

  const handleCreate = async () => {
    setCreating(true);
    await new Promise((r) => setTimeout(r, 1500));
    setCreating(false);
    // Navigate to app-builder with collected data
    navigate("/app-builder", {
      state: {
        channel,
        initialPrompt: prompt,
        prefill: {
          appName,
          tone,
          language,
          maxMessages,
          introMessage,
          onboarding,
          companyName,
        },
      },
    });
  };

  /* ─── stepper ─── */
  const Stepper = () => (
    <div className="flex items-center w-full max-w-2xl mx-auto mb-8">
      {stepLabels.map((label, i) => {
        const s = (i + 1) as Step;
        const isActive = step === s;
        const isDone = step > s;
        return (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isDone
                    ? "bg-primary text-primary-foreground"
                    : isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : s}
              </div>
              <span
                className={`text-sm font-medium ${
                  isActive ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </div>
            {i < stepLabels.length - 1 && (
              <div
                className={`flex-1 h-px mx-3 ${
                  step > s ? "bg-primary" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-foreground mb-6">Criar App</h1>
        <Stepper />

        {/* ─── STEP 1: Descrever ─── */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">Descreva seu app</h2>
              <p className="text-sm text-muted-foreground">
                Diga o que você quer que seu {channel === "whatsapp" ? "WhatsApp" : "Web"} app faça. Nossa IA vai construir para você.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Nome da empresa ou app (opcional)
              </label>
              <Input
                placeholder="ex. Clínica Dental São Paulo"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="bg-card border-border"
              />
            </div>

            <div className="space-y-1.5">
              <Textarea
                placeholder={`Peça à Aikortex para: criar um agente que ensina inglês e corrige exercícios enviados pelos usuários...`}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="bg-card border-border min-h-[160px] resize-none"
                maxLength={20000}
              />
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Mínimo 20 caracteres</span>
                <span>{prompt.length}/20000</span>
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={prompt.length < 20}
              className="gap-2 rounded-full"
            >
              <Sparkles className="w-4 h-4" />
              Gerar meu app
            </Button>

            {/* Templates section */}
            <div className="mt-10 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Ou comece por um exemplo</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <button
                    onClick={() => setTemplatePage(Math.max(0, templatePage - 1))}
                    disabled={templatePage === 0}
                    className="p-1 hover:text-foreground disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span>
                    {templatePage + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => setTemplatePage(Math.min(totalPages - 1, templatePage + 1))}
                    disabled={templatePage >= totalPages - 1}
                    className="p-1 hover:text-foreground disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou categoria..."
                  value={templateSearch}
                  onChange={(e) => {
                    setTemplateSearch(e.target.value);
                    setTemplatePage(0);
                  }}
                  className="pl-9 bg-card border-border"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {pagedTemplates.map((t) => (
                  <button
                    key={t.name + t.tag}
                    onClick={() => handleUseTemplate(t)}
                    className="text-left rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-sm font-bold text-foreground">{t.name}</h3>
                      <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full border border-border text-muted-foreground">
                        {t.tag}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {t.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── STEP 2: Personalizar ─── */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">Personalize seu app</h2>
              <p className="text-sm text-muted-foreground">
                Ajuste as configurações geradas pela IA antes de continuar. Você pode alterar depois.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Nome do app</label>
              <Input
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="bg-card border-border"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Tom</label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="bg-card border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional_friendly">Profissional e Amigável</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="casual">Casual e Descontraído</SelectItem>
                  <SelectItem value="empathetic">Empático e Acolhedor</SelectItem>
                  <SelectItem value="direct">Direto e Objetivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Idioma padrão</label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="bg-card border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Máx. mensagens por turno</label>
              <p className="text-xs text-muted-foreground">
                Quantas mensagens o app pode enviar em uma única resposta.
              </p>
              <div className="flex gap-2">
                {[1, 2, 3].map((n) => (
                  <button
                    key={n}
                    onClick={() => setMaxMessages(n)}
                    className={`w-10 h-10 rounded-lg border text-sm font-medium transition-all ${
                      maxMessages === n
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Mensagem de introdução</label>
              <p className="text-xs text-muted-foreground">
                Enviada como parte da primeira resposta quando um usuário inicia uma conversa.
              </p>
              <Textarea
                value={introMessage}
                onChange={(e) => setIntroMessage(e.target.value)}
                className="bg-card border-border min-h-[100px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Aplicação do Onboarding</label>
              <p className="text-xs text-muted-foreground">
                Controla o quão rigorosamente o agente segue as etapas de coleta de dados.
              </p>
              <div className="grid grid-cols-3 gap-3">
                {([
                  {
                    value: "none" as OnboardingLevel,
                    label: "Nenhum",
                    desc: "Agente responde livremente sem coletar dados do cliente primeiro",
                  },
                  {
                    value: "soft" as OnboardingLevel,
                    label: "Suave",
                    desc: "Agente coleta informações do cliente naturalmente durante a conversa",
                  },
                  {
                    value: "strict" as OnboardingLevel,
                    label: "Rigoroso",
                    desc: "Agente deve coletar todas as informações antes de prestar o serviço",
                  },
                ]).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setOnboarding(opt.value)}
                    className={`text-left rounded-xl border p-3 transition-all ${
                      onboarding === opt.value
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-primary/30"
                    }`}
                  >
                    <p className="text-sm font-semibold text-foreground mb-1">{opt.label}</p>
                    <p className="text-[11px] text-muted-foreground leading-snug">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep(1)} className="gap-2 rounded-full">
                Voltar
              </Button>
              <Button onClick={handlePersonalizeDone} className="gap-2 rounded-full">
                Salvar e Continuar
              </Button>
            </div>
          </div>
        )}

        {/* ─── STEP 3: Calibrar ─── */}
        {step === 3 && (
          <div className="space-y-6 text-center">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">Calibrando seu agente</h2>
              <p className="text-sm text-muted-foreground">
                Testando seu agente com uma conversa real para garantir que tudo funciona.
              </p>
            </div>

            <div className="text-left space-y-3 max-w-xl mx-auto">
              {calibrationEvents.map((ev, i) => (
                <div key={i}>
                  {ev.kind === "status" && (
                    <div className="flex items-center gap-2 text-sm">
                      {ev.done ? (
                        <Check className="w-4 h-4 text-primary" />
                      ) : (
                        <DbIcon className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className={ev.done ? "text-foreground" : "text-muted-foreground"}>
                        {ev.label}
                      </span>
                    </div>
                  )}
                  {ev.kind === "messages" && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MessageSquare className="w-4 h-4" />
                        {ev.label}
                      </div>
                      {ev.messages?.map((msg, j) => (
                        <div
                          key={j}
                          className="rounded-lg border border-border bg-card p-3 ml-6"
                        >
                          <p className="text-[10px] text-muted-foreground mb-1 font-medium">
                            {msg.type === "client" ? "Mensagem do cliente:" : "Resposta do agente:"}
                          </p>
                          <p className="text-sm text-foreground">{msg.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {ev.kind === "result" && (
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary" />
                      <span className="text-primary font-medium">{ev.label}</span>
                    </div>
                  )}
                </div>
              ))}

              {calibrating && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processando...
                </div>
              )}
            </div>

            {calibrationDone && (
              <div className="space-y-4 max-w-xl mx-auto">
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-center gap-3">
                  <Check className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    Agente calibrado com sucesso!
                  </span>
                </div>
                <Button onClick={handleFinishCalibration} className="rounded-full">
                  Continuar
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ─── STEP 4: Criar ─── */}
        {step === 4 && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            {creating ? (
              <>
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Criando seu app...</p>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Check className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">App pronto!</h2>
                <p className="text-sm text-muted-foreground">
                  Redirecionando para o Studio...
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CreateApp;
