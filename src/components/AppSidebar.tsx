import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Handshake,
  DollarSign,
  FileText,
  BarChart3,
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
  Search,
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NavItem {
  label: string;
  icon: typeof LayoutDashboard;
  path: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const groups: NavGroup[] = [
  {
    label: "Gestão",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/" },
      { label: "Contratos", icon: FileText, path: "/contracts" },
      { label: "Vendas", icon: ShoppingCart, path: "/sales" },
      { label: "Partners", icon: Handshake, path: "/partners" },
      { label: "Financeiro", icon: DollarSign, path: "/financial" },
      { label: "Relatórios", icon: BarChart3, path: "/reports" },
    ],
  },
  {
    label: "Projetos",
    items: [
      { label: "Clientes", icon: Users, path: "/clients" },
      { label: "Tarefas", icon: CheckSquare, path: "/tasks" },
    ],
  },
  {
    label: "Aikortex",
    items: [
      { label: "Agentes", icon: UserCheck, path: "/aikortex/agents" },
      { label: "Automações", icon: Workflow, path: "/aikortex/automations" },
      { label: "CRM", icon: Contact, path: "/aikortex/crm" },
      { label: "Mensagens", icon: MessageSquare, path: "/aikortex/messages" },
      { label: "Disparos", icon: Send, path: "/aikortex/broadcasts" },
    ],
  },
];

const AppSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Gestão: true,
    Projetos: true,
    Aikortex: true,
  });
  const [search, setSearch] = useState("");
  const location = useLocation();
  const { theme, toggle } = useTheme();

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const filteredGroups = groups
    .map((g) => ({
      ...g,
      items: g.items.filter((i) =>
        i.label.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <aside
      className={`flex flex-col h-screen bg-sidebar transition-all duration-300 ${
        collapsed ? "w-14" : "w-56"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 h-12 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Zap className="w-3.5 h-3.5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <span className="font-semibold text-sm text-foreground tracking-tight">
            AIHUB
          </span>
        )}
      </div>

      {/* Workspace + Search */}
      {!collapsed && (
        <div className="px-2.5 pb-2 space-y-2">
          <Select defaultValue="workspace-1">
            <SelectTrigger className="w-full h-8 text-xs border-sidebar-border bg-sidebar-accent/50 focus:ring-0 focus:ring-offset-0">
              <SelectValue placeholder="Workspace" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="workspace-1">Meu Workspace</SelectItem>
              <SelectItem value="workspace-2">Agência Alpha</SelectItem>
              <SelectItem value="workspace-3">Cliente Beta</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Procurar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-3 text-xs rounded-md bg-sidebar-accent/50 border border-sidebar-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors"
            />
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 overflow-y-auto scrollbar-thin">
        {filteredGroups.map((group) => (
          <div key={group.label} className="mb-1">
            {!collapsed ? (
              <button
                onClick={() => toggleGroup(group.label)}
                className="flex items-center gap-2 w-full px-2 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md"
              >
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-200 ${
                    openGroups[group.label] ? "" : "-rotate-90"
                  }`}
                />
                <span>{group.label}</span>
              </button>
            ) : (
              <div className="h-px bg-sidebar-border mx-1 my-2" />
            )}

            {(openGroups[group.label] || collapsed) && (
              <div className="space-y-px">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`group flex items-center gap-2.5 rounded-md transition-all duration-150 ${
                        collapsed
                          ? "justify-center px-0 py-2"
                          : "pl-7 pr-2 py-[6px]"
                      } ${
                        isActive
                          ? "bg-sidebar-accent text-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
                      }`}
                      title={collapsed ? item.label : undefined}
                    >
                      <item.icon
                        className={`w-[15px] h-[15px] shrink-0 transition-colors ${
                          isActive
                            ? "text-primary"
                            : "text-muted-foreground group-hover:text-foreground"
                        }`}
                      />
                      {!collapsed && (
                        <span className="text-[13px] font-normal truncate">
                          {item.label}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-2 space-y-px border-t border-sidebar-border">
        <Link
          to="/settings"
          className={`group flex items-center gap-2.5 rounded-md transition-all duration-150 ${
            collapsed ? "justify-center px-0 py-2" : "px-2 py-[6px]"
          } ${
            location.pathname === "/settings"
              ? "bg-sidebar-accent text-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
          }`}
          title={collapsed ? "Configurações" : undefined}
        >
          <Settings
            className={`w-[15px] h-[15px] shrink-0 ${
              location.pathname === "/settings"
                ? "text-primary"
                : "text-muted-foreground group-hover:text-foreground"
            }`}
          />
          {!collapsed && (
            <span className="text-[13px] font-normal">Configurações</span>
          )}
        </Link>

        <button
          onClick={toggle}
          className={`group flex items-center gap-2.5 rounded-md text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-foreground transition-all duration-150 w-full ${
            collapsed ? "justify-center px-0 py-2" : "px-2 py-[6px]"
          }`}
          title={theme === "dark" ? "Modo claro" : "Modo escuro"}
        >
          {theme === "dark" ? (
            <Sun className="w-[15px] h-[15px] shrink-0 text-muted-foreground group-hover:text-foreground" />
          ) : (
            <Moon className="w-[15px] h-[15px] shrink-0 text-muted-foreground group-hover:text-foreground" />
          )}
          {!collapsed && (
            <span className="text-[13px] font-normal">
              {theme === "dark" ? "Modo claro" : "Modo escuro"}
            </span>
          )}
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`group flex items-center gap-2.5 rounded-md text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-foreground transition-all duration-150 w-full ${
            collapsed ? "justify-center px-0 py-2" : "px-2 py-[6px]"
          }`}
        >
          {collapsed ? (
            <ChevronRight className="w-[15px] h-[15px] shrink-0 text-muted-foreground group-hover:text-foreground" />
          ) : (
            <>
              <ChevronLeft className="w-[15px] h-[15px] shrink-0 text-muted-foreground group-hover:text-foreground" />
              <span className="text-[13px] font-normal">Recolher</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
