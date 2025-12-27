import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useGlobalAccess } from "@/utils/accessUtils";

interface DashboardStats {
  processosAtivos: number;
  audienciasHoje: number;
  clientes: number;
  tarefasPendentes: number;
}

interface Processo {
  id: string;
  numero_processo: string;
  tipo_processo: string;
  status: string | null;
  created_at: string;
  prazo: string | null;
  user_id: string;
  cliente_preso: boolean | null;
  clientes: { nome: string } | null;
}

export function useDashboardStats() {
  const { user } = useAuth();
  const { canViewAllProcesses, canViewAllClients, permissionsLoading } = useGlobalAccess();

  return useQuery<DashboardStats>({
    queryKey: ["dashboard-stats", user?.id, canViewAllProcesses, canViewAllClients],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) throw new Error("Not authenticated");

      const headers = {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      };

      // Fetch stats from server API routes (using SERVICE_ROLE_KEY to bypass RLS)
      const [processosRes, clientesRes, audienciasRes, tarefasRes] = await Promise.all([
        fetch("/api/stats/processos", { headers }),
        fetch("/api/stats/clientes", { headers }),
        fetch("/api/stats/audiencias", { headers }),
        fetch("/api/tasks?status=pending", { headers })
      ]);

      const [processosData, clientesData, audienciasData, tarefasData] = await Promise.all([
        processosRes.json(),
        clientesRes.json(),
        audienciasRes.json(),
        tarefasRes.json()
      ]);

      return {
        processosAtivos: processosData.count || 0,
        audienciasHoje: audienciasData.count || 0,
        clientes: clientesData.count || 0,
        tarefasPendentes: Array.isArray(tarefasData) ? tarefasData.length : 0,
      };
    },
    enabled: !!user && !permissionsLoading,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });
}

export function useDashboardProcessos() {
  const { user } = useAuth();
  const { canViewAllProcesses, permissionsLoading } = useGlobalAccess();

  return useQuery<Processo[]>({
    queryKey: ["dashboard-processos", user?.id, canViewAllProcesses],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) throw new Error("Not authenticated");

      // Use server API route that bypasses RLS
      const response = await fetch("/api/processos", {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) throw new Error("Failed to fetch processos");
      return await response.json();
    },
    enabled: !!user && !permissionsLoading,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });
}
