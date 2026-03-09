import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { MOCK_CLIENTS } from "@/types/client";

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NewProjectDialog = ({ open, onOpenChange }: NewProjectDialogProps) => {
  const [form, setForm] = useState({
    name: "",
    client: "",
    description: "",
    manager: "",
    status: "planning",
    startDate: "",
    deadline: "",
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = () => {
    if (!form.name || !form.client || !form.deadline) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha pelo menos nome, cliente e prazo.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Projeto criado",
      description: `${form.name} foi criado com sucesso.`,
    });
    setForm({
      name: "", client: "", description: "", manager: "",
      status: "planning", startDate: "", deadline: "",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Projeto</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <Label>Nome do Projeto *</Label>
            <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Ex: Implementação CRM" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Cliente *</Label>
              <Select value={form.client} onValueChange={(v) => update("client", v)}>
                <SelectTrigger><SelectValue placeholder="Selecionar cliente" /></SelectTrigger>
                <SelectContent>
                  {MOCK_CLIENTS.map((c) => (
                    <SelectItem key={c.id} value={c.companyName}>{c.companyName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Gerente</Label>
              <Select value={form.manager} onValueChange={(v) => update("manager", v)}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Maria Silva">Maria Silva</SelectItem>
                  <SelectItem value="João Costa">João Costa</SelectItem>
                  <SelectItem value="Ana Santos">Ana Santos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Descreva o projeto..." rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Data de Início</Label>
              <Input type="date" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Prazo *</Label>
              <Input type="date" value={form.deadline} onChange={(e) => update("deadline", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Status Inicial</Label>
            <Select value={form.status} onValueChange={(v) => update("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="planning">Planejamento</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit}>Criar Projeto</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewProjectDialog;
