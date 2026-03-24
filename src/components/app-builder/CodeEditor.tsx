import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CodeEditorProps {
  fileName: string | null;
}

const DEMO_CODE: Record<string, string[]> = {
  "index.html": [
    '<!doctype html>',
    '<html lang="pt-BR">',
    '  <head>',
    '    <meta charset="UTF-8" />',
    '    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />',
    '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    '    <title>Meu App</title>',
    '  </head>',
    '  <body>',
    '    <div id="root"></div>',
    '    <script type="module" src="/src/main.tsx"></script>',
    '  </body>',
    '</html>',
  ],
  "main.tsx": [
    'import React from "react";',
    'import ReactDOM from "react-dom/client";',
    'import App from "./components/App";',
    'import "./index.css";',
    '',
    'ReactDOM.createRoot(document.getElementById("root")!).render(',
    '  <React.StrictMode>',
    '    <App />',
    '  </React.StrictMode>',
    ');',
  ],
  "package.json": [
    '{',
    '  "name": "meu-app",',
    '  "private": true,',
    '  "version": "1.0.0",',
    '  "type": "module",',
    '  "scripts": {',
    '    "dev": "vite",',
    '    "build": "vite build",',
    '    "preview": "vite preview"',
    '  },',
    '  "dependencies": {',
    '    "react": "^18.3.1",',
    '    "react-dom": "^18.3.1"',
    '  }',
    '}',
  ],
};

const getLines = (fileName: string | null): string[] => {
  if (!fileName) return [];
  return DEMO_CODE[fileName] || [
    `// ${fileName}`,
    '',
    'export default function Component() {',
    '  return (',
    '    <div className="p-4">',
    `      <h1>${fileName}</h1>`,
    '    </div>',
    '  );',
    '}',
  ];
};

const syntaxHighlight = (line: string) => {
  // Simple syntax coloring
  return line
    .replace(/(import|from|export|default|function|return|const|let|var|if|else)/g, '<span class="text-purple-400">$1</span>')
    .replace(/(".*?"|'.*?'|`.*?`)/g, '<span class="text-green-400">$1</span>')
    .replace(/(\/\/.*)/g, '<span class="text-muted-foreground">$1</span>')
    .replace(/(&lt;\/?[\w-]+)/g, '<span class="text-blue-400">$1</span>');
};

const CodeEditor = ({ fileName }: CodeEditorProps) => {
  const lines = getLines(fileName);

  if (!fileName) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        Selecione um arquivo para visualizar
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background">
      {/* Tab bar */}
      <div className="flex items-center border-b border-border bg-card/30">
        <div className={cn(
          "flex items-center gap-2 px-3 py-1.5 text-xs border-r border-border bg-background"
        )}>
          <span>{fileName}</span>
          <X className="w-3 h-3 text-muted-foreground hover:text-foreground cursor-pointer" />
        </div>
      </div>

      {/* File path */}
      <div className="px-4 py-1 text-[11px] text-muted-foreground border-b border-border bg-card/20">
        {fileName}
      </div>

      {/* Code area */}
      <div className="flex-1 overflow-auto font-mono text-xs leading-5">
        {lines.map((line, i) => (
          <div key={i} className="flex hover:bg-accent/20">
            <span className="w-10 shrink-0 text-right pr-3 text-muted-foreground/50 select-none">
              {i + 1}
            </span>
            <pre
              className="flex-1 whitespace-pre"
              dangerouslySetInnerHTML={{ __html: syntaxHighlight(line) }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default CodeEditor;
