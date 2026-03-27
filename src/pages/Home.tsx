import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Monitor, Sparkles, Globe, ArrowUp, Plus, RefreshCw, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const suggestionsByTab = {
  app: [
    ["Construtor de Formulários", "Dashboard de Vendas", "Landing Page"],
    ["Sistema de Tarefas", "Painel Financeiro", "CRM Completo"],
    ["E-commerce Simples", "Blog com IA", "Portal de Clientes"],
  ],
  agentes: [
    ["Agente SDR para WhatsApp", "Agente de Suporte 24/7", "Agente de Qualificação"],
    ["Agente BDR LinkedIn", "Agente CS Pós-Venda", "Agente de Pesquisa"],
    ["Agente de Onboarding", "Agente Cobranças", "Agente Agendamento"],
  ],
  flows: [
    ["Fluxo de Onboarding", "Automação de E-mail", "Pipeline de Vendas"],
    ["Nutrição de Leads", "Fluxo Pós-Compra", "Workflow de Aprovação"],
    ["Integração CRM + WhatsApp", "Fluxo de Cobrança", "Sequência Follow-up"],
  ],
};

const tabIcons = { app: Monitor, agentes: Sparkles, flows: Globe };

const Home = () => {
  const [prompt, setPrompt] = useState("");
  const [activeCreationTab, setActiveCreationTab] = useState<"app" | "agentes" | "flows">("app");
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [userName, setUserName] = useState("Usuário");
  const { user } = useAuth();
  const navigate = useNavigate();

  const FLOW_KEYWORDS = ["fluxo", "flow", "automação", "automatizar", "automatização", "automation", "pipeline", "workflow", "nutrição", "sequência", "automacao", "sequencia"];
  const AGENT_KEYWORDS = ["agente", "agent", "sdr", "bdr", "sac", "suporte", "atendimento", "qualificação", "prospecção", "cobranças", "onboarding"];

  const detectCategory = (text: string): "app" | "agentes" | "flows" => {
    const lower = text.toLowerCase();
    if (FLOW_KEYWORDS.some((k) => lower.includes(k))) return "flows";
    if (AGENT_KEYWORDS.some((k) => lower.includes(k))) return "agentes";
    return "app";
  };

  const handleSubmit = () => {
    const text = prompt.trim();
    if (!text) return;

    // Auto-detect category from text, override manual tab if keywords match
    const detected = detectCategory(text);
    // Switch tab visually before navigating
    if (detected !== activeCreationTab) {
      setActiveCreationTab(detected);
    }

    if (detected === "flows") {
      navigate("/aikortex/automations", { state: { initialPrompt: text } });
    } else if (detected === "agentes") {
      navigate("/aikortex/agents", { state: { initialPrompt: text } });
    } else {
      navigate("/app-builder", { state: { initialPrompt: text } });
    }
  };

  const currentSuggestions = suggestionsByTab[activeCreationTab][suggestionIndex];
  const SuggestionIcon = tabIcons[activeCreationTab];

  const refreshSuggestions = useCallback(() => {
    setSuggestionIndex((prev) => (prev + 1) % suggestionsByTab[activeCreationTab].length);
  }, [activeCreationTab]);

  const handleTabChange = (tab: "app" | "agentes" | "flows") => {
    setActiveCreationTab(tab);
    setSuggestionIndex(0);
  };

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
        <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-1 mb-8">
          {/* Creation tabs */}
          <div className="flex items-center gap-1 px-3 pt-2 pb-1">
            {(["app", "agentes", "flows"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeCreationTab === tab
                    ? "bg-primary/15 text-primary"
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

          {/* Text area */}
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Crie um app que..."
            className="w-full bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground px-4 py-3 min-h-[80px]"
          />

          {/* Bottom bar */}
          <div className="flex items-center justify-between px-3 pb-2">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <Plus className="w-4 h-4" />
              </Button>
              <button className="flex items-center gap-1.5 h-8 px-3 text-xs text-muted-foreground border border-border rounded-lg hover:bg-accent transition-colors">
                <Monitor className="w-3.5 h-3.5" />
                GPT-5
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
            <Button
              size="icon"
              className="h-9 w-9 rounded-full bg-primary hover:bg-primary/90"
              disabled={!prompt.trim()}
              onClick={() => handleSubmit()}
            >
              <ArrowUp className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Suggestions */}
        <div className="flex items-center gap-3 flex-wrap justify-center">
          {currentSuggestions.map((label) => (
            <button
              key={label}
              onClick={() => setPrompt(label)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
            >
              <SuggestionIcon className="w-4 h-4" />
              {label}
            </button>
          ))}
          <button
            onClick={refreshSuggestions}
            className="flex items-center justify-center w-10 h-10 rounded-full border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Home;
