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
      const hoje = new Date().toISOString().split("T")[0];

      let processosCountQuery = supabase
        .from("processos")
        .select("id", { count: "exact", head: true })
        .eq("status", "ATIVO");

      let clientesQuery = supabase
        .from("clientes")
        .select("id", { count: "exact", head: true });

      let audienciasQuery = supabase
        .from("processos")
        .select("id", { count: "exact", head: true })
        .eq("prazo", hoje);

      if (!canViewAllProcesses && user?.id) {
        processosCountQuery = processosCountQuery.eq("user_id", user.id);
        audienciasQuery = audienciasQuery.eq("user_id", user.id);
      }
      if (!canViewAllClients && user?.id) {
        clientesQuery = clientesQuery.eq("user_id", user.id);
      }

      const tarefasQuery = (supabase as any)
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .neq("status", "completed");

      const [processosResult, clientesResult, audienciasResult, tarefasResult] = await Promise.all([
        processosCountQuery,
        clientesQuery,
        audienciasQuery,
        tarefasQuery
      ]);

      return {
        processosAtivos: processosResult.count || 0,
        clientes: clientesResult.count || 0,
        audienciasHoje: audienciasResult.count || 0,
        tarefasPendentes: tarefasResult.count || 0,
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
      let query = supabase
        .from("processos")
        .select(`id, numero_processo, tipo_processo, status, created_at, prazo, user_id, cliente_preso, clientes (nome)`)
        .order("created_at", { ascending: false });

      if (!canViewAllProcesses && user?.id) {
        query = query.eq("user_id", user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !permissionsLoading,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });
}
