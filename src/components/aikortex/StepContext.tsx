import { BusinessContext, KnowledgeFile } from "@/types/agent-builder";
import { Client, MOCK_CLIENTS } from "@/types/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, ArrowLeft, Building2, Users, BookOpen, MessageCircle, Upload, X, FileText, Image, File, Bot, Briefcase, Zap, Plus, Check, AlertCircle } from "lucide-react";
import { useState, useRef } from "react";

interface Props {
  context: BusinessContext;
  onChange: (ctx: BusinessContext) => void;
  onNext: () => void;
  onBack: () => void;
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

const DEFAULT_SKILLS = [
  "Qualificação de leads",
  "Atendimento ao cliente",
  "Agendamento de reuniões",
  "Follow-up automático",
  "Coleta de feedback",
  "Onboarding de clientes",
  "Resolução de dúvidas técnicas",
  "Negociação e vendas",
  "Suporte pós-venda",
  "Pesquisa de satisfação",
];

type Section = "empresa" | "agente" | "servicos" | "publico" | "conhecimento" | "tom" | "skills";

const SECTIONS: { key: Section; label: string; icon: typeof Building2 }[] = [
  { key: "empresa", label: "Empresa", icon: Building2 },
  { key: "agente", label: "Nome do Agente", icon: Bot },
  { key: "servicos", label: "Serviços", icon: Briefcase },
  { key: "publico", label: "Público-alvo", icon: Users },
  { key: "conhecimento", label: "Base de conhecimento", icon: BookOpen },
  { key: "tom", label: "Tom e estilo", icon: MessageCircle },
  { key: "skills", label: "Skills", icon: Zap },
];

const StepContext = ({ context, onChange, onNext, onBack }: Props) => {
  const [activeSection, setActiveSection] = useState<Section>("empresa");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newService, setNewService] = useState("");
  const [newSkill, setNewSkill] = useState("");

  const update = (field: keyof BusinessContext, value: string) =>
    onChange({ ...context, [field]: value });

  const handleFiles = (files: FileList) => {
    const newFiles: KnowledgeFile[] = Array.from(files)
      .filter((f) => f.size <= 10 * 1024 * 1024)
      .map((f) => ({ id: crypto.randomUUID(), name: f.name, size: f.size, type: f.type }));
    onChange({ ...context, knowledgeFiles: [...context.knowledgeFiles, ...newFiles] });
  };

  const removeFile = (id: string) => {
    onChange({ ...context, knowledgeFiles: context.knowledgeFiles.filter((f) => f.id !== id) });
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <Image className="w-4 h-4 text-primary shrink-0" />;
    if (type === "application/pdf") return <FileText className="w-4 h-4 text-destructive shrink-0" />;
    return <File className="w-4 h-4 text-muted-foreground shrink-0" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const addService = () => {
    const trimmed = newService.trim();
    if (trimmed && !context.services.includes(trimmed)) {
      onChange({ ...context, services: [...context.services, trimmed] });
      setNewService("");
    }
  };

  const removeService = (service: string) => {
    onChange({ ...context, services: context.services.filter((s) => s !== service) });
  };

  const toggleSkill = (skill: string) => {
    const exists = context.skills.includes(skill);
    onChange({
      ...context,
      skills: exists ? context.skills.filter((s) => s !== skill) : [...context.skills, skill],
    });
  };

  const addCustomSkill = () => {
    const trimmed = newSkill.trim();
    if (trimmed && !context.skills.includes(trimmed)) {
      onChange({ ...context, skills: [...context.skills, trimmed] });
      setNewSkill("");
    }
  };

  // Validation per section
  const sectionValid: Record<Section, boolean> = {
    empresa: !!(context.companyName && context.industry && context.mainProduct),
    agente: !!context.agentName.trim(),
    servicos: context.services.length > 0,
    publico: !!context.targetAudienceDescription.trim(),
    conhecimento: context.knowledgeFiles.length > 0 || !!context.knowledgeSources.trim(),
    tom: !!context.toneOfVoice,
    skills: context.skills.length > 0,
  };

  const allValid = Object.values(sectionValid).every(Boolean);

  const incompleteSections = SECTIONS.filter((s) => !sectionValid[s.key]);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Configure seu agente</h2>
        <p className="text-sm text-muted-foreground">Preencha todas as seções para criar um agente eficaz.</p>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          const isActive = activeSection === s.key;
          const isComplete = sectionValid[s.key];
          return (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : isComplete
                  ? "text-foreground bg-muted/80"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {isComplete && !isActive ? (
                <Check className="w-3.5 h-3.5 text-[hsl(var(--success))]" />
              ) : (
                <Icon className="w-3.5 h-3.5" />
              )}
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Empresa */}
      {activeSection === "empresa" && (
        <div className="space-y-4 animate-fade-in">
          <div className="space-y-1.5">
            <Label>Selecionar cliente cadastrado *</Label>
            <Select
              value={context.companyName ? MOCK_CLIENTS.find(c => c.companyName === context.companyName)?.id || "" : ""}
              onValueChange={(clientId) => {
                const client = MOCK_CLIENTS.find(c => c.id === clientId);
                if (client) {
                  onChange({
                    ...context,
                    companyName: client.companyName,
                    website: client.website ? `https://${client.website}` : "",
                    industry: INDUSTRIES.includes(client.industry) ? client.industry : client.industry || "",
                  });
                }
              }}
            >
              <SelectTrigger><SelectValue placeholder="Escolha um cliente" /></SelectTrigger>
              <SelectContent>
                {MOCK_CLIENTS.filter(c => c.status === "active" || c.status === "onboarding").map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">{c.initials}</div>
                      <span>{c.companyName}</span>
                      <span className="text-muted-foreground text-xs">— {c.industry}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {context.companyName && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg border border-border bg-muted/30 p-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Empresa</Label>
                <p className="text-sm font-medium text-foreground">{context.companyName}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Indústria</Label>
                <p className="text-sm font-medium text-foreground">{context.industry || "—"}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Website</Label>
                <p className="text-sm font-medium text-foreground">{context.website || "—"}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">País / Idioma</Label>
                <p className="text-sm font-medium text-foreground">{context.country} / {context.language}</p>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="product">Produto ou serviço principal *</Label>
            <Input id="product" placeholder="Ex: Plataforma de automação" value={context.mainProduct} onChange={(e) => update("mainProduct", e.target.value)} />
          </div>
        </div>
      )}

      {/* Nome do Agente */}
      {activeSection === "agente" && (
        <div className="space-y-4 animate-fade-in">
          <div className="space-y-1.5">
            <Label htmlFor="agentName">Nome do agente *</Label>
            <Input
              id="agentName"
              placeholder="Ex: Sofia, Max, Assistente Comercial..."
              value={context.agentName}
              onChange={(e) => update("agentName", e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">Escolha um nome que represente a personalidade do agente.</p>
          </div>
        </div>
      )}

      {/* Serviços */}
      {activeSection === "servicos" && (
        <div className="space-y-4 animate-fade-in">
          <div className="space-y-1.5">
            <Label>Serviços que a empresa oferece *</Label>
            <p className="text-[11px] text-muted-foreground">Adicione os serviços/produtos que o agente deve conhecer.</p>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Ex: Consultoria em marketing digital"
              value={newService}
              onChange={(e) => setNewService(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addService(); } }}
            />
            <Button type="button" size="sm" onClick={addService} disabled={!newService.trim()} className="gap-1 shrink-0">
              <Plus className="w-4 h-4" /> Adicionar
            </Button>
          </div>
          {context.services.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {context.services.map((service) => (
                <Badge key={service} variant="secondary" className="gap-1.5 py-1.5 px-3 text-xs">
                  {service}
                  <button onClick={() => removeService(service)} className="hover:text-destructive transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          {context.services.length === 0 && (
            <p className="text-xs text-muted-foreground/70 text-center py-4 border border-dashed border-border rounded-lg">
              Nenhum serviço adicionado ainda
            </p>
          )}
        </div>
      )}

      {/* Público-alvo */}
      {activeSection === "publico" && (
        <div className="space-y-4 animate-fade-in">
          <div className="space-y-1.5">
            <Label htmlFor="audience">Quem é seu público-alvo? *</Label>
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
          <div className="space-y-2">
            <Label>Arquivos de referência *</Label>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
              }}
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
            >
              <Upload className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">Arraste arquivos ou clique para enviar</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">PDF, TXT, imagens (máx. 10MB cada)</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.txt,.md,.doc,.docx,.png,.jpg,.jpeg,.webp"
              className="hidden"
              onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ""; }}
            />
            {context.knowledgeFiles.length > 0 && (
              <div className="space-y-1.5 mt-3">
                {context.knowledgeFiles.map((file) => (
                  <div key={file.id} className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm">
                    {getFileIcon(file.type)}
                    <span className="flex-1 truncate text-foreground">{file.name}</span>
                    <span className="text-[10px] text-muted-foreground">{formatSize(file.size)}</span>
                    <button onClick={() => removeFile(file.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="knowledge">Fontes de conhecimento (URLs, descrições)</Label>
            <Textarea
              id="knowledge"
              placeholder="Cole links de documentação, manuais, artigos, scripts de vendas..."
              value={context.knowledgeSources}
              onChange={(e) => update("knowledgeSources", e.target.value)}
              rows={3}
            />
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
            <Label>Tom de voz do agente *</Label>
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

      {/* Skills */}
      {activeSection === "skills" && (
        <div className="space-y-4 animate-fade-in">
          <div className="space-y-1.5">
            <Label>Skills do agente *</Label>
            <p className="text-[11px] text-muted-foreground">Selecione ou adicione as habilidades do agente.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_SKILLS.map((skill) => {
              const selected = context.skills.includes(skill);
              return (
                <button
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    selected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 text-muted-foreground border-border hover:border-primary/50"
                  }`}
                >
                  {selected && <Check className="w-3 h-3 inline mr-1" />}
                  {skill}
                </button>
              );
            })}
          </div>
          {/* Custom skills */}
          {context.skills.filter((s) => !DEFAULT_SKILLS.includes(s)).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {context.skills.filter((s) => !DEFAULT_SKILLS.includes(s)).map((skill) => (
                <Badge key={skill} variant="secondary" className="gap-1.5 py-1.5 px-3 text-xs">
                  {skill}
                  <button onClick={() => toggleSkill(skill)} className="hover:text-destructive transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              placeholder="Adicionar skill personalizada..."
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomSkill(); } }}
            />
            <Button type="button" size="sm" onClick={addCustomSkill} disabled={!newSkill.trim()} className="gap-1 shrink-0">
              <Plus className="w-4 h-4" /> Adicionar
            </Button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onBack} className="gap-1.5">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Button>
          {!allValid && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <AlertCircle className="w-3.5 h-3.5 text-destructive" />
              <span>Faltam: {incompleteSections.map((s) => s.label).join(", ")}</span>
            </div>
          )}
        </div>
        <Button onClick={onNext} className="gap-2">
          Continuar <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default StepContext;
