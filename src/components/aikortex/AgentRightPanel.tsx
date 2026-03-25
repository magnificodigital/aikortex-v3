import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Zap, Monitor, MonitorSmartphone, Settings2, AlertTriangle } from "lucide-react";

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
  { section: "AGENTE", items: [
    { key: "general", icon: User, label: "Identidade" },
    { key: "status", icon: Zap, label: "Status" },
    { key: "machine", icon: Monitor, label: "Machine" },
  ]},
  { section: "CONFIGURAÇÃO", items: [
    { key: "channels", icon: MonitorSmartphone, label: "Canais" },
    { key: "advanced", icon: Settings2, label: "Avançado" },
    { key: "danger", icon: AlertTriangle, label: "Danger Zone" },
  ]},
];

interface Props {
  agent: { name: string; avatar: string };
  agentModel: string;
  onModelChange: (model: string) => void;
}

const AgentRightPanel = ({ agent, agentModel, onModelChange }: Props) => {
  const [rightTab, setRightTab] = useState("agent");
  const [settingsNav, setSettingsNav] = useState("general");
  const [agentName, setAgentName] = useState(agent.name);
  const [agentDesc, setAgentDesc] = useState("");

  return (
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
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Connectors */}
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

        {/* Secrets */}
        <TabsContent value="secrets" className="flex-1 mt-0">
          <div className="p-6 text-center text-muted-foreground">
            <p className="text-sm">No secrets configured yet.</p>
            <Button variant="outline" size="sm" className="mt-4">Add Secret</Button>
          </div>
        </TabsContent>

        {/* Files */}
        <TabsContent value="files" className="flex-1 mt-0">
          <div className="p-6 text-center text-muted-foreground">
            <p className="text-sm">No files uploaded yet.</p>
            <Button variant="outline" size="sm" className="mt-4">Upload File</Button>
          </div>
        </TabsContent>

        {/* Terminal */}
        <TabsContent value="terminal" className="flex-1 mt-0">
          <div className="h-full bg-muted p-4 font-mono text-xs text-primary">
            <p>$ agent status</p>
            <p className="text-muted-foreground">Agent "{agent.name}" is running.</p>
            <p className="text-muted-foreground">Model: {agentModel}</p>
            <p className="text-muted-foreground">Uptime: 2h 34m</p>
            <p className="mt-2">$ _</p>
          </div>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings" className="flex-1 mt-0 overflow-hidden">
          <div className="flex h-full">
            {/* Settings sidebar */}
            <div className="w-48 border-r border-border p-4 space-y-4 shrink-0">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Settings</p>
              {SETTINGS_NAV.map((section) => (
                <div key={section.section}>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{section.section}</p>
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.key}
                          onClick={() => setSettingsNav(item.key)}
                          className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                            settingsNav === item.key
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {item.label}
                        </button>
                      );
                    })}
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
                      <Select value={agentModel} onValueChange={onModelChange}>
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
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-sm text-foreground font-medium">Online</span>
                    </div>
                  </div>
                )}

                {settingsNav === "danger" && (
                  <div>
                    <h2 className="text-lg font-bold text-destructive">Danger Zone</h2>
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
  );
};

export default AgentRightPanel;
