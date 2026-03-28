import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Eye, Code2, Database, RotateCw, ExternalLink, Github, Upload,
  LayoutDashboard, Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ChatPanel from "@/components/app-builder/ChatPanel";
import FileTree from "@/components/app-builder/FileTree";
import CodeEditor from "@/components/app-builder/CodeEditor";
import PreviewPanel from "@/components/app-builder/PreviewPanel";
import DatabasePanel from "@/components/app-builder/DatabasePanel";
import TerminalPanel from "@/components/app-builder/TerminalPanel";
import AppConfigPanel from "@/components/app-builder/AppConfigPanel";

type TabId = "preview" | "dashboard" | "code" | "database";
type AppChannel = "whatsapp" | "web";

const tabs: { id: TabId; label: string; icon: typeof Eye }[] = [
  { id: "preview", label: "Preview", icon: Eye },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "code", label: "Código", icon: Code2 },
  { id: "database", label: "Database", icon: Database },
];

const AppBuilder = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as any;
  const initialPrompt = state?.initialPrompt || "";
  const initialChannel = (state?.channel as AppChannel) || "whatsapp";

  const [activeTab, setActiveTab] = useState<TabId>("preview");
  const [selectedFile, setSelectedFile] = useState<string | null>("index.html");
  const [channel, setChannel] = useState<AppChannel>(initialChannel);
  const [showConfig, setShowConfig] = useState(true);

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* ===== LEFT — CHAT ===== */}
      <ChatPanel onBack={() => navigate("/home")} initialPrompt={initialPrompt} />

      {/* ===== CENTER — WORKSPACE ===== */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        {/* Top toolbar */}
        <div className="h-11 border-b border-border flex items-center justify-between px-3 shrink-0">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <RotateCw className="w-3.5 h-3.5" />
            </Button>
            <span className="text-xs text-muted-foreground">/</span>
          </div>

          <div className="flex items-center gap-0.5 bg-muted/50 rounded-lg p-0.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant={showConfig ? "default" : "ghost"}
              size="icon"
              className="h-7 w-7"
              title="Configurações do App"
              onClick={() => setShowConfig(!showConfig)}
            >
              <Settings className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" title="GitHub">
              <Github className="w-3.5 h-3.5" />
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1 rounded-full">
              Upgrade
            </Button>
            <Button size="sm" className="h-7 text-xs gap-1 rounded-full bg-primary hover:bg-primary/90">
              <Upload className="w-3 h-3" />
              Publicar
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 flex min-h-0">
            {activeTab === "preview" && <PreviewPanel />}

            {activeTab === "dashboard" && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <LayoutDashboard className="w-10 h-10 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">Dashboard do projeto</p>
                </div>
              </div>
            )}

            {activeTab === "code" && (
              <>
                <FileTree selectedFile={selectedFile} onSelectFile={setSelectedFile} />
                <CodeEditor fileName={selectedFile} />
              </>
            )}

            {activeTab === "database" && <DatabasePanel />}
          </div>

          <TerminalPanel />
        </div>
      </div>

      {/* ===== RIGHT — CONFIG PANEL ===== */}
      {showConfig && (
        <AppConfigPanel channel={channel} onChannelChange={setChannel} />
      )}
    </div>
  );
};

export default AppBuilder;
