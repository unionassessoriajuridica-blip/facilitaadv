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
  const { permissionsLoading } = useGlobalAccess();

  const { data: financeiro = [], isLoading, refetch } = useQuery<FinanceiroItem[]>({
    queryKey: ["financeiro", user?.id],
    queryFn: async () => {
      // Removendo filtro de user_id conforme solicitado para visibilidade global
      const { data, error } = await supabase
        .from("financeiro")
        .select("*")
        .order("vencimento", { ascending: true });

      if (error) throw error;

      // CORREÇÃO CRÍTICA AQUI:
      // O banco pode retornar 'valor' como string. Forçamos a conversão para Number.
      // Isso garante que cálculos e formatações funcionem corretamente na interface.
      const dataTratada = (data || []).map((item) => ({
        ...item,
        valor: Number(item.valor) || 0, // Converte string "100.00" para number 100.00
      }));

      return dataTratada;
    },
    enabled: !!user && !permissionsLoading,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });

  return { financeiro, isLoading, refetch };
}

export function useClientesData() {
  const { user } = useAuth();
  const { permissionsLoading } = useGlobalAccess();

  const { data: clientes = [], isLoading } = useQuery<{ nome: string }[]>({
    queryKey: ["clientes-names-global", user?.id],
    queryFn: async () => {
      // 1. Busca nomes na tabela de clientes
      const { data: clientesData, error: errorClientes } = await supabase
        .from("clientes")
        .select("nome");

      if (errorClientes) throw errorClientes;

      // 2. Busca nomes na tabela de responsáveis financeiros
      const { data: responsaveisData, error: errorResponsaveis } = await supabase
        .from("responsavel_financeiro")
        .select("nome");

      if (errorResponsaveis) throw errorResponsaveis;

      // Unifica as listas e remove duplicatas
      const todosNomes = new Set([
        ...(clientesData?.map(c => c.nome) || []),
        ...(responsaveisData?.map(r => r.nome) || [])
      ]);

      const listaOrdenada = Array.from(todosNomes)
        .sort((a, b) => a.localeCompare(b))
        .map(nome => ({ nome }));

      return listaOrdenada;
    },
    enabled: !!user && !permissionsLoading,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
  });

  return { clientes, isLoading };
}