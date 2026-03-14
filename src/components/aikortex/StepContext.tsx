import { BusinessContext, KnowledgeFile, ExternalTool, EXTERNAL_TOOLS } from "@/types/agent-builder";
import { Client, MOCK_CLIENTS } from "@/types/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Building2, Users, BookOpen, MessageCircle, Puzzle, Upload, X, FileText, Image, File, Check } from "lucide-react";
import { useState, useRef } from "react";

interface Props {
  context: BusinessContext;
  onChange: (ctx: BusinessContext) => void;
  onNext: () => void;
  onBack: () => void;
  selectedTools: ExternalTool[];
  onToggleTool: (tool: ExternalTool) => void;
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

type Section = "empresa" | "publico" | "conhecimento" | "tom" | "funcoes";

const SECTIONS: { key: Section; label: string; icon: typeof Building2 }[] = [
  { key: "empresa", label: "Empresa", icon: Building2 },
  { key: "publico", label: "Público-alvo", icon: Users },
  { key: "conhecimento", label: "Base de conhecimento", icon: BookOpen },
  { key: "tom", label: "Tom e estilo", icon: MessageCircle },
  { key: "funcoes", label: "Integrações", icon: Puzzle },
];

const StepContext = ({ context, onChange, onNext, onBack, selectedTools, onToggleTool }: Props) => {
  const [activeSection, setActiveSection] = useState<Section>("empresa");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        <div className="space-y-4 animate-fade-in">
          {/* Client selector */}
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

          {/* Auto-filled fields */}
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
          {/* File upload area */}
          <div className="space-y-2">
            <Label>Arquivos de referência</Label>
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

            {/* File list */}
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

      {/* Funções / Integrações */}
      {activeSection === "funcoes" && (
        <div className="space-y-4 animate-fade-in">
          <p className="text-sm text-muted-foreground">Conecte ferramentas externas para expandir as capacidades do agente.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {EXTERNAL_TOOLS.map((tool) => {
              const isSelected = selectedTools.includes(tool.value);
              return (
                <div
                  key={tool.value}
                  className={`flex items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                    isSelected ? "border-primary bg-primary/5 shadow-md" : "border-border bg-card"
                  }`}
                >
                  <img
                    src={tool.logo}
                    alt={tool.label}
                    className="w-9 h-9 rounded-lg object-contain shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{tool.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{tool.description}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={isSelected ? "default" : "outline"}
                    onClick={() => onToggleTool(tool.value)}
                    className="shrink-0 text-xs h-8 gap-1.5"
                  >
                    {isSelected ? (
                      <><Check className="w-3 h-3" /> Conectado</>
                    ) : (
                      "Conectar"
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onBack} className="gap-1.5">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Button>
          <p className="text-xs text-muted-foreground">
            {!isValid && "Preencha os campos obrigatórios na aba Empresa"}
          </p>
        </div>
        <Button onClick={onNext} disabled={!isValid} className="gap-2">
          Continuar <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default StepContext;
