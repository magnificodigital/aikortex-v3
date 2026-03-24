import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Monitor, Sparkles, Globe, ArrowUp, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const suggestions = [
  { icon: Sparkles, label: "Construtor de Formulários" },
  { icon: Sparkles, label: "Dashboard de Vendas" },
  { icon: Sparkles, label: "Landing Page" },
];

const Home = () => {
  const [prompt, setPrompt] = useState("");
  const [activeCreationTab, setActiveCreationTab] = useState<"app" | "agentes" | "flows">("app");
  const [userName, setUserName] = useState("Usuário");
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.full_name) setUserName(data.full_name);
      });
  }, [user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] px-4">
        {/* Greeting */}
        <h1 className="text-3xl lg:text-5xl font-light text-foreground mb-3 text-center">
          {getGreeting()}, <span className="italic">{userName}</span>
        </h1>
        <p className="text-sm lg:text-base text-muted-foreground mb-10 text-center max-w-lg">
          Crie Agentes, Fluxos inteligentes e apps em<br />
          minutos conversando com IA.
        </p>

        {/* Prompt Box */}
        <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-1 mb-6">
          <div className="flex items-center gap-1 px-3 pt-2 pb-1">
            {(["app", "agentes", "flows"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveCreationTab(tab)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeCreationTab === tab
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "app" && <Monitor className="w-4 h-4" />}
                {tab === "agentes" && <Sparkles className="w-4 h-4" />}
                {tab === "flows" && <Globe className="w-4 h-4" />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Crie um app que..."
            className="w-full bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground px-4 py-3 min-h-[80px]"
          />

          <div className="flex items-center justify-between px-3 pb-2">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <Plus className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 text-muted-foreground">
                <Monitor className="w-3.5 h-3.5" />
                GPT-5
              </Button>
            </div>
            <Button
              size="icon"
              className="h-9 w-9 rounded-full bg-primary hover:bg-primary/90"
              disabled={!prompt.trim()}
            >
              <ArrowUp className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Suggestions */}
        <div className="flex items-center gap-3 flex-wrap justify-center">
          {suggestions.map((s) => (
            <button
              key={s.label}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
            >
              <s.icon className="w-4 h-4" />
              {s.label}
            </button>
          ))}
          <button className="flex items-center justify-center w-9 h-9 rounded-full border border-border text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Home;
