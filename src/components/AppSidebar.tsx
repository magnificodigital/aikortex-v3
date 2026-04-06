import { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import aikortexLogoWhite from "@/assets/aikortex-logo-white.png";
import aikortexLogoBlack from "@/assets/aikortex-logo-black.png";
import aikortexIconWhite from "@/assets/aikortex-icon-white.png";
import aikortexIconBlack from "@/assets/aikortex-icon-black.png";
import { LogOut } from "lucide-react";
import {
  LayoutDashboard,
  Home,
  Users,
  CheckSquare,
  DollarSign,
  FileText,
  Bot,
  Settings,
  CreditCard,
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
  LayoutTemplate,
  Video,
  X,
  ShieldCheck,
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useIsMobile } from "@/hooks/use-mobile";
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

type AppSidebarProps = {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
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
    children: [
      { label: "CRM", icon: Contact, path: "/aikortex/crm" },
      { label: "Reuniões", icon: Video, path: "/meetings" },
    ],
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
  { label: "Apps", icon: AppWindow, path: "/apps" },
  { label: "Templates", icon: LayoutTemplate, path: "/templates" },
  { label: "Mensagens", icon: MessageSquare, path: "/aikortex/messages" },
  { label: "Disparos", icon: Send, path: "/aikortex/broadcasts" },
];

const SIDEBAR_STATE_KEY = "sidebar-state";

const loadSidebarState = () => {
  try {
    const saved = localStorage.getItem(SIDEBAR_STATE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return null;
};

const saveSidebarState = (state: Record<string, unknown>) => {
  try {
    localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(state));
  } catch {}
};

const AppSidebar = ({ mobileOpen = false, onMobileClose }: AppSidebarProps) => {
  const saved = loadSidebarState();
  const [collapsed, setCollapsed] = useState(saved?.collapsed ?? false);
  const [gestaoOpen, setGestaoOpen] = useState(saved?.gestaoOpen ?? true);
  const [partnersOpen, setPartnersOpen] = useState(saved?.partnersOpen ?? true);
  const [aikortexOpen, setAikortexOpen] = useState(saved?.aikortexOpen ?? true);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    saved?.expandedItems ?? { "/clients": true, "/sales": true }
  );

  useEffect(() => {
    saveSidebarState({ collapsed, gestaoOpen, partnersOpen, aikortexOpen, expandedItems });
  }, [collapsed, gestaoOpen, partnersOpen, aikortexOpen, expandedItems]);

  const location = useLocation();
  const { theme, toggle } = useTheme();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile) {
      onMobileClose?.();
    }
  }, [location.pathname, location.search, isMobile, onMobileClose]);

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

  const handleNavigate = useCallback(() => {
    if (isMobile) {
      onMobileClose?.();
    }
  }, [isMobile, onMobileClose]);

  const linkClasses = (active: boolean) =>
    `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors overflow-hidden ${
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
            onClick={handleNavigate}
            className={`${linkClasses(isActive)} flex-1`}
            style={!collapsed && depth > 0 ? { paddingLeft: "2.75rem" } : undefined}
            title={collapsed && !isMobile ? item.label : undefined}
          >
            <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
            {(!collapsed || isMobile) && <span className="flex-1 truncate">{item.label}</span>}
          </Link>
          {hasChildren && !collapsed && !isMobile && (
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
        {hasChildren && (isExpanded || collapsed || isMobile) && (!collapsed || isMobile) && (
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
      {!collapsed || isMobile ? (
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center justify-between w-full px-3 py-2 mt-4 text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
        >
          <span>{label}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${open ? "" : "-rotate-90"}`} />
        </button>
      ) : (
        <div className="border-t border-sidebar-border my-2" />
      )}
      {(open || collapsed || isMobile) && (
        <div className="space-y-0.5">
          {items.map((item) => renderItem(item))}
        </div>
      )}
    </div>
  );

  return (
    <>
      {isMobile && mobileOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ${
          isMobile
            ? `fixed inset-y-0 left-0 z-40 w-72 max-w-[85vw] ${mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`
            : collapsed
              ? "w-16"
              : "w-56"
        }`}
      >
        <div className={`flex h-14 items-center border-b border-sidebar-border px-4 ${isMobile ? "justify-between" : "justify-center"}`}>
          <img
            src={collapsed && !isMobile
              ? (theme === "dark" ? aikortexIconWhite : aikortexIconBlack)
              : (theme === "dark" ? aikortexLogoWhite : aikortexLogoBlack)
            }
            alt="Aikortex"
            className={collapsed && !isMobile ? "h-7 w-7 object-contain" : "h-7 w-auto object-contain"}
          />

          {isMobile && (
            <button
              type="button"
              onClick={onMobileClose}
              className="rounded-md p-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-foreground"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Fechar menu</span>
            </button>
          )}
        </div>

        {(!collapsed || isMobile) && (
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

        <nav className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5 scrollbar-thin">
          <div className="mt-2 space-y-0.5">
            <Link to="/home" onClick={handleNavigate} className={linkClasses(isItemActive("/home"))} title={collapsed && !isMobile ? "Home" : undefined}>
              <Home className={`w-4 h-4 shrink-0 ${isItemActive("/home") ? "text-primary" : ""}`} />
              {(!collapsed || isMobile) && <span>Home</span>}
            </Link>
            <Link to="/dashboard" onClick={handleNavigate} className={linkClasses(isItemActive("/dashboard"))} title={collapsed && !isMobile ? "Dashboard" : undefined}>
              <LayoutDashboard className={`w-4 h-4 shrink-0 ${isItemActive("/dashboard") ? "text-primary" : ""}`} />
              {(!collapsed || isMobile) && <span>Dashboard</span>}
            </Link>
          </div>

          {renderGroup("Aikortex", aikortexItems, aikortexOpen, setAikortexOpen)}
          {renderGroup("Gestão", gestaoItems, gestaoOpen, setGestaoOpen)}
          {renderGroup("Partners", partnersItems, partnersOpen, setPartnersOpen)}
        </nav>

        <div className="space-y-0.5 border-t border-sidebar-border px-2 py-2">
          <Link
            to="/admin"
            onClick={handleNavigate}
            className={linkClasses(isItemActive("/admin"))}
            title={collapsed && !isMobile ? "Painel Admin" : undefined}
          >
            <ShieldCheck className={`w-4 h-4 shrink-0 ${isItemActive("/admin") ? "text-primary" : ""}`} />
            {(!collapsed || isMobile) && <span className="truncate">Painel Admin</span>}
          </Link>
          <Link
            to="/pricing"
            onClick={handleNavigate}
            className={linkClasses(isItemActive("/pricing"))}
            title={collapsed && !isMobile ? "Planos" : undefined}
          >
            <CreditCard className={`w-4 h-4 shrink-0 ${isItemActive("/pricing") ? "text-primary" : ""}`} />
            {(!collapsed || isMobile) && <span className="truncate">Planos</span>}
          </Link>
          <Link
            to="/settings"
            onClick={handleNavigate}
            className={linkClasses(isItemActive("/settings"))}
            title={collapsed && !isMobile ? "Configurações" : undefined}
          >
            <Settings className={`w-4 h-4 shrink-0 ${isItemActive("/settings") ? "text-primary" : ""}`} />
            {(!collapsed || isMobile) && <span className="truncate">Configurações</span>}
          </Link>
          <Link
            to="/tutorials"
            onClick={handleNavigate}
            className={linkClasses(isItemActive("/tutorials"))}
            title={collapsed && !isMobile ? "Tutoriais" : undefined}
          >
            <BookOpen className={`w-4 h-4 shrink-0 ${isItemActive("/tutorials") ? "text-primary" : ""}`} />
            {(!collapsed || isMobile) && <span className="truncate">Tutoriais</span>}
          </Link>

          <button
            onClick={toggle}
            className={`${linkClasses(false)} w-full`}
            title={theme === "dark" ? "Modo claro" : "Modo escuro"}
          >
            {theme === "dark" ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
            {(!collapsed || isMobile) && <span className="truncate">{theme === "dark" ? "Modo claro" : "Modo escuro"}</span>}
          </button>

          <button
            onClick={async () => {
              await signOut();
              navigate("/");
            }}
            className={`${linkClasses(false)} w-full`}
            title={collapsed && !isMobile ? "Sair" : undefined}
          >
            <LogOut className="w-4 h-4 shrink-0 text-destructive" />
            {(!collapsed || isMobile) && <span className="truncate text-destructive">Sair</span>}
          </button>

          {isMobile ? (
            <button
              type="button"
              onClick={onMobileClose}
              className={`${linkClasses(false)} w-full`}
            >
              <X className="w-4 h-4 shrink-0" />
              <span>Fechar menu</span>
            </button>
          ) : (
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
          )}
        </div>
      </aside>
    </>
  );
};

export default AppSidebar;
