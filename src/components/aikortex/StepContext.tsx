import { BusinessContext } from "@/types/agent-builder";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Building2, Users, BookOpen, MessageCircle, Settings2 } from "lucide-react";
import { useState } from "react";

interface Props {
  context: BusinessContext;
  onChange: (ctx: BusinessContext) => void;
  onNext: () => void;
}

const INDUSTRIES = [
  "Tecnologia", "SaaS", "E-commerce", "Marketing Digital", "Consultoria",
  "Educação", "Saúde", "Financeiro", "Imobiliário", "Varejo", "Outro",
];

const TONES = [
  "Profissional e amigável",
  "Formal e corporativo",
  "Casual e descontraído",
  "Consultivo e técnico",
  "Empático e acolhedor",
];

const HOURS = ["24/7", "Horário comercial (8h-18h)", "Personalizado"];

type Section = "empresa" | "publico" | "conhecimento" | "tom" | "operacional";

const SECTIONS: { key: Section; label: string; icon: typeof Building2 }[] = [
  { key: "empresa", label: "Empresa", icon: Building2 },
  { key: "publico", label: "Público-alvo", icon: Users },
  { key: "conhecimento", label: "Base de conhecimento", icon: BookOpen },
  { key: "tom", label: "Tom e estilo", icon: MessageCircle },
  { key: "operacional", label: "Operacional", icon: Settings2 },
];

const StepContext = ({ context, onChange, onNext }: Props) => {
  const [activeSection, setActiveSection] = useState<Section>("empresa");

  const update = (field: keyof BusinessContext, value: string) =>
    onChange({ ...context, [field]: value });

  const isValid = context.companyName && context.industry && context.mainProduct;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Configure seu agente</h2>
        <p className="text-sm text-muted-foreground">Preencha as informações para criar um agente eficaz. Campos com * são obrigatórios.</p>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          const isActive = activeSection === s.key;
          return (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Empresa */}
      {activeSection === "empresa" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
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
          <div className="space-y-1.5">
            <Label htmlFor="website">Website</Label>
            <Input id="website" placeholder="https://suaempresa.com" value={context.website} onChange={(e) => update("website", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="country">País / Idioma</Label>
            <Input id="country" placeholder="Brasil" value={context.country} onChange={(e) => update("country", e.target.value)} />
          </div>
        </div>
      )}

      {/* Público-alvo */}
      {activeSection === "publico" && (
        <div className="space-y-4 animate-fade-in">
          <div className="space-y-1.5">
            <Label htmlFor="audience">Quem é seu público-alvo?</Label>
            <Textarea
              id="audience"
              placeholder="Ex: PMEs de tecnologia com 10-50 funcionários, decisores de nível C-level..."
              value={context.targetAudienceDescription}
              onChange={(e) => update("targetAudienceDescription", e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pains">Principais dores / problemas do público</Label>
            <Textarea
              id="pains"
              placeholder="Ex: Dificuldade em escalar atendimento, perda de leads por demora na resposta..."
              value={context.painPoints}
              onChange={(e) => update("painPoints", e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ticket">Ticket médio</Label>
            <Input id="ticket" placeholder="R$ 2.000" value={context.averageTicket} onChange={(e) => update("averageTicket", e.target.value)} />
          </div>
        </div>
      )}

      {/* Base de conhecimento */}
      {activeSection === "conhecimento" && (
        <div className="space-y-4 animate-fade-in">
          <div className="space-y-1.5">
            <Label htmlFor="knowledge">Fontes de conhecimento</Label>
            <Textarea
              id="knowledge"
              placeholder="Descreva ou cole links de materiais que o agente deve usar: documentação, manuais, artigos, scripts de vendas..."
              value={context.knowledgeSources}
              onChange={(e) => update("knowledgeSources", e.target.value)}
              rows={4}
            />
            <p className="text-[10px] text-muted-foreground">O agente usará essas informações para responder de forma precisa</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="faq">URL do FAQ ou Central de Ajuda</Label>
            <Input id="faq" placeholder="https://suaempresa.com/faq" value={context.faqUrl} onChange={(e) => update("faqUrl", e.target.value)} />
          </div>
        </div>
      )}

      {/* Tom e estilo */}
      {activeSection === "tom" && (
        <div className="space-y-4 animate-fade-in">
          <div className="space-y-1.5">
            <Label>Tom de voz do agente</Label>
            <Select value={context.toneOfVoice} onValueChange={(v) => update("toneOfVoice", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="greeting">Mensagem de saudação</Label>
            <Textarea
              id="greeting"
              placeholder="Ex: Olá! 👋 Sou o assistente da [Empresa]. Como posso ajudar?"
              value={context.greetingMessage}
              onChange={(e) => update("greetingMessage", e.target.value)}
              rows={2}
            />
          </div>
        </div>
      )}

      {/* Operacional */}
      {activeSection === "operacional" && (
        <div className="space-y-4 animate-fade-in">
          <div className="space-y-1.5">
            <Label>Horário de funcionamento</Label>
            <Select value={context.businessHours} onValueChange={(v) => update("businessHours", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{HOURS.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="escalation">Regras de escalonamento</Label>
            <Textarea
              id="escalation"
              placeholder="Ex: Transferir para humano quando o cliente pedir, em casos de reclamação grave, ou quando não souber responder..."
              value={context.escalationRules}
              onChange={(e) => update("escalationRules", e.target.value)}
              rows={3}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-muted-foreground">
          {!isValid && "Preencha os campos obrigatórios na aba Empresa"}
        </p>
        <Button onClick={onNext} disabled={!isValid} className="gap-2">
          Criar agente <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default StepContext;
