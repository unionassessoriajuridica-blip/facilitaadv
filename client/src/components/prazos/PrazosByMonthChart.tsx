import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface PrazosByMonthChartProps {
    data: Array<{
        mes: string;
        quantidade: number;
    }>;
}

export function PrazosByMonthChart({ data }: PrazosByMonthChartProps) {
    // Formatar mes para exibição (YYYY-MM -> MMM/YY)
    const formattedData = data.map(item => ({
        ...item,
        mesFormatado: formatMes(item.mes)
    }));

    if (data.length === 0 || data.every(d => d.quantidade === 0)) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Prazos por Mês (Próximos 6 Meses)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        Nenhum prazo futuro para exibir
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Prazos por Mês (Próximos 6 Meses)</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={formattedData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="mesFormatado"
                            tick={{ fontSize: 12 }}
                        />
                        <YAxis />
                        <Tooltip
                            formatter={(value: number) => [`${value} prazos`, 'Vencimentos']}
                        />
                        <Legend />
                        <Bar
                            dataKey="quantidade"
                            fill="#3b82f6"
                            name="Prazos Vencendo"
                            radius={[8, 8, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

function formatMes(mesISO: string): string {
    const [ano, mes] = mesISO.split('-');
    const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${mesesNomes[parseInt(mes) - 1]}/${ano.slice(-2)}`;
}
