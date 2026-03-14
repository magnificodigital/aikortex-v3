import { BusinessContext } from "@/types/agent-builder";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight } from "lucide-react";

interface Props {
  context: BusinessContext;
  onChange: (ctx: BusinessContext) => void;
  onNext: () => void;
}

const INDUSTRIES = [
  "Tecnologia", "SaaS", "E-commerce", "Marketing Digital", "Consultoria",
  "Educação", "Saúde", "Financeiro", "Imobiliário", "Varejo", "Outro",
];

const StepContext = ({ context, onChange, onNext }: Props) => {
  const update = (field: keyof BusinessContext, value: string) =>
    onChange({ ...context, [field]: value });

  const isValid = context.companyName && context.industry && context.mainProduct;

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Sobre sua empresa</h2>
        <p className="text-sm text-muted-foreground">Apenas 3 campos obrigatórios para configurar seu agente</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nome da empresa *</Label>
          <Input id="name" placeholder="Sua Empresa" value={context.companyName} onChange={(e) => update("companyName", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Indústria *</Label>
          <Select value={context.industry} onValueChange={(v) => update("industry", v)}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>{INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="product">Produto ou serviço principal *</Label>
          <Input id="product" placeholder="Ex: Plataforma de automação" value={context.mainProduct} onChange={(e) => update("mainProduct", e.target.value)} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="website">Website (opcional)</Label>
          <Input id="website" placeholder="https://suaempresa.com" value={context.website} onChange={(e) => update("website", e.target.value)} />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!isValid} className="gap-2">
          Criar agente <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default StepContext;
