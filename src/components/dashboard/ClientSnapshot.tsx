const clients = [
  { name: "Carlos Mendes", company: "TechCorp", tag: "Mais ativo", initials: "CM", projects: 4 },
  { name: "Ana Beatriz", company: "SalesUp", tag: "Novo", initials: "AB", projects: 1 },
  { name: "Ricardo Lima", company: "DataViz", tag: "Automações", initials: "RL", projects: 3 },
  { name: "Fernanda Costa", company: "HealthPlus", tag: "Novo", initials: "FC", projects: 2 },
];

const tagColors: Record<string, string> = {
  "Mais ativo": "bg-[hsl(var(--success)/.1)] text-[hsl(var(--success))]",
  Novo: "bg-primary/10 text-primary",
  Automações: "bg-[hsl(var(--warning)/.1)] text-[hsl(var(--warning))]",
};

const ClientSnapshot = () => (
  <div className="glass-card rounded-xl">
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/50">
      <h2 className="text-sm font-semibold text-foreground">Clientes Destaque</h2>
      <span className="text-[10px] text-primary font-medium cursor-pointer hover:underline">Ver todos</span>
    </div>
    <div className="p-2 space-y-0.5">
      {clients.map((c) => (
        <div key={c.name} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/50 transition-colors">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
            {c.initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{c.name}</p>
            <p className="text-[10px] text-muted-foreground">{c.company} · {c.projects} projetos</p>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${tagColors[c.tag]}`}>{c.tag}</span>
        </div>
      ))}
    </div>
  </div>
);

export default ClientSnapshot;
