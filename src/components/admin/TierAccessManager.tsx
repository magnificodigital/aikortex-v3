import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Loader2, RotateCcw, ShieldCheck, ChevronDown, ChevronRight, Settings2,
} from "lucide-react";

const TIERS = ["bronze", "prata", "gold"] as const;
type Tier = (typeof TIERS)[number];

const TIER_COLORS: Record<Tier, string> = {
  bronze: "bg-amber-700/10 text-amber-700 border-amber-700/20",
  prata: "bg-slate-400/10 text-slate-500 border-slate-400/20",
  gold: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
};

interface SubFeatureDef {
  key: string;
  label: string;
}

interface ModuleDef {
  key: string;
  label: string;
  subFeatures?: SubFeatureDef[];
}

const MODULE_GROUPS: { group: string; modules: ModuleDef[] }[] = [
  {
    group: "Aikortex",
    modules: [
      {
        key: "aikortex.agentes",
        label: "Agentes",
        subFeatures: [
          { key: "template_sdr", label: "Template SDR" },
          { key: "template_sac", label: "Template SAC" },
          { key: "custom", label: "Agente Personalizado" },
          { key: "voice", label: "Agente de Voz" },
          { key: "llm_swap", label: "Troca de LLM" },
        ],
      },
      {
        key: "aikortex.flows",
        label: "Flows",
        subFeatures: [
          { key: "comercial", label: "Templates Comerciais" },
          { key: "atendimento", label: "Templates Atendimento" },
          { key: "customer_success", label: "Templates Customer Success" },
          { key: "operacao", label: "Templates Operação" },
          { key: "marketing", label: "Templates Marketing" },
          { key: "custom", label: "Fluxo em branco" },
        ],
      },
      {
        key: "aikortex.apps",
        label: "Apps",
        subFeatures: [
          { key: "web", label: "Apps Web" },
          { key: "whatsapp", label: "Apps WhatsApp" },
          { key: "custom_code", label: "Edição de código" },
        ],
      },
      {
        key: "aikortex.templates",
        label: "Templates",
        subFeatures: [
          { key: "sdr", label: "Templates SDR" },
          { key: "sac", label: "Templates SAC" },
          { key: "fluxos_comerciais", label: "Fluxos Comerciais" },
        ],
      },
      {
        key: "aikortex.mensagens",
        label: "Mensagens",
        subFeatures: [
          { key: "whatsapp", label: "WhatsApp" },
          { key: "email", label: "E-mail" },
          { key: "webchat", label: "Web Chat" },
        ],
      },
      {
        key: "aikortex.disparos",
        label: "Disparos",
        subFeatures: [
          { key: "whatsapp", label: "Disparos WhatsApp" },
          { key: "email", label: "Disparos E-mail" },
          { key: "agendamento", label: "Agendamento" },
        ],
      },
    ],
  },
  {
    group: "Gestão",
    modules: [
      {
        key: "gestao.clientes",
        label: "Clientes",
        subFeatures: [
          { key: "cadastro", label: "Cadastro" },
          { key: "health_score", label: "Health Score" },
          { key: "timeline", label: "Timeline" },
        ],
      },
      {
        key: "gestao.contratos",
        label: "Contratos",
        subFeatures: [
          { key: "criacao", label: "Criação" },
          { key: "assinatura_digital", label: "Assinatura Digital" },
          { key: "relatorios", label: "Relatórios" },
        ],
      },
      {
        key: "gestao.vendas",
        label: "Vendas",
        subFeatures: [
          { key: "pipeline", label: "Pipeline" },
          { key: "propostas", label: "Propostas" },
          { key: "metas", label: "Metas de vendas" },
        ],
      },
      {
        key: "gestao.crm",
        label: "CRM",
        subFeatures: [
          { key: "kanban", label: "Kanban" },
          { key: "lead_scoring", label: "Lead Scoring" },
          { key: "relatorios", label: "Relatórios" },
          { key: "automacoes", label: "Automações" },
        ],
      },
      {
        key: "gestao.reunioes",
        label: "Reuniões",
        subFeatures: [
          { key: "video", label: "Videochamadas" },
          { key: "gravacao", label: "Gravação" },
          { key: "traducao", label: "Tradução em tempo real" },
          { key: "sales_mentor", label: "Sales Mentor IA" },
        ],
      },
      {
        key: "gestao.financeiro",
        label: "Financeiro",
        subFeatures: [
          { key: "faturas", label: "Faturas" },
          { key: "despesas", label: "Despesas" },
          { key: "relatorios", label: "Relatórios financeiros" },
          { key: "fluxo_caixa", label: "Fluxo de caixa" },
        ],
      },
      {
        key: "gestao.equipe",
        label: "Equipe",
        subFeatures: [
          { key: "membros", label: "Gestão de membros" },
          { key: "performance", label: "Performance" },
          { key: "produtividade", label: "Produtividade" },
        ],
      },
      {
        key: "gestao.tarefas",
        label: "Tarefas",
        subFeatures: [
          { key: "kanban", label: "Kanban" },
          { key: "calendario", label: "Calendário" },
          { key: "equipe", label: "Visão por equipe" },
        ],
      },
    ],
  },
];

const ALL_MODULE_KEYS = MODULE_GROUPS.flatMap((g) => g.modules.map((m) => m.key));
const TOTAL_MODULES = ALL_MODULE_KEYS.length;

const DEFAULT_ACCESS: Record<string, Record<string, boolean>> = {
  bronze: {
    "aikortex.agentes": true, "aikortex.flows": false, "aikortex.apps": false,
    "aikortex.templates": true, "aikortex.mensagens": true, "aikortex.disparos": false,
    "gestao.clientes": true, "gestao.contratos": false, "gestao.vendas": true,
    "gestao.crm": false, "gestao.reunioes": false, "gestao.financeiro": false,
    "gestao.equipe": true, "gestao.tarefas": true,
  },
  prata: {
    "aikortex.agentes": true, "aikortex.flows": true, "aikortex.apps": false,
    "aikortex.templates": true, "aikortex.mensagens": true, "aikortex.disparos": true,
    "gestao.clientes": true, "gestao.contratos": true, "gestao.vendas": true,
    "gestao.crm": true, "gestao.reunioes": false, "gestao.financeiro": true,
    "gestao.equipe": true, "gestao.tarefas": true,
  },
  gold: Object.fromEntries(ALL_MODULE_KEYS.map((k) => [k, true])),
};

interface AccessRow {
  id: string;
  tier: string;
  module_key: string;
  has_access: boolean;
  sub_features: Record<string, boolean>;
}

const TierAccessManager = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  const { data: rows, isLoading } = useQuery({
    queryKey: ["tier-module-access-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tier_module_access" as any)
        .select("*");
      if (error) throw error;
      return (data ?? []) as unknown as AccessRow[];
    },
  });

  // Build maps
  const accessMap: Record<string, Record<string, boolean>> = {};
  const subFeaturesMap: Record<string, Record<string, Record<string, boolean>>> = {};
  if (rows) {
    for (const tier of TIERS) {
      accessMap[tier] = {};
      subFeaturesMap[tier] = {};
    }
    for (const row of rows) {
      if (!accessMap[row.tier]) accessMap[row.tier] = {};
      if (!subFeaturesMap[row.tier]) subFeaturesMap[row.tier] = {};
      accessMap[row.tier][row.module_key] = row.has_access;
      subFeaturesMap[row.tier][row.module_key] = (row.sub_features && typeof row.sub_features === "object")
        ? row.sub_features as Record<string, boolean>
        : {};
    }
  }

  const toggleMutation = useMutation({
    mutationFn: async ({ tier, moduleKey, value }: { tier: string; moduleKey: string; value: boolean }) => {
      const { error } = await supabase
        .from("tier_module_access" as any)
        .update({ has_access: value, updated_by: user?.id } as any)
        .eq("tier", tier)
        .eq("module_key", moduleKey);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tier-module-access-admin"] });
      queryClient.invalidateQueries({ queryKey: ["tier-module-access"] });
      toast.success("Acesso atualizado");
    },
    onError: () => toast.error("Erro ao atualizar acesso"),
  });

  const subFeatureMutation = useMutation({
    mutationFn: async ({ tier, moduleKey, subFeatures }: { tier: string; moduleKey: string; subFeatures: Record<string, boolean> }) => {
      const { error } = await supabase
        .from("tier_module_access" as any)
        .update({ sub_features: subFeatures, updated_by: user?.id } as any)
        .eq("tier", tier)
        .eq("module_key", moduleKey);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tier-module-access-admin"] });
      queryClient.invalidateQueries({ queryKey: ["tier-module-access"] });
      toast.success("Sub-funcionalidade atualizada");
    },
    onError: () => toast.error("Erro ao atualizar"),
  });

  const handleToggle = (tier: string, moduleKey: string, newValue: boolean) => {
    if (newValue) {
      const tierIdx = TIERS.indexOf(tier as Tier);
      for (let i = tierIdx; i < TIERS.length; i++) {
        const t = TIERS[i];
        if (!accessMap[t]?.[moduleKey]) {
          toggleMutation.mutate({ tier: t, moduleKey, value: true });
        }
      }
    } else {
      toggleMutation.mutate({ tier, moduleKey, value: false });
    }
  };

  const handleSubFeatureToggle = (tier: string, moduleKey: string, subKey: string, value: boolean) => {
    const current = subFeaturesMap[tier]?.[moduleKey] ?? {};
    const updated = { ...current, [subKey]: value };
    subFeatureMutation.mutate({ tier, moduleKey, subFeatures: updated });
  };

  const handleResetDefaults = async () => {
    if (!confirm("Restaurar configurações padrão para todos os tiers?")) return;
    for (const tier of TIERS) {
      for (const key of ALL_MODULE_KEYS) {
        const defaultVal = DEFAULT_ACCESS[tier]?.[key] ?? false;
        await supabase
          .from("tier_module_access" as any)
          .update({ has_access: defaultVal, updated_by: user?.id, sub_features: {} } as any)
          .eq("tier", tier)
          .eq("module_key", key);
      }
    }
    queryClient.invalidateQueries({ queryKey: ["tier-module-access-admin"] });
    queryClient.invalidateQueries({ queryKey: ["tier-module-access"] });
    toast.success("Padrões restaurados");
  };

  const countEnabled = (tier: string) =>
    ALL_MODULE_KEYS.filter((k) => accessMap[tier]?.[k]).length;

  const getModuleDef = (key: string): ModuleDef | undefined => {
    for (const g of MODULE_GROUPS) {
      const found = g.modules.find((m) => m.key === key);
      if (found) return found;
    }
    return undefined;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <ShieldCheck className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-foreground">Funcionalidades por Tier</h2>
          <p className="text-xs text-muted-foreground">
            Configure quais módulos e sub-funcionalidades cada tier pode acessar. Clique no módulo para gerenciar detalhes.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleResetDefaults} className="gap-1.5">
          <RotateCcw className="w-3.5 h-3.5" /> Restaurar padrões
        </Button>
      </div>

      {/* Tier summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {TIERS.map((tier) => {
          const enabled = countEnabled(tier);
          const pct = Math.round((enabled / TOTAL_MODULES) * 100);
          return (
            <Card key={tier} className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Badge className={`capitalize text-[10px] ${TIER_COLORS[tier]}`}>{tier}</Badge>
              </div>
              <p className="text-sm font-medium text-foreground">
                {enabled} de {TOTAL_MODULES} módulos
              </p>
              <Progress value={pct} className="h-1.5" />
            </Card>
          );
        })}
      </div>

      {/* Matrix table */}
      <div className="rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Módulo</th>
              {TIERS.map((tier) => (
                <th key={tier} className="px-4 py-3 text-center">
                  <Badge className={`capitalize text-[10px] ${TIER_COLORS[tier]}`}>{tier}</Badge>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MODULE_GROUPS.map((group) => (
              <> 
                <tr key={group.group} className="bg-muted/10">
                  <td colSpan={5} className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {group.group}
                  </td>
                </tr>
                {group.modules.map((mod) => {
                  const isExpanded = expandedModule === mod.key;
                  const hasSubFeatures = mod.subFeatures && mod.subFeatures.length > 0;

                  return (
                    <> 
                      <tr
                        key={mod.key}
                        className={`border-b border-border/50 transition-colors ${
                          isExpanded ? "bg-primary/5" : "hover:bg-muted/20"
                        } ${hasSubFeatures ? "cursor-pointer" : ""}`}
                      >
                        <td
                          className="px-4 py-2.5 font-medium text-foreground"
                          onClick={() => hasSubFeatures && setExpandedModule(isExpanded ? null : mod.key)}
                        >
                          <div className="flex items-center gap-2">
                            {hasSubFeatures && (
                              isExpanded
                                ? <ChevronDown className="w-3.5 h-3.5 text-primary" />
                                : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                            )}
                            <span>{mod.label}</span>
                            {hasSubFeatures && (
                              <Settings2 className="w-3 h-3 text-muted-foreground/50" />
                            )}
                          </div>
                        </td>
                        {TIERS.map((tier) => (
                          <td key={tier} className="px-4 py-2.5 text-center">
                            <Switch
                              checked={accessMap[tier]?.[mod.key] ?? false}
                              onCheckedChange={(val) => handleToggle(tier, mod.key, val)}
                              disabled={toggleMutation.isPending}
                            />
                          </td>
                        ))}
                      </tr>

                      {/* Sub-features expanded row */}
                      {isExpanded && hasSubFeatures && (
                        <tr key={`${mod.key}-sub`} className="bg-primary/5 border-b border-border/50">
                          <td colSpan={5} className="px-4 py-3">
                            <div className="ml-6 space-y-3">
                              <p className="text-xs font-medium text-muted-foreground mb-2">
                                Sub-funcionalidades de {mod.label}
                              </p>
                              <div className="rounded-lg border border-border/60 overflow-hidden">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="bg-muted/20">
                                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Funcionalidade</th>
                                      {TIERS.map((t) => (
                                        <th key={t} className="px-3 py-2 text-center">
                                          <Badge className={`capitalize text-[9px] ${TIER_COLORS[t]}`}>{t}</Badge>
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {mod.subFeatures!.map((sf) => (
                                      <tr key={sf.key} className="border-t border-border/30 hover:bg-muted/10 transition-colors">
                                        <td className="px-3 py-2 text-foreground">{sf.label}</td>
                                        {TIERS.map((tier) => {
                                          const moduleEnabled = accessMap[tier]?.[mod.key] ?? false;
                                          const subEnabled = subFeaturesMap[tier]?.[mod.key]?.[sf.key] ?? false;
                                          return (
                                            <td key={tier} className="px-3 py-2 text-center">
                                              <Checkbox
                                                checked={subEnabled}
                                                onCheckedChange={(val) =>
                                                  handleSubFeatureToggle(tier, mod.key, sf.key, !!val)
                                                }
                                                disabled={!moduleEnabled || subFeatureMutation.isPending}
                                                className="mx-auto"
                                              />
                                            </td>
                                          );
                                        })}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TierAccessManager;
