import { usePrazosStats } from '@/hooks/usePrazosStats';
import { PrazosMetricsCards } from '@/components/prazos/PrazosMetricsCards';
import { PrazosDistChart } from '@/components/prazos/PrazosDistChart';
import { PrazosByMonthChart } from '@/components/prazos/PrazosByMonthChart';
import { TaxaCumprimentoChart } from '@/components/prazos/TaxaCumprimentoChart';
import { TopProcessos } from '@/components/prazos/TopProcessos';
import { Loader2, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function PrazosDashboard() {
    const { stats, loading, error } = usePrazosStats(30);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground">Carregando estatísticas...</p>
                </div>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="p-6">
                <Alert variant="destructive">
                    <AlertDescription>
                        Erro ao carregar estatísticas: {error || 'Dados não disponíveis'}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold">Dashboard de Prazos</h1>
                </div>
                <p className="text-muted-foreground">
                    Análise completa dos prazos processuais - Últimos 30 dias
                </p>
            </div>

            {/* Metrics Cards */}
            <PrazosMetricsCards
                total={stats.total}
                urgentes={stats.urgentes}
                vencidos={stats.vencidos}
                taxaCumprimento={stats.taxaCumprimento}
            />

            {/* Charts Grid - Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <PrazosDistChart data={stats.distribuicao} />
                <PrazosByMonthChart data={stats.prazosPorMes} />
            </div>

            {/* Charts Grid - Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TaxaCumprimentoChart data={stats.taxaDiaria} />
                <TopProcessos processos={stats.topProcessos} />
            </div>
        </div>
    );
}
