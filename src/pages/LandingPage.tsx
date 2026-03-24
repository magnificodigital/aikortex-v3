import { useState, useEffect, useCallback } from "react";

import { useNavigate } from "react-router-dom";
import aikortexLogoWhite from "@/assets/aikortex-logo-white.png";
import { Monitor, Sparkles, Globe, ArrowUp, Plus, RefreshCw, Sun, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "@/components/auth/AuthModal";

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

const LandingPage = () => {
  const [prompt, setPrompt] = useState("");
  const [activeCreationTab, setActiveCreationTab] = useState<"app" | "agentes" | "flows">("app");
  const [showAuth, setShowAuth] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const navigate = useNavigate();
  const { user, loading } = useAuth();

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
    if (!loading && user) {
      navigate("/home");
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      {/* Top Navbar */}
      <header className="flex items-center justify-between px-6 lg:px-10 h-16 border-b border-white/5">
        <div className="flex items-center gap-8">
          <img src={aikortexLogoWhite} alt="Aikortex" className="h-7 w-auto object-contain" />
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/60">
            <button onClick={() => { setActiveCreationTab("agentes"); }} className="flex items-center gap-1.5 hover:text-white transition-colors">
              Agentes
              <span className="text-[10px] font-bold uppercase bg-[#559caa] text-white px-1.5 py-0.5 rounded-full">Novo</span>
            </button>
            <button onClick={() => setShowAuth(true)} className="hover:text-white transition-colors">Templates</button>
            <button onClick={() => setShowAuth(true)} className="hover:text-white transition-colors">Preços</button>
          </nav>
        </div>
        <div className="flex items-center gap-4 text-sm text-white/60">
          <button className="hover:text-white transition-colors">
            <Sun className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-1 hover:text-white transition-colors">
            <Globe className="w-4 h-4" />
            PT
          </button>
          <button
            onClick={() => setShowAuth(true)}
            className="hover:text-white transition-colors"
          >
            Entrar
          </button>
          <button
            onClick={() => setShowAuth(true)}
            className="px-4 py-1.5 rounded-full bg-[#559caa] hover:bg-[#4a8a97] text-white text-sm font-medium transition-colors"
          >
            Comece grátis
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 -mt-10">
        {/* Announcement Banner */}
        <button
          className="flex items-center gap-2 mb-10 px-5 py-2.5 rounded-full border border-white/10 bg-white/5 text-sm text-white/70 hover:bg-white/10 transition-colors"
        >
          <span className="text-[10px] font-bold uppercase bg-[#559caa] text-white px-2 py-0.5 rounded-full">Novo</span>
          Conheça o Aikortex Claw — Agentes IA que trabalham 24/7
          <span className="text-white/40">→</span>
        </button>

        {/* Hero */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-light text-center mb-5 tracking-tight">
          <span className="text-white/90">Infinitas </span>
          <span className="italic font-serif font-light text-white/80">possibilidades</span>
        </h1>
        <p className="text-base lg:text-lg text-white/40 text-center max-w-lg mb-12 leading-relaxed">
          Crie Agentes, Fluxos inteligentes e apps em<br />
          minutos conversando com IA.
        </p>

        {/* Prompt Box */}
        <div className="w-full max-w-2xl rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-1 mb-8">
          {/* Creation tabs */}
          <div className="flex items-center gap-1 px-3 pt-2 pb-1">
            {(["app", "agentes", "flows"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeCreationTab === tab
                    ? "bg-[#559caa]/15 text-[#559caa]"
                    : "text-white/40 hover:text-white/60"
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
            className="w-full bg-transparent border-none outline-none resize-none text-sm text-white/80 placeholder:text-white/20 px-4 py-3 min-h-[80px]"
          />

          {/* Bottom bar */}
          <div className="flex items-center justify-between px-3 pb-2">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white/30 hover:text-white/60 hover:bg-white/5">
                <Plus className="w-4 h-4" />
              </Button>
              <button className="flex items-center gap-1.5 h-8 px-3 text-xs text-white/40 border border-white/10 rounded-lg hover:bg-white/5 transition-colors">
                <Monitor className="w-3.5 h-3.5" />
                GPT-5
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
            <Button
              size="icon"
              className="h-9 w-9 rounded-full bg-[#559caa] hover:bg-[#4a8a97] text-white"
              disabled={!prompt.trim()}
              onClick={() => setShowAuth(true)}
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
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 text-sm text-white/40 hover:text-white/60 hover:border-white/20 transition-colors"
            >
              <SuggestionIcon className="w-4 h-4" />
              {label}
            </button>
          ))}
          <button
            onClick={refreshSuggestions}
            className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 text-white/30 hover:text-white/60 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
};

export default LandingPage;
