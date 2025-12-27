import tpuPrazos from '../data/tpu-prazos.json';
import type { DatajudMovement, Prazo, PrazoAlert, TpuMapping } from '../types/datajud';
import {
    calcularDataFinal,
    diasAteVencimento,
    determinarUrgencia,
    deveAlertar,
    formatDateToString
} from './prazo-calculator';

const tpuMapping = tpuPrazos as TpuMapping;

/**
 * Detecta novos movimentos que ainda não foram processados
 * E gerencia prazos existentes (deleta cumpridos, mantém ativos)
 */
export async function detectarNovosMovimentos(
    processoId: string,
    movimentos: DatajudMovement[]
): Promise<DatajudMovement[]> {
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Buscar prazos já existentes para este processo (incluir cumprido_em e status)
    const response = await fetch(
        `${SUPABASE_URL}/rest/v1/prazos?processo_id=eq.${processoId}&select=id,movimento_codigo,movimento_data,cumprido_em,status`,
        {
            headers: {
                'apikey': SUPABASE_SERVICE_KEY!,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
            }
        }
    );

    if (!response.ok) {
        console.error('[Prazos] Erro ao buscar prazos existentes');
        return movimentos; // Em caso de erro, processar todos
    }

    const prazosExistentes = await response.json();

    // Deletar prazos CUMPRIDOS que não têm mais movimento correspondente
    const movimentoCodigos = new Set(movimentos.map(m => m.codigo));
    const movimentoDatas = new Set(movimentos.map(m => new Date(m.dataHora).getTime()));

    for (const prazo of prazosExistentes) {
        if (prazo.cumprido_em !== null || prazo.status === 'CUMPRIDO') {
            // Deletar prazo cumprido (cumprido_em preenchido OU status CUMPRIDO)
            try {
                await fetch(`${SUPABASE_URL}/rest/v1/prazos?id=eq.${prazo.id}`, {
                    method: 'DELETE',
                    headers: {
                        'apikey': SUPABASE_SERVICE_KEY!,
                        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
                    }
                });
                console.log(`[Prazos] Deletado prazo cumprido: ${prazo.id}`);
            } catch (error) {
                console.error('[Prazos] Erro ao deletar prazo cumprido:', error);
            }
        }
    }

    // Filtrar movimentos novos (que NÃO têm prazo ATIVO)
    return movimentos.filter(mov => {
        const jaTemPrazoAtivo = prazosExistentes.some((p: any) =>
            (p.cumprido_em === null && p.status !== 'CUMPRIDO') &&  // Prazo não cumprido
            p.movimento_codigo === mov.codigo &&
            new Date(p.movimento_data).getTime() === new Date(mov.dataHora).getTime()
        );
        return !jaTemPrazoAtivo;
    });
}

/**
 * Calcula e cria praz os para movimentos que os geram
 */
export async function calcularPrazos(
    processoId: string,
    userId: string,
    clienteNome: string,
    numeroProcesso: string,
    movimentos: DatajudMovement[]
): Promise<{ prazos: number; alertas: PrazoAlert[] }> {
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    let prazosCreated = 0;
    const alertas: PrazoAlert[] = [];

    for (const movimento of movimentos) {
        const codigoStr = String(movimento.codigo);
        const config = tpuMapping.movimentos_com_prazo[codigoStr];

        if (!config) {
            // Movimento não abre prazo
            continue;
        }

        const dataMovimento = new Date(movimento.dataHora);
        const dataInicio = new Date(dataMovimento);
        dataInicio.setHours(0, 0, 0, 0); // Normalizar para meia-noite

        const dataFinal = calcularDataFinal(
            dataInicio,
            config.dias_padrao,
            config.dias_corridos
        );

        // Criar registro de prazo
        const prazoData = {
            user_id: userId,
            processo_id: processoId,
            movimento_codigo: movimento.codigo,
            movimento_descricao: movimento.descricao || config.descricao,
            movimento_data: movimento.dataHora,
            tipo_prazo: config.tipo_prazo,
            dias_prazo: config.dias_padrao,
            data_inicio: formatDateToString(dataInicio),
            data_final: formatDateToString(dataFinal),
            dias_corridos: config.dias_corridos,
            status: 'ATIVO',
            observacoes: config.observacao
        };

        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/prazos`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_SERVICE_KEY!,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(prazoData)
            });

            if (response.ok) {
                prazosCreated++;

                // Verificar se deve criar alerta
                const diasRestantes = diasAteVencimento(dataFinal);

                if (deveAlertar(diasRestantes, config.alerta_dias)) {
                    alertas.push({
                        processo_id: processoId,
                        numero_processo: numeroProcesso,
                        user_id: userId,
                        cliente_nome: clienteNome,
                        tipo_prazo: config.tipo_prazo,
                        data_final: formatDateToString(dataFinal),
                        dias_restantes: diasRestantes,
                        urgencia: determinarUrgencia(diasRestantes)
                    });
                }
            }
        } catch (error: any) {
            console.error(`[Prazos] Erro ao criar prazo: ${error.message}`);
        }
    }

    return { prazos: prazosCreated, alertas };
}

/**
 * Cria notificações para alertas de prazo
 */
export async function criarAlertasPrazo(alertas: PrazoAlert[]): Promise<number> {
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    let alertasCreated = 0;

    for (const alerta of alertas) {
        const urgenciaIcon = alerta.urgencia === 'CRITICA' ? '🔴' :
            alerta.urgencia === 'ALTA' ? '🟠' : '🟡';

        const diasText = alerta.dias_restantes === 0 ? 'hoje' :
            alerta.dias_restantes === 1 ? 'amanhã' :
                `em ${alerta.dias_restantes} dias`;

        const titulo = `${urgenciaIcon} Prazo ${alerta.tipo_prazo.toLowerCase()} vence ${diasText}`;

        const mensagem = `Processo ${alerta.numero_processo}\n` +
            `Cliente: ${alerta.cliente_nome}\n` +
            `Tipo: ${alerta.tipo_prazo}\n` +
            `Vencimento: ${alerta.data_final}\n\n` +
            tpuMapping.metadata.disclaimer;

        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/notificacoes`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_SERVICE_KEY!,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    user_id: alerta.user_id,
                    tipo: 'PRAZO_PROXIMO',
                    titulo,
                    mensagem,
                    cliente_nome: alerta.cliente_nome,
                    lida: false,
                    created_at: new Date().toISOString()
                })
            });

            if (response.ok) {
                alertasCreated++;
            }
        } catch (error: any) {
            console.error(`[Prazos] Erro ao criar alerta: ${error.message}`);
        }

        // Pequeno delay entre notificações
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    return alertasCreated;
}

/**
 * Marca prazos vencidos automaticamente
 */
export async function marcarPrazosVencidos(): Promise<number> {
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const hojeStr = formatDateToString(hoje);

    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/prazos?status=eq.ATIVO&data_final=lt.${hojeStr}`,
            {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_SERVICE_KEY!,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    status: 'VENCIDO',
                    updated_at: new Date().toISOString()
                })
            }
        );

        if (response.ok) {
            const updated = await response.json();
            return updated.length;
        }
    } catch (error: any) {
        console.error(`[Prazos] Erro ao marcar vencidos: ${error.message}`);
    }

    return 0;
}
