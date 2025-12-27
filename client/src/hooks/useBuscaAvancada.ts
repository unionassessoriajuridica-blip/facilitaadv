import { useState, useCallback } from 'react';
import { FiltrosPrazos, FiltroAtivo, TipoUrgencia } from '@/types/filtros';

export function useBuscaAvancada() {
    const [filtros, setFiltros] = useState<FiltrosPrazos>({
        status: 'ativos' // Default
    });
    const [drawerOpen, setDrawerOpen] = useState(false);

    const updateFiltro = useCallback(<K extends keyof FiltrosPrazos>(
        chave: K,
        valor: FiltrosPrazos[K]
    ) => {
        setFiltros(prev => ({
            ...prev,
            [chave]: valor
        }));
    }, []);

    const toggleUrgencia = useCallback((urgencia: TipoUrgencia) => {
        setFiltros(prev => {
            const current = prev.urgencias || [];
            const isSelected = current.includes(urgencia);

            return {
                ...prev,
                urgencias: isSelected
                    ? current.filter(u => u !== urgencia)
                    : [...current, urgencia]
            };
        });
    }, []);

    const removerFiltro = useCallback((chave: keyof FiltrosPrazos) => {
        setFiltros(prev => {
            const newFiltros = { ...prev };
            delete newFiltros[chave];
            return newFiltros;
        });
    }, []);

    const limparFiltros = useCallback(() => {
        setFiltros({ status: 'ativos' });
    }, []);

    const getFiltrosAtivos = (): FiltroAtivo[] => {
        const ativos: FiltroAtivo[] = [];

        if (filtros.cliente_nome) {
            ativos.push({
                chave: 'cliente_id',
                label: 'Cliente',
                valor: filtros.cliente_nome
            });
        }

        if (filtros.numero_processo) {
            ativos.push({
                chave: 'numero_processo',
                label: 'Processo',
                valor: filtros.numero_processo
            });
        }

        if (filtros.urgencias && filtros.urgencias.length > 0) {
            const labels: Record<TipoUrgencia, string> = {
                urgente: 'Urgente',
                atencao: 'Atenção',
                medio: 'Médio',
                longo: 'Longo'
            };
            ativos.push({
                chave: 'urgencias',
                label: 'Urgência',
                valor: filtros.urgencias.map(u => labels[u]).join(', ')
            });
        }

        if (filtros.data_final_de && filtros.data_final_ate) {
            ativos.push({
                chave: 'data_final_de',
                label: 'Data Final',
                valor: `${filtros.data_final_de} a ${filtros.data_final_ate}`
            });
        }

        if (filtros.status && filtros.status !== 'ativos') {
            ativos.push({
                chave: 'status',
                label: 'Status',
                valor: filtros.status.charAt(0).toUpperCase() + filtros.status.slice(1)
            });
        }

        return ativos;
    };

    const temFiltrosAtivos = () => {
        return getFiltrosAtivos().length > 0;
    };

    return {
        filtros,
        setFiltros,
        updateFiltro,
        toggleUrgencia,
        removerFiltro,
        limparFiltros,
        getFiltrosAtivos,
        temFiltrosAtivos,
        drawerOpen,
        setDrawerOpen
    };
}
