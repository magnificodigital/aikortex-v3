import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type MarketplaceItem } from "@/types/partner";
import { Search, Plus, Star, Download, Eye, Package } from "lucide-react";
import { toast } from "sonner";

const MOCK_ITEMS: MarketplaceItem[] = [
  { id: "1", title: "Agente de Atendimento IA", description: "Agente inteligente para atendimento ao cliente com integração WhatsApp", category: "agent", price: 297, currency: "BRL", author: "AI Solutions", rating: 4.8, reviews: 24, installs: 156, screenshots: [], tags: ["whatsapp", "atendimento", "ia"], status: "published" },
  { id: "2", title: "Template CRM Imobiliário", description: "Setup completo de CRM para imobiliárias com automações", category: "crm_setup", price: 197, currency: "BRL", author: "PropTech Co", rating: 4.5, reviews: 12, installs: 89, screenshots: [], tags: ["crm", "imobiliária"], status: "published" },
  { id: "3", title: "Automação Lead Scoring", description: "Pipeline automático de qualificação de leads com IA", category: "automation", price: 147, currency: "BRL", author: "Growth Lab", rating: 4.9, reviews: 31, installs: 210, screenshots: [], tags: ["leads", "scoring", "automação"], status: "published" },
  { id: "4", title: "Landing Page SaaS Kit", description: "Templates de landing page prontos para produtos SaaS", category: "template", price: 97, currency: "BRL", author: "WebEdit Studio", rating: 4.3, reviews: 8, installs: 67, screenshots: [], tags: ["landing", "saas", "template"], status: "published" },
  { id: "5", title: "SaaS de Agendamento IA", description: "Produto SaaS completo para agendamento inteligente", category: "saas", price: 497, currency: "BRL", author: "ScheduleAI", rating: 4.7, reviews: 15, installs: 42, screenshots: [], tags: ["agendamento", "saas", "ia"], status: "published" },
];

const CATEGORY_LABELS: Record<string, string> = { agent: "Agente IA", automation: "Automação", crm_setup: "Setup CRM", template: "Template", saas: "SaaS" };

const MarketplaceTab = () => {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [items, setItems] = useState(MOCK_ITEMS);
  const [newOpen, setNewOpen] = useState(false);
  const [newItem, setNewItem] = useState({ title: "", description: "", category: "agent", price: "" });

  const filtered = items.filter((item) => {
    if (catFilter !== "all" && item.category !== catFilter) return false;
    if (search && !item.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handlePublish = () => {
    if (!newItem.title) return;
    const item: MarketplaceItem = {
      id: Date.now().toString(),
      title: newItem.title,
      description: newItem.description,
      category: newItem.category as MarketplaceItem["category"],
      price: Number(newItem.price) || 0,
      currency: "BRL",
      author: "Minha Agência",
      rating: 0,
      reviews: 0,
      installs: 0,
      screenshots: [],
      tags: [],
      status: "under_review",
    };
    setItems([item, ...items]);
    setNewOpen(false);
    setNewItem({ title: "", description: "", category: "agent", price: "" });
    toast.success("Produto enviado para revisão!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar no marketplace..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2">
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={newOpen} onOpenChange={setNewOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-1" />Publicar</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Publicar no Marketplace</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Título</Label><Input value={newItem.title} onChange={(e) => setNewItem({ ...newItem, title: e.target.value })} /></div>
                <div><Label>Descrição</Label><Textarea value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} rows={3} /></div>
                <div><Label>Categoria</Label>
                  <Select value={newItem.category} onValueChange={(v) => setNewItem({ ...newItem, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(CATEGORY_LABELS).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div><Label>Preço (R$)</Label><Input type="number" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} /></div>
                <Button className="w-full" onClick={handlePublish}>Enviar para revisão</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Items grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <Badge variant="outline" className="text-xs">{CATEGORY_LABELS[item.category]}</Badge>
                {item.status === "under_review" && <Badge variant="secondary" className="text-xs">Em revisão</Badge>}
              </div>
              <h3 className="font-semibold text-foreground text-sm">{item.title}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">por {item.author}</span>
                <span className="font-bold text-foreground text-base">R$ {item.price}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />{item.rating}</span>
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{item.reviews} reviews</span>
                <span className="flex items-center gap-1"><Download className="w-3 h-3" />{item.installs}</span>
              </div>
              <div className="flex gap-2">
                {item.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MarketplaceTab;
