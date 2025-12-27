import feriados2025 from '../data/feriados-2025.json';

/**
 * Calcula a data final de um prazo considerando dias úteis e feriados
 */
export function calcularDataFinal(
    dataInicio: Date,
    diasPrazo: number,
    diasCorridos: boolean
): Date {
    if (diasCorridos) {
        // Prazo em dias corridos - simplesmente adicionar dias
        const dataFinal = new Date(dataInicio);
        dataFinal.setDate(dataFinal.getDate() + diasPrazo);
        return dataFinal;
    } else {
        // Prazo em dias úteis - pular fins de semana e feriados
        let dataAtual = new Date(dataInicio);
        let diasContados = 0;

        while (diasContados < diasPrazo) {
            dataAtual.setDate(dataAtual.getDate() + 1);

            // Pular fins de semana
            if (isWeekend(dataAtual)) {
                continue;
            }

            // Pular feriados nacionais
            if (isFeriadoNacional(dataAtual)) {
                continue;
            }

            diasContados++;
        }

        return dataAtual;
    }
}

/**
 * Verifica se uma data é fim de semana
 */
export function isWeekend(date: Date): boolean {
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // 0 = domingo, 6 = sábado
}

/**
 * Verifica se uma data é feriado nacional
 */
export function isFeriadoNacional(date: Date): boolean {
    const dateStr = formatDateToString(date);
    return feriados2025.feriados_nacionais.includes(dateStr);
}

/**
 * Calcula quantos dias faltam até uma data
 */
export function diasAteVencimento(dataFinal: Date): number {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); // Normalizar para meia-noite

    const dataFinalNormalized = new Date(dataFinal);
    dataFinalNormalized.setHours(0, 0, 0, 0);

    const diffMs = dataFinalNormalized.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    return diffDays;
}

/**
 * Determina o nível de urgência de um prazo
 */
export function determinarUrgencia(diasRestantes: number): 'CRITICA' | 'ALTA' | 'MEDIA' {
    if (diasRestantes <= 3) return 'CRITICA';
    if (diasRestantes <= 5) return 'ALTA';
    return 'MEDIA';
}

/**
 * Verifica se deve criar alerta para um prazo
 */
export function deveAlertar(diasRestantes: number, alertaDias: number[]): boolean {
    return alertaDias.includes(diasRestantes);
}

/**
 * Formata data para string YYYY-MM-DD
 */
export function formatDateToString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Formata data para exibição (DD/MM/YYYY)
 */
export function formatDateBR(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

/**
 * Calcula próxima data útil após uma data
 */
export function proximaDataUtil(date: Date): Date {
    let proximaData = new Date(date);
    proximaData.setDate(proximaData.getDate() + 1);

    while (isWeekend(proximaData) || isFeriadoNacional(proximaData)) {
        proximaData.setDate(proximaData.getDate() + 1);
    }

    return proximaData;
}

/**
 * Retorna texto descritivo dos dias restantes
 */
export function descricaoDiasRestantes(dias: number): string {
    if (dias < 0) return `Vencido há ${Math.abs(dias)} dia(s)`;
    if (dias === 0) return 'Vence hoje';
    if (dias === 1) return 'Vence amanhã';
    return `Vence em ${dias} dia(s)`;
}
