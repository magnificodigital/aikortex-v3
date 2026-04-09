import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, EyeOff, GripVertical } from "lucide-react";

interface HelpArticle {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  icon_name: string;
  read_time: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const iconOptions = [
  "Bot", "Workflow", "MessageSquare", "Send", "Users", "ShoppingCart",
  "DollarSign", "CheckSquare", "FileText", "Video", "AppWindow",
  "LayoutTemplate", "Settings", "BookOpen", "HelpCircle", "Shield",
  "Zap", "Globe", "Mail", "Phone",
];

const categoryOptions = ["Aikortex", "Gestão", "Sistema", "Geral"];

const emptyArticle: Omit<HelpArticle, "id" | "created_at" | "updated_at"> = {
  title: "",
  description: "",
  content: "",
  category: "Geral",
  icon_name: "BookOpen",
  read_time: "5 min",
  sort_order: 0,
  is_active: true,
};

const AdminHelpTab = () => {
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Partial<HelpArticle> | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchArticles = async () => {
    const { data, error } = await supabase
      .from("help_articles")
      .select("*")
      .order("sort_order", { ascending: true });
    if (!error && data) setArticles(data as HelpArticle[]);
    setLoading(false);
  };

  useEffect(() => { fetchArticles(); }, []);

  const handleSave = async () => {
    if (!editingArticle?.title?.trim()) {
      toast.error("Título é obrigatório");
      return;
    }
    setSaving(true);
    try {
      if (editingArticle.id) {
        const { error } = await supabase
          .from("help_articles")
          .update({
            title: editingArticle.title,
            description: editingArticle.description || "",
            content: editingArticle.content || "",
            category: editingArticle.category || "Geral",
            icon_name: editingArticle.icon_name || "BookOpen",
            read_time: editingArticle.read_time || "5 min",
            sort_order: editingArticle.sort_order || 0,
            is_active: editingArticle.is_active ?? true,
          })
          .eq("id", editingArticle.id);
        if (error) throw error;
        toast.success("Artigo atualizado");
      } else {
        const { error } = await supabase
          .from("help_articles")
          .insert({
            title: editingArticle.title,
            description: editingArticle.description || "",
            content: editingArticle.content || "",
            category: editingArticle.category || "Geral",
            icon_name: editingArticle.icon_name || "BookOpen",
            read_time: editingArticle.read_time || "5 min",
            sort_order: editingArticle.sort_order || 0,
            is_active: editingArticle.is_active ?? true,
          });
        if (error) throw error;
        toast.success("Artigo criado");
      }
      setDialogOpen(false);
      setEditingArticle(null);
      fetchArticles();
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este artigo?")) return;
    const { error } = await supabase.from("help_articles").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else { toast.success("Artigo excluído"); fetchArticles(); }
  };

  const toggleActive = async (article: HelpArticle) => {
    await supabase
      .from("help_articles")
      .update({ is_active: !article.is_active })
      .eq("id", article.id);
    fetchArticles();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Artigos de Ajuda</h2>
          <p className="text-xs text-muted-foreground">Gerencie os tutoriais exibidos na Central de Ajuda.</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => { setEditingArticle({ ...emptyArticle, sort_order: articles.length + 1 }); setDialogOpen(true); }}>
          <Plus className="w-3.5 h-3.5" /> Novo Artigo
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Leitura</TableHead>
                <TableHead className="w-20">Status</TableHead>
                <TableHead className="w-28">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">Carregando...</TableCell></TableRow>
              ) : articles.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">Nenhum artigo cadastrado.</TableCell></TableRow>
              ) : articles.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-xs text-muted-foreground">{a.sort_order}</TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate max-w-[300px]">{a.description}</p>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{a.category}</Badge></TableCell>
                  <TableCell className="text-xs">{a.read_time}</TableCell>
                  <TableCell>
                    <button onClick={() => toggleActive(a)} title={a.is_active ? "Desativar" : "Ativar"}>
                      {a.is_active ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingArticle(a); setDialogOpen(true); }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(a.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditingArticle(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingArticle?.id ? "Editar Artigo" : "Novo Artigo"}</DialogTitle>
          </DialogHeader>
          {editingArticle && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Título</Label>
                  <Input value={editingArticle.title || ""} onChange={(e) => setEditingArticle({ ...editingArticle, title: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Categoria</Label>
                  <Select value={editingArticle.category || "Geral"} onValueChange={(v) => setEditingArticle({ ...editingArticle, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Descrição curta</Label>
                <Input value={editingArticle.description || ""} onChange={(e) => setEditingArticle({ ...editingArticle, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Ícone</Label>
                  <Select value={editingArticle.icon_name || "BookOpen"} onValueChange={(v) => setEditingArticle({ ...editingArticle, icon_name: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((ic) => <SelectItem key={ic} value={ic}>{ic}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tempo de leitura</Label>
                  <Input value={editingArticle.read_time || ""} onChange={(e) => setEditingArticle({ ...editingArticle, read_time: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Ordem</Label>
                  <Input type="number" value={editingArticle.sort_order || 0} onChange={(e) => setEditingArticle({ ...editingArticle, sort_order: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Conteúdo (Markdown)</Label>
                <Textarea
                  value={editingArticle.content || ""}
                  onChange={(e) => setEditingArticle({ ...editingArticle, content: e.target.value })}
                  className="min-h-[250px] font-mono text-xs"
                  placeholder="# Título&#10;&#10;## Seção&#10;- Item 1&#10;- Item 2"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editingArticle.is_active ?? true} onCheckedChange={(c) => setEditingArticle({ ...editingArticle, is_active: c })} />
                <Label className="text-xs">Artigo ativo (visível na Central de Ajuda)</Label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => { setDialogOpen(false); setEditingArticle(null); }}>Cancelar</Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminHelpTab;
