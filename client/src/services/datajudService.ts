import { supabase } from "@/integrations/supabase/client";

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/datajud-lookup`;

export interface DatajudMovimento {
  codigo: number;
  nome: string;
  dataHora: string;
  complementosTabelados?: Array<{
    codigo: number;
    valor: number;
    nome: string;
    descricao: string;
  }>;
}

export interface DatajudResponse {
  success: boolean;
  sigilo?: boolean;
  tribunal?: string;
  classe?: string;
  sistema?: string;
  formato?: string;
  grau?: string;
  dataAjuizamento?: string;
  dataHoraUltimaAtualizacao?: string;
  movimentos?: DatajudMovimento[];
  error?: string;
  message?: string;
}

export interface ProcessoDatajud {
  datajud_tribunal?: string | null;
  datajud_classe?: string | null;
  datajud_classe_codigo?: number | null;
  datajud_sistema?: string | null;
  datajud_formato?: string | null;
  datajud_grau?: string | null;
  datajud_data_ajuizamento?: string | null;
  datajud_movimentos?: string | null;
  datajud_ultima_atualizacao_cnj?: string | null;
  datajud_ultima_movimentacao?: string | null;
  datajud_atualizado_em?: string | null;
}

class DatajudService {
  private static instance: DatajudService;

  private constructor() {}

  static getInstance(): DatajudService {
    if (!DatajudService.instance) {
      DatajudService.instance = new DatajudService();
    }
    return DatajudService.instance;
  }

  async lookupProcess(processNumber: string, processoId?: string): Promise<DatajudResponse> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      return { success: false, error: "Usuário não autenticado" };
    }

    try {
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ 
          action: "lookup", 
          processNumber,
          processoId 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || "Erro ao consultar DataJud" };
      }

      return data;
    } catch (error) {
      console.error("Erro ao consultar DataJud:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Erro desconhecido" 
      };
    }
  }

  parseMovimentos(movimentosJson: string | null): DatajudMovimento[] {
    if (!movimentosJson) return [];
    try {
      return JSON.parse(movimentosJson);
    } catch {
      return [];
    }
  }

  formatDataAjuizamento(dataAjuizamento: string | null): string {
    if (!dataAjuizamento) return "-";
    
    if (dataAjuizamento.length === 14) {
      const year = dataAjuizamento.substring(0, 4);
      const month = dataAjuizamento.substring(4, 6);
      const day = dataAjuizamento.substring(6, 8);
      return `${day}/${month}/${year}`;
    }
    
    try {
      const date = new Date(dataAjuizamento);
      return date.toLocaleDateString('pt-BR');
    } catch {
      return dataAjuizamento;
    }
  }

  formatDateTime(dateTime: string | null): string {
    if (!dateTime) return "-";
    try {
      const date = new Date(dateTime);
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateTime;
    }
  }
}

export const datajudService = DatajudService.getInstance();
