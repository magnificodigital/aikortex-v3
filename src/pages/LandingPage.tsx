import { useState } from "react";
import { useNavigate } from "react-router-dom";
import aikortexLogoWhite from "@/assets/aikortex-logo-white.png";
import { Monitor, Sparkles, Globe, ArrowUp, Plus, RefreshCw, Sun, User, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const suggestions = [
  { icon: Sparkles, label: "Construtor de Formulários" },
  { icon: Sparkles, label: "Dashboard de Vendas" },
  { icon: Sparkles, label: "Landing Page" },
];

const LandingPage = () => {
  const [prompt, setPrompt] = useState("");
  const [activeCreationTab, setActiveCreationTab] = useState<"app" | "agentes" | "flows">("app");
  const navigate = useNavigate();

  const handleEnter = () => {
    navigate("/home");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      {/* Top Navbar */}
      <header className="flex items-center justify-between px-6 lg:px-10 h-16 border-b border-white/5">
        <div className="flex items-center gap-8">
          <img src={aikortexLogoWhite} alt="Aikortex" className="h-7 w-auto object-contain" />
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/60">
            <button className="flex items-center gap-1.5 hover:text-white transition-colors">
              Agentes
              <span className="text-[10px] font-bold uppercase bg-blue-500 text-white px-1.5 py-0.5 rounded-full">Novo</span>
            </button>
            <button className="hover:text-white transition-colors">Templates</button>
            <button className="hover:text-white transition-colors">Preços</button>
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
          <button onClick={handleEnter} className="flex items-center gap-1.5 hover:text-white transition-colors">
            <User className="w-4 h-4" />
            Usuário Teste
          </button>
          <button className="hover:text-white transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 -mt-10">
        {/* Announcement Banner */}
        <button
          onClick={handleEnter}
          className="flex items-center gap-2 mb-10 px-5 py-2.5 rounded-full border border-white/10 bg-white/5 text-sm text-white/70 hover:bg-white/10 transition-colors"
        >
          <span className="text-[10px] font-bold uppercase bg-blue-500 text-white px-2 py-0.5 rounded-full">Novo</span>
          Conheça o Aikortex Claw — Agentes IA que trabalham 24/7
          <span className="text-white/40">→</span>
        </button>

        {/* Hero */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-center mb-5 tracking-tight">
          <span className="text-white/90">Infinitas </span>
          <span className="italic font-serif text-white/80">possibilidades</span>
        </h1>
        <p className="text-base lg:text-lg text-white/40 text-center max-w-lg mb-12 leading-relaxed">
          Crie Agentes, Fluxos inteligentes e apps em<br />
          minutos conversando com IA.
        </p>

        {/* Prompt Box */}
        <div className="w-full max-w-2xl rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-1 mb-8">
          {/* Creation tabs */}
          <div className="flex items-center gap-1 px-3 pt-2 pb-1">
            <button
              onClick={() => setActiveCreationTab("app")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeCreationTab === "app"
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              <Monitor className="w-4 h-4" />
              App
            </button>
            <button
              onClick={() => setActiveCreationTab("agentes")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeCreationTab === "agentes"
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Agentes
            </button>
            <button
              onClick={() => setActiveCreationTab("flows")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeCreationTab === "flows"
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              <Globe className="w-4 h-4" />
              Flows
            </button>
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
              className="h-9 w-9 rounded-full bg-blue-500 hover:bg-blue-600 text-white"
              disabled={!prompt.trim()}
              onClick={handleEnter}
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
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 text-sm text-white/40 hover:text-white/60 hover:border-white/20 transition-colors"
            >
              <s.icon className="w-4 h-4" />
              {s.label}
            </button>
          ))}
          <button className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 text-white/30 hover:text-white/60 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
