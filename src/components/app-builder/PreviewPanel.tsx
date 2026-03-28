import { Phone, Monitor, MessageSquare, User, Bot, Send, BarChart3, Settings, Users, Calendar } from "lucide-react";
import { useAppBuilder } from "@/contexts/AppBuilderContext";

interface PreviewPanelProps {
  channel?: "whatsapp" | "web";
}

const WhatsAppPreview = () => {
  const { files, appName, isGenerating } = useAppBuilder();
  const hasContent = files.length > 0;

  return (
    <div className="flex-1 flex items-center justify-center bg-muted/10 p-6">
      <div className="w-[360px] rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        <div className="bg-green-600 dark:bg-green-700 px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{appName}</p>
            <p className="text-[10px] text-white/70">{isGenerating ? "digitando..." : "online"}</p>
          </div>
          <Phone className="w-4 h-4 text-white ml-auto" />
        </div>

        <div className="bg-[#ece5dd] dark:bg-[#0b141a] p-4 space-y-3 min-h-[320px]">
          {hasContent ? (
            <>
              <div className="flex gap-2">
                <div className="bg-white dark:bg-[#202c33] rounded-xl rounded-tl-sm px-3 py-2 max-w-[80%] shadow-sm">
                  <p className="text-xs text-foreground">Olá! 👋 Bem-vindo! Como posso ajudar você hoje?</p>
                  <p className="text-[9px] text-muted-foreground text-right mt-1">10:30</p>
                </div>
              </div>
              <div className="flex justify-end">
                <div className="bg-[#dcf8c6] dark:bg-[#005c4b] rounded-xl rounded-tr-sm px-3 py-2 max-w-[80%] shadow-sm">
                  <p className="text-xs text-foreground">Gostaria de saber mais</p>
                  <p className="text-[9px] text-muted-foreground text-right mt-1">10:31</p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="bg-white dark:bg-[#202c33] rounded-xl rounded-tl-sm px-3 py-2 max-w-[80%] shadow-sm">
                  <p className="text-xs text-foreground">Claro! Para começar, preciso de algumas informações:</p>
                  <p className="text-xs text-foreground mt-1">📋 Qual é o seu nome completo?</p>
                  <p className="text-[9px] text-muted-foreground text-right mt-1">10:31</p>
                </div>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {["Agendar", "Preços", "Horários"].map((opt) => (
                  <span key={opt} className="px-3 py-1.5 rounded-full border border-green-600/30 text-[10px] font-medium text-green-700 dark:text-green-400 bg-white dark:bg-[#202c33]">
                    {opt}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
              {isGenerating ? "Gerando preview..." : "Envie uma mensagem para gerar o preview"}
            </div>
          )}
        </div>

        <div className="bg-[#f0f0f0] dark:bg-[#202c33] px-3 py-2 flex items-center gap-2 border-t border-border">
          <div className="flex-1 bg-white dark:bg-[#2a3942] rounded-full px-3 py-1.5 text-xs text-muted-foreground">
            Digite uma mensagem...
          </div>
          <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
            <Send className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
};

const WebPreview = () => {
  const { files, appName, isGenerating } = useAppBuilder();
  const hasContent = files.length > 0;

  return (
    <div className="flex-1 flex items-center justify-center bg-muted/10 p-6">
      <div className="w-full max-w-[700px] rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
        <div className="bg-muted/50 px-3 py-2 flex items-center gap-2 border-b border-border">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 mx-8">
            <div className="bg-background rounded-md px-3 py-1 text-[10px] text-muted-foreground text-center">
              {appName.toLowerCase().replace(/\s+/g, "")}.aikortex.com
            </div>
          </div>
        </div>

        {hasContent ? (
          <div className="flex h-[380px]">
            <div className="w-[160px] border-r border-border bg-card/50 p-3 space-y-1">
              {[
                { icon: BarChart3, label: "Dashboard", active: true },
                { icon: Users, label: "Clientes" },
                { icon: Calendar, label: "Agenda" },
                { icon: MessageSquare, label: "Mensagens" },
                { icon: Settings, label: "Configurações" },
              ].map((item) => (
                <div key={item.label} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[10px] ${item.active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"}`}>
                  <item.icon className="w-3 h-3" />
                  {item.label}
                </div>
              ))}
            </div>

            <div className="flex-1 p-4 space-y-4 overflow-hidden">
              <h2 className="text-sm font-semibold text-foreground">Dashboard</h2>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Usuários", value: "0", change: "--" },
                  { label: "Receita", value: "R$ 0", change: "--" },
                  { label: "Conversão", value: "0%", change: "--" },
                ].map((m) => (
                  <div key={m.label} className="rounded-lg border border-border p-2.5 bg-card">
                    <p className="text-[9px] text-muted-foreground">{m.label}</p>
                    <p className="text-sm font-bold text-foreground">{m.value}</p>
                    <span className="text-[9px] text-muted-foreground">{m.change}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-border p-3 bg-card">
                <p className="text-[10px] font-medium text-foreground mb-2">Dados em tempo real</p>
                <div className="flex items-end gap-1.5 h-[80px]">
                  {[40, 65, 45, 80, 55, 90, 70, 95, 60, 85, 75, 100].map((h, i) => (
                    <div key={i} className="flex-1 bg-primary/20 rounded-sm" style={{ height: `${h}%` }}>
                      <div className="w-full bg-primary rounded-sm" style={{ height: `${Math.min(h + 10, 100)}%` }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-[380px] flex items-center justify-center text-sm text-muted-foreground">
            {isGenerating ? "Gerando preview..." : "Envie uma mensagem para gerar o preview"}
          </div>
        )}
      </div>
    </div>
  );
};

const PreviewPanel = ({}: PreviewPanelProps) => {
  const { channel } = useAppBuilder();
  return channel === "whatsapp" ? <WhatsAppPreview /> : <WebPreview />;
};

export default PreviewPanel;
