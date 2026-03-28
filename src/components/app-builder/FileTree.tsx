import { useState } from "react";
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileNode {
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
}

const WEB_TREE: FileNode[] = [
  {
    name: "src",
    type: "folder",
    children: [
      {
        name: "components",
        type: "folder",
        children: [
          { name: "App.tsx", type: "file" },
          { name: "Header.tsx", type: "file" },
          { name: "Sidebar.tsx", type: "file" },
          { name: "Dashboard.tsx", type: "file" },
          { name: "DataTable.tsx", type: "file" },
          { name: "MetricCard.tsx", type: "file" },
          { name: "ChartWidget.tsx", type: "file" },
          { name: "LoginForm.tsx", type: "file" },
        ],
      },
      {
        name: "pages",
        type: "folder",
        children: [
          { name: "Home.tsx", type: "file" },
          { name: "Dashboard.tsx", type: "file" },
          { name: "Settings.tsx", type: "file" },
          { name: "Auth.tsx", type: "file" },
        ],
      },
      {
        name: "hooks",
        type: "folder",
        children: [
          { name: "useAuth.ts", type: "file" },
          { name: "useData.ts", type: "file" },
        ],
      },
      {
        name: "lib",
        type: "folder",
        children: [
          { name: "supabase.ts", type: "file" },
          { name: "utils.ts", type: "file" },
        ],
      },
      { name: "main.tsx", type: "file" },
      { name: "index.css", type: "file" },
    ],
  },
  { name: "index.html", type: "file" },
  { name: "package.json", type: "file" },
  { name: "tailwind.config.ts", type: "file" },
  { name: "vite.config.ts", type: "file" },
];

const WHATSAPP_TREE: FileNode[] = [
  {
    name: "src",
    type: "folder",
    children: [
      {
        name: "agents",
        type: "folder",
        children: [
          { name: "main-agent.ts", type: "file" },
          { name: "qualifier.ts", type: "file" },
          { name: "scheduler.ts", type: "file" },
          { name: "follow-up.ts", type: "file" },
        ],
      },
      {
        name: "flows",
        type: "folder",
        children: [
          { name: "onboarding.ts", type: "file" },
          { name: "qualification.ts", type: "file" },
          { name: "appointment.ts", type: "file" },
          { name: "follow-up.ts", type: "file" },
        ],
      },
      {
        name: "handlers",
        type: "folder",
        children: [
          { name: "message-handler.ts", type: "file" },
          { name: "webhook.ts", type: "file" },
          { name: "media-handler.ts", type: "file" },
        ],
      },
      {
        name: "integrations",
        type: "folder",
        children: [
          { name: "whatsapp-api.ts", type: "file" },
          { name: "crm.ts", type: "file" },
          { name: "calendar.ts", type: "file" },
        ],
      },
      {
        name: "utils",
        type: "folder",
        children: [
          { name: "prompts.ts", type: "file" },
          { name: "templates.ts", type: "file" },
          { name: "validators.ts", type: "file" },
        ],
      },
      { name: "config.ts", type: "file" },
      { name: "index.ts", type: "file" },
    ],
  },
  {
    name: "dashboard",
    type: "folder",
    children: [
      { name: "App.tsx", type: "file" },
      { name: "ConversationView.tsx", type: "file" },
      { name: "Analytics.tsx", type: "file" },
      { name: "Settings.tsx", type: "file" },
    ],
  },
  { name: ".env", type: "file" },
  { name: "package.json", type: "file" },
  { name: "tsconfig.json", type: "file" },
];

interface FileTreeItemProps {
  node: FileNode;
  depth: number;
  selectedFile: string | null;
  onSelect: (name: string) => void;
}

const FileTreeItem = ({ node, depth, selectedFile, onSelect }: FileTreeItemProps) => {
  const [open, setOpen] = useState(depth === 0);
  const isFolder = node.type === "folder";
  const isSelected = selectedFile === node.name;

  return (
    <div>
      <button
        onClick={() => {
          if (isFolder) setOpen(!open);
          else onSelect(node.name);
        }}
        className={cn(
          "flex items-center gap-1.5 w-full text-left px-2 py-1 text-xs hover:bg-accent/50 rounded transition-colors",
          isSelected && "bg-accent text-accent-foreground"
        )}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
      >
        {isFolder ? (
          <>
            {open ? <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" /> : <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />}
            {open ? <FolderOpen className="w-3.5 h-3.5 text-primary shrink-0" /> : <Folder className="w-3.5 h-3.5 text-primary shrink-0" />}
          </>
        ) : (
          <>
            <span className="w-3 shrink-0" />
            <File className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          </>
        )}
        <span className="truncate">{node.name}</span>
      </button>
      {isFolder && open && node.children?.map((child) => (
        <FileTreeItem key={child.name} node={child} depth={depth + 1} selectedFile={selectedFile} onSelect={onSelect} />
      ))}
    </div>
  );
};

interface FileTreeProps {
  selectedFile: string | null;
  onSelectFile: (name: string) => void;
  channel?: "whatsapp" | "web";
}

const FileTree = ({ selectedFile, onSelectFile, channel = "web" }: FileTreeProps) => {
  const tree = channel === "whatsapp" ? WHATSAPP_TREE : WEB_TREE;

  return (
    <div className="w-[220px] min-w-[180px] border-r border-border bg-card/50 flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
        <File className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground ml-auto">⬇ Download</span>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {tree.map((node) => (
          <FileTreeItem key={node.name} node={node} depth={0} selectedFile={selectedFile} onSelect={onSelectFile} />
        ))}
      </div>
    </div>
  );
};

export default FileTree;
