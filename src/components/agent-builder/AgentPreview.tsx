import { useAgentBuilder } from "@/contexts/AgentBuilderContext";
import { Bot, Wifi, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const AgentPreview = () => {
  const { structuredConfig, agentType, step } = useAgentBuilder();

  const name = structuredConfig?.name || "Meu Agente";
  const greeting = structuredConfig?.greetingMessage || "Olá! Como posso te ajudar?";
  const tone = structuredConfig?.toneOfVoice || "—";
  const language = structuredConfig?.language || "Português";
  const stagesCount = structuredConfig?.stages?.length || 0;
  const quickReplies = structuredConfig?.quickReplies || [];

  return (
    <div className="flex flex-col h-full">
      {/* Chat simulation */}
      <div className="flex-1 flex flex-col rounded-xl border border-border bg-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/40">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{name}</p>
            <div className="flex items-center gap-1 text-xs text-emerald-500">
              <Wifi className="h-3 w-3" /> Online
            </div>
          </div>
          <Badge variant="outline" className="text-[10px]">{agentType}</Badge>
        </div>

        {/* Messages area */}
        <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-background/50 min-h-[200px]">
          {/* Agent greeting */}
          <div className="flex gap-2 max-w-[85%]">
            <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="rounded-xl rounded-tl-sm bg-muted px-3 py-2 text-sm">
              {greeting}
            </div>
          </div>

          {/* Quick replies */}
          {quickReplies.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pl-9">
              {quickReplies.map((qr, i) => (
                <button
                  key={i}
                  className="px-3 py-1 rounded-full border border-primary/30 text-xs text-primary hover:bg-primary/10 transition-colors"
                >
                  {qr}
                </button>
              ))}
            </div>
          )}

          {step === "describe" && !structuredConfig && (
            <p className="text-xs text-muted-foreground text-center pt-8">
              Descreva seu agente para ver o preview aqui
            </p>
          )}
        </div>

        {/* Input mock */}
        <div className="px-3 py-2 border-t border-border flex items-center gap-2">
          <div className="flex-1 rounded-full bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
            Digite uma mensagem...
          </div>
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Send className="h-3.5 w-3.5 text-primary" />
          </div>
        </div>
      </div>

      {/* Summary panel */}
      <div className="mt-3 rounded-xl border border-border bg-card p-4 space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resumo</h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
          <span className="text-muted-foreground">Nome</span>
          <span className="font-medium truncate">{name}</span>
          <span className="text-muted-foreground">Tipo</span>
          <span className="font-medium">{agentType}</span>
          <span className="text-muted-foreground">Tom</span>
          <span className="font-medium truncate">{tone}</span>
          <span className="text-muted-foreground">Idioma</span>
          <span className="font-medium">{language}</span>
          <span className="text-muted-foreground">Estágios</span>
          <span className="font-medium">{stagesCount}</span>
        </div>
      </div>
    </div>
  );
};

export default AgentPreview;
