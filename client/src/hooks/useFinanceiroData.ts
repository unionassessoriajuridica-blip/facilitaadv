import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useGlobalAccess } from "@/utils/accessUtils";

export interface FinanceiroItem {
  id: string;
  cliente_nome: string;
  valor: number;
  tipo: string;
  status: string | null;
  vencimento: string | null;
  data_pagamento?: string | null;
  created_at: string;
}

export function useFinanceiroData() {
  const { user } = useAuth();
  const { canViewAllFinancial, permissionsLoading } = useGlobalAccess();

  const { data: financeiro = [], isLoading, refetch } = useQuery<FinanceiroItem[]>({
    queryKey: ["financeiro", user?.id, canViewAllFinancial],
    queryFn: async () => {
      let query = supabase
        .from("financeiro")
        .select("*")
        .order("vencimento", { ascending: true });

      if (!canViewAllFinancial && user?.id) {
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

  return { financeiro, isLoading, refetch };
}

export function useClientesData() {
  const { user } = useAuth();
  const { canViewAllClients, permissionsLoading } = useGlobalAccess();

  const { data: clientes = [], isLoading } = useQuery<{ nome: string }[]>({
    queryKey: ["clientes-names", user?.id, canViewAllClients],
    queryFn: async () => {
      let query = supabase
        .from("clientes")
        .select("nome")
        .order("nome");

      if (!canViewAllClients && user?.id) {
        query = query.eq("user_id", user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !permissionsLoading,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
  });

  return { clientes, isLoading };
}
