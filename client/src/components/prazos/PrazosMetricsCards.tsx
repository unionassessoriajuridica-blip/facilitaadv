import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Clock, CheckCircle, TrendingUp } from 'lucide-react';

interface PrazosMetricsCardsProps {
    total: number;
    urgentes: number;
    vencidos: number;
    taxaCumprimento: number;
}

export function PrazosMetricsCards({ total, urgentes, vencidos, taxaCumprimento }: PrazosMetricsCardsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total de Prazos */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total de Prazos</p>
                            <h3 className="text-3xl font-bold mt-2">{total}</h3>
                        </div>
                        <Clock className="h-10 w-10 text-blue-500 opacity-80" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Prazos ativos no sistema</p>
                </CardContent>
            </Card>

            {/* Prazos Urgentes */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Urgentes</p>
                            <h3 className="text-3xl font-bold mt-2 text-red-600">{urgentes}</h3>
                        </div>
                        <AlertCircle className="h-10 w-10 text-red-500 opacity-80" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Vencem em até 3 dias</p>
                </CardContent>
            </Card>

            {/* Prazos Vencidos */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Vencidos</p>
                            <h3 className="text-3xl font-bold mt-2 text-orange-600">{vencidos}</h3>
                        </div>
                        <AlertCircle className="h-10 w-10 text-orange-500 opacity-80" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Prazo já expirado</p>
                </CardContent>
            </Card>

            {/* Taxa de Cumprimento */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Taxa de Cumprimento</p>
                            <h3 className="text-3xl font-bold mt-2 text-green-600">{taxaCumprimento}%</h3>
                        </div>
                        {taxaCumprimento >= 80 ? (
                            <CheckCircle className="h-10 w-10 text-green-500 opacity-80" />
                        ) : (
                            <TrendingUp className="h-10 w-10 text-yellow-500 opacity-80" />
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Últimos 30 dias</p>
                </CardContent>
            </Card>
        </div>
    );
}
