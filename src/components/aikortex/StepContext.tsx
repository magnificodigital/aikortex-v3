import { BusinessContext, INITIAL_CONTEXT } from "@/types/agent-builder";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, ArrowRight } from "lucide-react";

interface Props {
  context: BusinessContext;
  onChange: (ctx: BusinessContext) => void;
  onNext: () => void;
}

const INDUSTRIES = [
  "Tecnologia", "SaaS", "E-commerce", "Marketing Digital", "Consultoria",
  "Educação", "Saúde", "Financeiro", "Imobiliário", "Varejo", "Outro",
];

const CHANNELS = ["Website", "WhatsApp", "Instagram", "LinkedIn", "Email", "Telefone", "Outro"];

const StepContext = ({ context, onChange, onNext }: Props) => {
  const update = (field: keyof BusinessContext, value: string) =>
    onChange({ ...context, [field]: value });

  const isValid = context.companyName && context.industry && context.mainProduct;

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Globe className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Conte-nos sobre seu negócio</h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Vamos analisar sua empresa para criar os melhores agentes de IA para você.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="website">Website da empresa</Label>
          <Input id="website" placeholder="https://suaempresa.com" value={context.website} onChange={(e) => update("website", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="name">Nome da empresa *</Label>
          <Input id="name" placeholder="Sua Empresa" value={context.companyName} onChange={(e) => update("companyName", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="country">País</Label>
          <Input id="country" value={context.country} onChange={(e) => update("country", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="language">Idioma</Label>
          <Input id="language" value={context.language} onChange={(e) => update("language", e.target.value)} />
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
          <Input id="product" placeholder="Ex: Plataforma de automação de marketing" value={context.mainProduct} onChange={(e) => update("mainProduct", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ticket">Ticket médio</Label>
          <Input id="ticket" placeholder="R$ 2.000" value={context.averageTicket} onChange={(e) => update("averageTicket", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Canal principal de vendas</Label>
          <Select value={context.mainSalesChannel} onValueChange={(v) => update("mainSalesChannel", v)}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>{CHANNELS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="desc">Descreva seu negócio (opcional)</Label>
          <Textarea id="desc" placeholder="Conte mais sobre como sua empresa funciona..." value={context.description} onChange={(e) => update("description", e.target.value)} rows={3} />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!isValid} className="gap-2">
          Analisar negócio <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default StepContext;
