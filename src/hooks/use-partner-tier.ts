import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { TIER_FEATURE_CONFIG, type FeatureFlag, type PartnerTier } from "@/types/rbac";
import { TIER_CONFIG } from "@/types/partner";

const TIERS: PartnerTier[] = ["bronze", "prata", "gold"];

export interface PartnerTierData {
  id: string;
  user_id: string;
  tier: PartnerTier;
  clients_served: number;
  revenue: number;
  solutions_published: number;
  certifications_earned: number;
  tier_upgraded_at: string;
  notes: string | null;
}

export interface TierProgress {
  clients: number;
  revenue: number;
  solutions: number;
  certs: number;
}

export function usePartnerTier() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["partner-tier", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      // Try to fetch existing tier
      const { data: existing, error } = await supabase
        .from("partner_tiers" as any)
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;

      if (existing) return existing as unknown as PartnerTierData;

      // Auto-create bronze tier on first access
      const { data: created, error: insertError } = await supabase
        .from("partner_tiers" as any)
        .insert({ user_id: user!.id, tier: "bronze" })
        .select()
        .single();

      if (insertError) throw insertError;
      return created as unknown as PartnerTierData;
    },
  });

  const tier: PartnerTier = (data?.tier as PartnerTier) ?? "bronze";
  const tierIdx = TIERS.indexOf(tier);
  const nextTier = tierIdx < TIERS.length - 1 ? TIERS[tierIdx + 1] : null;

  const hasFeature = (flag: FeatureFlag): boolean => {
    return TIER_FEATURE_CONFIG[tier]?.features?.includes(flag) ?? false;
  };

  const getMinTierForFeature = (flag: FeatureFlag): PartnerTier | null => {
    for (const t of TIERS) {
      if (TIER_FEATURE_CONFIG[t]?.features?.includes(flag)) return t;
    }
    return null;
  };

  const progressToNextTier: TierProgress | null = nextTier
    ? (() => {
        const cfg = TIER_CONFIG[nextTier];
        const d = data;
        return {
          clients: cfg.minClients > 0 ? Math.min(100, ((d?.clients_served ?? 0) / cfg.minClients) * 100) : 100,
          revenue: cfg.minRevenue > 0 ? Math.min(100, ((d?.revenue ?? 0) / cfg.minRevenue) * 100) : 100,
          solutions: cfg.minSolutions > 0 ? Math.min(100, ((d?.solutions_published ?? 0) / cfg.minSolutions) * 100) : 100,
          certs: cfg.minCerts > 0 ? Math.min(100, ((d?.certifications_earned ?? 0) / cfg.minCerts) * 100) : 100,
        };
      })()
    : null;

  const updateMetrics = useMutation({
    mutationFn: async (metrics: Partial<Pick<PartnerTierData, "clients_served" | "revenue" | "solutions_published" | "certifications_earned">>) => {
      const { error } = await supabase
        .from("partner_tiers" as any)
        .update(metrics)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["partner-tier", user?.id] }),
  });

  return {
    tier,
    data,
    isLoading,
    hasFeature,
    getMinTierForFeature,
    nextTier,
    progressToNextTier,
    updateMetrics,
  };
}
