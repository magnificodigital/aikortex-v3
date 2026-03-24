import { Terminal as TerminalIcon, ChevronUp, ChevronDown } from "lucide-react";
import { useState } from "react";

const TerminalPanel = () => {
  const [expanded, setExpanded] = useState(false);

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="flex items-center gap-1.5 px-4 py-1.5 border-t border-border text-xs text-muted-foreground hover:text-foreground transition-colors bg-card/30"
      >
        <TerminalIcon className="w-3.5 h-3.5" />
        <span>Terminal</span>
        <ChevronUp className="w-3 h-3 ml-1" />
      </button>
    );
  }

  return (
    <div className="border-t border-border bg-background">
      <button
        onClick={() => setExpanded(false)}
        className="flex items-center gap-1.5 px-4 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
      >
        <TerminalIcon className="w-3.5 h-3.5" />
        <span>Terminal</span>
        <ChevronDown className="w-3 h-3 ml-1" />
      </button>
      <div className="h-32 overflow-auto px-4 py-2 font-mono text-xs text-muted-foreground">
        <div>$ <span className="text-foreground">npm run dev</span></div>
        <div className="text-green-500">➜ Local: http://localhost:5173/</div>
        <div className="text-muted-foreground">ready in 320ms</div>
      </div>
    </div>
  );
};

export default TerminalPanel;
