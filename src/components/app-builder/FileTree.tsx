import { useState } from "react";
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileNode {
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
}

const DEMO_TREE: FileNode[] = [
  {
    name: "public",
    type: "folder",
    children: [
      { name: "favicon.svg", type: "file" },
      { name: "robots.txt", type: "file" },
      { name: "placeholder.svg", type: "file" },
    ],
  },
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
          { name: "Footer.tsx", type: "file" },
        ],
      },
      {
        name: "pages",
        type: "folder",
        children: [
          { name: "Index.tsx", type: "file" },
          { name: "About.tsx", type: "file" },
        ],
      },
      { name: "main.tsx", type: "file" },
      { name: "index.css", type: "file" },
    ],
  },
  { name: ".env.local", type: "file" },
  { name: "index.html", type: "file" },
  { name: "package.json", type: "file" },
  { name: "postcss.config.cjs", type: "file" },
  { name: "tailwind.config.ts", type: "file" },
  { name: "tsconfig.json", type: "file" },
  { name: "vite.config.ts", type: "file" },
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
            {open ? (
              <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
            )}
            {open ? (
              <FolderOpen className="w-3.5 h-3.5 text-primary shrink-0" />
            ) : (
              <Folder className="w-3.5 h-3.5 text-primary shrink-0" />
            )}
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
        <FileTreeItem
          key={child.name}
          node={child}
          depth={depth + 1}
          selectedFile={selectedFile}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
};

interface FileTreeProps {
  selectedFile: string | null;
  onSelectFile: (name: string) => void;
}

const FileTree = ({ selectedFile, onSelectFile }: FileTreeProps) => {
  return (
    <div className="w-[220px] min-w-[180px] border-r border-border bg-card/50 flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
        <File className="w-3.5 h-3.5 text-muted-foreground" />
        <button className="p-1 hover:bg-accent rounded transition-colors">
          <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
        </button>
        <span className="text-xs text-muted-foreground ml-auto">⬇ Download</span>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {DEMO_TREE.map((node) => (
          <FileTreeItem
            key={node.name}
            node={node}
            depth={0}
            selectedFile={selectedFile}
            onSelect={onSelectFile}
          />
        ))}
      </div>
    </div>
  );
};

export default FileTree;
