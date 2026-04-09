import { useState } from "react";
import {
  BookOpen,
  X,
  ChevronRight,
  ArrowLeft,
  Search,
  Bot,
  Workflow,
  MessageSquare,
  Users,
  DollarSign,
  CheckSquare,
  Settings,
  ShoppingCart,
  Send,
  AppWindow,
  LayoutTemplate,
  Video,
  FileText,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

interface Tutorial {
  id: string;
  title: string;
  description: string;
  icon: typeof Bot;
  category: string;
  readTime: string;
  content: string;
}

const tutorials: Tutorial[] = [
  {
    id: "agentes",
    title: "Agentes de IA",
    description: "Criar, configurar e testar agentes inteligentes.",
    icon: Bot,
    category: "Aikortex",
    readTime: "8 min",
    content: `# Agentes de IA

## O que são Agentes?
Agentes são assistentes de inteligência artificial configuráveis que podem interagir com seus clientes, qualificar leads, responder dúvidas e executar ações automatizadas.

## Como criar um Agente
1. Acesse **Aikortex → Agentes** no menu lateral.
2. Clique em **"Novo Agente"** no canto superior direito.
3. Escolha um modelo pré-configurado ou comece do zero.

## Configuração do Agente
- **Identidade**: Nome, avatar e descrição.
- **Objetivo**: Propósito principal do agente.
- **Prompt**: Instruções detalhadas de comportamento.
- **Modelo de IA**: Selecione o LLM.
- **Temperatura**: Controle a criatividade (0 = preciso, 1 = criativo).

## Testando o Agente
- Use o chat de teste na lateral direita.
- Ajuste prompt e configurações até obter o comportamento desejado.`,
  },
  {
    id: "flows",
    title: "Flows e Automações",
    description: "Construtor visual de fluxos: blocos, conexões e execução.",
    icon: Workflow,
    category: "Aikortex",
    readTime: "12 min",
    content: `# Flows e Automações

## O que são Flows?
Flows são fluxos visuais de automação que conectam blocos de ações, decisões e integrações.

## 3 Formas de Criar Fluxos
1. **Modelos Prontos**: Biblioteca de templates prontos.
2. **Copilot IA**: Descreva o que deseja em linguagem natural.
3. **Construção Manual**: Arraste blocos da paleta para o canvas.

## Categorias de Blocos
- **Triggers**: Chat, Webhook, Agendamento.
- **Processing**: Agente IA, API, Parser.
- **Logic**: If/Else, Switch, Router.
- **Output**: Mensagem, E-mail, WhatsApp.

## Executando um Fluxo
1. Clique em **"Run"** para testar.
2. Acompanhe a execução visual no canvas.
3. Verifique logs na aba de Logs.`,
  },
  {
    id: "mensagens",
    title: "Central de Mensagens",
    description: "Gerencie conversas com clientes em um único lugar.",
    icon: MessageSquare,
    category: "Aikortex",
    readTime: "5 min",
    content: `# Central de Mensagens

## Visão Geral
Unifica todas as conversas de diferentes canais (WhatsApp, chat, e-mail).

## Funcionalidades
- Responda diretamente pelo painel de chat.
- Atribua conversas a membros da equipe.
- Use etiquetas para organizar por prioridade.
- Visualize o histórico completo de cada contato.`,
  },
  {
    id: "disparos",
    title: "Disparos em Massa",
    description: "Envie mensagens em larga escala para listas segmentadas.",
    icon: Send,
    category: "Aikortex",
    readTime: "5 min",
    content: `# Disparos em Massa

## Como Criar um Disparo
1. Acesse **Aikortex → Disparos**.
2. Clique em **"Novo Disparo"**.
3. Selecione o canal e destinatários.
4. Redija a mensagem ou selecione um template.
5. Agende ou envie imediatamente.

## Boas Práticas
- Segmente sua base para mensagens relevantes.
- Use variáveis para personalizar (nome, empresa, etc.).`,
  },
  {
    id: "clientes",
    title: "Gestão de Clientes",
    description: "Cadastre e acompanhe seus clientes com visão 360°.",
    icon: Users,
    category: "Gestão",
    readTime: "6 min",
    content: `# Gestão de Clientes

## Cadastrando um Cliente
1. Acesse **Gestão → Clientes**.
2. Clique em **"Novo Cliente"**.
3. Preencha os dados e salve.

## Perfil do Cliente
- **Dados gerais**: Informações de contato e empresa.
- **Histórico**: Timeline de interações.
- **Contratos**: Contratos associados.
- **Métricas**: Health score, engajamento.`,
  },
  {
    id: "vendas",
    title: "Vendas e CRM",
    description: "Gerencie seu pipeline de vendas com kanban visual.",
    icon: ShoppingCart,
    category: "Gestão",
    readTime: "7 min",
    content: `# Vendas e CRM

## Pipeline Visual
Visão kanban com colunas personalizáveis para cada etapa.

## Gerenciando Leads
1. Acesse **Gestão → Vendas → CRM**.
2. Adicione leads manualmente ou via integrações.
3. Arraste cards entre as colunas.`,
  },
  {
    id: "financeiro",
    title: "Financeiro",
    description: "Controle receitas, despesas e fluxo de caixa.",
    icon: DollarSign,
    category: "Gestão",
    readTime: "6 min",
    content: `# Financeiro

## Módulos Disponíveis
- **Visão Geral**: Dashboard financeiro.
- **Faturas**: Crie e gerencie faturas.
- **Despesas**: Registre e categorize.
- **Fluxo de Caixa**: Entradas e saídas.`,
  },
  {
    id: "tarefas",
    title: "Tarefas",
    description: "Organize tarefas com múltiplas visualizações.",
    icon: CheckSquare,
    category: "Gestão",
    readTime: "5 min",
    content: `# Tarefas

## Visualizações
- **Lista**: Visão em tabela.
- **Kanban**: Cards entre colunas.
- **Calendário**: Tarefas por data.
- **Minhas Tarefas**: Foco nas suas.
- **Equipe**: Carga de trabalho.`,
  },
  {
    id: "contratos",
    title: "Contratos",
    description: "Crie e assine contratos digitalmente.",
    icon: FileText,
    category: "Gestão",
    readTime: "5 min",
    content: `# Contratos

## Funcionalidades
- Criação com templates.
- Assinatura digital integrada.
- Acompanhamento de status.
- Vínculo automático com clientes.`,
  },
  {
    id: "reunioes",
    title: "Reuniões",
    description: "Videoconferência integrada com IA.",
    icon: Video,
    category: "Gestão",
    readTime: "5 min",
    content: `# Reuniões e Videoconferência

## Funcionalidades
- Agende reuniões com clientes e equipe.
- Videoconferência com sala de espera.
- Tradução em tempo real.
- Sales Mentor: assistente IA durante a reunião.`,
  },
  {
    id: "apps",
    title: "App Builder",
    description: "Construa aplicações com IA assistida.",
    icon: AppWindow,
    category: "Aikortex",
    readTime: "5 min",
    content: `# App Builder

## Como Usar
1. Acesse **Aikortex → Apps**.
2. Descreva o que deseja no chat.
3. A IA gera o código e preview em tempo real.
4. Edite, ajuste e publique.`,
  },
  {
    id: "templates",
    title: "Templates",
    description: "Modelos prontos para agentes e fluxos.",
    icon: LayoutTemplate,
    category: "Aikortex",
    readTime: "4 min",
    content: `# Templates

## Categorias Disponíveis
- **Comercial**: SDR, qualificação, follow-up.
- **Atendimento**: FAQ, triagem, suporte.
- **Customer Success**: Onboarding, reengajamento.
- **Operação**: Aprovações, coleta de documentos.

## Como Usar
1. Acesse **Aikortex → Templates**.
2. Clique em **"Usar Template"** para criar uma cópia editável.`,
  },
  {
    id: "configuracoes",
    title: "Configurações",
    description: "Preferências, integrações e permissões.",
    icon: Settings,
    category: "Sistema",
    readTime: "5 min",
    content: `# Configurações

## Seções Disponíveis
- **Geral**: Nome do workspace e preferências.
- **Integrações**: Chaves de API e ferramentas externas.
- **Canais**: WhatsApp, redes sociais, widget de chat.
- **Equipe**: Papéis e permissões.
- **Faturamento**: Plano atual e faturas.`,
  },
];

const categoryColors: Record<string, string> = {
  Aikortex: "bg-primary/10 text-primary",
  Gestão: "bg-accent text-accent-foreground",
  Sistema: "bg-muted text-muted-foreground",
};

const HelpBubble = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? tutorials.filter(
        (t) =>
          t.title.toLowerCase().includes(search.toLowerCase()) ||
          t.description.toLowerCase().includes(search.toLowerCase()) ||
          t.category.toLowerCase().includes(search.toLowerCase())
      )
    : tutorials;

  const grouped = filtered.reduce<Record<string, Tutorial[]>>((acc, t) => {
    (acc[t.category] ??= []).push(t);
    return acc;
  }, {});

  const renderContent = (text: string) =>
    text.split("\n").map((line, i) => {
      if (line.startsWith("# "))
        return (
          <h1 key={i} className="text-base font-bold mt-4 mb-2 text-foreground">
            {line.slice(2)}
          </h1>
        );
      if (line.startsWith("## "))
        return (
          <h2 key={i} className="text-sm font-semibold mt-3 mb-1.5 text-foreground">
            {line.slice(3)}
          </h2>
        );
      if (line.startsWith("### "))
        return (
          <h3 key={i} className="text-sm font-medium mt-2 mb-1 text-foreground">
            {line.slice(4)}
          </h3>
        );
      if (/^\d+\.\s/.test(line))
        return (
          <p key={i} className="ml-3 mb-0.5 text-xs text-foreground/90">
            {line}
          </p>
        );
      if (line.startsWith("- "))
        return (
          <p key={i} className="ml-3 mb-0.5 text-xs text-foreground/90">
            • {line.slice(2)}
          </p>
        );
      if (line.trim() === "") return <div key={i} className="h-1.5" />;
      return (
        <p key={i} className="text-xs text-foreground/90 mb-1">
          {line}
        </p>
      );
    });

  return (
    <>
      {/* Panel */}
      <div
        className={cn(
          "fixed bottom-20 right-5 z-50 w-[380px] max-w-[calc(100vw-2.5rem)] rounded-2xl border border-border bg-card shadow-2xl transition-all duration-300 origin-bottom-right",
          isOpen
            ? "scale-100 opacity-100 pointer-events-auto"
            : "scale-95 opacity-0 pointer-events-none"
        )}
        style={{ maxHeight: "min(580px, calc(100vh - 140px))" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border rounded-t-2xl bg-primary/5">
          {selectedTutorial ? (
            <>
              <button
                onClick={() => setSelectedTutorial(null)}
                className="p-1 rounded-md hover:bg-accent transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-muted-foreground" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {selectedTutorial.title}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {selectedTutorial.readTime} de leitura
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpen className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Central de Ajuda</p>
                <p className="text-[10px] text-muted-foreground">
                  Tutoriais e guias da plataforma
                </p>
              </div>
            </>
          )}
          <button
            onClick={() => {
              setIsOpen(false);
              setTimeout(() => setSelectedTutorial(null), 300);
            }}
            className="p-1 rounded-md hover:bg-accent transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        {selectedTutorial ? (
          <ScrollArea className="px-5 py-4" style={{ height: "min(460px, calc(100vh - 240px))" }}>
            <div>{renderContent(selectedTutorial.content)}</div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col" style={{ height: "min(460px, calc(100vh - 240px))" }}>
            {/* Search */}
            <div className="px-4 pt-3 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar tutorial..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-8 text-xs border-border"
                />
              </div>
            </div>

            {/* List */}
            <ScrollArea className="flex-1 px-4 pb-3">
              {Object.entries(grouped).length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">
                  Nenhum tutorial encontrado.
                </p>
              )}
              {Object.entries(grouped).map(([category, items]) => (
                <div key={category} className="mb-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 px-1">
                    {category}
                  </p>
                  <div className="space-y-1">
                    {items.map((tutorial) => (
                      <button
                        key={tutorial.id}
                        onClick={() => setSelectedTutorial(tutorial)}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left hover:bg-accent/60 transition-colors group"
                      >
                        <div className="p-1.5 rounded-md bg-primary/10 shrink-0">
                          <tutorial.icon className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">
                            {tutorial.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {tutorial.description}
                          </p>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Floating Bubble */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-5 right-5 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-300 hover:scale-105",
          "bg-primary text-primary-foreground hover:shadow-xl",
          isOpen && "rotate-0"
        )}
        title="Central de Ajuda"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <HelpCircle className="w-6 h-6" />
        )}
      </button>
    </>
  );
};

export default HelpBubble;
