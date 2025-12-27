import type { DatajudProcess } from '../types/datajud';

interface PaginationResult {
    processes: DatajudProcess[];
    searchAfter: number[] | null;
    hasMore: boolean;
}

/**
 * Busca uma página de processos do DataJud com paginação
 */
export async function fetchDatajudPage(
    endpoint: string,
    processNumbers: string[],
    searchAfter?: number[]
): Promise<PaginationResult> {
    const apiKey = process.env.DATAJUD_API_KEY;
    if (!apiKey) {
        throw new Error('DATAJUD_API_KEY não configurada');
    }

    const url = `https://api-publica.datajud.cnj.jus.br/${endpoint}/_search`;

    // Dividir em chunks de 500 se houver muitos processos
    const chunk = processNumbers.slice(0, 500);

    const body: any = {
        size: 500,
        query: {
            terms: {
                numeroProcesso: chunk
            }
        },
        sort: [
            { "@timestamp": { "order": "desc" } }
        ],
        _source: {
            includes: [
                "numeroProcesso",
                "tribunal",
                "classe",
                "sistema",
                "formato",
                "grau",
                "dataAjuizamento",
                "dataHoraUltimaAtualizacao",
                "movimentos"
            ]
        }
    };

    if (searchAfter) {
        body.search_after = searchAfter;
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `APIKey ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`API retornou ${response.status}`);
        }

        const data = await response.json();
        const hits = data.hits?.hits || [];

        const processes: DatajudProcess[] = hits.map((hit: any) => hit._source);

        const lastHit = hits[hits.length - 1];
        const nextSearchAfter = lastHit ? lastHit.sort : null;
        const hasMore = hits.length === 500; // Se retornou size completo, pode ter mais

        return {
            processes,
            searchAfter: nextSearchAfter,
            hasMore
        };
    } catch (error: any) {
        throw new Error(`Erro ao buscar DataJud: ${error.message}`);
    }
}
