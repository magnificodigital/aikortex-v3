import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send, Paperclip, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import AgentRightPanel from "@/components/aikortex/AgentRightPanel";
import { useAgentChat } from "@/hooks/use-agent-chat";

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

const LLM_MODELS = [
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  { value: "gemini-3-flash-preview", label: "Gemini 3 Flash" },
  { value: "gpt-5", label: "GPT-5" },
  { value: "gpt-5-mini", label: "GPT-5 Mini" },
];

const AgentDetail = () => {
  const navigate = useNavigate();
  const { agentId } = useParams();
  const agent = AGENTS_MAP[agentId || "sdr-1"] || AGENTS_MAP["sdr-1"];

  const [input, setInput] = useState("");
  const [agentModel, setAgentModel] = useState(agent.model);
  const [isFullyConfigured, setIsFullyConfigured] = useState(true);
  const [rightPanelTab, setRightPanelTab] = useState("agent");

  const { messages, sendMessage, isStreaming } = useAgentChat(
    [{ role: "agent", text: `Olá! Sou ${agent.name}. Como posso ajudar?` }],
    { model: agentModel }
  );

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    const text = input.trim();
    setInput("");
    sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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
            <span className={`w-1.5 h-1.5 rounded-full ${isFullyConfigured ? "bg-emerald-500" : "bg-yellow-500"}`} />
            {isFullyConfigured ? "Online" : "Configurando"}
          </span>
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

        {/* Input — large textarea like reference */}
        <div className="px-4 pb-4 pt-2">
          <div className="border border-border rounded-xl bg-muted/30 flex flex-col">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Envie uma mensagem ao agente..."
              className="border-0 bg-transparent text-sm min-h-[80px] max-h-[160px] resize-none focus-visible:ring-0 focus-visible:ring-offset-0 p-4"
            />
            <div className="flex items-center justify-between px-3 pb-3">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <Paperclip className="w-4 h-4" />
                </Button>
                <select
                  value={agentModel}
                  onChange={(e) => setAgentModel(e.target.value)}
                  className="text-xs text-muted-foreground hover:text-foreground bg-transparent border border-border rounded-md px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/40"
                >
                  {LLM_MODELS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <HelpCircle className="w-4 h-4" />
                </Button>
                <Button size="icon" className="h-8 w-8 rounded-full" onClick={handleSend} disabled={!input.trim() || isStreaming}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT — Panel */}
      <AgentRightPanel agent={agent} agentModel={agentModel} onModelChange={setAgentModel} activeTab={rightPanelTab} onTabChange={setRightPanelTab} />
    </div>
  );
};

export default AgentDetail;
