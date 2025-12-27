export type TipoUrgencia = 'urgente' | 'atencao' | 'medio' | 'longo';
export type StatusPrazo = 'ativos' | 'vencidos' | 'cumpridos' | 'todos';

export interface FiltrosPrazos {
    cliente_id?: string;
    cliente_nome?: string; // Para exibição
    processo_id?: string;
    numero_processo?: string;
    urgencias?: TipoUrgencia[];
    data_final_de?: string;
    data_final_ate?: string;
    status?: StatusPrazo;
}

export interface FiltroAtivo {
    chave: keyof FiltrosPrazos;
    label: string;
    valor: string;
}
