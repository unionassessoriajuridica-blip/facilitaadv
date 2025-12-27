import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { addDays, startOfDay, format } from 'date-fns';

export interface PrazosStats {
    total: number;
    urgentes: number;
    vencidos: number;
    taxaCumprimento: number;
    distribuicao: {
        urgente: number;
        atencao: number;
        medio: number;
        longo: number;
    };
    prazosPorMes: Array<{
        mes: string;
        quantidade: number;
    }>;
    taxaDiaria: Array<{
        dia: string;
        taxa: number;
    }>;
    topProcessos: Array<{
        processo_id: string;
        numero_processo: string;
        cliente: string;
        data_final: string;
        dias_restantes: number;
    }>;
}

export function usePrazosStats(periodo: number = 30) {
    const [stats, setStats] = useState<PrazosStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchStats() {
            setLoading(true);
            setError(null);

            try {
                const hoje = startOfDay(new Date());
                const tresDias = addDays(hoje, 3);
                const seteDias = addDays(hoje, 7);
                const quinzeDias = addDays(hoje, 15);

                // Buscar todos os prazos ativos
                const { data: prazosAtivos, error: err1 } = await supabase
                    .from('prazos')
                    .select('*')
                    .is('cumprido_em', null);

                if (err1) throw err1;

                // Calcular métricas básicas
                const total = prazosAtivos?.length || 0;

                const urgentes = prazosAtivos?.filter(p =>
                    new Date(p.data_final) <= tresDias
                ).length || 0;

                const vencidos = prazosAtivos?.filter(p =>
                    new Date(p.data_final) < hoje
                ).length || 0;

                // Distribuição por urgência
                const distribuicao = {
                    urgente: prazosAtivos?.filter(p =>
                        new Date(p.data_final) <= tresDias
                    ).length || 0,
                    atencao: prazosAtivos?.filter(p => {
                        const data = new Date(p.data_final);
                        return data > tresDias && data <= seteDias;
                    }).length || 0,
                    medio: prazosAtivos?.filter(p => {
                        const data = new Date(p.data_final);
                        return data > seteDias && data <= quinzeDias;
                    }).length || 0,
                    longo: prazosAtivos?.filter(p =>
                        new Date(p.data_final) > quinzeDias
                    ).length || 0,
                };

                // Buscar todos os prazos (incluindo cumpridos) para taxa de cumprimento
                const dataInicio = addDays(hoje, -periodo);
                const { data: todosPrazos, error: err2 } = await supabase
                    .from('prazos')
                    .select('*')
                    .gte('created_at', dataInicio.toISOString());

                if (err2) throw err2;

                const totalPeriodo = todosPrazos?.length || 0;
                const cumpridos = todosPrazos?.filter(p => p.cumprido_em !== null).length || 0;
                const taxaCumprimento = totalPeriodo > 0 ? (cumpridos / totalPeriodo) * 100 : 0;

                // Prazos por mês (próximos 6 meses)
                const prazosPorMes: { [key: string]: number } = {};
                const mesesFuturos = 6;

                for (let i = 0; i < mesesFuturos; i++) {
                    const mes = addDays(hoje, i * 30);
                    const mesKey = format(mes, 'yyyy-MM');
                    prazosPorMes[mesKey] = 0;
                }

                prazosAtivos?.forEach(p => {
                    const dataFinal = new Date(p.data_final);
                    if (dataFinal >= hoje) {
                        const mesKey = format(dataFinal, 'yyyy-MM');
                        if (prazosPorMes[mesKey] !== undefined) {
                            prazosPorMes[mesKey]++;
                        }
                    }
                });

                const prazosPorMesArray = Object.entries(prazosPorMes)
                    .map(([mes, quantidade]) => ({ mes, quantidade }))
                    .sort((a, b) => a.mes.localeCompare(b.mes));

                // Taxa diária (últimos 30 dias)
                const taxaDiaria: Array<{ dia: string; taxa: number }> = [];

                for (let i = 29; i >= 0; i--) {
                    const dia = addDays(hoje, -i);
                    const diaKey = format(dia, 'yyyy-MM-dd');

                    const prazosNoDia = todosPrazos?.filter(p =>
                        format(new Date(p.created_at), 'yyyy-MM-dd') === diaKey
                    ) || [];

                    const totalDia = prazosNoDia.length;
                    const cumpridosDia = prazosNoDia.filter(p => p.cumprido_em !== null).length;
                    const taxa = totalDia > 0 ? (cumpridosDia / totalDia) * 100 : 0;

                    taxaDiaria.push({
                        dia: format(dia, 'dd/MM'),
                        taxa: Math.round(taxa)
                    });
                }

                // Top 5 processos mais urgentes (data_final mais próxima)
                const { data: topProcessosData, error: err3 } = await (supabase as any)
                    .from('prazos')
                    .select(`
                        processo_id,
                        data_final,
                        processos (
                            numero_processo,
                            clientes (nome)
                        )
                    `)
                    .is('cumprido_em', null)
                    .order('data_final', { ascending: true });

                if (err3) throw err3;

                const processosMap: { [key: string]: any } = {};

                topProcessosData?.forEach((p: any) => {
                    if (!processosMap[p.processo_id]) {
                        const dataFinal = new Date(p.data_final);
                        const diasRestantes = Math.ceil(
                            (dataFinal.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
                        );

                        processosMap[p.processo_id] = {
                            processo_id: p.processo_id,
                            numero_processo: p.processos?.numero_processo || 'N/A',
                            cliente: p.processos?.clientes?.nome || 'Sem cliente vinculado',
                            data_final: p.data_final,
                            dias_restantes: diasRestantes
                        };
                    }
                });

                const topProcessos = Object.values(processosMap)
                    .sort((a: any, b: any) => a.dias_restantes - b.dias_restantes)
                    .slice(0, 5);

                setStats({
                    total,
                    urgentes,
                    vencidos,
                    taxaCumprimento: Math.round(taxaCumprimento),
                    distribuicao,
                    prazosPorMes: prazosPorMesArray,
                    taxaDiaria,
                    topProcessos
                });

            } catch (err: any) {
                console.error('[usePrazosStats] Erro ao buscar estatísticas:', err);
                setError(err.message || 'Erro ao carregar estatísticas');
            } finally {
                setLoading(false);
            }
        }

        fetchStats();
    }, [periodo]);

    return { stats, loading, error };
}
