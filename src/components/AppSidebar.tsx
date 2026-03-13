import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  UsersRound,
  DollarSign,
  FileText,
  BarChart3,
  Handshake,
  Bot,
  Globe,
  Phone,
  Calendar,
  Radio,
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
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

const coreItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Clientes", icon: Users, path: "/clients" },
  { label: "Projetos", icon: FolderKanban, path: "/projects" },
  { label: "Tarefas", icon: CheckSquare, path: "/tasks" },
  { label: "Equipe", icon: UsersRound, path: "/team" },
  { label: "Financeiro", icon: DollarSign, path: "/financial" },
  { label: "Contratos", icon: FileText, path: "/contracts" },
  { label: "Relatórios", icon: BarChart3, path: "/reports" },
  { label: "Partners", icon: Handshake, path: "/partners" },
];

const aikortexSubItems = [
  { label: "CRM", icon: Contact, path: "/aikortex/crm" },
  { label: "Agentes", icon: UserCheck, path: "/aikortex/agents" },
  { label: "Automações", icon: Workflow, path: "/aikortex/automations" },
  { label: "Mensagens", icon: MessageSquare, path: "/aikortex/messages" },
  { label: "Disparos", icon: Send, path: "/aikortex/broadcasts" },
];

const otherModuleItems = [
  { label: "WebEdit", icon: Globe, path: "/webedit" },
  { label: "AlowDigital", icon: Phone, path: "/alowdigital" },
  { label: "IAgora", icon: Calendar, path: "/iagora" },
  { label: "SintonIA", icon: Radio, path: "/sintonia" },
];

const AppSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [modulesOpen, setModulesOpen] = useState(true);
  const location = useLocation();
  const { theme, toggle } = useTheme();

  const isAikortexActive = location.pathname.startsWith("/aikortex");
  const [aikortexOpen, setAikortexOpen] = useState(isAikortexActive);

  const renderItem = (item: { label: string; icon: typeof LayoutDashboard; path: string }, indent = false) => {
    const isActive = location.pathname === item.path;
    return (
      <Link
        key={item.path}
        to={item.path}
        className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          indent && !collapsed ? "pl-9" : ""
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

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto scrollbar-thin">
        {/* Core */}
        {!collapsed && (
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground px-3 py-2 block">
            Core
          </span>
        )}
        {coreItems.map((item) => renderItem(item))}

        {/* Modules separator */}
        {!collapsed ? (
          <button
            onClick={() => setModulesOpen(!modulesOpen)}
            className="flex items-center justify-between w-full text-[10px] uppercase tracking-widest text-muted-foreground px-3 py-2 mt-3 hover:text-foreground transition-colors"
          >
            <span>Módulos</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${modulesOpen ? "" : "-rotate-90"}`} />
          </button>
        ) : (
          <div className="border-t border-sidebar-border my-2" />
        )}

        {(modulesOpen || collapsed) && (
          <>
            {/* Aikortex with sub-items */}
            {collapsed ? (
              renderItem({ label: "Aikortex", icon: Bot, path: "/aikortex" })
            ) : (
              <div>
                <button
                  onClick={() => setAikortexOpen(!aikortexOpen)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full ${
                    isAikortexActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
                >
                  <Bot className={`w-4 h-4 shrink-0 ${isAikortexActive ? "text-primary" : ""}`} />
                  <span className="flex-1 text-left">Aikortex</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${aikortexOpen ? "" : "-rotate-90"}`} />
                </button>
                {aikortexOpen && (
                  <div className="space-y-0.5 mt-0.5">
                    {aikortexSubItems.map((item) => renderItem(item, true))}
                  </div>
                )}
              </div>
            )}

            {otherModuleItems.map((item) => renderItem(item))}
          </>
        )}
      </nav>

      {/* Bottom */}
      <div className="py-3 px-2 space-y-1 border-t border-sidebar-border">
        {renderItem({ label: "Configurações", icon: Settings, path: "/settings" })}

        <button
          onClick={toggle}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors w-full"
          title={theme === "dark" ? "Modo claro" : "Modo escuro"}
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 shrink-0" />
          ) : (
            <Moon className="w-4 h-4 shrink-0" />
          )}
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
