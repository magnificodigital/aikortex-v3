import { Lead, PipelineStage, PIPELINE_STAGES, TEMPERATURE_CONFIG, LEAD_SOURCES } from "@/types/crm";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { DollarSign, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onStageChange: (leadId: string, newStage: PipelineStage) => void;
}

const KANBAN_STAGES: PipelineStage[] = ["novo", "contato", "qualificado", "proposta", "negociacao", "ganho", "perdido"];

const CRMKanban = ({ leads, onLeadClick, onStageChange }: Props) => {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newStage = result.destination.droppableId as PipelineStage;
    onStageChange(result.draggableId, newStage);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3 h-[calc(100vh-320px)]">
        {KANBAN_STAGES.map((stage) => {
          const cfg = PIPELINE_STAGES.find((s) => s.value === stage)!;
          const columnLeads = leads.filter((l) => l.stage === stage);
          const totalValue = columnLeads.reduce((sum, l) => sum + l.value, 0);

          return (
            <div key={stage} className="flex flex-col min-w-0">
              <div className={`mb-2 px-2 py-2 rounded-lg ${cfg.bg} space-y-1`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                    <span className={`text-xs font-semibold ${cfg.color} truncate`}>{cfg.label}</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{columnLeads.length}</Badge>
                </div>
                <p className="text-[10px] text-muted-foreground font-medium">
                  R$ {totalValue.toLocaleString("pt-BR")}
                </p>
              </div>

              <Droppable droppableId={stage}>
                {(provided, snapshot) => (
                  <ScrollArea className="flex-1">
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-2 min-h-[100px] rounded-lg p-1 transition-colors ${
                        snapshot.isDraggingOver ? "bg-primary/5 ring-1 ring-primary/20" : ""
                      }`}
                    >
                      {columnLeads.map((lead, index) => {
                        const temp = TEMPERATURE_CONFIG[lead.temperature];
                        const source = LEAD_SOURCES.find((s) => s.value === lead.source);

                        return (
                          <Draggable key={lead.id} draggableId={lead.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => onLeadClick(lead)}
                                className={`rounded-lg border border-border bg-card p-3 cursor-grab active:cursor-grabbing transition-all space-y-2 ${
                                  snapshot.isDragging
                                    ? "shadow-lg ring-2 ring-primary/30 rotate-1"
                                    : "hover:shadow-md hover:border-primary/30"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-1">
                                  <p className="text-xs font-semibold text-foreground leading-tight truncate">{lead.name}</p>
                                  <Badge variant="outline" className={`text-[8px] shrink-0 ${temp.color} ${temp.bg} border-0 px-1.5`}>
                                    {temp.label}
                                  </Badge>
                                </div>

                                <p className="text-[10px] text-muted-foreground truncate">{lead.company}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{lead.position}</p>

                                {lead.tags.length > 0 && (
                                  <div className="flex gap-1 flex-wrap">
                                    {lead.tags.slice(0, 2).map((tag) => (
                                      <span key={tag} className="text-[8px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                <div className="flex items-center justify-between pt-1 border-t border-border/30">
                                  <div className="flex items-center gap-1">
                                    <DollarSign className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-[10px] font-medium text-foreground">
                                      {lead.value >= 1000 ? `${(lead.value / 1000).toFixed(0)}k` : lead.value}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px]">{source?.icon}</span>
                                    <Avatar className="w-5 h-5">
                                      <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                                        {lead.assignee.split(" ").map((n) => n[0]).join("")}
                                      </AvatarFallback>
                                    </Avatar>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                      {columnLeads.length === 0 && (
                        <div className="rounded-lg border border-dashed border-border p-4 text-center text-[10px] text-muted-foreground">
                          Arraste leads aqui
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
};

export default CRMKanban;
