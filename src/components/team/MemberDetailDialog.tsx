import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TeamMember, roleConfig, statusConfig, departmentConfig, mockActivityLog } from "@/types/team";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, CheckSquare, Clock, AlertTriangle, Mail, Phone, Calendar } from "lucide-react";

interface MemberDetailDialogProps {
  member: TeamMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MemberDetailDialog = ({ member, open, onOpenChange }: MemberDetailDialogProps) => {
  if (!member) return null;

  const rc = roleConfig[member.role];
  const sc = statusConfig[member.status];
  const dc = departmentConfig[member.department];
  const completionRate = member.completedTasks + member.assignedTasks > 0
    ? Math.round((member.completedTasks / (member.completedTasks + member.assignedTasks)) * 100)
    : 0;

  const memberActivity = mockActivityLog.filter((a) => a.userId === member.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Perfil do Membro</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-4 pb-4 border-b border-border/50">
          <Avatar className="w-14 h-14">
            <AvatarFallback className="text-lg bg-primary/10 text-primary font-bold">
              {member.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">{member.fullName}</h3>
            <p className="text-sm text-muted-foreground">{member.jobTitle}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={`text-[10px] ${rc.color} ${rc.bg} border-0`}>{rc.label}</Badge>
              <Badge variant="outline" className={`text-[10px] ${dc.color} ${dc.bg} border-0`}>{dc.label}</Badge>
              <Badge variant="outline" className={`text-[10px] ${sc.color} ${sc.bg} border-0`}>{sc.label}</Badge>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="mt-2">
          <TabsList className="w-full">
            <TabsTrigger value="overview" className="flex-1 text-xs">Visão Geral</TabsTrigger>
            <TabsTrigger value="workload" className="flex-1 text-xs">Carga</TabsTrigger>
            <TabsTrigger value="activity" className="flex-1 text-xs">Atividade</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">{member.email}</span>
              </div>
              {member.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{member.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Entrou em {new Date(member.joinedAt).toLocaleDateString("pt-BR")}</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="workload" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="glass-card rounded-lg p-3 text-center">
                <CheckSquare className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{member.assignedTasks}</p>
                <p className="text-[10px] text-muted-foreground">Tarefas ativas</p>
              </div>
              <div className="glass-card rounded-lg p-3 text-center">
                <Briefcase className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{member.activeProjects}</p>
                <p className="text-[10px] text-muted-foreground">Projetos</p>
              </div>
              <div className="glass-card rounded-lg p-3 text-center">
                <AlertTriangle className="w-5 h-5 text-destructive mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{member.overdueTasks}</p>
                <p className="text-[10px] text-muted-foreground">Atrasadas</p>
              </div>
              <div className="glass-card rounded-lg p-3 text-center">
                <Clock className="w-5 h-5 text-[hsl(var(--success))] mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{Math.round(member.totalHoursLogged / 60)}h</p>
                <p className="text-[10px] text-muted-foreground">Horas totais</p>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Taxa de conclusão</span>
                <span className="text-foreground font-medium">{completionRate}%</span>
              </div>
              <Progress value={completionRate} className="h-2" />
            </div>
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            {memberActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Sem atividade recente</p>
            ) : (
              <div className="space-y-2">
                {memberActivity.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent/40">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{a.action}</p>
                      <p className="text-xs text-muted-foreground">{a.target}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {new Date(a.timestamp).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default MemberDetailDialog;
