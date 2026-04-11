import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface AgencyClient {
  id: string;
  client_name: string;
  client_email: string | null;
  status: string | null;
}

interface WorkspaceContextType {
  agencyName: string;
  agencyProfileId: string | null;
  clients: AgencyClient[];
  activeWorkspace: { type: "agency" | "client"; id: string; name: string };
  switchToAgency: () => void;
  switchToClient: (client: AgencyClient) => void;
  loading: boolean;
  refreshClients: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

const WS_ACTIVE_KEY = "aikortex_active_workspace";

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAgencyOwner, profile } = useAuth();
  const [agencyName, setAgencyName] = useState("Meu Workspace");
  const [agencyProfileId, setAgencyProfileId] = useState<string | null>(null);
  const [clients, setClients] = useState<AgencyClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeWorkspace, setActiveWorkspace] = useState<{ type: "agency" | "client"; id: string; name: string }>({
    type: "agency", id: "", name: "Meu Workspace",
  });

  const loadAgencyData = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    try {
      // Load agency profile
      const { data: agency } = await supabase
        .from("agency_profiles")
        .select("id, agency_name")
        .eq("user_id", user.id)
        .maybeSingle();

      const name = agency?.agency_name || "Meu Workspace";
      setAgencyName(name);
      setAgencyProfileId(agency?.id ?? null);

      // Load clients for this agency
      if (agency?.id) {
        const { data: agencyClients } = await supabase
          .from("agency_clients")
          .select("id, client_name, client_email, status")
          .eq("agency_id", agency.id)
          .eq("status", "active")
          .order("client_name");

        setClients(agencyClients ?? []);
      }

      // Restore saved active workspace
      try {
        const saved = localStorage.getItem(WS_ACTIVE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.type === "agency") {
            setActiveWorkspace({ type: "agency", id: agency?.id ?? "", name });
          } else {
            // Verify client still exists
            const clientExists = (agencyClients ?? []).find((c: AgencyClient) => c.id === parsed.id);
            if (clientExists) {
              setActiveWorkspace({ type: "client", id: parsed.id, name: parsed.name });
            } else {
              setActiveWorkspace({ type: "agency", id: agency?.id ?? "", name });
            }
          }
        } else {
          setActiveWorkspace({ type: "agency", id: agency?.id ?? "", name });
        }
      } catch {
        setActiveWorkspace({ type: "agency", id: agency?.id ?? "", name });
      }
    } catch (err) {
      console.error("Error loading workspace data:", err);
    } finally {
      setLoading(false);
    }

    // Fix: agencyClients is scoped inside the if block, need to restructure
  }, [user]);

  useEffect(() => {
    loadAgencyData();
  }, [loadAgencyData]);

  // Fix the loadAgencyData to properly handle client restoration
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        const { data: agency } = await supabase
          .from("agency_profiles")
          .select("id, agency_name")
          .eq("user_id", user.id)
          .maybeSingle();

        const name = agency?.agency_name || "Meu Workspace";
        setAgencyName(name);
        setAgencyProfileId(agency?.id ?? null);

        let loadedClients: AgencyClient[] = [];
        if (agency?.id) {
          const { data: agencyClients } = await supabase
            .from("agency_clients")
            .select("id, client_name, client_email, status")
            .eq("agency_id", agency.id)
            .eq("status", "active")
            .order("client_name");
          loadedClients = agencyClients ?? [];
          setClients(loadedClients);
        }

        // Restore saved workspace
        try {
          const saved = localStorage.getItem(WS_ACTIVE_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.type === "client") {
              const exists = loadedClients.find(c => c.id === parsed.id);
              if (exists) {
                setActiveWorkspace({ type: "client", id: parsed.id, name: parsed.name });
              } else {
                setActiveWorkspace({ type: "agency", id: agency?.id ?? "", name });
              }
            } else {
              setActiveWorkspace({ type: "agency", id: agency?.id ?? "", name });
            }
          } else {
            setActiveWorkspace({ type: "agency", id: agency?.id ?? "", name });
          }
        } catch {
          setActiveWorkspace({ type: "agency", id: agency?.id ?? "", name });
        }
      } catch (err) {
        console.error("Error loading workspace:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const switchToAgency = useCallback(() => {
    const ws = { type: "agency" as const, id: agencyProfileId ?? "", name: agencyName };
    setActiveWorkspace(ws);
    localStorage.setItem(WS_ACTIVE_KEY, JSON.stringify(ws));
  }, [agencyProfileId, agencyName]);

  const switchToClient = useCallback((client: AgencyClient) => {
    const ws = { type: "client" as const, id: client.id, name: client.client_name };
    setActiveWorkspace(ws);
    localStorage.setItem(WS_ACTIVE_KEY, JSON.stringify(ws));
  }, []);

  const refreshClients = useCallback(async () => {
    if (!agencyProfileId) return;
    const { data } = await supabase
      .from("agency_clients")
      .select("id, client_name, client_email, status")
      .eq("agency_id", agencyProfileId)
      .eq("status", "active")
      .order("client_name");
    setClients(data ?? []);
  }, [agencyProfileId]);

  return (
    <WorkspaceContext.Provider value={{
      agencyName, agencyProfileId, clients,
      activeWorkspace, switchToAgency, switchToClient,
      loading, refreshClients,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
};
