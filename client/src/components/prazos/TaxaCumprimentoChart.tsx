import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface TaxaCumprimentoChartProps {
    data: Array<{
        dia: string;
        taxa: number;
    }>;
}

export function TaxaCumprimentoChart({ data }: TaxaCumprimentoChartProps) {
    // Pegar apenas últimos 15 dias para não ficar muito poluído
    const dadosReduzidos = data.slice(-15);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Taxa de Cumprimento Diária (Últimos 15 Dias)</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={dadosReduzidos}>
                        <defs>
                            <linearGradient id="colorTaxa" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="dia"
                            tick={{ fontSize: 11 }}
                        />
                        <YAxis
                            domain={[0, 100]}
                            tick={{ fontSize: 12 }}
                            label={{ value: '%', position: 'insideLeft' }}
                        />
                        <Tooltip
                            formatter={(value: number) => [`${value}%`, 'Taxa de Cumprimento']}
                        />
                        <Area
                            type="monotone"
                            dataKey="taxa"
                            stroke="#10b981"
                            fillOpacity={1}
                            fill="url(#colorTaxa)"
                            name="Taxa %"
                        />
                    </AreaChart>
                </ResponsiveContainer>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                    Percentual de prazos cumpridos em relação ao total criado por dia
                </p>
            </CardContent>
        </Card>
    );
}
