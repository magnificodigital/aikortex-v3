import { Eye } from "lucide-react";

const PreviewPanel = () => {
  return (
    <div className="flex-1 flex items-center justify-center bg-muted/10">
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Eye className="w-7 h-7 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">
          A visualização do app será exibida aqui
        </p>
      </div>
    </div>
  );
};

export default PreviewPanel;
