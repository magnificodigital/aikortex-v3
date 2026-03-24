import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import aikortexLogoWhite from "@/assets/aikortex-logo-white.png";
import aikortexLogoBlack from "@/assets/aikortex-logo-black.png";
import {
  LayoutDashboard,
  Home,
  Users,
  CheckSquare,
  DollarSign,
  FileText,
  Bot,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sun,
  Moon,
  Contact,
  UserCheck,
  Workflow,
  MessageSquare,
  Send,
  ShoppingCart,
  User,
  TrendingUp,
  BookOpen,
  Package,
  Calendar,
  MessageCircle,
  AppWindow,
  Sparkles,
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type NavItem = {
  label: string;
  icon: typeof Home;
  path: string;
  children?: NavItem[];
};

const gestaoItems: NavItem[] = [
  {
    label: "Clientes",
    icon: Users,
    path: "/clients",
    children: [{ label: "Contratos", icon: FileText, path: "/contracts" }],
  },
  {
    label: "Vendas",
    icon: ShoppingCart,
    path: "/sales",
    children: [{ label: "CRM", icon: Contact, path: "/aikortex/crm" }],
  },
  { label: "Financeiro", icon: DollarSign, path: "/financial" },
  { label: "Equipe", icon: UserCheck, path: "/team" },
  { label: "Tarefas", icon: CheckSquare, path: "/tasks" },
];

const partnersItems: NavItem[] = [
  { label: "Perfil", icon: User, path: "/partners?tab=profile" },
  { label: "Evolução", icon: TrendingUp, path: "/partners?tab=tiers" },
  { label: "Treinamentos", icon: BookOpen, path: "/partners?tab=training" },
  { label: "Store", icon: Package, path: "/partners?tab=marketplace" },
  { label: "Eventos", icon: Calendar, path: "/partners?tab=events" },
  { label: "Comunidade", icon: MessageCircle, path: "/partners?tab=community" },
];

const aikortexItems: NavItem[] = [
  { label: "Agentes", icon: Bot, path: "/aikortex/agents" },
  { label: "Flows", icon: Workflow, path: "/aikortex/automations" },
  { label: "Apps", icon: AppWindow, path: "/aikortex/apps" },
  { label: "Mensagens", icon: MessageSquare, path: "/aikortex/messages" },
  { label: "Disparos", icon: Send, path: "/aikortex/broadcasts" },
];

const AppSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [gestaoOpen, setGestaoOpen] = useState(true);
  const [partnersOpen, setPartnersOpen] = useState(true);
  const [aikortexOpen, setAikortexOpen] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    "/clients": true,
    "/sales": true,
  });
  const location = useLocation();
  const { theme, toggle } = useTheme();

  const isItemActive = (path: string) => {
    if (path.includes("?tab=")) {
      const [base, query] = path.split("?");
      return location.pathname === base && location.search === `?${query}`;
    }
    return location.pathname === path;
  };

  const toggleExpand = (path: string) => {
    setExpandedItems((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const linkClasses = (active: boolean) =>
    `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
      active
        ? "bg-sidebar-accent text-primary font-medium"
        : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
    }`;

  const renderItem = (item: NavItem, depth = 0) => {
    const isActive = isItemActive(item.path);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems[item.path];

    return (
      <div key={item.path}>
        <div className="flex items-center">
          <Link
            to={item.path}
            className={`${linkClasses(isActive)} flex-1`}
            style={!collapsed && depth > 0 ? { paddingLeft: "2.75rem" } : undefined}
            title={collapsed ? item.label : undefined}
          >
            <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
            {!collapsed && <span className="flex-1">{item.label}</span>}
          </Link>
          {hasChildren && !collapsed && (
            <button
              onClick={() => toggleExpand(item.path)}
              className="p-1 mr-1 text-muted-foreground hover:text-foreground rounded transition-colors"
            >
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "" : "-rotate-90"}`}
              />
            </button>
          )}
        </div>
        {hasChildren && (isExpanded || collapsed) && !collapsed && (
          <div className="space-y-0.5">
            {item.children!.map((child) => renderItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderGroup = (
    label: string,
    items: NavItem[],
    open: boolean,
    setOpen: (v: boolean) => void
  ) => (
    <div>
      {!collapsed ? (
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center justify-between w-full text-[10px] uppercase tracking-widest text-muted-foreground px-3 py-2 mt-4 hover:text-foreground transition-colors"
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
        collapsed ? "w-16" : "w-56"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 h-14 border-b border-sidebar-border">
        <img src={aikortexLogo} alt="Aikortex" className="w-7 h-7 shrink-0 object-contain" />
        {!collapsed && (
          <span className="font-bold text-base text-foreground tracking-tight">
            Aikortex
            <Sparkles className="inline w-3.5 h-3.5 ml-0.5 text-muted-foreground" />
          </span>
        )}
      </div>

      {/* Workspace selector */}
      {!collapsed && (
        <div className="px-2 pt-3">
          <Select defaultValue="workspace-1">
            <SelectTrigger className="w-full h-8 text-xs border-sidebar-border">
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
        {/* Home & Dashboard */}
        <div className="space-y-0.5 mt-2">
          <Link to="/" className={linkClasses(isItemActive("/"))} title={collapsed ? "Home" : undefined}>
            <Home className={`w-4 h-4 shrink-0 ${isItemActive("/") ? "text-primary" : ""}`} />
            {!collapsed && <span>Home</span>}
          </Link>
          <Link to="/dashboard" className={linkClasses(isItemActive("/dashboard"))} title={collapsed ? "Dashboard" : undefined}>
            <LayoutDashboard className={`w-4 h-4 shrink-0 ${isItemActive("/dashboard") ? "text-primary" : ""}`} />
            {!collapsed && <span>Dashboard</span>}
          </Link>
        </div>

        {renderGroup("Gestão", gestaoItems, gestaoOpen, setGestaoOpen)}
        {renderGroup("Partners", partnersItems, partnersOpen, setPartnersOpen)}
        {renderGroup("Aikortex", aikortexItems, aikortexOpen, setAikortexOpen)}
      </nav>

      {/* Bottom */}
      <div className="py-2 px-2 space-y-0.5 border-t border-sidebar-border">
        <Link
          to="/settings"
          className={linkClasses(isItemActive("/settings"))}
          title={collapsed ? "Configurações" : undefined}
        >
          <Settings className={`w-4 h-4 shrink-0 ${isItemActive("/settings") ? "text-primary" : ""}`} />
          {!collapsed && <span>Configurações</span>}
        </Link>

        <button
          onClick={toggle}
          className={`${linkClasses(false)} w-full`}
          title={theme === "dark" ? "Modo claro" : "Modo escuro"}
        >
          {theme === "dark" ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
          {!collapsed && <span>{theme === "dark" ? "Modo claro" : "Modo escuro"}</span>}
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`${linkClasses(false)} w-full`}
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
