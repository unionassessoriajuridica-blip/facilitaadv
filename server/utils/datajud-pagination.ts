import type { DatajudProcess, DatajudMovement } from '../types/datajud';

const TRIBUNAIS: Record<string, string> = {
    "8.26": "api_publica_tjsp",
    "8.19": "api_publica_tjrj",
    "8.13": "api_publica_tjmg",
    "8.21": "api_publica_tjrs",
    "8.16": "api_publica_tjpr",
    "8.24": "api_publica_tjsc",
    "8.05": "api_publica_tjba",
    "8.08": "api_publica_tjdf",
    "8.09": "api_publica_tjes",
    "8.03": "api_publica_tjms",
    "8.11": "api_publica_tjmt",
    "8.27": "api_publica_tjto",
    "8.12": "api_publica_tjrn",
    "8.15": "api_publica_tjpb",
    "8.17": "api_publica_tjpe",
    "8.02": "api_publica_tjal",
    "8.25": "api_publica_tjse",
    "8.22": "api_publica_tjro",
    "8.01": "api_publica_tjac",
    "8.04": "api_publica_tjam",
    "8.14": "api_publica_tjpa",
    "8.18": "api_publica_tjpi",
    "8.06": "api_publica_tjce",
    "8.20": "api_publica_tjrr",
    "8.23": "api_publica_tjap",
    "8.10": "api_publica_tjgo",
    "4.01": "api_publica_trf1",
    "4.02": "api_publica_trf2",
    "4.03": "api_publica_trf3",
    "4.04": "api_publica_trf4",
    "4.05": "api_publica_trf5",
    "4.06": "api_publica_trf6",
    "5.01": "api_publica_trt1",
    "5.02": "api_publica_trt2",
    "5.03": "api_publica_trt3",
    "5.04": "api_publica_trt4",
    "5.05": "api_publica_trt5",
    "5.06": "api_publica_trt6",
    "5.07": "api_publica_trt7",
    "5.08": "api_publica_trt8",
    "5.09": "api_publica_trt9",
    "5.10": "api_publica_trt10",
    "5.11": "api_publica_trt11",
    "5.12": "api_publica_trt12",
    "5.13": "api_publica_trt13",
    "5.14": "api_publica_trt14",
    "5.15": "api_publica_trt15",
    "5.16": "api_publica_trt16",
    "5.17": "api_publica_trt17",
    "5.18": "api_publica_trt18",
    "5.19": "api_publica_trt19",
    "5.20": "api_publica_trt20",
    "5.21": "api_publica_trt21",
    "5.22": "api_publica_trt22",
    "5.23": "api_publica_trt23",
    "5.24": "api_publica_trt24"
};

interface ProcessGroup {
    tribunalCode: string;
    endpoint: string;
    processNumbers: string[];
    processMap: Map<string, ProcessMetadata>;
}

interface ProcessMetadata {
    id: string;
    userId: string;
    clientName: string;
}

/**
 * Agrupa processos por tribunal para otimizar consultas
 */
export function groupProcessesByTribunal(
    processes: any[]
): Map<string, ProcessGroup> {
    const groups = new Map<string, ProcessGroup>();

    for (const process of processes) {
        const tribunalCode = extractTribunalCode(process.numero_processo);
        if (!tribunalCode) {
            console.warn(`[Pagination] Não foi possível extrair tribunal de: ${process.numero_processo}`);
            continue;
        }

        const endpoint = getTribunalEndpoint(tribunalCode);
        if (!endpoint) {
            console.warn(`[Pagination] Tribunal não mapeado: ${tribunalCode}`);
            continue;
        }

        const cleanNumber = process.numero_processo.replace(/\D/g, '');

        if (!groups.has(tribunalCode)) {
            groups.set(tribunalCode, {
                tribunalCode,
                endpoint,
                processNumbers: [],
                processMap: new Map()
            });
        }

        const group = groups.get(tribunalCode)!;
        group.processNumbers.push(cleanNumber);
        group.processMap.set(cleanNumber, {
            id: process.id,
            userId: process.user_id,
            clientName: process.clientes?.nome || 'Cliente não identificado'
        });
    }

    return groups;
}

/**
 * Extrai código do tribunal do número do processo CNJ
 */
export function extractTribunalCode(processNumber: string): string | null {
    const cleanNumber = processNumber.replace(/\D/g, '');
    if (cleanNumber.length >= 20) {
        const segmento = cleanNumber.substring(13, 14);
        const tribunal = cleanNumber.substring(14, 16);
        return `${segmento}.${tribunal}`;
    }
    return null;
}

/**
 * Retorna endpoint da API para um código de tribunal
 */
export function getTribunalEndpoint(tribunalCode: string): string | null {
    return TRIBUNAIS[tribunalCode] || null;
}

/**
 * Extrai os 30 últimos movimentos ordenados por data DESC
 */
export function getRecentMovements(
    processData: DatajudProcess,
    maxMovements = 30
): DatajudMovement[] {
    const movements = processData.movimentos || [];

    // Ordenar por dataHora DESC (mais recente primeiro)
    const sorted = movements.sort((a, b) => {
        return new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime();
    });

    return sorted.slice(0, maxMovements);
}

/**
 * Extrai valor de sort do hit para paginação
 */
export function extractSortValue(hit: any): number[] {
    return hit.sort || [];
}
