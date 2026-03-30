import { useMemo, useState, useEffect } from "react";
import {
  Phone, Bot, Send, BarChart3, Settings, Users, Calendar,
  MessageSquare, Search, Globe, Zap, Monitor, Smartphone,
  FileCode, Database, Layout, Code2, ArrowRight,
} from "lucide-react";
import { useAppBuilder, GeneratedFile } from "@/contexts/AppBuilderContext";
import { Badge } from "@/components/ui/badge";

/* ── Helpers to extract real content from generated files ── */

function extractFromFile(files: GeneratedFile[], pathIncludes: string): GeneratedFile | undefined {
  return files.find(f => f.path.toLowerCase().includes(pathIncludes.toLowerCase()) || f.name.toLowerCase().includes(pathIncludes.toLowerCase()));
}

function extractStringsFromCode(code: string, pattern: RegExp): string[] {
  const results: string[] = [];
  let match;
  while ((match = pattern.exec(code)) !== null) {
    results.push(match[1]);
  }
  return results;
}

function extractGreeting(files: GeneratedFile[]): string {
  for (const f of files) {
    const greetMatch = f.content.match(/(?:greeting|intro|saudação|welcome|olá|oi)[^"]*["'`]([^"'`]{10,}?)["'`]/i);
    if (greetMatch) return greetMatch[1];
    const msgMatch = f.content.match(/sendText\([^,]+,\s*["'`]([^"'`]{10,}?)["'`]/i);
    if (msgMatch) return msgMatch[1];
  }
  return "";
}

function extractBotName(files: GeneratedFile[], fallback: string): string {
  for (const f of files) {
    const match = f.content.match(/botName[:\s=]*["'`]([^"'`]+)["'`]/i)
      || f.content.match(/name[:\s=]*["'`]([^"'`]+)["'`]/i);
    if (match && match[1].length > 2 && match[1].length < 40) return match[1];
  }
  return fallback;
}

function extractQuickReplies(files: GeneratedFile[]): string[] {
  for (const f of files) {
    const match = f.content.match(/(?:buttons|quick_?replies|options|botões)\s*[:=]\s*\[([\s\S]*?)\]/i);
    if (match) {
      return extractStringsFromCode(match[1], /["'`]([^"'`]+)["'`]/g).slice(0, 4);
    }
    const btnMatch = f.content.match(/sendButtons\([^,]+,[^,]+,\s*\[([\s\S]*?)\]/i);
    if (btnMatch) {
      return extractStringsFromCode(btnMatch[1], /["'`]([^"'`]+)["'`]/g).slice(0, 4);
    }
  }
  return [];
}

function extractStages(files: GeneratedFile[]): string[] {
  for (const f of files) {
    const match = f.content.match(/(?:stages|etapas|steps|fluxo|jornada)\s*[:=]\s*\[([\s\S]*?)\]/i);
    if (match) {
      return extractStringsFromCode(match[1], /["'`]([^"'`]+)["'`]/g).slice(0, 6);
    }
    const qMatch = f.content.match(/questions\s*=\s*\[([\s\S]*?)\]/i);
    if (qMatch) {
      return extractStringsFromCode(qMatch[1], /["'`]([^"'`]{5,})["'`]/g).slice(0, 5);
    }
  }
  return [];
}

function extractNavItems(files: GeneratedFile[]): string[] {
  for (const f of files) {
    const routeMatches = extractStringsFromCode(f.content, /path[:\s=]*["'`]\/([^"'`]+)["'`]/g);
    if (routeMatches.length > 1) return routeMatches.map(r => r.charAt(0).toUpperCase() + r.slice(1)).slice(0, 6);
    const navMatches = extractStringsFromCode(f.content, /(?:label|title|text)[:\s=]*["'`]([^"'`]+)["'`]/g);
    if (navMatches.length > 1) return navMatches.slice(0, 6);
  }
  return [];
}

function extractMetricsFromCode(files: GeneratedFile[]): { label: string; value: string }[] {
  const results: { label: string; value: string }[] = [];
  for (const f of files) {
    const match = f.content.match(/(?:title|label)[:\s=]*["'`]([^"'`]+)["'`][\s\S]*?(?:value)[:\s=]*["'`]([^"'`]+)["'`]/gi);
    if (match) {
      for (const m of match) {
        const titleMatch = m.match(/(?:title|label)[:\s=]*["'`]([^"'`]+)["'`]/i);
        const valueMatch = m.match(/value[:\s=]*["'`]([^"'`]+)["'`]/i);
        if (titleMatch && valueMatch) {
          results.push({ label: titleMatch[1], value: valueMatch[1] });
        }
      }
    }
  }
  return results.slice(0, 4);
}

/* ── Mock bot responses from real file content ── */
function buildMockResponses(
  files: GeneratedFile[],
  wizardIntro?: string,
  features?: string[],
  botName?: string,
): Record<string, string> {
  const name = botName || "Assistente";
  const featureList = features && features.length > 0 ? features : [];

  // Build contextual default responses
  const contextualDefaults = [
    featureList.length > 0
      ? `Posso te ajudar com: ${featureList.slice(0, 3).join(", ")}. Qual delas você precisa?`
      : `Ótimo! Como posso te ajudar hoje?`,
    `Entendido! Deixa eu verificar isso para você. 🔍`,
    `Perfeito! Vou te guiar nesse processo. Primeiro, preciso de algumas informações.`,
    `Claro! Esse é um dos meus pontos fortes. Me conta mais detalhes.`,
    `Sem problemas! Vamos resolver isso juntos. 💪`,
  ];

  // Feature-specific responses
  const featureResponses: Record<string, string> = {};
  const featureKeywords: Record<string, string[]> = {
    "agendamento": ["agendar", "horário", "agenda", "marcar", "consulta", "reservar"],
    "triagem": ["triagem", "avaliação", "avaliar", "diagnóstico"],
    "suporte": ["ajuda", "suporte", "problema", "erro", "dúvida", "help"],
    "preços": ["preço", "valor", "custo", "quanto", "plano", "tabela"],
    "check-in": ["check", "checkin", "acompanhamento", "retorno"],
    "cadastro": ["cadastrar", "registrar", "cadastro", "registro", "conta"],
    "pedido": ["pedido", "comprar", "compra", "encomendar", "pedir"],
    "cardápio": ["cardápio", "menu", "opções", "pratos"],
    "pagamento": ["pagar", "pagamento", "pix", "cartão", "boleto"],
    "delivery": ["entrega", "delivery", "envio", "frete"],
    "refeição": ["refeição", "comida", "almoço", "jantar", "lanche"],
    "nutrição": ["nutrição", "dieta", "alimentação", "nutricional", "calorias"],
  };

  for (const [feature, keywords] of Object.entries(featureKeywords)) {
    const isRelevant = featureList.some(f => f.toLowerCase().includes(feature)) || featureList.length === 0;
    if (isRelevant) {
      for (const kw of keywords) {
        featureResponses[kw] = `Claro! Vou te ajudar com ${feature}. Me passa os detalhes para eu dar andamento. 📋`;
      }
    }
  }

  // Common greetings
  const greetingResponses: Record<string, string> = {
    "oi": `Olá! 😊 Sou o ${name}. Como posso te ajudar?`,
    "olá": `Oi! 👋 Que bom te ver aqui. Em que posso ajudar?`,
    "bom dia": `Bom dia! ☀️ Estou aqui para te ajudar. O que precisa?`,
    "boa tarde": `Boa tarde! 🌤️ Como posso ser útil?`,
    "boa noite": `Boa noite! 🌙 Em que posso ajudar?`,
    "obrigado": `De nada! 😊 Precisa de mais alguma coisa?`,
    "obrigada": `Por nada! 😊 Estou aqui se precisar de algo mais.`,
    "tchau": `Até logo! 👋 Foi um prazer ajudar. Volte quando precisar!`,
    "sim": `Ótimo! Vamos lá então. Me conta mais detalhes.`,
    "não": `Tudo bem! Se mudar de ideia, estou por aqui. 😊`,
  };

  // Extract from files too
  const fromFiles: Record<string, string> = {};
  for (const f of files) {
    const responseMatches = f.content.matchAll(/(?:sendText|reply|respond)\s*\([^,]*,\s*["'`]([^"'`]{10,})["'`]/gi);
    for (const m of responseMatches) {
      const text = m[1];
      const keyword = text.split(/\s+/).slice(0, 2).join(" ").toLowerCase();
      fromFiles[keyword] = text;
    }
  }

  return {
    ...featureResponses,
    ...greetingResponses,
    ...fromFiles,
    default: contextualDefaults[0],
    _contextualDefaults: contextualDefaults as any, // used for rotation
  };
}

let responseRotation = 0;

const toneEmoji: Record<string, string> = {
  professional_friendly: "🤝",
  formal: "👔",
  casual: "😄",
  empathetic: "💙",
  direct: "⚡",
};

const toneLabels: Record<string, string> = {
  professional_friendly: "Profissional e Amigável",
  formal: "Formal",
  casual: "Casual e Descontraído",
  empathetic: "Empático e Acolhedor",
  direct: "Direto e Objetivo",
};

/* ── WhatsApp Preview ── */

const WhatsAppPreview = () => {
  const { files, appName, isGenerating, tables, wizardData, wizardConfig, wizardStep } = useAppBuilder();
  const hasContent = files.length > 0;
  const isConfiguring = wizardStep !== "done";

  // Prefer wizard data, then file extraction, then defaults
  const effectiveName = wizardData.appName || wizardConfig?.appName || appName;
  const effectiveIntro = wizardData.introMessage || wizardConfig?.introMessage || "";
  const effectiveTone = wizardData.tone || wizardConfig?.tone || "professional_friendly";

  const greeting = useMemo(() => {
    if (effectiveIntro) return effectiveIntro;
    const fromFiles = extractGreeting(files);
    return fromFiles || `Olá! 👋 Sou o ${effectiveName}. Como posso ajudar?`;
  }, [files, effectiveName, effectiveIntro]);

  const botName = useMemo(() => {
    if (effectiveName && effectiveName !== "Meu App") return effectiveName;
    return extractBotName(files, effectiveName);
  }, [files, effectiveName]);

  const quickReplies = useMemo(() => {
    const extracted = extractQuickReplies(files);
    return extracted.length > 0 ? extracted : ["Agendar", "Preços", "Suporte"];
  }, [files]);

  const stages = useMemo(() => extractStages(files), [files]);
  const mockResponses = useMemo(() => buildMockResponses(files, effectiveIntro), [files, effectiveIntro]);

  const [chatMessages, setChatMessages] = useState<{ role: "user" | "bot"; text: string; time: string }[]>([]);
  const [testInput, setTestInput] = useState("");
  const [botTyping, setBotTyping] = useState(false);

  useEffect(() => {
    setChatMessages([]);
  }, [files.length, effectiveIntro, botName]);

  const now = () => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  const getBotResponse = (userMsg: string): string => {
    const lower = userMsg.toLowerCase();
    const key = Object.keys(mockResponses).find(k => k !== "default" && lower.includes(k));
    return mockResponses[key || "default"];
  };

  const handleSendTest = (text?: string) => {
    const msg = (text || testInput).trim();
    if (!msg) return;
    setTestInput("");
    setChatMessages(prev => [...prev, { role: "user", text: msg, time: now() }]);
    setBotTyping(true);
    setTimeout(() => {
      setBotTyping(false);
      setChatMessages(prev => [...prev, { role: "bot", text: getBotResponse(msg), time: now() }]);
    }, 800 + Math.random() * 600);
  };

  // Show preview even during wizard configuration
  const showContent = hasContent || isConfiguring;

  return (
    <div className="flex-1 flex items-center justify-center bg-muted/5 p-4 gap-6">
      {/* Phone mock */}
      <div className="relative">
        <div className="w-[370px] rounded-[2.5rem] border-[3px] border-muted/30 bg-card shadow-2xl overflow-hidden">
          {/* Status bar */}
          <div className="h-7 bg-[#075e54] dark:bg-[#1f2c34] flex items-center justify-center">
            <div className="w-20 h-4 rounded-full bg-black/20" />
          </div>

          {/* WhatsApp header */}
          <div className="bg-[#075e54] dark:bg-[#1f2c34] px-4 py-2.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">{botName}</p>
              <p className="text-[10px] text-white/60">{isGenerating || botTyping ? "digitando..." : "online"}</p>
            </div>
            <Phone className="w-4 h-4 text-white/70" />
          </div>

          {/* Chat area */}
          <div className="bg-[#ece5dd] dark:bg-[#0b141a] p-4 space-y-3 min-h-[380px] max-h-[440px] overflow-y-auto">
            {showContent ? (
              <>
                {/* Greeting bubble */}
                <div className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                  <div className="bg-white dark:bg-[#202c33] rounded-xl rounded-tl-sm px-3 py-2 max-w-[80%] shadow-sm">
                    <p className="text-xs text-foreground">{greeting}</p>
                    <p className="text-[9px] text-muted-foreground text-right mt-1">10:30</p>
                  </div>
                </div>

                {/* Tone badge during config */}
                {isConfiguring && effectiveTone && (
                  <div className="flex justify-center animate-in fade-in duration-300">
                    <span className="px-2.5 py-1 rounded-full bg-white/80 dark:bg-[#202c33]/80 text-[9px] text-muted-foreground border border-border/30 shadow-sm">
                      {toneEmoji[effectiveTone] || "🤖"} Tom: {toneLabels[effectiveTone] || effectiveTone}
                    </span>
                  </div>
                )}

                {/* Quick reply buttons */}
                {chatMessages.length === 0 && quickReplies.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap animate-in fade-in duration-300 delay-300">
                    {quickReplies.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => handleSendTest(opt)}
                        className="px-3 py-1.5 rounded-full border border-green-600/30 text-[10px] font-medium text-green-700 dark:text-green-400 bg-white dark:bg-[#202c33] shadow-sm cursor-pointer hover:bg-green-50 dark:hover:bg-[#2a3942] transition-colors"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {/* Chat messages */}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "gap-2"} animate-in fade-in duration-200`}>
                    <div className={`rounded-xl px-3 py-2 max-w-[80%] shadow-sm ${
                      msg.role === "user"
                        ? "bg-[#dcf8c6] dark:bg-[#005c4b] rounded-tr-sm"
                        : "bg-white dark:bg-[#202c33] rounded-tl-sm"
                    }`}>
                      <p className="text-xs text-foreground">{msg.text}</p>
                      <p className="text-[9px] text-muted-foreground text-right mt-1">{msg.time}</p>
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {(isGenerating || botTyping) && (
                  <div className="flex gap-2 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#202c33] rounded-xl rounded-tl-sm px-4 py-3 shadow-sm">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full min-h-[300px] text-xs text-muted-foreground">
                {isGenerating ? (
                  <div className="flex flex-col items-center gap-3">
                    <Zap className="w-6 h-6 animate-pulse text-green-500" />
                    <span>Gerando preview do WhatsApp App...</span>
                  </div>
                ) : (
                  <div className="text-center">
                    <Smartphone className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                    <p>Envie uma mensagem no Studio<br/>para ver o preview do seu bot aqui</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input bar */}
          <div className="bg-[#f0f0f0] dark:bg-[#202c33] px-3 py-2.5 flex items-center gap-2 border-t border-border/30">
            <input
              type="text"
              value={testInput}
              onChange={e => setTestInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSendTest()}
              placeholder="Teste seu agente..."
              className="flex-1 bg-white dark:bg-[#2a3942] rounded-full px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none"
            />
            <button
              onClick={() => handleSendTest()}
              disabled={!testInput.trim() || botTyping}
              className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center shadow-sm hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </div>

          <div className="h-5 bg-[#f0f0f0] dark:bg-[#202c33] flex items-center justify-center">
            <div className="w-24 h-1 rounded-full bg-muted-foreground/20" />
          </div>
        </div>

        {/* Bottom info badge */}
        {(hasContent || isConfiguring) && (
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-card border border-border rounded-full px-3 py-1 shadow-lg">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              {hasContent
                ? `${files.length} arquivo(s)${stages.length > 0 ? ` • ${stages.length} etapas` : ""}${tables.length > 0 ? ` • ${tables.length} tabelas` : ""}`
                : `Configurando...`
              }
            </span>
          </div>
        )}
      </div>

      {/* Right panel: config summary during wizard OR generated structure */}
      {(hasContent || isConfiguring) && (
        <div className="w-[240px] space-y-3 animate-in fade-in slide-in-from-right-4 duration-500">
          {/* Wizard config summary */}
          {isConfiguring && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-primary uppercase tracking-wider">
                <Zap className="w-3 h-3" /> Configuração Atual
              </div>
              <div className="space-y-1.5 text-[10px]">
                {wizardData.appName && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nome</span>
                    <span className="text-foreground font-medium">{wizardData.appName}</span>
                  </div>
                )}
                {wizardData.companyName && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Empresa</span>
                    <span className="text-foreground font-medium">{wizardData.companyName}</span>
                  </div>
                )}
                {wizardData.tone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tom</span>
                    <span className="text-foreground font-medium">{toneLabels[wizardData.tone] || wizardData.tone}</span>
                  </div>
                )}
                {wizardData.language && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Idioma</span>
                    <span className="text-foreground font-medium">{wizardData.language}</span>
                  </div>
                )}
                {wizardData.introMessage && (
                  <div>
                    <span className="text-muted-foreground">Intro:</span>
                    <p className="text-foreground/80 mt-0.5 italic">"{wizardData.introMessage.slice(0, 60)}{wizardData.introMessage.length > 60 ? "..." : ""}"</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Files generated */}
          {hasContent && (
            <div className="rounded-xl border border-border bg-card/60 p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                <FileCode className="w-3 h-3" /> Arquivos
              </div>
              <div className="space-y-1 max-h-[140px] overflow-y-auto">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-[10px] text-foreground/80 py-0.5">
                    <Code2 className="w-3 h-3 text-primary/60 shrink-0" />
                    <span className="truncate">{f.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tables */}
          {tables.length > 0 && (
            <div className="rounded-xl border border-border bg-card/60 p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                <Database className="w-3 h-3" /> Tabelas
              </div>
              <div className="space-y-1">
                {tables.map((t, i) => (
                  <div key={i} className="flex items-center justify-between text-[10px] py-0.5">
                    <span className="text-foreground/80">{t.name}</span>
                    <Badge variant="secondary" className="text-[8px] h-4 px-1.5">{t.columns.length} cols</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conversation flow (stages) */}
          {stages.length > 0 && (
            <div className="rounded-xl border border-border bg-card/60 p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                <MessageSquare className="w-3 h-3" /> Fluxo
              </div>
              <div className="space-y-1">
                {stages.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-[10px] py-0.5">
                    <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-[8px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                    <span className="text-foreground/80 truncate">{s}</span>
                    {i < stages.length - 1 && <ArrowRight className="w-2.5 h-2.5 text-muted-foreground/40 shrink-0" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isGenerating && (
            <div className="flex items-center gap-2 text-[10px] text-primary animate-pulse px-1">
              <Zap className="w-3 h-3" /> Atualizando em tempo real...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ── Web Preview ── */

const WebPreview = () => {
  const { files, appName, isGenerating, dashboardMetrics, tables, wizardData, wizardConfig, wizardStep } = useAppBuilder();
  const hasContent = files.length > 0;
  const isConfiguring = wizardStep !== "done";

  const effectiveName = wizardData.appName || wizardConfig?.appName || appName;

  const navItems = useMemo(() => {
    const extracted = extractNavItems(files);
    if (extracted.length > 1) {
      const iconMap: Record<string, typeof BarChart3> = {
        dashboard: BarChart3, clientes: Users, clients: Users, users: Users,
        agenda: Calendar, calendar: Calendar, mensagens: MessageSquare,
        messages: MessageSquare, config: Settings, settings: Settings, home: Layout,
      };
      return extracted.map(label => ({
        label,
        icon: iconMap[label.toLowerCase()] || Layout,
      }));
    }
    return [
      { label: "Dashboard", icon: BarChart3 },
      { label: "Clientes", icon: Users },
      { label: "Agenda", icon: Calendar },
      { label: "Mensagens", icon: MessageSquare },
      { label: "Configurações", icon: Settings },
    ];
  }, [files]);

  const metrics = useMemo(() => {
    if (dashboardMetrics.length > 0) {
      return dashboardMetrics.slice(0, 4).map(m => ({ label: m.label, value: m.value, change: m.change }));
    }
    const fromCode = extractMetricsFromCode(files);
    if (fromCode.length > 0) return fromCode;
    return [
      { label: "Usuários", value: "0" },
      { label: "Receita", value: "R$ 0" },
      { label: "Conversão", value: "0%" },
    ];
  }, [dashboardMetrics, files]);

  const activeNav = navItems[0]?.label || "Dashboard";
  const pageFiles = useMemo(() => files.filter(f => f.path.includes("/pages/") || f.path.includes("Page")), [files]);

  const showContent = hasContent || isConfiguring;

  return (
    <div className="flex-1 flex items-center justify-center bg-muted/5 p-4 gap-6">
      {/* Browser window */}
      <div className="w-full max-w-[780px] rounded-xl border border-border bg-card shadow-2xl overflow-hidden transition-all duration-500">
        {/* Browser chrome */}
        <div className="bg-muted/40 px-3 py-2 flex items-center gap-2 border-b border-border">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
          </div>
          <div className="flex-1 mx-8">
            <div className="bg-background rounded-md px-3 py-1 text-[10px] text-muted-foreground text-center border border-border/50">
              🔒 {effectiveName.toLowerCase().replace(/\s+/g, "")}.aikortex.com
            </div>
          </div>
        </div>

        {showContent ? (
          <div className="flex h-[420px]">
            {/* Sidebar */}
            <div className="w-[160px] border-r border-border bg-card/80 p-3 space-y-1">
              <div className="px-2 py-2 mb-2">
                <p className="text-xs font-semibold text-foreground">{effectiveName}</p>
                <p className="text-[9px] text-muted-foreground">
                  {wizardData.companyName || "Painel de Gestão"}
                </p>
              </div>
              {navItems.map((item, idx) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11px] transition-colors ${
                    idx === 0 ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted/30"
                  }`}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                </div>
              ))}
            </div>

            {/* Main content */}
            <div className="flex-1 p-5 space-y-4 overflow-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">{activeNav}</h2>
                  <p className="text-[10px] text-muted-foreground">
                    {isConfiguring ? "Configurando seu app..." : "Visão geral do sistema"}
                  </p>
                </div>
                {isGenerating && (
                  <div className="flex items-center gap-1.5 text-[10px] text-primary animate-pulse">
                    <Zap className="w-3 h-3" />
                    Atualizando...
                  </div>
                )}
              </div>

              {/* Wizard config banner when configuring */}
              {isConfiguring && wizardData.prompt && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-1.5 animate-in fade-in duration-300">
                  <p className="text-[10px] font-semibold text-primary">📝 Descrição do App</p>
                  <p className="text-[10px] text-foreground/80 leading-relaxed">
                    {wizardData.prompt.slice(0, 150)}{wizardData.prompt.length > 150 ? "..." : ""}
                  </p>
                  {wizardData.tone && (
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-[8px] h-4">
                        {toneEmoji[wizardData.tone]} {toneLabels[wizardData.tone] || wizardData.tone}
                      </Badge>
                      <Badge variant="secondary" className="text-[8px] h-4">
                        🌐 {wizardData.language}
                      </Badge>
                    </div>
                  )}
                </div>
              )}

              {/* Metrics */}
              <div className={`grid gap-3 ${metrics.length <= 3 ? "grid-cols-3" : "grid-cols-4"}`}>
                {metrics.map((m) => (
                  <div key={m.label} className="rounded-xl border border-border p-3 bg-card/50 animate-in fade-in duration-300">
                    <p className="text-[9px] text-muted-foreground mb-0.5">{m.label}</p>
                    <p className="text-base font-bold text-foreground">{m.value}</p>
                    {"change" in m && m.change && (
                      <span className="text-[9px] text-muted-foreground">{(m as any).change}</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Chart */}
              <div className="rounded-xl border border-border p-4 bg-card/50">
                <p className="text-[10px] font-medium text-foreground mb-3">Atividade recente</p>
                <div className="flex items-end gap-1.5 h-[80px]">
                  {[40, 65, 45, 80, 55, 90, 70, 95, 60, 85, 75, 100].map((h, i) => (
                    <div key={i} className="flex-1 rounded-sm transition-all duration-500 overflow-hidden" style={{ height: `${h}%` }}>
                      <div className="w-full h-full bg-gradient-to-t from-primary/60 to-primary/20 rounded-sm" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic table */}
              {tables.length > 0 && (
                <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
                    <p className="text-[10px] font-medium text-foreground">{tables[0].name}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[8px] h-4">{tables[0].columns.length} colunas</Badge>
                      <Search className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="px-4 py-1">
                    <div className="flex items-center gap-3 py-1.5 border-b border-border/50">
                      {tables[0].columns.slice(0, 4).map(col => (
                        <div key={col.name} className="flex-1">
                          <span className="text-[8px] font-semibold text-muted-foreground uppercase">{col.name}</span>
                        </div>
                      ))}
                    </div>
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center gap-3 py-2">
                        {tables[0].columns.slice(0, 4).map((col, ci) => (
                          <div key={col.name} className="flex-1">
                            <div className={`h-2 bg-muted/40 rounded ${ci === 0 ? "w-16" : "w-12"}`} />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-[420px] flex items-center justify-center text-sm text-muted-foreground">
            {isGenerating ? (
              <div className="flex flex-col items-center gap-3">
                <Zap className="w-6 h-6 animate-pulse text-primary" />
                <span>Gerando preview do Web App...</span>
              </div>
            ) : (
              <div className="text-center">
                <Monitor className="w-10 h-10 mx-auto mb-3 text-muted-foreground/20" />
                <p className="text-xs">Envie uma mensagem no Studio<br/>para ver o preview do seu app aqui</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right panel */}
      {(hasContent || isConfiguring) && (
        <div className="w-[220px] space-y-3 animate-in fade-in slide-in-from-right-4 duration-500">
          {/* Wizard config summary */}
          {isConfiguring && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-primary uppercase tracking-wider">
                <Zap className="w-3 h-3" /> Configuração
              </div>
              <div className="space-y-1.5 text-[10px]">
                {wizardData.appName && wizardData.appName !== "Meu App" && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nome</span>
                    <span className="text-foreground font-medium">{wizardData.appName}</span>
                  </div>
                )}
                {wizardData.companyName && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Empresa</span>
                    <span className="text-foreground font-medium">{wizardData.companyName}</span>
                  </div>
                )}
                {wizardData.tone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tom</span>
                    <span className="text-foreground font-medium">{toneLabels[wizardData.tone] || wizardData.tone}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {hasContent && (
            <div className="rounded-xl border border-border bg-card/60 p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                <FileCode className="w-3 h-3" /> Arquivos ({files.length})
              </div>
              <div className="space-y-1 max-h-[160px] overflow-y-auto">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-[10px] text-foreground/80 py-0.5">
                    <Code2 className="w-3 h-3 text-primary/60 shrink-0" />
                    <span className="truncate">{f.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tables.length > 0 && (
            <div className="rounded-xl border border-border bg-card/60 p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                <Database className="w-3 h-3" /> Tabelas ({tables.length})
              </div>
              <div className="space-y-1">
                {tables.map((t, i) => (
                  <div key={i} className="flex items-center justify-between text-[10px] py-0.5">
                    <span className="text-foreground/80">{t.name}</span>
                    <Badge variant="secondary" className="text-[8px] h-4 px-1.5">{t.columns.length} cols</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pageFiles.length > 0 && (
            <div className="rounded-xl border border-border bg-card/60 p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                <Layout className="w-3 h-3" /> Páginas
              </div>
              <div className="space-y-1">
                {pageFiles.map((f, i) => (
                  <div key={i} className="text-[10px] text-foreground/80 py-0.5 truncate">{f.name}</div>
                ))}
              </div>
            </div>
          )}

          {isGenerating && (
            <div className="flex items-center gap-2 text-[10px] text-primary animate-pulse px-1">
              <Zap className="w-3 h-3" /> Atualizando em tempo real...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface PreviewPanelProps {
  channel?: "whatsapp" | "web";
}

const PreviewPanel = ({}: PreviewPanelProps) => {
  const { channel } = useAppBuilder();
  return channel === "whatsapp" ? <WhatsAppPreview /> : <WebPreview />;
};

export default PreviewPanel;
