import { useState } from "react";
import {
  Phone, Monitor, MessageSquare, Globe, Webhook, Bell, Users, Shield,
  Palette, Layout, Database, Settings, BarChart3, CreditCard, FileText,
  Bot, Zap, Link2, Upload, Image, Type, MousePointer, Smartphone,
  ChevronRight, Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type AppChannel = "whatsapp" | "web";

/* ──── WhatsApp config sections ──── */
const WhatsAppConfig = () => {
  const [greeting, setGreeting] = useState("Olá! 👋 Como posso ajudar você hoje?");
  const [fallback, setFallback] = useState("Desculpe, não entendi. Pode reformular?");

  return (
    <div className="space-y-6">
      {/* Conexão */}
      <Section title="Conexão WhatsApp" icon={Phone}>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-green-500/15 flex items-center justify-center">
                <Phone className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">WhatsApp Business API</p>
                <p className="text-[10px] text-muted-foreground">Conecte seu número</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="h-7 text-xs">Conectar</Button>
          </div>
          <Input placeholder="Número do WhatsApp (ex: +5511999999999)" className="h-9 text-xs" />
          <Input placeholder="Token de acesso da API" type="password" className="h-9 text-xs" />
        </div>
      </Section>

      {/* Mensagens */}
      <Section title="Mensagens" icon={MessageSquare}>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Mensagem de saudação</label>
            <Textarea value={greeting} onChange={(e) => setGreeting(e.target.value)} className="text-xs min-h-[60px]" />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Mensagem de fallback</label>
            <Textarea value={fallback} onChange={(e) => setFallback(e.target.value)} className="text-xs min-h-[60px]" />
          </div>
        </div>
      </Section>

      {/* Jornada Conversacional */}
      <Section title="Jornada Conversacional" icon={Zap}>
        <div className="space-y-2">
          {["Qualificação inicial", "Coleta de dados", "Apresentação de oferta", "Follow-up automático", "Encerramento"].map((step, i) => (
            <div key={step} className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border bg-card hover:border-primary/20 transition-colors cursor-pointer">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
              <span className="text-xs text-foreground">{step}</span>
              <ChevronRight className="w-3 h-3 text-muted-foreground ml-auto" />
            </div>
          ))}
          <Button variant="outline" size="sm" className="w-full h-8 text-xs mt-1">+ Adicionar etapa</Button>
        </div>
      </Section>

      {/* Agentes Internos */}
      <Section title="Agentes Internos" icon={Bot}>
        <p className="text-[11px] text-muted-foreground mb-2">Agentes especializados que compõem este app.</p>
        <div className="space-y-2">
          {[
            { name: "Qualificador", desc: "Coleta e qualifica informações do lead" },
            { name: "Atendente", desc: "Responde dúvidas e fornece informações" },
          ].map((agent) => (
            <div key={agent.name} className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border bg-card">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground">{agent.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{agent.desc}</p>
              </div>
              <Settings className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
          ))}
          <Button variant="outline" size="sm" className="w-full h-8 text-xs">+ Adicionar agente</Button>
        </div>
      </Section>

      {/* Integrações */}
      <Section title="Integrações" icon={Link2}>
        <div className="space-y-2">
          {[
            { name: "CRM", desc: "Sincronize leads e contatos", connected: false },
            { name: "Calendário", desc: "Agendamento automático", connected: false },
            { name: "Pagamentos", desc: "Cobranças via conversa", connected: false },
          ].map((int) => (
            <div key={int.name} className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card">
              <div>
                <p className="text-xs font-medium text-foreground">{int.name}</p>
                <p className="text-[10px] text-muted-foreground">{int.desc}</p>
              </div>
              <Switch />
            </div>
          ))}
        </div>
      </Section>

      {/* Notificações */}
      <Section title="Notificações" icon={Bell}>
        <div className="space-y-2">
          <ToggleRow label="Notificar ao receber lead qualificado" />
          <ToggleRow label="Alerta de conversa sem resposta (>5min)" />
          <ToggleRow label="Resumo diário de conversas" />
        </div>
      </Section>

      {/* Horário de Funcionamento */}
      <Section title="Horário de Funcionamento" icon={Settings}>
        <div className="space-y-2">
          <ToggleRow label="Atendimento 24/7" defaultOn />
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Mensagem fora do horário</label>
            <Textarea placeholder="Estamos fora do horário. Retornaremos em breve!" className="text-xs min-h-[50px]" />
          </div>
        </div>
      </Section>
    </div>
  );
};

/* ──── Web App config sections ──── */
const WebAppConfig = () => {
  return (
    <div className="space-y-6">
      {/* Layout & Design */}
      <Section title="Layout & Design" icon={Layout}>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-foreground mb-1.5 block">Estilo do layout</label>
            <div className="grid grid-cols-3 gap-2">
              {["Dashboard", "Landing Page", "Portal"].map((style) => (
                <button key={style} className="p-3 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors text-center">
                  <Layout className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                  <span className="text-[10px] text-foreground font-medium">{style}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Cor primária</label>
            <div className="flex gap-2">
              {["#6366f1", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"].map((c) => (
                <button key={c} className="w-7 h-7 rounded-full border-2 border-transparent hover:border-foreground/20 transition-colors" style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Páginas */}
      <Section title="Páginas" icon={FileText}>
        <div className="space-y-2">
          {["Home", "Dashboard", "Login", "Perfil", "Configurações"].map((page) => (
            <div key={page} className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-foreground">{page}</span>
              </div>
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            </div>
          ))}
          <Button variant="outline" size="sm" className="w-full h-8 text-xs">+ Adicionar página</Button>
        </div>
      </Section>

      {/* Componentes */}
      <Section title="Componentes" icon={MousePointer}>
        <div className="space-y-2">
          {[
            { name: "Tabela de dados", desc: "Listagem com filtros e paginação" },
            { name: "Formulário", desc: "Entrada de dados com validação" },
            { name: "Gráficos", desc: "Visualização de métricas" },
            { name: "Chat widget", desc: "Atendimento integrado" },
          ].map((comp) => (
            <div key={comp.name} className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border bg-card hover:border-primary/20 transition-colors cursor-pointer">
              <MousePointer className="w-3.5 h-3.5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground">{comp.name}</p>
                <p className="text-[10px] text-muted-foreground">{comp.desc}</p>
              </div>
              <Switch />
            </div>
          ))}
        </div>
      </Section>

      {/* Banco de Dados */}
      <Section title="Banco de Dados" icon={Database}>
        <div className="space-y-2">
          {["users", "products", "orders"].map((table) => (
            <div key={table} className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card">
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-mono text-foreground">{table}</span>
              </div>
              <Badge variant="outline" className="text-[9px]">Auto</Badge>
            </div>
          ))}
          <Button variant="outline" size="sm" className="w-full h-8 text-xs">+ Adicionar tabela</Button>
        </div>
      </Section>

      {/* Autenticação */}
      <Section title="Autenticação" icon={Shield}>
        <div className="space-y-2">
          <ToggleRow label="Login com e-mail e senha" defaultOn />
          <ToggleRow label="Login social (Google)" />
          <ToggleRow label="Registro de novos usuários" defaultOn />
          <ToggleRow label="Recuperação de senha" defaultOn />
        </div>
      </Section>

      {/* Responsividade */}
      <Section title="Responsividade" icon={Smartphone}>
        <div className="space-y-2">
          <ToggleRow label="Design responsivo mobile" defaultOn />
          <ToggleRow label="PWA (instalável no celular)" />
        </div>
      </Section>

      {/* Analytics */}
      <Section title="Analytics" icon={BarChart3}>
        <div className="space-y-2">
          <ToggleRow label="Dashboard de métricas" />
          <ToggleRow label="Rastreamento de eventos" />
        </div>
      </Section>

      {/* Pagamentos */}
      <Section title="Pagamentos" icon={CreditCard}>
        <div className="space-y-2">
          <ToggleRow label="Integração Stripe" />
          <ToggleRow label="Planos e assinaturas" />
        </div>
      </Section>
    </div>
  );
};

/* ──── Shared sub-components ──── */
function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-primary" />
        <h3 className="text-xs font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function ToggleRow({ label, defaultOn = false }: { label: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card">
      <span className="text-xs text-foreground">{label}</span>
      <Switch checked={on} onCheckedChange={setOn} />
    </div>
  );
}

/* ──── Main Config Panel ──── */
interface AppConfigPanelProps {
  channel: AppChannel;
  onChannelChange: (ch: AppChannel) => void;
}

const AppConfigPanel = ({ channel, onChannelChange }: AppConfigPanelProps) => {
  return (
    <div className="w-[340px] min-w-[300px] border-l border-border flex flex-col bg-card/30 overflow-hidden">
      {/* Header with channel toggle */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">Configurações</h2>
          <Badge variant="outline" className="text-[10px] gap-1">
            {channel === "whatsapp" ? <Phone className="w-3 h-3 text-green-500" /> : <Monitor className="w-3 h-3 text-primary" />}
            {channel === "whatsapp" ? "WhatsApp" : "Web"}
          </Badge>
        </div>
        <div className="flex gap-1.5 p-0.5 bg-muted/50 rounded-lg">
          <button
            onClick={() => onChannelChange("whatsapp")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              channel === "whatsapp" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            WhatsApp
          </button>
          <button
            onClick={() => onChannelChange("web")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              channel === "web" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            Web App
          </button>
        </div>
      </div>

      {/* Scrollable config content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {channel === "whatsapp" ? <WhatsAppConfig /> : <WebAppConfig />}
      </div>

      {/* Save button */}
      <div className="px-4 py-3 border-t border-border shrink-0">
        <Button className="w-full h-9 text-xs rounded-lg gap-1.5">
          <Check className="w-3.5 h-3.5" />
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
};

export default AppConfigPanel;
