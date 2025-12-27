import cron from "node-cron";
import { calcularPrazos } from '../utils/prazo-manager';

const TRIBUNAIS: Record<string, string> = {
    "8.06": "api_publica_tjce",
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
    "8.07": "api_publica_tjce",
    "8.20": "api_publica_tjrr",
    "8.23": "api_publica_tjap",
    "8.10": "api_publica_tjgo",
    "8.28": "api_publica_tjma",
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
    "5.24": "api_publica_trt24",
};

function extractTribunalCode(processNumber: string): string | null {
    const cleanNumber = processNumber.replace(/\D/g, "");
    if (cleanNumber.length >= 20) {
        const segmento = cleanNumber.substring(13, 14);
        const tribunal = cleanNumber.substring(14, 16);
        return `${segmento}.${tribunal}`;
    }
    return null;
}

function getTribunalEndpoint(tribunalCode: string): string | null {
    return TRIBUNAIS[tribunalCode] || null;
}

async function lookupDatajud(processNumber: string): Promise<any> {
    const tribunalCode = extractTribunalCode(processNumber);
    if (!tribunalCode) {
        return { success: false, error: "Não foi possível extrair o código do tribunal" };
    }

    const endpoint = getTribunalEndpoint(tribunalCode);
    if (!endpoint) {
        return { success: false, error: `Tribunal não suportado: ${tribunalCode}` };
    }

    const cleanNumber = processNumber.replace(/\D/g, "");
    const url = `https://api-publica.datajud.cnj.jus.br/${endpoint}/_search`;
    const apiKey = process.env.DATAJUD_API_KEY;

    if (!apiKey) {
        return { success: false, error: "DATAJUD_API_KEY não configurada" };
    }

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `APIKey ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                query: {
                    match: {
                        numeroProcesso: cleanNumber,
                    },
                },
            }),
        });

        if (!response.ok) {
            return { success: false, error: `Erro na API DataJud: ${response.status}` };
        }

        const data = await response.json();
        const hits = data.hits?.hits || [];

        if (hits.length === 0) {
            return { success: true, sigilo: true };
        }

        const source = hits[0]._source;
        return {
            success: true,
            sigilo: false,
            tribunal: source.tribunal,
            classe: source.classe?.nome,
            classeCodigo: source.classe?.codigo,
            sistema: source.sistema?.nome,
            formato: source.formato?.nome,
            grau: source.grau,
            dataAjuizamento: source.dataAjuizamento,
            dataHoraUltimaAtualizacao: source.dataHoraUltimaAtualizacao,
            movimentos: source.movimentos || [],
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

async function runDatajudCron() {
    console.log("[DataJud Cron] Iniciando atualização automática...");

    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        console.error("[DataJud Cron] ERRO: Variáveis de ambiente não configuradas");
        return;
    }

    try {
        // Buscar processos para atualizar (os mais antigos primeiro)
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/processos?select=id,numero_processo&numero_processo=not.is.null&numero_processo=neq.&order=datajud_atualizado_em.asc.nullsfirst&limit=50`,
            {
                headers: {
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
                },
            }
        );

        if (!response.ok) {
            console.error("[DataJud Cron] Erro ao buscar processos:", response.status);
            return;
        }

        const processos = await response.json();
        console.log(`[DataJud Cron] Encontrados ${processos.length} processos para atualizar`);

        const results = {
            total: processos.length,
            success: 0,
            sigilo: 0,
            errors: 0,
        };

        for (let i = 0; i < processos.length; i++) {
            const processo = processos[i];

            try {
                console.log(`[DataJud Cron] [${i + 1}/${processos.length}] Processando: ${processo.numero_processo}`);

                const result = await lookupDatajud(processo.numero_processo);

                if (result.sigilo) {
                    await fetch(`${SUPABASE_URL}/rest/v1/processos?id=eq.${processo.id}`, {
                        method: "PATCH",
                        headers: {
                            "apikey": SUPABASE_SERVICE_KEY,
                            "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
                            "Content-Type": "application/json",
                            "Prefer": "return=minimal",
                        },
                        body: JSON.stringify({
                            datajud_sigilo: true,
                            datajud_atualizado_em: new Date().toISOString(),
                        }),
                    });
                    results.sigilo++;
                } else if (result.success) {
                    const updateData: any = {
                        datajud_sigilo: false,
                        datajud_tribunal: result.tribunal,
                        datajud_classe: result.classe,
                        datajud_classe_codigo: result.classeCodigo,
                        datajud_sistema: result.sistema,
                        datajud_formato: result.formato,
                        datajud_grau: result.grau,
                        datajud_data_ajuizamento: result.dataAjuizamento,
                        datajud_ultima_atualizacao_cnj: result.dataHoraUltimaAtualizacao,
                        datajud_atualizado_em: new Date().toISOString(),
                    };

                    if (result.movimentos && result.movimentos.length > 0) {
                        updateData.datajud_movimentos = JSON.stringify(result.movimentos);
                        updateData.datajud_ultima_movimentacao = result.movimentos[0]?.dataHora;
                    }

                    await fetch(`${SUPABASE_URL}/rest/v1/processos?id=eq.${processo.id}`, {
                        method: "PATCH",
                        headers: {
                            "apikey": SUPABASE_SERVICE_KEY,
                            "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
                            "Content-Type": "application/json",
                            "Prefer": "return=minimal",
                        },
                        body: JSON.stringify(updateData),
                    });
                    results.success++;
                } else {
                    console.error(`[DataJud Cron] [${i + 1}] ERRO: ${result.error}`);
                    results.errors++;
                }

                // Aguardar 200ms entre requisições para não sobrecarregar a API
                await new Promise((resolve) => setTimeout(resolve, 200));
            } catch (error: any) {
                console.error(`[DataJud Cron] [${i + 1}] ERRO: ${error.message}`);
                results.errors++;
            }
        }

        console.log(
            `[DataJud Cron] Concluído: ${results.success} atualizados, ${results.sigilo} sigilosos, ${results.errors} erros`
        );
    } catch (error: any) {
        console.error("[DataJud Cron] Erro geral:", error.message);
    }
}

// ============================================
// NOVA FUNÇÃO BATCH COM PAGINAÇÃO
// ============================================

import { groupProcessesByTribunal, getRecentMovements } from '../utils/datajud-pagination';
import { detectRecentMovement, batchCreateAlerts } from '../utils/datajud-alerts';
import { fetchDatajudPage } from './datajud-batch';
import { detectarNovosMovimentos, calcularPrazos, criarAlertasPrazo, marcarPrazosVencidos } from '../utils/prazo-manager';
import type { BatchMetrics, ProcessAlert, PrazoAlert } from '../types/datajud';

async function runDatajudBatchCronInternal() {
    console.log('[DataJud Batch] 🚀 Iniciando atualização em lote...');

    const metrics: BatchMetrics = {
        startTime: Date.now(),
        endTime: 0,
        tribunalsProcessed: 0,
        totalPages: 0,
        processesFound: 0,
        processesUpdated: 0,
        processesWithRecentMovements: 0,
        alertsCreated: 0,
        prazosCreated: 0,
        errors: 0
    };

    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        console.error('[DataJud Batch] ❌ Variáveis de ambiente não configuradas');
        return;
    }

    try {
        // Marcar prazos vencidos primeiro
        const prazosVencidos = await marcarPrazosVencidos();
        if (prazosVencidos > 0) {
            console.log(`[DataJud Batch] ⏰ Marcados ${prazosVencidos} prazos como vencidos`);
        }

        // 1. Buscar TODOS os processos do banco
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/processos?select=id,numero_processo,user_id,clientes(nome)&numero_processo=not.is.null&numero_processo=neq.`,
            {
                headers: {
                    'apikey': SUPABASE_SERVICE_KEY,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Erro ao buscar processos: ${response.status}`);
        }

        const allProcesses = await response.json();
        console.log(`[DataJud Batch] 📊 Total de processos no banco: ${allProcesses.length}`);

        // 2. Agrupar por tribunal
        const grouped = groupProcessesByTribunal(allProcesses);
        console.log(`[DataJud Batch] 📑 Tribunais únicos: ${grouped.size}`);

        const pendingAlerts: ProcessAlert[] = [];
        const pendingPrazoAlerts: PrazoAlert[] = [];

        // 3. Para cada tribunal, fazer paginação
        for (const [tribunalCode, group] of grouped) {
            metrics.tribunalsProcessed++;
            console.log(`[DataJud Batch] 🏛️  Processando tribunal ${tribunalCode} - ${group.processNumbers.length} processos`);

            let searchAfter: number[] | null = null;
            let hasMore = true;
            let pageNum = 0;

            while (hasMore && pageNum < 10) { // Limite de 10 páginas por tribunal
                pageNum++;
                metrics.totalPages++;

                try {
                    const result = await fetchDatajudPage(
                        group.endpoint,
                        group.processNumbers,
                        searchAfter || undefined
                    );

                    metrics.processesFound += result.processes.length;

                    // 4. Processar cada processo retornado
                    for (const processData of result.processes) {
                        const cleanNumber = processData.numeroProcesso;
                        const metadata = group.processMap.get(cleanNumber);

                        if (!metadata) continue;

                        // Pegar apenas 30 últimos movimentos
                        const recentMovements = getRecentMovements(processData, 30);

                        // Detectar movimentação recente (últimos 5 dias)
                        const alert = detectRecentMovement(
                            metadata.id,
                            processData.numeroProcesso,
                            metadata.userId,
                            metadata.clientName,
                            recentMovements,
                            5
                        );

                        if (alert) {
                            pendingAlerts.push(alert);
                            metrics.processesWithRecentMovements++;
                        }

                        // Detectar novos movimentos que abrem prazo
                        const novosMovimentos = await detectarNovosMovimentos(
                            metadata.id,
                            recentMovements
                        );

                        if (novosMovimentos.length > 0) {
                            const { prazos, alertas } = await calcularPrazos(
                                metadata.id,
                                metadata.userId,
                                metadata.clientName,
                                processData.numeroProcesso,
                                novosMovimentos
                            );

                            metrics.prazosCreated += prazos;
                            pendingPrazoAlerts.push(...alertas);
                        }

                        // Atualizar processo no banco
                        const updateData: any = {
                            datajud_sigilo: false,
                            datajud_tribunal: processData.tribunal,
                            datajud_classe: processData.classe?.nome,
                            datajud_classe_codigo: processData.classe?.codigo,
                            datajud_sistema: processData.sistema?.nome,
                            datajud_formato: processData.formato?.nome,
                            datajud_grau: processData.grau,
                            datajud_data_ajuizamento: processData.dataAjuizamento,
                            datajud_ultima_atualizacao_cnj: processData.dataHoraUltimaAtualizacao,
                            datajud_atualizado_em: new Date().toISOString()
                        };

                        if (recentMovements.length > 0) {
                            updateData.datajud_movimentos = JSON.stringify(recentMovements);
                            updateData.datajud_ultima_movimentacao = recentMovements[0].dataHora;
                        }

                        await fetch(`${SUPABASE_URL}/rest/v1/processos?id=eq.${metadata.id}`, {
                            method: 'PATCH',
                            headers: {
                                'apikey': SUPABASE_SERVICE_KEY,
                                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                                'Content-Type': 'application/json',
                                'Prefer': 'return=minimal'
                            },
                            body: JSON.stringify(updateData)
                        });

                        metrics.processesUpdated++;
                    }

                    searchAfter = result.searchAfter;
                    hasMore = result.hasMore;

                } catch (error: any) {
                    console.error(`[DataJud Batch] ❌ Erro na página ${pageNum}: ${error.message}`);
                    metrics.errors++;
                    break;
                }

                // Delay entre páginas
                if (hasMore) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            // Delay entre tribunais
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // 5. Criar alertas de movimentação em lote
        if (pendingAlerts.length > 0) {
            console.log(`[DataJud Batch] 🔔 Criando ${pendingAlerts.length} alertas de movimentação...`);
            const created = await batchCreateAlerts(pendingAlerts);
            metrics.alertsCreated += created;
        }

        // 6. Criar alertas de prazo em lote
        if (pendingPrazoAlerts.length > 0) {
            console.log(`[DataJud Batch] ⏰ Criando ${pendingPrazoAlerts.length} alertas de prazo...`);
            const created = await criarAlertasPrazo(pendingPrazoAlerts);
            metrics.alertsCreated += created;
        }

        metrics.endTime = Date.now();

        // 7. Resumo final
        const duration = ((metrics.endTime - metrics.startTime) / 1000).toFixed(2);
        console.log('');
        console.log('═══════════════════════════════════════════════');
        console.log('  📊 RESUMO DA ATUALIZAÇÃO DATAJUD');
        console.log('═══════════════════════════════════════════════');
        console.log(`  ⏱️  Duração: ${duration}s`);
        console.log(`  🏛️  Tribunais processados: ${metrics.tribunalsProcessed}`);
        console.log(`  📄 Páginas consultadas: ${metrics.totalPages}`);
        console.log(`  🔍 Processos encontrados: ${metrics.processesFound}`);
        console.log(`  ✅ Processos atualizados: ${metrics.processesUpdated}`);
        console.log(`  🆕 Com movimentação recente: ${metrics.processesWithRecentMovements}`);
        console.log(`  ⚖️  Prazos criados: ${metrics.prazosCreated}`);
        console.log(`  🔔 Alertas criados: ${metrics.alertsCreated}`);
        console.log(`  ❌ Erros: ${metrics.errors}`);
        console.log('═══════════════════════════════════════════════');
        console.log('');

        // Retornar métricas para endpoint
        return {
            success: true,
            prazosCreated: metrics.prazosCreated,
            processesUpdated: metrics.processesUpdated,
            duration: duration
        };

    } catch (error: any) {
        console.error('[DataJud Batch] ❌ Erro geral:', error.message);
        throw error; // Re throw para endpoint capturar
    }
}

/**
 * Busca última sincronização bem-sucedida
 */
async function getUltimoSync(): Promise<Date | null> {
    const supabaseUrl = process.env.VITE_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    try {
        const response = await fetch(
            `${supabaseUrl}/rest/v1/datajud_sync_log?select=ultimo_sync&status=eq.success&order=created_at.desc&limit=1`,
            {
                headers: {
                    "apikey": supabaseServiceKey,
                    "Authorization": `Bearer ${supabaseServiceKey}`,
                },
            }
        );

        if (!response.ok) {
            console.error('[DataJud Checkpoint] Erro ao buscar último sync:', response.status);
            return null;
        }

        const data = await response.json();
        if (data && data.length > 0 && data[0].ultimo_sync) {
            const timestamp = new Date(data[0].ultimo_sync);
            console.log('[DataJud Checkpoint] Última sincronização:', timestamp.toISOString());
            return timestamp;
        }

        console.log('[DataJud Checkpoint] Primeira execução - sem checkpoint anterior');
        return null;
    } catch (error) {
        console.error('[DataJud Checkpoint] Erro ao buscar checkpoint:', error);
        return null;
    }
}

/**
 * Registra checkpoint de sincronização
 */
async function registrarSync(stats: {
    processos: number;
    novos: number;
    atualizados: number;
    status: 'success' | 'error' | 'partial';
    errorMessage?: string;
}) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const logEntry = {
        ultimo_sync: new Date().toISOString(),
        processos_consultados: stats.processos,
        prazos_novos: stats.novos,
        prazos_atualizados: stats.atualizados,
        status: stats.status,
        error_message: stats.errorMessage || null
    };

    try {
        const response = await fetch(
            `${supabaseUrl}/rest/v1/datajud_sync_log`,
            {
                method: 'POST',
                headers: {
                    "apikey": supabaseServiceKey,
                    "Authorization": `Bearer ${supabaseServiceKey}`,
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal"
                },
                body: JSON.stringify(logEntry)
            }
        );

        if (!response.ok) {
            console.error('[DataJud Checkpoint] Erro ao registrar sync:', response.status);
        } else {
            console.log('[DataJud Checkpoint] Checkpoint registrado com sucesso');
        }
    } catch (error) {
        console.error('[DataJud Checkpoint] Erro ao registrar checkpoint:', error);
    }
}

export async function runDatajudBatchCron() {
    console.log("[DataJud Batch] ⏰ Iniciando execução do cron");

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error("[DataJud Batch] ⚠️  VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados");
        return;
    }

    // Buscar último checkpoint
    const ultimoSync = await getUltimoSync();
    const stats = {
        processos: 0,
        novos: 0,
        atualizados: 0,
        status: 'success' as const,
        errorMessage: undefined as string | undefined
    };

    try {
        // 1. Buscar todos os processos ATIVOS
        const processosResponse = await fetch(
            `${supabaseUrl}/rest/v1/processos?status=eq.ATIVO&select=id,numero_processo`,
            {
                headers: {
                    apikey: supabaseServiceKey,
                    Authorization: `Bearer ${supabaseServiceKey}`,
                },
            }
        );

        if (!processosResponse.ok) {
            throw new Error(`Erro ao buscar processos: ${processosResponse.status}`);
        }

        const processos: Array<{ id: string; numero_processo: string }> = await processosResponse.json();
        console.log(`[DataJud Batch] 📋 ${processos.length} processos ativos encontrados`);

        if (processos.length === 0) {
            console.log("[DataJud Batch] ℹ️  Nenhum processo ativo para consultar");
            await registrarSync(stats);
            return;
        }

        stats.processos = processos.length;

        // 2. Para cada processo, consultar DataJud e atualizar prazos
        for (const processo of processos) {
            console.log(`[DataJud Batch] 🔍 Consultando processo ${processo.numero_processo}`);

            // Lookup no DataJud
            const datajudResult = await lookupDatajud(processo.numero_processo);

            if (!datajudResult.success) {
                console.error(`[DataJud Batch] ❌ Erro ao consultar ${processo.numero_processo}:`, datajudResult.error);
                continue;
            }

            const movimentos = datajudResult.data?.movimentos || [];
            console.log(`[DataJud Batch] 📄 ${movimentos.length} movimentos encontrados`);

            // Filtrar apenas movimentos NOVOS (desde último checkpoint)
            let movimentosFiltrados = movimentos;
            if (ultimoSync) {
                movimentosFiltrados = movimentos.filter((mov: any) => {
                    const dataMovimento = new Date(mov.dataHora);
                    return dataMovimento > ultimoSync;
                });
                console.log(`[DataJud Batch] ⏰ ${movimentosFiltrados.length} movimentos novos desde ${ultimoSync.toISOString()}`);
            }

            if (movimentosFiltrados.length === 0) {
                console.log(`[DataJud Batch] ℹ️  Nenhum movimento novo para ${processo.numero_processo} `);
                continue;
            }

            // Calcular e criar prazos a partir dos movimentos novos
            try {
                const { prazos: prazosCount, alertas } = await calcularPrazos(
                    processo.id,
                    '', // user_id - será populado pela função via processo
                    '', // clienteNome - será populado via lookup
                    processo.numero_processo,
                    movimentosFiltrados
                );

                if (prazosCount > 0) {
                    console.log(`[DataJud Batch] ⚖️  ${prazosCount} prazos criados para ${processo.numero_processo} `);
                    stats.novos += prazosCount;
                }

                if (alertas.length > 0) {
                    console.log(`[DataJud Batch] 🔔 ${alertas.length} alertas criados`);
                    // TODO: Criar alertas no banco
                }
            } catch (error: any) {
                console.error(`[DataJud Batch] ❌ Erro ao calcular prazos para ${processo.numero_processo}: `, error.message);
            }
        }

        console.log(`[DataJud Batch] ✅ Sincronização concluída: `, stats);
        await registrarSync(stats);

        // Retornar métricas para endpoint
        return {
            success: true,
            prazosCreated: stats.novos,
            processesUpdated: stats.processos,
            duration: 0 // TODO: calcular duração real
        };

    } catch (error: any) {
        console.error("[DataJud Batch] ❌ Erro durante execução:", error);
        const errorStats = {
            ...stats,
            status: 'error' as const,
            errorMessage: error.message
        };
        await registrarSync(errorStats);

        // Retornar erro
        throw error;
    }
}

export function startDatajudCron() {
    // Executar a cada 12 horas
    cron.schedule("0 */12 * * *", () => {
        console.log("[DataJud Batch] ⏰ Cron agendado executando...");
        runDatajudBatchCron();
    });

    console.log("[DataJud Batch] ⏰ Cron agendado para executar a cada 12 horas");
    console.log("[DataJud Batch] ℹ️  Use o botão 'Verificar Novos Prazos' no Dashboard para executar manualmente");
}

// REMOVIDO: Execução automática no início (bloqueava o servidor por 2+ minutos)
// Os prazos podem ser verificados manualmente via botão no Dashboard
// ou aguardar a próxima execução agendada (a cada 12 horas)
