// Types para o sistema DataJud e Prazos
export interface DatajudProcess {
    numeroProcesso: string;
    tribunal: string;
    classe: {
        nome: string;
        codigo: number;
    };
    sistema: {
        nome: string;
    };
    formato: {
        nome: string;
    };
    grau: string;
    dataAjuizamento: string;
    dataHoraUltimaAtualizacao: string;
    movimentos: DatajudMovement[];
}

export interface DatajudMovement {
    codigo: number;
    descricao: string;
    dataHora: string;
    complemento?: string;
}

export interface ProcessAlert {
    processoId: string;
    numeroProcesso: string;
    userId: string;
    clienteNome: string;
    movementDate: string;
    movementDescription: string;
    daysAgo: number;
}

export interface BatchMetrics {
    startTime: number;
    endTime: number;
    tribunalsProcessed: number;
    totalPages: number;
    processesFound: number;
    processesUpdated: number;
    processesWithRecentMovements: number;
    alertsCreated: number;
    prazosCreated: number;
    errors: number;
}

export interface Prazo {
    id: string;
    user_id: string;
    processo_id: string;
    movimento_codigo: number;
    movimento_descricao: string;
    movimento_data: string;
    tipo_prazo: TipoPrazo;
    dias_prazo: number;
    data_inicio: string;
    data_final: string;
    dias_corridos: boolean;
    status: StatusPrazo;
    cumprido_em?: string;
    observacoes?: string;
    created_at: string;
    updated_at: string;
}

export type TipoPrazo =
    | 'INTIMACAO'
    | 'RESPOSTA'
    | 'RECURSO'
    | 'CIENCIA'
    | 'MANIFESTACAO'
    | 'CONTRARRAZOES'
    | 'IMPUGNACAO'
    | 'VERIFICACAO'
    | 'DESPACHO';

export type StatusPrazo =
    | 'ATIVO'
    | 'CUMPRIDO'
    | 'VENCIDO'
    | 'CANCELADO';

export interface PrazoConfig {
    descricao: string;
    tipo_prazo: TipoPrazo;
    dias_padrao: number;
    dias_corridos: boolean;
    alerta_dias: number[];
    observacao: string;
}

export interface PrazoAlert {
    processo_id: string;
    numero_processo: string;
    user_id: string;
    cliente_nome: string;
    tipo_prazo: TipoPrazo;
    data_final: string;
    dias_restantes: number;
    urgencia: 'CRITICA' | 'ALTA' | 'MEDIA';
}

export interface TpuMapping {
    movimentos_com_prazo: Record<string, PrazoConfig>;
    metadata: {
        ultima_atualizacao: string;
        fonte: string;
        observacoes: string[];
        disclaimer: string;
    };
}
