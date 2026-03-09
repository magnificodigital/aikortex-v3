import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TIER_CONFIG, type PartnerProfile, type PartnerTier } from "@/types/partner";
import { Award, Check, Lock, ChevronRight, Users, DollarSign, Package, GraduationCap } from "lucide-react";

interface Props {
  profile: PartnerProfile;
}

const tiers: PartnerTier[] = ["bronze", "silver", "gold", "elite"];

const PartnerTiersTab = ({ profile }: Props) => {
  const currentIdx = tiers.indexOf(profile.tier);

  const getProgress = (tier: PartnerTier) => {
    const cfg = TIER_CONFIG[tier];
    const metrics = [
      { current: profile.clientsServed, required: cfg.minClients, label: "Clientes", icon: Users },
      { current: profile.revenue, required: cfg.minRevenue, label: "Receita (R$)", icon: DollarSign },
      { current: profile.solutionsPublished, required: cfg.minSolutions, label: "Soluções", icon: Package },
      { current: profile.certifications.length, required: cfg.minCerts, label: "Certificações", icon: GraduationCap },
    ];
    return metrics;
  };

  return (
    <div className="space-y-6">
      {/* Timeline */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            {tiers.map((t, i) => {
              const cfg = TIER_CONFIG[t];
              const reached = i <= currentIdx;
              return (
                <div key={t} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${reached ? "border-primary bg-primary/10" : "border-muted bg-muted/30"}`}>
                      {reached ? <Check className={`w-5 h-5 ${cfg.color}`} /> : <Lock className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    <span className={`text-xs mt-1 font-medium ${reached ? cfg.color : "text-muted-foreground"}`}>{cfg.label}</span>
                  </div>
                  {i < tiers.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 ${i < currentIdx ? "bg-primary" : "bg-muted"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tier cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tiers.map((t, i) => {
          const cfg = TIER_CONFIG[t];
          const reached = i <= currentIdx;
          const isNext = i === currentIdx + 1;
          const metrics = getProgress(t);

          return (
            <Card key={t} className={`${isNext ? "border-primary/50 ring-1 ring-primary/20" : ""} ${reached && !isNext ? "opacity-80" : ""}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className={`w-5 h-5 ${cfg.color}`} />
                    <CardTitle className="text-base">{cfg.label}</CardTitle>
                  </div>
                  {reached && <Badge variant="secondary" className="text-xs">Conquistado</Badge>}
                  {isNext && <Badge className="text-xs">Próximo nível</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Requirements */}
                {metrics.filter((m) => m.required > 0).map((m) => {
                  const pct = Math.min(100, (m.current / m.required) * 100);
                  return (
                    <div key={m.label}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <m.icon className="w-3 h-3" />{m.label}
                        </span>
                        <span className="text-foreground font-medium">{m.current}/{m.required}</span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                  );
                })}

                {/* Benefits */}
                <div className="pt-2 border-t border-border">
                  <p className="text-xs font-medium text-foreground mb-1">Benefícios:</p>
                  <ul className="space-y-1">
                    {cfg.benefits.map((b) => (
                      <li key={b} className="text-xs text-muted-foreground flex items-center gap-1">
                        <ChevronRight className="w-3 h-3 text-primary shrink-0" />{b}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default PartnerTiersTab;
