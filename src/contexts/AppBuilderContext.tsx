import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface GeneratedFile {
  name: string;
  path: string;
  content: string;
}

export interface GeneratedTable {
  name: string;
  columns: { name: string; type: string; isPK?: boolean }[];
  rows: Record<string, string>[];
}

export interface TerminalLog {
  text: string;
  type: "command" | "output" | "success" | "error";
  timestamp: number;
}

export interface DashboardMetric {
  label: string;
  value: string;
  change: string;
  up: boolean;
}

export interface WizardConfig {
  prompt: string;
  companyName: string;
  appName: string;
  tone: string;
  language: string;
  introMessage: string;
  maxMessages: number;
  onboarding: "none" | "soft" | "strict";
}

export interface AppBuilderState {
  channel: "whatsapp" | "web";
  files: GeneratedFile[];
  tables: GeneratedTable[];
  terminalLogs: TerminalLog[];
  dashboardMetrics: DashboardMetric[];
  appName: string;
  isGenerating: boolean;
  wizardConfig: WizardConfig | null;
}

interface AppBuilderContextType extends AppBuilderState {
  setChannel: (ch: "whatsapp" | "web") => void;
  addFile: (file: GeneratedFile) => void;
  setFiles: (files: GeneratedFile[]) => void;
  addTable: (table: GeneratedTable) => void;
  setTables: (tables: GeneratedTable[]) => void;
  addTerminalLog: (log: TerminalLog) => void;
  setDashboardMetrics: (metrics: DashboardMetric[]) => void;
  setAppName: (name: string) => void;
  setIsGenerating: (v: boolean) => void;
  setWizardConfig: (config: WizardConfig) => void;
  initializeProject: (channel: "whatsapp" | "web", prompt: string) => void;
  saveApp: (userId: string) => Promise<string | null>;
  appId: string | null;
  setAppId: (id: string | null) => void;
}

const AppBuilderContext = createContext<AppBuilderContextType | null>(null);

export const useAppBuilder = () => {
  const ctx = useContext(AppBuilderContext);
  if (!ctx) throw new Error("useAppBuilder must be used within AppBuilderProvider");
  return ctx;
};

/* ── Scaffold generators ── */

function generateWebFiles(prompt: string): GeneratedFile[] {
  const appDesc = prompt.slice(0, 60);
  return [
    { name: "index.html", path: "/index.html", content: `<!doctype html>\n<html lang="pt-BR">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>Meu App</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.tsx"></script>\n  </body>\n</html>` },
    { name: "App.tsx", path: "/src/App.tsx", content: `import { BrowserRouter, Routes, Route } from "react-router-dom";\nimport Sidebar from "./components/Sidebar";\nimport Header from "./components/Header";\nimport Dashboard from "./pages/Dashboard";\nimport Home from "./pages/Home";\n\n// ${appDesc}\nexport default function App() {\n  return (\n    <BrowserRouter>\n      <div className="flex h-screen">\n        <Sidebar />\n        <div className="flex-1 flex flex-col">\n          <Header />\n          <main className="flex-1 p-6 overflow-auto">\n            <Routes>\n              <Route path="/" element={<Home />} />\n              <Route path="/dashboard" element={<Dashboard />} />\n            </Routes>\n          </main>\n        </div>\n      </div>\n    </BrowserRouter>\n  );\n}` },
    { name: "Dashboard.tsx", path: "/src/pages/Dashboard.tsx", content: `import MetricCard from "../components/MetricCard";\n\nexport default function Dashboard() {\n  return (\n    <div className="space-y-6">\n      <h1 className="text-2xl font-bold">Dashboard</h1>\n      <div className="grid grid-cols-4 gap-4">\n        <MetricCard title="Usuários" value="0" change="+0%" />\n        <MetricCard title="Receita" value="R$ 0" change="+0%" />\n      </div>\n    </div>\n  );\n}` },
    { name: "MetricCard.tsx", path: "/src/components/MetricCard.tsx", content: `interface Props { title: string; value: string; change: string; }\n\nexport default function MetricCard({ title, value, change }: Props) {\n  return (\n    <div className="rounded-xl border p-4 bg-card">\n      <p className="text-sm text-muted-foreground">{title}</p>\n      <p className="text-2xl font-bold mt-1">{value}</p>\n      <span className="text-xs text-green-500">{change}</span>\n    </div>\n  );\n}` },
    { name: "Sidebar.tsx", path: "/src/components/Sidebar.tsx", content: `export default function Sidebar() {\n  return (\n    <aside className="w-60 border-r bg-card p-4">\n      <nav className="space-y-1">\n        <a href="/" className="block px-3 py-2 rounded-md text-sm">Home</a>\n        <a href="/dashboard" className="block px-3 py-2 rounded-md text-sm">Dashboard</a>\n      </nav>\n    </aside>\n  );\n}` },
    { name: "Header.tsx", path: "/src/components/Header.tsx", content: `export default function Header() {\n  return (\n    <header className="h-14 border-b flex items-center px-6">\n      <h1 className="text-lg font-semibold">Meu App</h1>\n    </header>\n  );\n}` },
  ];
}

function generateWhatsAppFiles(prompt: string): GeneratedFile[] {
  const appDesc = prompt.slice(0, 60);
  return [
    { name: "main-agent.ts", path: "/src/agents/main-agent.ts", content: `// ${appDesc}\n// Agente principal do WhatsApp Bot\n\nimport { WhatsAppAPI } from "../integrations/whatsapp-api";\nimport { config } from "../config";\n\nexport class MainAgent {\n  private api: WhatsAppAPI;\n\n  constructor() {\n    this.api = new WhatsAppAPI(config.token, config.phoneNumberId);\n  }\n\n  async handle(from: string, text: string, stage: string) {\n    // Lógica principal do agente\n    // O agente processa mensagens de acordo com o estágio atual\n  }\n}` },
    { name: "qualifier.ts", path: "/src/agents/qualifier.ts", content: `// Agente de qualificação de leads\n\nexport class QualifierAgent {\n  private questions = [\n    "Qual é o seu nome completo?",\n    "Qual é o seu principal objetivo?",\n    "Qual o seu orçamento estimado?",\n  ];\n\n  async qualify(from: string, step: number) {\n    // Envia pergunta de qualificação de acordo com o passo\n  }\n}` },
    { name: "whatsapp-api.ts", path: "/src/integrations/whatsapp-api.ts", content: `// Client wrapper para WhatsApp Cloud API v21.0\n\nconst BASE_URL = "https://graph.facebook.com/v21.0";\n\nexport class WhatsAppAPI {\n  constructor(private token: string, private phoneId: string) {}\n\n  async sendText(to: string, body: string) {\n    // POST /{phoneId}/messages\n  }\n\n  async sendButtons(to: string, body: string, buttons: string[]) {\n    // Envia mensagem interativa com botões\n  }\n\n  async sendList(to: string, body: string, sections: any[]) {\n    // Envia mensagem interativa com lista\n  }\n}` },
    { name: "webhook.ts", path: "/src/handlers/webhook.ts", content: `// Handler do webhook do WhatsApp\n\nexport async function handleWebhook(req: Request) {\n  const body = await req.json();\n  const entry = body.entry?.[0]?.changes?.[0]?.value;\n  const message = entry?.messages?.[0];\n  if (!message) return new Response("OK");\n\n  // Processa a mensagem recebida\n}` },
    { name: "config.ts", path: "/src/config.ts", content: `// Configuração do bot WhatsApp\n\nexport const config = {\n  phoneNumberId: "",\n  token: "",\n  botName: "Assistente",\n  language: "pt-BR",\n};` },
  ];
}

function generateWebTables(): GeneratedTable[] {
  return [
    { name: "users", columns: [{ name: "id", type: "UUID", isPK: true }, { name: "email", type: "TEXT" }, { name: "full_name", type: "TEXT" }, { name: "created_at", type: "TIMESTAMP" }], rows: [] },
    { name: "profiles", columns: [{ name: "id", type: "UUID", isPK: true }, { name: "user_id", type: "UUID" }, { name: "avatar_url", type: "TEXT" }, { name: "bio", type: "TEXT" }], rows: [] },
    { name: "settings", columns: [{ name: "id", type: "UUID", isPK: true }, { name: "user_id", type: "UUID" }, { name: "theme", type: "TEXT" }, { name: "notifications", type: "BOOLEAN" }], rows: [] },
  ];
}

function generateWhatsAppTables(): GeneratedTable[] {
  return [
    { name: "contacts", columns: [{ name: "id", type: "UUID", isPK: true }, { name: "phone", type: "TEXT" }, { name: "name", type: "TEXT" }, { name: "stage", type: "TEXT" }, { name: "created_at", type: "TIMESTAMP" }], rows: [] },
    { name: "conversations", columns: [{ name: "id", type: "UUID", isPK: true }, { name: "contact_id", type: "UUID" }, { name: "status", type: "TEXT" }, { name: "started_at", type: "TIMESTAMP" }, { name: "ended_at", type: "TIMESTAMP" }], rows: [] },
    { name: "messages", columns: [{ name: "id", type: "UUID", isPK: true }, { name: "conversation_id", type: "UUID" }, { name: "direction", type: "TEXT" }, { name: "content", type: "TEXT" }, { name: "sent_at", type: "TIMESTAMP" }], rows: [] },
    { name: "leads", columns: [{ name: "id", type: "UUID", isPK: true }, { name: "contact_id", type: "UUID" }, { name: "score", type: "INTEGER" }, { name: "qualified", type: "BOOLEAN" }, { name: "data", type: "JSONB" }], rows: [] },
  ];
}

function generateWebMetrics(): DashboardMetric[] {
  return [
    { label: "Usuários Ativos", value: "0", change: "--", up: true },
    { label: "Pageviews", value: "0", change: "--", up: true },
    { label: "Conversão", value: "0%", change: "--", up: true },
    { label: "Bounce Rate", value: "0%", change: "--", up: true },
  ];
}

function generateWhatsAppMetrics(): DashboardMetric[] {
  return [
    { label: "Conversas Ativas", value: "0", change: "--", up: true },
    { label: "Leads Qualificados", value: "0", change: "--", up: true },
    { label: "Taxa de Resposta", value: "0%", change: "--", up: true },
    { label: "Tempo Médio", value: "--", change: "--", up: true },
  ];
}

/* ── Provider ── */

export function AppBuilderProvider({ children, initialChannel = "web", existingAppId }: { children: ReactNode; initialChannel?: "whatsapp" | "web"; existingAppId?: string | null }) {
  const [appId, setAppId] = useState<string | null>(existingAppId || null);
  const [state, setState] = useState<AppBuilderState>({
    channel: initialChannel,
    files: [],
    tables: [],
    terminalLogs: [],
    dashboardMetrics: [],
    appName: "Meu App",
    isGenerating: false,
    wizardConfig: null,
  });

  const setChannel = useCallback((ch: "whatsapp" | "web") => setState(s => ({ ...s, channel: ch })), []);
  const addFile = useCallback((file: GeneratedFile) => setState(s => {
    const exists = s.files.findIndex(f => f.name === file.name);
    if (exists >= 0) {
      const updated = [...s.files];
      updated[exists] = file;
      return { ...s, files: updated };
    }
    return { ...s, files: [...s.files, file] };
  }), []);
  const setFiles = useCallback((files: GeneratedFile[]) => setState(s => ({ ...s, files })), []);
  const addTable = useCallback((table: GeneratedTable) => setState(s => {
    const exists = s.tables.findIndex(t => t.name === table.name);
    if (exists >= 0) {
      const updated = [...s.tables];
      updated[exists] = table;
      return { ...s, tables: updated };
    }
    return { ...s, tables: [...s.tables, table] };
  }), []);
  const setTables = useCallback((tables: GeneratedTable[]) => setState(s => ({ ...s, tables })), []);
  const addTerminalLog = useCallback((log: TerminalLog) => setState(s => ({ ...s, terminalLogs: [...s.terminalLogs, log] })), []);
  const setDashboardMetrics = useCallback((metrics: DashboardMetric[]) => setState(s => ({ ...s, dashboardMetrics: metrics })), []);
  const setAppName = useCallback((name: string) => setState(s => ({ ...s, appName: name })), []);
  const setIsGenerating = useCallback((v: boolean) => setState(s => ({ ...s, isGenerating: v })), []);
  const setWizardConfig = useCallback((config: WizardConfig) => setState(s => ({ ...s, wizardConfig: config })), []);

  const initializeProject = useCallback((channel: "whatsapp" | "web", prompt: string) => {
    const files = channel === "whatsapp" ? generateWhatsAppFiles(prompt) : generateWebFiles(prompt);
    const tables = channel === "whatsapp" ? generateWhatsAppTables() : generateWebTables();
    const metrics = channel === "whatsapp" ? generateWhatsAppMetrics() : generateWebMetrics();

    const logs: TerminalLog[] = [
      { text: "$ aikortex init --channel=" + channel, type: "command", timestamp: Date.now() },
      { text: "✓ Projeto inicializado com sucesso", type: "success", timestamp: Date.now() + 100 },
      { text: `✓ ${files.length} arquivos gerados`, type: "success", timestamp: Date.now() + 200 },
      { text: `✓ ${tables.length} tabelas criadas`, type: "success", timestamp: Date.now() + 300 },
      { text: "$ npm run dev", type: "command", timestamp: Date.now() + 400 },
      { text: "➜ Local: http://localhost:5173/", type: "success", timestamp: Date.now() + 500 },
      { text: "ready in 320ms", type: "output", timestamp: Date.now() + 600 },
    ];

    setState(s => ({
      ...s,
      channel,
      files,
      tables,
      terminalLogs: logs,
      dashboardMetrics: metrics,
      isGenerating: false,
    }));
  }, []);

  const saveApp = useCallback(async (userId: string): Promise<string | null> => {
    const payload = {
      user_id: userId,
      name: state.appName,
      description: '',
      channel: state.channel,
      files: JSON.parse(JSON.stringify(state.files)),
      tables_schema: JSON.parse(JSON.stringify(state.tables)),
      status: 'draft',
    };

    if (appId) {
      const { error } = await supabase
        .from('user_apps')
        .update(payload)
        .eq('id', appId);
      if (error) { console.error(error); return null; }
      return appId;
    } else {
      const { data, error } = await supabase
        .from('user_apps')
        .insert(payload)
        .select('id')
        .single();
      if (error || !data) { console.error(error); return null; }
      setAppId(data.id);
      return data.id;
    }
  }, [state, appId]);

  return (
    <AppBuilderContext.Provider value={{
      ...state,
      setChannel, addFile, setFiles, addTable, setTables,
      addTerminalLog, setDashboardMetrics, setAppName,
      setIsGenerating, initializeProject, saveApp, appId, setAppId,
    }}>
      {children}
    </AppBuilderContext.Provider>
  );
}
