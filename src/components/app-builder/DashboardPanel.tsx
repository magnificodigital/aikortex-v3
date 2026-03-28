import { BarChart3, Users, MessageSquare, TrendingUp, Clock, Phone, Monitor, ArrowUp, ArrowDown, Activity } from "lucide-react";

interface DashboardPanelProps {
  channel?: "whatsapp" | "web";
}

const WhatsAppDashboard = () => (
  <div className="flex-1 overflow-auto p-6 space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Painel de Gestão</h2>
        <p className="text-xs text-muted-foreground">WhatsApp App — Últimas 24h</p>
      </div>
      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
        <Phone className="w-3 h-3" /> WhatsApp
      </span>
    </div>

    {/* Metrics */}
    <div className="grid grid-cols-4 gap-4">
      {[
        { label: "Conversas Ativas", value: "127", change: "+18%", icon: MessageSquare, up: true },
        { label: "Leads Qualificados", value: "34", change: "+12%", icon: Users, up: true },
        { label: "Taxa de Resposta", value: "94%", change: "+2%", icon: Activity, up: true },
        { label: "Tempo Médio", value: "1.2min", change: "-15%", icon: Clock, up: true },
      ].map((m) => (
        <div key={m.label} className="rounded-xl border border-border p-4 bg-card">
          <div className="flex items-center justify-between mb-2">
            <m.icon className="w-4 h-4 text-muted-foreground" />
            <span className={`flex items-center gap-0.5 text-[10px] font-medium ${m.up ? "text-green-500" : "text-red-500"}`}>
              {m.up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              {m.change}
            </span>
          </div>
          <p className="text-2xl font-bold text-foreground">{m.value}</p>
          <p className="text-[11px] text-muted-foreground">{m.label}</p>
        </div>
      ))}
    </div>

    {/* Conversation funnel & recent */}
    <div className="grid grid-cols-2 gap-4">
      <div className="rounded-xl border border-border p-5 bg-card">
        <h3 className="text-sm font-semibold text-foreground mb-4">Funil Conversacional</h3>
        <div className="space-y-3">
          {[
            { stage: "Mensagens Recebidas", count: 342, pct: 100 },
            { stage: "Qualificação Iniciada", count: 189, pct: 55 },
            { stage: "Dados Coletados", count: 98, pct: 29 },
            { stage: "Agendamento", count: 52, pct: 15 },
            { stage: "Conversão", count: 34, pct: 10 },
          ].map((s) => (
            <div key={s.stage}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-foreground">{s.stage}</span>
                <span className="text-muted-foreground">{s.count}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-green-500" style={{ width: `${s.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border p-5 bg-card">
        <h3 className="text-sm font-semibold text-foreground mb-4">Conversas Recentes</h3>
        <div className="space-y-3">
          {[
            { name: "Maria Silva", msg: "Gostaria de agendar uma consulta", time: "2min", status: "Em andamento" },
            { name: "João Santos", msg: "Qual o preço do plano premium?", time: "5min", status: "Qualificado" },
            { name: "Ana Costa", msg: "Preciso remarcar meu horário", time: "12min", status: "Agendado" },
            { name: "Pedro Lima", msg: "Obrigado pelo atendimento!", time: "18min", status: "Concluído" },
            { name: "Carla Souza", msg: "Boa tarde, tenho uma dúvida", time: "25min", status: "Em andamento" },
          ].map((c) => (
            <div key={c.name} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                {c.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-foreground">{c.name}</p>
                  <span className="text-[10px] text-muted-foreground">{c.time}</span>
                </div>
                <p className="text-[10px] text-muted-foreground truncate">{c.msg}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Agent performance */}
    <div className="rounded-xl border border-border p-5 bg-card">
      <h3 className="text-sm font-semibold text-foreground mb-4">Performance dos Agentes</h3>
      <div className="grid grid-cols-3 gap-4">
        {[
          { name: "Qualificador", conversations: 189, successRate: "78%", avgTime: "45s" },
          { name: "Agendador", conversations: 52, successRate: "92%", avgTime: "1.5min" },
          { name: "Follow-up", conversations: 34, successRate: "85%", avgTime: "30s" },
        ].map((a) => (
          <div key={a.name} className="rounded-lg border border-border p-3 bg-muted/20">
            <p className="text-xs font-semibold text-foreground mb-2">{a.name}</p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px]"><span className="text-muted-foreground">Conversas</span><span className="text-foreground">{a.conversations}</span></div>
              <div className="flex justify-between text-[10px]"><span className="text-muted-foreground">Sucesso</span><span className="text-green-500">{a.successRate}</span></div>
              <div className="flex justify-between text-[10px]"><span className="text-muted-foreground">Tempo médio</span><span className="text-foreground">{a.avgTime}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const WebDashboard = () => (
  <div className="flex-1 overflow-auto p-6 space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Painel de Gestão</h2>
        <p className="text-xs text-muted-foreground">Web App — Últimas 24h</p>
      </div>
      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
        <Monitor className="w-3 h-3" /> Web App
      </span>
    </div>

    {/* Metrics */}
    <div className="grid grid-cols-4 gap-4">
      {[
        { label: "Usuários Ativos", value: "1,234", change: "+15%", icon: Users, up: true },
        { label: "Pageviews", value: "8,901", change: "+22%", icon: BarChart3, up: true },
        { label: "Conversão", value: "3.2%", change: "+0.5%", icon: TrendingUp, up: true },
        { label: "Bounce Rate", value: "24%", change: "-3%", icon: Activity, up: true },
      ].map((m) => (
        <div key={m.label} className="rounded-xl border border-border p-4 bg-card">
          <div className="flex items-center justify-between mb-2">
            <m.icon className="w-4 h-4 text-muted-foreground" />
            <span className={`flex items-center gap-0.5 text-[10px] font-medium ${m.up ? "text-green-500" : "text-red-500"}`}>
              {m.up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              {m.change}
            </span>
          </div>
          <p className="text-2xl font-bold text-foreground">{m.value}</p>
          <p className="text-[11px] text-muted-foreground">{m.label}</p>
        </div>
      ))}
    </div>

    {/* Charts */}
    <div className="grid grid-cols-2 gap-4">
      <div className="rounded-xl border border-border p-5 bg-card">
        <h3 className="text-sm font-semibold text-foreground mb-4">Acessos por Dia</h3>
        <div className="flex items-end gap-2 h-[140px]">
          {[60, 80, 45, 90, 70, 95, 85].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-primary/20 rounded-sm relative" style={{ height: `${h}%` }}>
                <div className="absolute bottom-0 w-full bg-primary rounded-sm" style={{ height: "60%" }} />
              </div>
              <span className="text-[8px] text-muted-foreground">{["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"][i]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border p-5 bg-card">
        <h3 className="text-sm font-semibold text-foreground mb-4">Páginas Mais Acessadas</h3>
        <div className="space-y-3">
          {[
            { page: "/dashboard", views: 3421, pct: 100 },
            { page: "/clientes", views: 2108, pct: 62 },
            { page: "/configuracoes", views: 1256, pct: 37 },
            { page: "/relatorios", views: 890, pct: 26 },
            { page: "/perfil", views: 654, pct: 19 },
          ].map((p) => (
            <div key={p.page}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-foreground font-mono">{p.page}</span>
                <span className="text-muted-foreground">{p.views.toLocaleString()}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: `${p.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Recent users */}
    <div className="rounded-xl border border-border p-5 bg-card">
      <h3 className="text-sm font-semibold text-foreground mb-4">Usuários Recentes</h3>
      <div className="overflow-hidden rounded-lg border border-border">
        <div className="grid grid-cols-5 gap-0 text-[10px] font-medium text-muted-foreground bg-muted/30 px-3 py-2">
          <span>Nome</span><span>Email</span><span>Plano</span><span>Status</span><span>Último Acesso</span>
        </div>
        {[
          { n: "Maria Silva", e: "maria@email.com", p: "Pro", s: "Ativo", t: "Agora" },
          { n: "João Santos", e: "joao@email.com", p: "Free", s: "Ativo", t: "2min" },
          { n: "Ana Costa", e: "ana@email.com", p: "Pro", s: "Ativo", t: "15min" },
          { n: "Pedro Lima", e: "pedro@email.com", p: "Enterprise", s: "Ativo", t: "1h" },
        ].map((u) => (
          <div key={u.n} className="grid grid-cols-5 gap-0 text-[10px] text-foreground px-3 py-2 border-t border-border">
            <span className="font-medium">{u.n}</span>
            <span className="text-muted-foreground">{u.e}</span>
            <span>{u.p}</span>
            <span className="text-green-500">{u.s}</span>
            <span className="text-muted-foreground">{u.t}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const DashboardPanel = ({ channel = "web" }: DashboardPanelProps) => {
  return channel === "whatsapp" ? <WhatsAppDashboard /> : <WebDashboard />;
};

export default DashboardPanel;
