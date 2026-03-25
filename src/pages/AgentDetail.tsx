import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Bot, User, Send, Paperclip, HelpCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import avatar1 from "@/assets/avatars/avatar-1.png";
import avatar2 from "@/assets/avatars/avatar-2.png";
import avatar3 from "@/assets/avatars/avatar-3.png";
import avatar8 from "@/assets/avatars/avatar-8.png";

const AGENTS_MAP: Record<string, { name: string; avatar: string; model: string }> = {
  "sdr-1": { name: "Agente SDR", avatar: avatar1, model: "gemini-2.5-flash" },
  "bdr-1": { name: "Agente BDR", avatar: avatar2, model: "gemini-2.5-flash" },
  "sac-1": { name: "Agente SAC", avatar: avatar3, model: "gemini-2.5-flash" },
  "social-1": { name: "Social Media Manager", avatar: avatar8, model: "gemini-2.5-flash" },
  "custom-1": { name: "Agente Personalizado", avatar: avatar1, model: "gemini-2.5-flash" },
};

const CHANNELS = [
  { icon: "💬", label: "Telegram" },
  { icon: "📱", label: "WhatsApp" },
  { icon: "🎮", label: "Discord" },
  { icon: "💼", label: "Slack" },
];

const CONNECTORS = [
  { icon: "📝", label: "Notion", desc: "Read/write Notion pages and databases." },
  { icon: "💬", label: "Slack", desc: "Send messages to Slack channels." },
  { icon: "🎮", label: "Discord", desc: "Post to Discord servers." },
  { icon: "🔶", label: "HubSpot", desc: "Access CRM and contacts." },
  { icon: "📊", label: "Airtable", desc: "Read/write bases, tables, and records." },
  { icon: "🔗", label: "LinkedIn", desc: "Access profile and create posts." },
  { icon: "☁️", label: "Salesforce", desc: "Access CRM contacts and opportunities." },
  { icon: "📧", label: "Gmail", desc: "Read, send and compose emails." },
  { icon: "📁", label: "Google Drive", desc: "Read, upload and manage files." },
  { icon: "📅", label: "Google Calendar", desc: "Read and manage calendar events." },
  { icon: "📄", label: "Google Docs", desc: "Create and edit documents." },
];

const SETTINGS_NAV = [
  { section: "AGENT", items: [
    { key: "general", icon: "👤", label: "General" },
    { key: "status", icon: "⚡", label: "Status" },
    { key: "machine", icon: "🖥️", label: "Machine" },
  ]},
  { section: "CONFIGURATION", items: [
    { key: "channels", icon: "📺", label: "Channels" },
    { key: "advanced", icon: "🔧", label: "Advanced" },
    { key: "danger", icon: "⚠️", label: "Danger Zone" },
  ]},
];

const MOCK_RESPONSES: Record<string, string> = {
  default: "Olá! Como posso ajudar você hoje?",
  oi: "Olá! Que bom te ver por aqui. Como posso ajudar?",
  preço: "Nossos planos são flexíveis. Posso agendar uma conversa com nosso especialista?",
  funciona: "Nosso sistema é super intuitivo! Quer que eu te mostre como?",
};

const AgentDetail = () => {
  const navigate = useNavigate();
  const { agentId } = useParams();
  const agent = AGENTS_MAP[agentId || "sdr-1"] || AGENTS_MAP["sdr-1"];

  const [messages, setMessages] = useState<{ role: "user" | "agent"; text: string }[]>([
    { role: "agent", text: `Olá! Sou ${agent.name}. Como posso ajudar?` },
  ]);
  const [input, setInput] = useState("");
  const [rightTab, setRightTab] = useState("connectors");
  const [settingsNav, setSettingsNav] = useState("general");
  const [agentName, setAgentName] = useState(agent.name);
  const [agentDesc, setAgentDesc] = useState("");
  const [agentModel, setAgentModel] = useState(agent.model);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setInput("");
    setTimeout(() => {
      const key = Object.keys(MOCK_RESPONSES).find((k) => userMsg.toLowerCase().includes(k));
      setMessages((prev) => [...prev, { role: "agent", text: MOCK_RESPONSES[key || "default"] }]);
    }, 600);
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* LEFT — Chat */}
      <div className="w-full max-w-[55%] flex flex-col border-r border-border">
        {/* Header */}
        <div className="h-12 border-b border-border flex items-center gap-3 px-4 shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate("/aikortex/agents")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <img src={agent.avatar} alt={agent.name} className="w-7 h-7 rounded-full object-cover" />
          <span className="text-sm font-semibold">{agent.name}</span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--success,142_71%_45%))]" />
            Running
          </span>
          <span className="text-xs text-muted-foreground ml-1">{agentModel}</span>
        </div>

        {/* Channel bar */}
        <div className="px-4 py-2 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Chat from an app you already use</span>
            <button className="ml-auto text-muted-foreground hover:text-foreground">
              <span className="text-xs">✕</span>
            </button>
          </div>
          <div className="flex gap-2 mt-2">
            {CHANNELS.map((ch) => (
              <button
                key={ch.label}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-xs font-medium hover:border-primary/40 transition-colors"
              >
                <span>{ch.icon}</span> {ch.label}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2.5 items-start ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "agent" && (
                  <img src={agent.avatar} alt="" className="w-6 h-6 rounded-full object-cover mt-0.5" />
                )}
                <div className={`rounded-xl px-3.5 py-2.5 text-sm max-w-[75%] ${
                  msg.role === "agent"
                    ? "bg-muted/60 text-foreground"
                    : "bg-primary text-primary-foreground ml-auto"
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="px-4 py-3 border-t border-border">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <Paperclip className="w-4 h-4" />
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Message your agent..."
              className="text-sm h-9 flex-1"
            />
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <HelpCircle className="w-4 h-4" />
            </Button>
            <Button size="icon" className="h-8 w-8 shrink-0" onClick={handleSend} disabled={!input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              🤖 {agentModel} <ChevronDown className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT — Panel with tabs */}
      <div className="flex-1 flex flex-col min-w-0">
        <Tabs value={rightTab} onValueChange={setRightTab} className="flex flex-col h-full">
          <div className="border-b border-border px-4">
            <TabsList className="bg-transparent h-11 gap-0 p-0">
              {["connectors", "secrets", "files", "terminal", "settings"].map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 text-sm capitalize"
                >
                  {tab === "connectors" ? "Connectors" : tab === "secrets" ? "Secrets" : tab === "files" ? "Files" : tab === "terminal" ? "Terminal" : "Settings"}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Connectors Tab */}
          <TabsContent value="connectors" className="flex-1 mt-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-6">
                <h2 className="text-lg font-bold text-foreground">Connectors</h2>
                <p className="text-sm text-muted-foreground mt-1 mb-6">
                  Link workspace OAuth connectors so your agent can use them in tasks.
                </p>
                <div className="space-y-1">
                  {CONNECTORS.map((c) => (
                    <div key={c.label} className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{c.icon}</span>
                        <div>
                          <p className="text-sm font-medium text-foreground">{c.label}</p>
                          <p className="text-xs text-muted-foreground">{c.desc}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground gap-1">
                        + Connect
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Secrets Tab */}
          <TabsContent value="secrets" className="flex-1 mt-0">
            <div className="p-6 text-center text-muted-foreground">
              <p className="text-sm">No secrets configured yet.</p>
              <Button variant="outline" size="sm" className="mt-4">Add Secret</Button>
            </div>
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="flex-1 mt-0">
            <div className="p-6 text-center text-muted-foreground">
              <p className="text-sm">No files uploaded yet.</p>
              <Button variant="outline" size="sm" className="mt-4">Upload File</Button>
            </div>
          </TabsContent>

          {/* Terminal Tab */}
          <TabsContent value="terminal" className="flex-1 mt-0">
            <div className="h-full bg-black/90 p-4 font-mono text-xs text-green-400">
              <p>$ agent status</p>
              <p className="text-muted-foreground">Agent "{agent.name}" is running.</p>
              <p className="text-muted-foreground">Model: {agentModel}</p>
              <p className="text-muted-foreground">Uptime: 2h 34m</p>
              <p className="mt-2">$ _</p>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="flex-1 mt-0 overflow-hidden">
            <div className="flex h-full">
              {/* Settings nav */}
              <div className="w-48 border-r border-border p-4 space-y-4 shrink-0">
                {SETTINGS_NAV.map((section) => (
                  <div key={section.section}>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{section.section}</p>
                    <div className="space-y-0.5">
                      {section.items.map((item) => (
                        <button
                          key={item.key}
                          onClick={() => setSettingsNav(item.key)}
                          className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                            settingsNav === item.key
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          }`}
                        >
                          <span className="text-sm">{item.icon}</span>
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Settings content */}
              <ScrollArea className="flex-1">
                <div className="p-6 max-w-lg space-y-8">
                  {settingsNav === "general" && (
                    <>
                      <div>
                        <h2 className="text-lg font-bold text-foreground">General</h2>
                        <p className="text-sm text-muted-foreground mt-1">Agent identity, purpose, and AI model.</p>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-foreground">Avatar</h3>
                        <div className="flex items-center gap-4">
                          <img src={agent.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                          <div className="text-xs text-muted-foreground">
                            <p>JPEG, PNG, or WebP · up to 5 MB.</p>
                            <p>Shown in cards and chat across your workspace.</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-foreground">Name</h3>
                        <Input value={agentName} onChange={(e) => setAgentName(e.target.value)} className="text-sm" />
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-foreground">Description</h3>
                        <p className="text-xs text-muted-foreground">Defines your agent's role and personality. Loaded into the system prompt on every startup.</p>
                        <Textarea
                          value={agentDesc}
                          onChange={(e) => setAgentDesc(e.target.value)}
                          placeholder="e.g. A research assistant who monitors competitors, summarises news, and sends a daily briefing via Telegram."
                          className="text-sm min-h-[100px]"
                        />
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-foreground">Model</h3>
                        <p className="text-xs text-muted-foreground">The AI model used for all agent conversations.</p>
                        <Select value={agentModel} onValueChange={setAgentModel}>
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gemini-2.5-flash">🤖 gemini-2.5-flash</SelectItem>
                            <SelectItem value="gemini-2.5-pro">🤖 gemini-2.5-pro</SelectItem>
                            <SelectItem value="gpt-5">🤖 gpt-5</SelectItem>
                            <SelectItem value="gpt-5-mini">🤖 gpt-5-mini</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {settingsNav === "status" && (
                    <div>
                      <h2 className="text-lg font-bold text-foreground">Status</h2>
                      <p className="text-sm text-muted-foreground mt-1">Agent is currently running.</p>
                      <div className="mt-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-sm text-foreground font-medium">Online</span>
                      </div>
                    </div>
                  )}

                  {settingsNav === "danger" && (
                    <div>
                      <h2 className="text-lg font-bold text-foreground text-destructive">Danger Zone</h2>
                      <p className="text-sm text-muted-foreground mt-1">Irreversible actions for this agent.</p>
                      <Button variant="destructive" size="sm" className="mt-4">Delete Agent</Button>
                    </div>
                  )}

                  {!["general", "status", "danger"].includes(settingsNav) && (
                    <div>
                      <h2 className="text-lg font-bold text-foreground capitalize">{settingsNav}</h2>
                      <p className="text-sm text-muted-foreground mt-1">Configuration coming soon.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AgentDetail;
