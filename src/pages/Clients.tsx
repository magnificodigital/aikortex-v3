import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Plus,
  Search,
  Building2,
  Mail,
  Phone,
  FolderKanban,
  Bot,
  Zap,
  DollarSign,
  Eye,
  Link2,
  Copy,
  Check,
} from "lucide-react";

interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: "active" | "inactive" | "prospect";
  projects: number;
  agents: number;
  automations: number;
  revenue: string;
  initials: string;
  since: string;
}

const mockClients: Client[] = [
  {
    id: "1",
    name: "Carlos Mendes",
    company: "TechCorp",
    email: "carlos@techcorp.com",
    phone: "(11) 99999-0001",
    status: "active",
    projects: 3,
    agents: 2,
    automations: 5,
    revenue: "R$ 12.500",
    initials: "CM",
    since: "Jan 2024",
  },
  {
    id: "2",
    name: "Ana Beatriz",
    company: "SalesUp",
    email: "ana@salesup.com.br",
    phone: "(11) 99999-0002",
    status: "active",
    projects: 2,
    agents: 1,
    automations: 3,
    revenue: "R$ 8.900",
    initials: "AB",
    since: "Mar 2024",
  },
  {
    id: "3",
    name: "Ricardo Lima",
    company: "DataViz",
    email: "ricardo@dataviz.io",
    phone: "(21) 99999-0003",
    status: "active",
    projects: 4,
    agents: 3,
    automations: 8,
    revenue: "R$ 22.000",
    initials: "RL",
    since: "Nov 2023",
  },
  {
    id: "4",
    name: "Fernanda Costa",
    company: "HealthPlus",
    email: "fernanda@healthplus.com",
    phone: "(31) 99999-0004",
    status: "inactive",
    projects: 1,
    agents: 0,
    automations: 1,
    revenue: "R$ 3.200",
    initials: "FC",
    since: "Jun 2024",
  },
  {
    id: "5",
    name: "Pedro Almeida",
    company: "FinanceAI",
    email: "pedro@financeai.com",
    phone: "(11) 99999-0005",
    status: "active",
    projects: 2,
    agents: 4,
    automations: 12,
    revenue: "R$ 18.700",
    initials: "PA",
    since: "Fev 2024",
  },
  {
    id: "6",
    name: "Juliana Ferreira",
    company: "EduTech",
    email: "juliana@edutech.com.br",
    phone: "(41) 99999-0006",
    status: "prospect",
    projects: 0,
    agents: 0,
    automations: 0,
    revenue: "R$ 0",
    initials: "JF",
    since: "Mar 2025",
  },
  {
    id: "7",
    name: "Marcos Oliveira",
    company: "RetailMax",
    email: "marcos@retailmax.com",
    phone: "(11) 99999-0007",
    status: "active",
    projects: 5,
    agents: 2,
    automations: 7,
    revenue: "R$ 15.300",
    initials: "MO",
    since: "Dez 2023",
  },
  {
    id: "8",
    name: "Luciana Santos",
    company: "LogiFlow",
    email: "luciana@logiflow.com",
    phone: "(51) 99999-0008",
    status: "active",
    projects: 1,
    agents: 1,
    automations: 2,
    revenue: "R$ 6.400",
    initials: "LS",
    since: "Mai 2024",
  },
];

const statusConfig = {
  active: { label: "Ativo", className: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border-[hsl(var(--success))]/30" },
  inactive: { label: "Inativo", className: "bg-destructive/15 text-destructive border-destructive/30" },
  prospect: { label: "Prospect", className: "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30" },
};

const Clients = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);

  const filtered = mockClients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = mockClients
    .filter((c) => c.status === "active")
    .reduce((sum, c) => sum + parseFloat(c.revenue.replace(/[^\d]/g, "")) / 100, 0);

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
              <p className="text-sm text-muted-foreground">
                Gestão completa de clientes da agência
              </p>
            </div>
          </div>
          <Button className="glow-primary">
            <Plus className="w-4 h-4" />
            Novo Cliente
          </Button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Total de Clientes",
              value: mockClients.length,
              icon: Users,
              sub: `${mockClients.filter((c) => c.status === "active").length} ativos`,
            },
            {
              label: "Projetos Vinculados",
              value: mockClients.reduce((s, c) => s + c.projects, 0),
              icon: FolderKanban,
              sub: "em andamento",
            },
            {
              label: "Agentes IA Ativos",
              value: mockClients.reduce((s, c) => s + c.agents, 0),
              icon: Bot,
              sub: "em produção",
            },
            {
              label: "Receita Mensal",
              value: `R$ ${totalRevenue.toFixed(1)}k`,
              icon: DollarSign,
              sub: "clientes ativos",
            },
          ].map((m) => (
            <div key={m.label} className="glass-card rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{m.label}</span>
                <m.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold text-foreground">{m.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{m.sub}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, empresa ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
              <SelectItem value="prospect">Prospects</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="glass-card rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead>Cliente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Projetos</TableHead>
                <TableHead className="hidden md:table-cell">Agentes IA</TableHead>
                <TableHead className="hidden lg:table-cell">Automações</TableHead>
                <TableHead className="hidden lg:table-cell">Receita</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((client) => {
                const status = statusConfig[client.status];
                return (
                  <TableRow
                    key={client.id}
                    className="border-border/30 cursor-pointer"
                    onClick={() => setSelectedClient(client)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                            {client.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-foreground">{client.name}</p>
                          <p className="text-xs text-muted-foreground">{client.company}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={status.className}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {client.projects}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {client.agents}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {client.automations}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm font-medium text-foreground">
                      {client.revenue}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    Nenhum cliente encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedClient && (
                <>
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/15 text-primary font-bold">
                      {selectedClient.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p>{selectedClient.name}</p>
                    <p className="text-sm font-normal text-muted-foreground">
                      {selectedClient.company}
                    </p>
                  </div>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedClient && (
            <div className="space-y-5 pt-2">
              {/* Contact */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Contato
                </h3>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    {selectedClient.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    {selectedClient.phone}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    Cliente desde {selectedClient.since}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Projetos", value: selectedClient.projects, icon: FolderKanban },
                  { label: "Agentes IA", value: selectedClient.agents, icon: Bot },
                  { label: "Automações", value: selectedClient.automations, icon: Zap },
                  { label: "Receita", value: selectedClient.revenue, icon: DollarSign },
                ].map((stat) => (
                  <div key={stat.label} className="glass-card rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <stat.icon className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{stat.label}</span>
                    </div>
                    <p className="text-lg font-bold text-foreground">{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge
                  variant="outline"
                  className={statusConfig[selectedClient.status].className}
                >
                  {statusConfig[selectedClient.status].label}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Clients;
