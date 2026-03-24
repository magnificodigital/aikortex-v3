import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Monitor, Sparkles, Globe, ArrowUp, Plus, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const suggestions = [
  { icon: Sparkles, label: "Construtor de Formulários" },
  { icon: Sparkles, label: "Dashboard de Vendas" },
  { icon: Sparkles, label: "Landing Page" },
];

const recentProjects = [
  { id: 1, name: "Teste 01", description: "Sem descrição", date: "24 de mar.", type: "APP" },
];

const tabs = ["Vistos recentemente", "Meus projetos", "Templates"] as const;

const Home = () => {
  const [prompt, setPrompt] = useState("");
  const [activeCreationTab, setActiveCreationTab] = useState<"app" | "agentes" | "flows">("app");
  const [activeListTab, setActiveListTab] = useState<typeof tabs[number]>("Vistos recentemente");

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-start min-h-[calc(100vh-3.5rem)] px-4 py-12 lg:py-20">
        {/* Greeting */}
        <h1 className="text-3xl lg:text-5xl font-light text-foreground mb-3 text-center">
          {getGreeting()}, <span className="italic">Usuário</span>
        </h1>
        <p className="text-sm lg:text-base text-muted-foreground mb-10 text-center max-w-lg">
          Crie websites, apps e mobile em minutos — banco de dados, hospedagem e IA inclusos.
        </p>

        {/* Prompt Box */}
        <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-1 mb-6">
          {/* Creation tabs */}
          <div className="flex items-center gap-1 px-3 pt-2 pb-1">
            <button
              onClick={() => setActiveCreationTab("app")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeCreationTab === "app"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Monitor className="w-4 h-4" />
              App
            </button>
            <button
              onClick={() => setActiveCreationTab("agentes")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeCreationTab === "agentes"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Agentes
            </button>
            <button
              onClick={() => setActiveCreationTab("flows")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeCreationTab === "flows"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
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
            className="w-full bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground px-4 py-3 min-h-[80px]"
          />

          {/* Bottom bar */}
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
        <div className="flex items-center gap-3 mb-12 flex-wrap justify-center">
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

        {/* Projects Section */}
        <div className="w-full max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveListTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeListTab === tab
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <button className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
              Ver todos →
            </button>
          </div>

          {/* Project Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentProjects.map((project) => (
              <div
                key={project.id}
                className="rounded-xl border border-border bg-card overflow-hidden hover:border-primary/30 transition-colors cursor-pointer group"
              >
                <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5" />
                <div className="p-4 space-y-2">
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {project.type}
                  </span>
                  <h3 className="text-sm font-semibold text-foreground">{project.name}</h3>
                  <p className="text-xs text-muted-foreground">{project.description}</p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                    <Clock className="w-3.5 h-3.5" />
                    {project.date}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Home;
