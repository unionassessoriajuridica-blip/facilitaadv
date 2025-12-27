import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = {
    urgente: '#ef4444',
    atencao: '#f59e0b',
    medio: '#3b82f6',
    longo: '#10b981',
};

interface PrazosDistChartProps {
    data: {
        urgente: number;
        atencao: number;
        medio: number;
        longo: number;
    };
}

export function PrazosDistChart({ data }: PrazosDistChartProps) {
    const chartData = [
        { name: '🚨 Urgente (≤3 dias)', value: data.urgente, color: COLORS.urgente },
        { name: '⚠️ Atenção (4-7 dias)', value: data.atencao, color: COLORS.atencao },
        { name: '📅 Médio (8-15 dias)', value: data.medio, color: COLORS.medio },
        { name: '🗓️ Longo (>15 dias)', value: data.longo, color: COLORS.longo },
    ].filter(item => item.value > 0); // Apenas categorias com valores

    const total = data.urgente + data.atencao + data.medio + data.longo;

    if (total === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Distribuição por Urgência</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        Nenhum prazo ativo para exibir
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Distribuição por Urgência</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value: number) => [`${value} prazos`, 'Quantidade']}
                        />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
