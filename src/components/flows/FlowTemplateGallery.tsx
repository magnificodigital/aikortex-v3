import { useState } from "react";
import { FLOW_TEMPLATES, type FlowTemplate } from "@/types/flow-builder";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onSelect: (template: FlowTemplate) => void;
}

export default function FlowTemplateGallery({ onSelect }: Props) {
  const [search, setSearch] = useState("");

  const categories = [...new Set(FLOW_TEMPLATES.map((t) => t.category))];
  const filtered = FLOW_TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.tags.some((tag) => tag.includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground mb-1">Templates prontos</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Clique em um template para abrir o fluxo completo, pronto para personalizar e publicar.
        </p>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {categories.map((cat) => {
        const items = filtered.filter((t) => t.category === cat);
        if (items.length === 0) return null;
        return (
          <div key={cat}>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{cat}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {items.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => onSelect(tpl)}
                  className={cn(
                    "text-left rounded-xl border border-border bg-card/60 backdrop-blur-sm p-4 hover:bg-accent/40 hover:border-primary/30 transition-all group cursor-pointer"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{tpl.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {tpl.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {tpl.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {tpl.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[9px] px-1.5 py-0">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
