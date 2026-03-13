import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  Handshake,
  DollarSign,
  FileText,
  BarChart3,
  Bot,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Zap,
  Sun,
  Moon,
  Contact,
  UserCheck,
  Workflow,
  MessageSquare,
  Send,
  ShoppingCart,
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const gestaoItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Clientes", icon: Users, path: "/clients" },
  { label: "Tarefas", icon: CheckSquare, path: "/tasks" },
  { label: "Vendas", icon: ShoppingCart, path: "/sales" },
  { label: "Financeiro", icon: DollarSign, path: "/financial" },
  { label: "Contratos", icon: FileText, path: "/contracts" },
  { label: "Relatórios", icon: BarChart3, path: "/reports" },
];

const aikortexItems = [
  { label: "Agentes", icon: UserCheck, path: "/aikortex/agents" },
  { label: "Automações", icon: Workflow, path: "/aikortex/automations" },
  { label: "CRM", icon: Contact, path: "/aikortex/crm" },
  { label: "Mensagens", icon: MessageSquare, path: "/aikortex/messages" },
  { label: "Disparos", icon: Send, path: "/aikortex/broadcasts" },
];

const AppSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [gestaoOpen, setGestaoOpen] = useState(true);
  const [aikortexOpen, setAikortexOpen] = useState(true);
  const location = useLocation();
  const { theme, toggle } = useTheme();

  const renderItem = (item: { label: string; icon: typeof LayoutDashboard; path: string }) => {
    const isActive = location.pathname === item.path;
    return (
      <Link
        key={item.path}
        to={item.path}
        className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          collapsed ? "" : "pl-9"
        } ${
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        }`}
        title={collapsed ? item.label : undefined}
      >
        <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
        {!collapsed && <span>{item.label}</span>}
      </Link>
    );
  };

  const renderGroup = (
    label: string,
    items: typeof gestaoItems,
    open: boolean,
    setOpen: (v: boolean) => void
  ) => (
    <div>
      {!collapsed ? (
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center justify-between w-full text-[10px] uppercase tracking-widest text-muted-foreground px-3 py-2 mt-3 hover:text-foreground transition-colors"
        >
          <span>{label}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${open ? "" : "-rotate-90"}`} />
        </button>
      ) : (
        <div className="border-t border-sidebar-border my-2" />
      )}
      {(open || collapsed) && (
        <div className="space-y-0.5">
          {items.map((item) => renderItem(item))}
        </div>
      )}
    </div>
  );

  return (
    <aside
      className={`flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 h-14 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center glow-primary shrink-0">
          <Zap className="w-4 h-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <span className="font-bold text-lg text-foreground tracking-tight">AIHUB</span>
        )}
      </div>

      {/* Workspace selector */}
      {!collapsed && (
        <div className="px-3 pt-3">
          <Select defaultValue="workspace-1">
            <SelectTrigger className="w-full h-9 text-xs">
              <SelectValue placeholder="Workspace" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="workspace-1">Meu Workspace</SelectItem>
              <SelectItem value="workspace-2">Agência Alpha</SelectItem>
              <SelectItem value="workspace-3">Cliente Beta</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 py-1 px-2 space-y-0.5 overflow-y-auto scrollbar-thin">
        {renderGroup("Gestão", gestaoItems, gestaoOpen, setGestaoOpen)}
        {renderGroup("Projetos", projetosItems, projetosOpen, setProjetosOpen)}
        {renderGroup("Aikortex", aikortexItems, aikortexOpen, setAikortexOpen)}
      </nav>

      {/* Bottom */}
      <div className="py-3 px-2 space-y-1 border-t border-sidebar-border">
        <Link
          to="/settings"
          className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            collapsed ? "" : ""
          } ${
            location.pathname === "/settings"
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          }`}
          title={collapsed ? "Configurações" : undefined}
        >
          <Settings className={`w-4 h-4 shrink-0 ${location.pathname === "/settings" ? "text-primary" : ""}`} />
          {!collapsed && <span>Configurações</span>}
        </Link>

        <button
          onClick={toggle}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors w-full"
          title={theme === "dark" ? "Modo claro" : "Modo escuro"}
        >
          {theme === "dark" ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
          {!collapsed && <span>{theme === "dark" ? "Modo claro" : "Modo escuro"}</span>}
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors w-full"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 shrink-0" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 shrink-0" />
              <span>Recolher</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
