import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';

interface TopProcessosProps {
    processos: Array<{
        processo_id: string;
        numero_processo: string;
        cliente: string;
        data_final: string;
        dias_restantes: number;
    }>;
}

export function TopProcessos({ processos }: TopProcessosProps) {
    if (processos.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Top 5 Processos Mais Urgentes</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        Nenhum processo com prazos ativos
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Top 5 Processos Mais Urgentes</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {processos.map((processo, index) => {
                        const urgenciaColor =
                            processo.dias_restantes <= 1 ? 'text-red-600' :
                                processo.dias_restantes <= 3 ? 'text-orange-600' :
                                    processo.dias_restantes <= 7 ? 'text-yellow-600' :
                                        'text-blue-600';

                        const urgenciaText =
                            processo.dias_restantes === 0 ? 'HOJE' :
                                processo.dias_restantes === 1 ? 'AMANHÃ' :
                                    `${processo.dias_restantes} dias`;

                        return (
                            <div
                                key={processo.processo_id}
                                className="flex items-start justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                            >
                                <div className="flex items-start gap-3 flex-1">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex-shrink-0">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                            <p className="font-mono text-sm font-medium truncate">
                                                {processo.numero_processo}
                                            </p>
                                        </div>
                                        <p className="text-sm font-medium text-foreground mb-1">
                                            {processo.cliente}
                                        </p>
                                        <p className={`text-xs font-semibold ${urgenciaColor}`}>
                                            Vence em: {urgenciaText}
                                        </p>
                                    </div>
                                </div>
                                <Badge
                                    variant={index === 0 ? "destructive" : index <= 2 ? "default" : "secondary"}
                                    className="ml-2 flex-shrink-0"
                                >
                                    {urgenciaText}
                                </Badge>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
