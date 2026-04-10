import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import {
  Users, CreditCard, BarChart3, Settings, Award, ArrowLeft, Sun, Moon, ShieldCheck, Coins, BookOpen, MessageSquare,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import aikortexIconWhite from "@/assets/aikortex-icon-white.png";
import aikortexIconBlack from "@/assets/aikortex-icon-black.png";

const adminNavItems = [
  { label: "Usuários", icon: Users, path: "/admin?tab=users" },
  { label: "Planos", icon: CreditCard, path: "/admin?tab=plans" },
  { label: "Assinaturas", icon: BarChart3, path: "/admin?tab=subscriptions" },
  { label: "Parceiros", icon: Award, path: "/admin?tab=partners" },
  { label: "Pagamentos", icon: Settings, path: "/admin?tab=payment" },
  { label: "Créditos", icon: Coins, path: "/admin?tab=credits" },
  { label: "Tutoriais", icon: BookOpen, path: "/admin?tab=tutorials" },
  { label: "Suporte", icon: MessageSquare, path: "/admin?tab=support" },
  { label: "Configurações", icon: Settings, path: "/admin?tab=config" },
];

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const { profile } = useAuth();

  const isActive = (path: string) => {
    if (path.includes("?tab=")) {
      const [, query] = path.split("?");
      return location.search === `?${query}`;
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
        {/* Header */}
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

        {/* Welcome */}
        <div className="px-4 py-3 border-b border-sidebar-border">
          <p className="text-xs text-muted-foreground">Olá, {profile?.full_name?.split(" ")[0] ?? "Admin"}</p>
          <p className="text-[10px] text-muted-foreground/70 mt-0.5">Painel de controle Aikortex</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {adminNavItems.map((item) => (
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

        {/* Footer */}
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
