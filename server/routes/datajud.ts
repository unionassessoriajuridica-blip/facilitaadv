import { Router, type Request, Response } from "express";

const router = Router();

const tribunalMap: Record<string, string> = {
    '1.00': 'api_publica_stf',
    '2.00': 'api_publica_cnj',
    '3.00': 'api_publica_stj',
    '9.00': 'api_publica_stm',
    '0.90': 'api_publica_tst',
    '0.00': 'api_publica_tse',
    '4.01': 'api_publica_trf1',
    '4.02': 'api_publica_trf2',
    '4.03': 'api_publica_trf3',
    '4.04': 'api_publica_trf4',
    '4.05': 'api_publica_trf5',
    '4.06': 'api_publica_trf6',
    '5.01': 'api_publica_trt1',
    '5.02': 'api_publica_trt2',
    '5.03': 'api_publica_trt3',
    '5.04': 'api_publica_trt4',
    '5.05': 'api_publica_trt5',
    '5.06': 'api_publica_trt6',
    '5.07': 'api_publica_trt7',
    '5.08': 'api_publica_trt8',
    '5.09': 'api_publica_trt9',
    '5.10': 'api_publica_trt10',
    '5.11': 'api_publica_trt11',
    '5.12': 'api_publica_trt12',
    '5.13': 'api_publica_trt13',
    '5.14': 'api_publica_trt14',
    '5.15': 'api_publica_trt15',
    '5.16': 'api_publica_trt16',
    '5.17': 'api_publica_trt17',
    '5.18': 'api_publica_trt18',
    '5.19': 'api_publica_trt19',
    '5.20': 'api_publica_trt20',
    '5.21': 'api_publica_trt21',
    '5.22': 'api_publica_trt22',
    '5.23': 'api_publica_trt23',
    '5.24': 'api_publica_trt24',
    '6.01': 'api_publica_tre-ac',
    '6.02': 'api_publica_tre-al',
    '6.03': 'api_publica_tre-ap',
    '6.04': 'api_publica_tre-am',
    '6.05': 'api_publica_tre-ba',
    '6.06': 'api_publica_tre-ce',
    '6.07': 'api_publica_tre-df',
    '6.08': 'api_publica_tre-es',
    '6.09': 'api_publica_tre-go',
    '6.10': 'api_publica_tre-ma',
    '6.11': 'api_publica_tre-mt',
    '6.12': 'api_publica_tre-ms',
    '6.13': 'api_publica_tre-mg',
    '6.14': 'api_publica_tre-pa',
    '6.15': 'api_publica_tre-pb',
    '6.16': 'api_publica_tre-pr',
    '6.17': 'api_publica_tre-pe',
    '6.18': 'api_publica_tre-pi',
    '6.19': 'api_publica_tre-rj',
    '6.20': 'api_publica_tre-rn',
    '6.21': 'api_publica_tre-rs',
    '6.22': 'api_publica_tre-ro',
    '6.23': 'api_publica_tre-rr',
    '6.24': 'api_publica_tre-sc',
    '6.25': 'api_publica_tre-sp',
    '6.26': 'api_publica_tre-se',
    '6.27': 'api_publica_tre-to',
    '8.01': 'api_publica_tjac',
    '8.02': 'api_publica_tjal',
    '8.03': 'api_publica_tjap',
    '8.04': 'api_publica_tjam',
    '8.05': 'api_publica_tjba',
    '8.06': 'api_publica_tjce',
    '8.07': 'api_publica_tjdft',
    '8.08': 'api_publica_tjes',
    '8.09': 'api_publica_tjgo',
    '8.10': 'api_publica_tjma',
    '8.11': 'api_publica_tjmt',
    '8.12': 'api_publica_tjms',
    '8.13': 'api_publica_tjmg',
    '8.14': 'api_publica_tjpa',
    '8.15': 'api_publica_tjpb',
    '8.16': 'api_publica_tjpr',
    '8.17': 'api_publica_tjpe',
    '8.18': 'api_publica_tjpi',
    '8.19': 'api_publica_tjrj',
    '8.20': 'api_publica_tjrn',
    '8.21': 'api_publica_tjrs',
    '8.22': 'api_publica_tjro',
    '8.23': 'api_publica_tjrr',
    '8.24': 'api_publica_tjsc',
    '8.25': 'api_publica_tjse',
    '8.26': 'api_publica_tjsp',
    '8.27': 'api_publica_tjto',
    '9.13': 'api_publica_tjmmg',
    '9.21': 'api_publica_tjmrs',
    '9.26': 'api_publica_tjmsp',
};

function extractTribunalCode(processNumber: string): string {
    const cleanNumber = processNumber.replace(/\D/g, '');
    if (cleanNumber.length >= 20) {
        const segmento = cleanNumber.substring(13, 14);
        const tribunal = cleanNumber.substring(14, 16);
        return `${segmento}.${tribunal}`;
    }
    return '';
}

// POST /api/datajud/lookup - Consultar processo no DataJud
router.post("/lookup", async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: "Authorization required" });
        }

        const { action, processNumber, processoId } = req.body;

        if (action !== 'lookup') {
            return res.status(400).json({ error: 'Ação inválida.' });
        }

        if (!processNumber) {
            return res.status(400).json({ error: 'Número do processo é obrigatório.' });
        }

        const tribunalCode = extractTribunalCode(processNumber);
        if (!tribunalCode) {
            return res.status(400).json({
                error: 'Não foi possível identificar o tribunal pelo número do processo.'
            });
        }

        const endpoint = tribunalMap[tribunalCode];
        if (!endpoint) {
            return res.status(400).json({
                error: `Tribunal não mapeado (Código CNJ: ${tribunalCode}). Verifique o número do processo.`
            });
        }

        const apiKey = process.env.DATAJUD_API_KEY;
        if (!apiKey) {
            return res.status(500).json({
                error: 'API Key do DataJud não configurada no servidor. Adicione DATAJUD_API_KEY no arquivo .env'
            });
        }

        const url = `https://api-publica.datajud.cnj.jus.br/${endpoint}/_search`;
        const cleanProcessNumber = processNumber.replace(/\D/g, '');

        console.log(`[DataJud] Consultando ${endpoint} para processo ${cleanProcessNumber}`);

        const datajudResponse = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `APIKey ${apiKey}`
            },
            body: JSON.stringify({
                query: {
                    term: {
                        numeroProcesso: cleanProcessNumber
                    }
                },
                _source: true
            })
        });

        if (!datajudResponse.ok) {
            const errText = await datajudResponse.text();
            console.error("[DataJud] Erro API:", datajudResponse.status, errText);
            return res.status(500).json({
                error: `Erro na API DataJud (${datajudResponse.status})`
            });
        }

        const data = await datajudResponse.json();
        const hits = data?.hits?.hits;

        // Processo sob sigilo ou não encontrado  
        if (!hits || hits.length === 0) {
            if (processoId) {
                const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
                const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

                await fetch(`${SUPABASE_URL}/rest/v1/processos?id=eq.${processoId}`, {
                    method: 'PATCH',
                    headers: {
                        "apikey": SUPABASE_SERVICE_KEY || "",
                        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
                        "Content-Type": "application/json",
                        "Prefer": "return=minimal"
                    },
                    body: JSON.stringify({
                        datajud_sigilo: true,
                        datajud_atualizado_em: new Date().toISOString()
                    })
                });
            }

            return res.json({
                sigilo: true,
                message: "Processo sob sigilo. Dados não disponíveis na base pública do DataJud."
            });
        }

        const processData = hits[0]._source;

        // Processar movimentos
        const movimentos = processData.movimentos || [];
        const sortedMovimentos = movimentos.sort((a: any, b: any) => {
            return new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime();
        });
        const ultimaMovimentacao = sortedMovimentos.length > 0
            ? sortedMovimentos[0].dataHora
            : null;

        // Atualizar processo no Supabase se processoId foi fornecido
        if (processoId) {
            const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
            const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

            await fetch(`${SUPABASE_URL}/rest/v1/processos?id=eq.${processoId}`, {
                method: 'PATCH',
                headers: {
                    "apikey": SUPABASE_SERVICE_KEY || "",
                    "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal"
                },
                body: JSON.stringify({
                    datajud_tribunal: processData.tribunal || null,
                    datajud_classe: processData.classe?.nome || null,
                    datajud_classe_codigo: processData.classe?.codigo || null,
                    datajud_sistema: processData.sistema?.nome || null,
                    datajud_formato: processData.formato?.nome || null,
                    datajud_grau: processData.grau || null,
                    datajud_data_ajuizamento: processData.dataAjuizamento || null,
                    datajud_movimentos: JSON.stringify(sortedMovimentos),
                    datajud_ultima_atualizacao_cnj: processData.dataHoraUltimaAtualizacao || null,
                    datajud_ultima_movimentacao: ultimaMovimentacao,
                    datajud_atualizado_em: new Date().toISOString(),
                })
            });
        }

        return res.json({
            success: true,
            tribunal: processData.tribunal,
            classe: processData.classe?.nome,
            sistema: processData.sistema?.nome,
            formato: processData.formato?.nome,
            grau: processData.grau,
            dataAjuizamento: processData.dataAjuizamento,
            dataHoraUltimaAtualizacao: processData.dataHoraUltimaAtualizacao,
            movimentos: (processData.movimentos || []).sort((a: any, b: any) =>
                new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime()
            ),
        });

    } catch (error: any) {
        console.error("[DataJud] Error:", error.message);
        return res.status(500).json({
            error: error.message || "Erro desconhecido ao consultar DataJud"
        });
    }
});

export default router;
