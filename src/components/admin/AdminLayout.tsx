import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import {
  Users, Building2, Contact, CreditCard, LayoutTemplate, DollarSign, Key, BookOpen, MessageSquare,
  ArrowLeft, Sun, Moon, BarChart3,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import aikortexIconWhite from "@/assets/aikortex-icon-white.png";
import aikortexIconBlack from "@/assets/aikortex-icon-black.png";

const adminNavItems: { label: string; icon: any; path: string; ownerOnly?: boolean }[] = [
  { label: "Visão Geral", icon: BarChart3, path: "/admin?tab=overview" },
  { label: "Agências", icon: Building2, path: "/admin?tab=agencies" },
  { label: "Clientes", icon: Contact, path: "/admin?tab=clients" },
  { label: "Usuários", icon: Users, path: "/admin?tab=users" },
  { label: "Planos", icon: CreditCard, path: "/admin?tab=plans" },
  { label: "Templates", icon: LayoutTemplate, path: "/admin?tab=templates" },
  { label: "Financeiro", icon: DollarSign, path: "/admin?tab=financeiro" },
  { label: "Chaves de API", icon: Key, path: "/admin?tab=api-keys", ownerOnly: true },
  { label: "Suporte", icon: MessageSquare, path: "/admin?tab=support" },
  { label: "Tutoriais", icon: BookOpen, path: "/admin?tab=tutorials" },
];

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const { profile } = useAuth();

  const isActive = (path: string) => {
    if (path.includes("?tab=")) {
      const [, query] = path.split("?");
      const currentTab = new URLSearchParams(location.search).get("tab");
      const navTab = new URLSearchParams(query).get("tab");
      // Default tab is overview
      if (!currentTab && navTab === "overview") return true;
      return currentTab === navTab;
    }
    return location.pathname === path && !location.search;
  };

  const linkClasses = (active: boolean) =>
    `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
      active
        ? "bg-primary/10 text-primary font-medium"
        : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
    }`;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <aside className="flex h-full w-56 flex-col border-r border-sidebar-border bg-sidebar shrink-0">
        <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
          <img
            src={theme === "dark" ? aikortexIconWhite : aikortexIconBlack}
            alt="Aikortex"
            className="h-7 w-7 object-contain"
          />
          <span className="font-semibold text-sm text-foreground">Admin</span>
          <Badge variant="secondary" className="ml-auto text-[10px] bg-red-500/10 text-red-500 border-0">
            Plataforma
          </Badge>
        </div>

        <div className="px-4 py-3 border-b border-sidebar-border">
          <p className="text-xs text-muted-foreground">Olá, {profile?.full_name?.split(" ")[0] ?? "Admin"}</p>
          <p className="text-[10px] text-muted-foreground/70 mt-0.5">Painel de controle Aikortex</p>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {adminNavItems
            .filter((item) => !item.ownerOnly || profile?.role === "platform_owner")
            .map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={linkClasses(isActive(item.path))}
              >
                <item.icon className={`w-4 h-4 shrink-0 ${isActive(item.path) ? "text-primary" : ""}`} />
                <span className="truncate">{item.label}</span>
              </Link>
            ))}
        </nav>

        <div className="space-y-0.5 border-t border-sidebar-border px-2 py-2">
          <button onClick={toggle} className={`${linkClasses(false)} w-full`}>
            {theme === "dark" ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
            <span>{theme === "dark" ? "Modo claro" : "Modo escuro"}</span>
          </button>
          <button onClick={() => navigate("/home")} className={`${linkClasses(false)} w-full`}>
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>Sair do Admin</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
};

export default AdminLayout;
