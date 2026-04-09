import { useState, useEffect } from "react";
import {
  BookOpen, X, ChevronRight, ArrowLeft, Search,
  Bot, Workflow, MessageSquare, Users, DollarSign,
  CheckSquare, Settings, ShoppingCart, Send, AppWindow,
  LayoutTemplate, Video, FileText, HelpCircle, Shield,
  Zap, Globe, Mail, Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

interface HelpArticle {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  icon_name: string;
  read_time: string;
  sort_order: number;
}

const iconMap: Record<string, typeof Bot> = {
  Bot, Workflow, MessageSquare, Users, DollarSign, CheckSquare,
  Settings, ShoppingCart, Send, AppWindow, LayoutTemplate, Video,
  FileText, HelpCircle, BookOpen, Shield, Zap, Globe, Mail, Phone,
};

const categoryColors: Record<string, string> = {
  Aikortex: "bg-primary/10 text-primary",
  Gestão: "bg-accent text-accent-foreground",
  Sistema: "bg-muted text-muted-foreground",
  Geral: "bg-secondary text-secondary-foreground",
};

const HelpBubble = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<HelpArticle | null>(null);
  const [search, setSearch] = useState("");
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isOpen || loaded) return;
    supabase
      .from("help_articles")
      .select("id,title,description,content,category,icon_name,read_time,sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (data) setArticles(data as HelpArticle[]);
        setLoaded(true);
      });
  }, [isOpen, loaded]);

  const filtered = search.trim()
    ? articles.filter(
        (t) =>
          t.title.toLowerCase().includes(search.toLowerCase()) ||
          t.description.toLowerCase().includes(search.toLowerCase()) ||
          t.category.toLowerCase().includes(search.toLowerCase())
      )
    : articles;

  const grouped = filtered.reduce<Record<string, HelpArticle[]>>((acc, t) => {
    (acc[t.category] ??= []).push(t);
    return acc;
  }, {});

  const renderContent = (text: string) =>
    text.split("\n").map((line, i) => {
      if (line.startsWith("# ")) return <h1 key={i} className="text-base font-bold mt-4 mb-2 text-foreground">{line.slice(2)}</h1>;
      if (line.startsWith("## ")) return <h2 key={i} className="text-sm font-semibold mt-3 mb-1.5 text-foreground">{line.slice(3)}</h2>;
      if (line.startsWith("### ")) return <h3 key={i} className="text-sm font-medium mt-2 mb-1 text-foreground">{line.slice(4)}</h3>;
      if (/^\d+\.\s/.test(line)) return <p key={i} className="ml-3 mb-0.5 text-xs text-foreground/90">{line}</p>;
      if (line.startsWith("- ")) return <p key={i} className="ml-3 mb-0.5 text-xs text-foreground/90">• {line.slice(2)}</p>;
      if (line.trim() === "") return <div key={i} className="h-1.5" />;
      return <p key={i} className="text-xs text-foreground/90 mb-1">{line}</p>;
    });

  const getIcon = (name: string) => iconMap[name] || BookOpen;

  return (
    <>
      <div
        className={cn(
          "fixed bottom-20 right-5 z-50 w-[380px] max-w-[calc(100vw-2.5rem)] rounded-2xl border border-border bg-card shadow-2xl transition-all duration-300 origin-bottom-right",
          isOpen ? "scale-100 opacity-100 pointer-events-auto" : "scale-95 opacity-0 pointer-events-none"
        )}
        style={{ maxHeight: "min(580px, calc(100vh - 140px))" }}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border rounded-t-2xl bg-primary/5">
          {selected ? (
            <>
              <button onClick={() => setSelected(null)} className="p-1 rounded-md hover:bg-accent transition-colors">
                <ArrowLeft className="w-4 h-4 text-muted-foreground" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{selected.title}</p>
                <p className="text-[10px] text-muted-foreground">{selected.read_time} de leitura</p>
              </div>
            </>
          ) : (
            <>
              <div className="p-2 rounded-lg bg-primary/10"><BookOpen className="w-4 h-4 text-primary" /></div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Central de Ajuda</p>
                <p className="text-[10px] text-muted-foreground">Tutoriais e guias da plataforma</p>
              </div>
            </>
          )}
          <button onClick={() => { setIsOpen(false); setTimeout(() => setSelected(null), 300); }} className="p-1 rounded-md hover:bg-accent transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {selected ? (
          <ScrollArea className="px-5 py-4" style={{ height: "min(460px, calc(100vh - 240px))" }}>
            <div>{renderContent(selected.content)}</div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col" style={{ height: "min(460px, calc(100vh - 240px))" }}>
            <div className="px-4 pt-3 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input placeholder="Buscar tutorial..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-8 text-xs border-border" />
              </div>
            </div>
            <ScrollArea className="flex-1 px-4 pb-3">
              {Object.entries(grouped).length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">
                  {loaded ? "Nenhum tutorial encontrado." : "Carregando..."}
                </p>
              )}
              {Object.entries(grouped).map(([category, items]) => {
                return (
                  <div key={category} className="mb-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 px-1">{category}</p>
                    <div className="space-y-1">
                      {items.map((article) => {
                        const Icon = getIcon(article.icon_name);
                        return (
                          <button key={article.id} onClick={() => setSelected(article)} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left hover:bg-accent/60 transition-colors group">
                            <div className="p-1.5 rounded-md bg-primary/10 shrink-0"><Icon className="w-3.5 h-3.5 text-primary" /></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground truncate">{article.title}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{article.description}</p>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </ScrollArea>
          </div>
        )}
      </div>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-5 right-5 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-300 hover:scale-105",
          "bg-primary text-primary-foreground hover:shadow-xl"
        )}
        title="Central de Ajuda"
      >
        {isOpen ? <X className="w-6 h-6" /> : <HelpCircle className="w-6 h-6" />}
      </button>
    </>
  );
};

export default HelpBubble;
