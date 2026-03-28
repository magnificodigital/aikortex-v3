import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CodeEditorProps {
  fileName: string | null;
  channel?: "whatsapp" | "web";
}

const WEB_CODE: Record<string, string[]> = {
  "index.html": [
    '<!doctype html>',
    '<html lang="pt-BR">',
    '  <head>',
    '    <meta charset="UTF-8" />',
    '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    '    <title>Meu App</title>',
    '  </head>',
    '  <body>',
    '    <div id="root"></div>',
    '    <script type="module" src="/src/main.tsx"></script>',
    '  </body>',
    '</html>',
  ],
  "App.tsx": [
    'import { BrowserRouter, Routes, Route } from "react-router-dom";',
    'import Header from "./Header";',
    'import Sidebar from "./Sidebar";',
    'import Home from "../pages/Home";',
    'import Dashboard from "../pages/Dashboard";',
    '',
    'export default function App() {',
    '  return (',
    '    <BrowserRouter>',
    '      <div className="flex h-screen">',
    '        <Sidebar />',
    '        <div className="flex-1 flex flex-col">',
    '          <Header />',
    '          <main className="flex-1 p-6 overflow-auto">',
    '            <Routes>',
    '              <Route path="/" element={<Home />} />',
    '              <Route path="/dashboard" element={<Dashboard />} />',
    '            </Routes>',
    '          </main>',
    '        </div>',
    '      </div>',
    '    </BrowserRouter>',
    '  );',
    '}',
  ],
  "Dashboard.tsx": [
    'import MetricCard from "../components/MetricCard";',
    'import ChartWidget from "../components/ChartWidget";',
    'import DataTable from "../components/DataTable";',
    '',
    'export default function Dashboard() {',
    '  return (',
    '    <div className="space-y-6">',
    '      <h1 className="text-2xl font-bold">Dashboard</h1>',
    '      <div className="grid grid-cols-4 gap-4">',
    '        <MetricCard title="Usuários" value="1,234" change="+12%" />',
    '        <MetricCard title="Receita" value="R$ 45.6k" change="+8%" />',
    '        <MetricCard title="Conversão" value="3.2%" change="+0.5%" />',
    '        <MetricCard title="Sessões" value="8,901" change="+15%" />',
    '      </div>',
    '      <div className="grid grid-cols-2 gap-4">',
    '        <ChartWidget title="Receita Mensal" type="bar" />',
    '        <ChartWidget title="Acessos" type="line" />',
    '      </div>',
    '      <DataTable />',
    '    </div>',
    '  );',
    '}',
  ],
  "MetricCard.tsx": [
    'interface MetricCardProps {',
    '  title: string;',
    '  value: string;',
    '  change: string;',
    '}',
    '',
    'export default function MetricCard({ title, value, change }: MetricCardProps) {',
    '  const isPositive = change.startsWith("+");',
    '  return (',
    '    <div className="rounded-xl border p-4 bg-card">',
    '      <p className="text-sm text-muted-foreground">{title}</p>',
    '      <p className="text-2xl font-bold mt-1">{value}</p>',
    '      <span className={`text-xs ${isPositive ? "text-green-500" : "text-red-500"}`}>',
    '        {change}',
    '      </span>',
    '    </div>',
    '  );',
    '}',
  ],
};

const WHATSAPP_CODE: Record<string, string[]> = {
  "main-agent.ts": [
    'import { WhatsAppAPI } from "../integrations/whatsapp-api";',
    'import { QualifierAgent } from "./qualifier";',
    'import { SchedulerAgent } from "./scheduler";',
    '',
    'export class MainAgent {',
    '  private whatsapp: WhatsAppAPI;',
    '  private qualifier: QualifierAgent;',
    '  private scheduler: SchedulerAgent;',
    '',
    '  constructor(config: AgentConfig) {',
    '    this.whatsapp = new WhatsAppAPI(config.token);',
    '    this.qualifier = new QualifierAgent(config);',
    '    this.scheduler = new SchedulerAgent(config);',
    '  }',
    '',
    '  async handleMessage(message: IncomingMessage) {',
    '    const context = await this.getContext(message.from);',
    '    const stage = context.currentStage;',
    '',
    '    switch (stage) {',
    '      case "greeting":',
    '        return this.sendGreeting(message.from);',
    '      case "qualification":',
    '        return this.qualifier.process(message, context);',
    '      case "scheduling":',
    '        return this.scheduler.process(message, context);',
    '      default:',
    '        return this.handleGeneral(message, context);',
    '    }',
    '  }',
    '',
    '  private async sendGreeting(to: string) {',
    '    await this.whatsapp.sendMessage(to, {',
    '      text: "Olá! 👋 Bem-vindo! Como posso ajudar?"',
    '    });',
    '  }',
    '}',
  ],
  "qualifier.ts": [
    'export class QualifierAgent {',
    '  private questions = [',
    '    "Qual é o seu nome completo?",',
    '    "Qual é o seu principal objetivo?",',
    '    "Qual o seu orçamento estimado?",',
    '    "Quando pretende iniciar?",',
    '  ];',
    '',
    '  async process(message: IncomingMessage, context: Context) {',
    '    const currentQ = context.qualificationStep || 0;',
    '',
    '    // Salvar resposta anterior',
    '    if (currentQ > 0) {',
    '      await this.saveAnswer(context.userId, currentQ - 1, message.text);',
    '    }',
    '',
    '    // Próxima pergunta ou finalizar',
    '    if (currentQ < this.questions.length) {',
    '      await this.ask(message.from, this.questions[currentQ]);',
    '      await this.updateStage(context.userId, currentQ + 1);',
    '    } else {',
    '      await this.completeQualification(context);',
    '    }',
    '  }',
    '}',
  ],
  "whatsapp-api.ts": [
    'export class WhatsAppAPI {',
    '  private baseUrl = "https://graph.facebook.com/v18.0";',
    '  private token: string;',
    '  private phoneNumberId: string;',
    '',
    '  constructor(token: string, phoneNumberId?: string) {',
    '    this.token = token;',
    '    this.phoneNumberId = phoneNumberId || "";',
    '  }',
    '',
    '  async sendMessage(to: string, content: MessageContent) {',
    '    const response = await fetch(',
    '      `${this.baseUrl}/${this.phoneNumberId}/messages`,',
    '      {',
    '        method: "POST",',
    '        headers: {',
    '          "Authorization": `Bearer ${this.token}`,',
    '          "Content-Type": "application/json",',
    '        },',
    '        body: JSON.stringify({',
    '          messaging_product: "whatsapp",',
    '          to,',
    '          type: content.type || "text",',
    '          text: { body: content.text },',
    '        }),',
    '      }',
    '    );',
    '    return response.json();',
    '  }',
    '}',
  ],
  "webhook.ts": [
    'export async function handleWebhook(req: Request) {',
    '  const body = await req.json();',
    '  const entry = body.entry?.[0];',
    '  const changes = entry?.changes?.[0];',
    '  const message = changes?.value?.messages?.[0];',
    '',
    '  if (!message) return new Response("OK", { status: 200 });',
    '',
    '  const agent = new MainAgent(config);',
    '  await agent.handleMessage({',
    '    from: message.from,',
    '    text: message.text?.body || "",',
    '    type: message.type,',
    '    timestamp: message.timestamp,',
    '  });',
    '',
    '  return new Response("OK", { status: 200 });',
    '}',
  ],
  "config.ts": [
    'export const config = {',
    '  token: process.env.WHATSAPP_TOKEN!,',
    '  phoneNumberId: process.env.PHONE_NUMBER_ID!,',
    '  verifyToken: process.env.VERIFY_TOKEN!,',
    '  model: "gpt-5",',
    '  greeting: "Olá! 👋 Como posso ajudar?",',
    '  fallback: "Desculpe, não entendi. Pode reformular?",',
    '  stages: ["greeting", "qualification", "scheduling", "follow-up"],',
    '  maxRetries: 3,',
    '};',
  ],
};

const getLines = (fileName: string | null, channel: string): string[] => {
  if (!fileName) return [];
  const codeMap = channel === "whatsapp" ? WHATSAPP_CODE : WEB_CODE;
  return codeMap[fileName] || [
    `// ${fileName}`,
    '',
    channel === "whatsapp"
      ? `export class ${fileName.replace(/\.\w+$/, "")} {`
      : `export default function ${fileName.replace(/\.\w+$/, "")}() {`,
    channel === "whatsapp"
      ? '  async process() {'
      : '  return (',
    channel === "whatsapp"
      ? '    // Implementação gerada pela IA'
      : '    <div className="p-4">',
    channel === "whatsapp"
      ? '  }'
      : `      <h1>${fileName}</h1>`,
    channel === "whatsapp"
      ? '}'
      : '    </div>',
    channel === "whatsapp"
      ? ''
      : '  );',
    channel === "whatsapp"
      ? ''
      : '}',
  ];
};

const syntaxHighlight = (line: string) => {
  return line
    .replace(/(import|from|export|default|function|return|const|let|var|if|else|switch|case|break|new|this|await|async|class|private|interface|type)/g, '<span class="text-purple-400">$1</span>')
    .replace(/(".*?"|'.*?'|`.*?`)/g, '<span class="text-green-400">$1</span>')
    .replace(/(\/\/.*)/g, '<span class="text-muted-foreground">$1</span>');
};

const CodeEditor = ({ fileName, channel = "web" }: CodeEditorProps) => {
  const lines = getLines(fileName, channel);

  if (!fileName) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        Selecione um arquivo para visualizar
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background">
      <div className="flex items-center border-b border-border bg-card/30">
        <div className={cn("flex items-center gap-2 px-3 py-1.5 text-xs border-r border-border bg-background")}>
          <span>{fileName}</span>
          <X className="w-3 h-3 text-muted-foreground hover:text-foreground cursor-pointer" />
        </div>
      </div>
      <div className="px-4 py-1 text-[11px] text-muted-foreground border-b border-border bg-card/20">
        {fileName}
      </div>
      <div className="flex-1 overflow-auto font-mono text-xs leading-5">
        {lines.map((line, i) => (
          <div key={i} className="flex hover:bg-accent/20">
            <span className="w-10 shrink-0 text-right pr-3 text-muted-foreground/50 select-none">{i + 1}</span>
            <pre className="flex-1 whitespace-pre" dangerouslySetInnerHTML={{ __html: syntaxHighlight(line) }} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default CodeEditor;
