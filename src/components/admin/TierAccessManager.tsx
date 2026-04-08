import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, RotateCcw, ShieldCheck } from "lucide-react";

const TIERS = ["bronze", "silver", "gold", "elite"] as const;
type Tier = (typeof TIERS)[number];

const TIER_COLORS: Record<Tier, string> = {
  bronze: "bg-amber-700/10 text-amber-700 border-amber-700/20",
  silver: "bg-slate-400/10 text-slate-500 border-slate-400/20",
  gold: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  elite: "bg-purple-500/10 text-purple-600 border-purple-500/20",
};

interface ModuleDef {
  key: string;
  label: string;
}

const MODULE_GROUPS: { group: string; modules: ModuleDef[] }[] = [
  {
    group: "Aikortex",
    modules: [
      { key: "aikortex.agentes", label: "Agentes" },
      { key: "aikortex.flows", label: "Flows" },
      { key: "aikortex.apps", label: "Apps" },
      { key: "aikortex.templates", label: "Templates" },
      { key: "aikortex.mensagens", label: "Mensagens" },
      { key: "aikortex.disparos", label: "Disparos" },
    ],
  },
  {
    group: "Gestão",
    modules: [
      { key: "gestao.clientes", label: "Clientes" },
      { key: "gestao.contratos", label: "Contratos" },
      { key: "gestao.vendas", label: "Vendas" },
      { key: "gestao.crm", label: "CRM" },
      { key: "gestao.reunioes", label: "Reuniões" },
      { key: "gestao.financeiro", label: "Financeiro" },
      { key: "gestao.equipe", label: "Equipe" },
      { key: "gestao.tarefas", label: "Tarefas" },
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
  silver: {
    "aikortex.agentes": true, "aikortex.flows": true, "aikortex.apps": false,
    "aikortex.templates": true, "aikortex.mensagens": true, "aikortex.disparos": true,
    "gestao.clientes": true, "gestao.contratos": true, "gestao.vendas": true,
    "gestao.crm": true, "gestao.reunioes": false, "gestao.financeiro": true,
    "gestao.equipe": true, "gestao.tarefas": true,
  },
  gold: Object.fromEntries(ALL_MODULE_KEYS.map((k) => [k, true])),
  elite: Object.fromEntries(ALL_MODULE_KEYS.map((k) => [k, true])),
};

interface AccessRow {
  id: string;
  tier: string;
  module_key: string;
  has_access: boolean;
}

const TierAccessManager = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

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

  // Build a map: tier -> module_key -> has_access
  const buildMap = (data: AccessRow[]): Record<string, Record<string, boolean>> => {
    const map: Record<string, Record<string, boolean>> = {};
    for (const tier of TIERS) map[tier] = {};
    for (const row of data) {
      if (!map[row.tier]) map[row.tier] = {};
      map[row.tier][row.module_key] = row.has_access;
    }
    return map;
  };

  const accessMap = rows ? buildMap(rows) : {};

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

  const handleToggle = (tier: string, moduleKey: string, newValue: boolean) => {
    // Cascade: enabling for a lower tier enables for all higher tiers
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

  const handleResetDefaults = async () => {
    if (!confirm("Restaurar configurações padrão para todos os tiers?")) return;
    for (const tier of TIERS) {
      for (const key of ALL_MODULE_KEYS) {
        const defaultVal = DEFAULT_ACCESS[tier]?.[key] ?? false;
        await supabase
          .from("tier_module_access" as any)
          .update({ has_access: defaultVal, updated_by: user?.id } as any)
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
            Configure quais módulos cada tier de parceiro pode acessar. Alterações são aplicadas imediatamente.
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
                {group.modules.map((mod) => (
                  <tr key={mod.key} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-foreground">{mod.label}</td>
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
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TierAccessManager;
