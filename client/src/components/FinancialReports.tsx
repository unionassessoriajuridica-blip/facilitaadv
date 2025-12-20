import { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/utils/currency";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { FinanceiroItem } from "@/hooks/useFinanceiroData";

interface FinancialReportsProps {
  financeiro: FinanceiroItem[];
}

export const FinancialReports = ({ financeiro }: FinancialReportsProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const isVencido = (vencimento: string | null, status: string | null) => {
    if (!vencimento || status === 'PAGO') return false;
    const hoje = new Date();
    const dataVencimento = new Date(vencimento);
    return dataVencimento < hoje;
  };

  const isAVencer = (vencimento: string | null, status: string | null) => {
    if (!vencimento || status === 'PAGO') return false;
    const hoje = new Date();
    const dataVencimento = new Date(vencimento);
    const diasParaVencer = Math.ceil((dataVencimento.getTime() - hoje.getTime()) / (1000 * 3600 * 24));
    return diasParaVencer <= 30 && diasParaVencer > 0;
  };

  const categorizeData = () => {
    const vencidas = financeiro.filter(item => isVencido(item.vencimento, item.status));
    const aVencer = financeiro.filter(item => isAVencer(item.vencimento, item.status));
    const emAberto = financeiro.filter(item => item.status === 'PENDENTE' && !isVencido(item.vencimento, item.status) && !isAVencer(item.vencimento, item.status));
    const pagas = financeiro.filter(item => item.status === 'PAGO');

    return { vencidas, aVencer, emAberto, pagas };
  };

  const generateChartData = () => {
    const monthlyData: { [key: string]: { mes: string; pendente: number; pago: number; vencido: number } } = {};

    financeiro.forEach(item => {
      if (!item.vencimento) return;
      const date = new Date(item.vencimento);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { mes: monthName, pendente: 0, pago: 0, vencido: 0 };
      }

      if (item.status === 'PAGO') {
        monthlyData[monthKey].pago += item.valor;
      } else if (isVencido(item.vencimento, item.status)) {
        monthlyData[monthKey].vencido += item.valor;
      } else {
        monthlyData[monthKey].pendente += item.valor;
      }
    });

    return Object.values(monthlyData).sort((a, b) => a.mes.localeCompare(b.mes));
  };

  const generatePDFReport = async (type: 'summary' | 'detailed') => {
    const { vencidas, aVencer, emAberto, pagas } = categorizeData();
    
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    
    // Header
    pdf.setFontSize(20);
    pdf.text('Relatório Financeiro', pageWidth / 2, 20, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, 30, { align: 'center' });

    let yPosition = 50;

    // Summary
    pdf.setFontSize(16);
    pdf.text('Resumo Financeiro', 20, yPosition);
    yPosition += 20;

    pdf.setFontSize(12);
    const summaryData = [
      { label: 'Parcelas Vencidas:', value: formatCurrency(vencidas.reduce((sum, item) => sum + item.valor, 0)), count: vencidas.length },
      { label: 'Parcelas a Vencer (30 dias):', value: formatCurrency(aVencer.reduce((sum, item) => sum + item.valor, 0)), count: aVencer.length },
      { label: 'Parcelas em Aberto:', value: formatCurrency(emAberto.reduce((sum, item) => sum + item.valor, 0)), count: emAberto.length },
      { label: 'Parcelas Pagas:', value: formatCurrency(pagas.reduce((sum, item) => sum + item.valor, 0)), count: pagas.length },
    ];

    summaryData.forEach(item => {
      pdf.text(`${item.label} ${item.value} (${item.count} parcelas)`, 20, yPosition);
      yPosition += 15;
    });

    if (type === 'detailed') {
      yPosition += 10;
      
      // Detailed sections
      const sections = [
        { title: 'Parcelas Vencidas', data: vencidas },
        { title: 'Parcelas a Vencer (30 dias)', data: aVencer },
        { title: 'Parcelas em Aberto', data: emAberto },
      ];

      sections.forEach(section => {
        if (section.data.length > 0) {
          if (yPosition > 250) {
            pdf.addPage();
            yPosition = 20;
          }

          pdf.setFontSize(14);
          pdf.text(section.title, 20, yPosition);
          yPosition += 15;

          pdf.setFontSize(10);
          section.data.forEach(item => {
            if (yPosition > 280) {
              pdf.addPage();
              yPosition = 20;
            }

            const vencimentoStr = item.vencimento ? new Date(item.vencimento).toLocaleDateString('pt-BR') : 'N/A';
            const text = `${item.cliente_nome} - ${item.tipo} - ${formatCurrency(item.valor)} - Venc: ${vencimentoStr}`;
            pdf.text(text, 25, yPosition);
            yPosition += 12;
          });

          yPosition += 10;
        }
      });
    }

    pdf.save(`relatorio-financeiro-${type}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const generateChartPDF = async () => {
    if (!chartRef.current) return;

    const canvas = await html2canvas(chartRef.current, { 
      backgroundColor: '#ffffff',
      scale: 2 
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('landscape');
    
    const imgWidth = 280;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.setFontSize(16);
    pdf.text('Evolução Financeira', pdf.internal.pageSize.width / 2, 20, { align: 'center' });
    
    pdf.addImage(imgData, 'PNG', 10, 30, imgWidth, imgHeight);
    
    pdf.save(`grafico-evolucao-financeira-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const chartData = generateChartData();
  const { vencidas, aVencer, emAberto, pagas } = categorizeData();

  const pieData = [
    { name: 'Vencidas', value: vencidas.reduce((sum, item) => sum + item.valor, 0), color: '#ef4444' },
    { name: 'A Vencer', value: aVencer.reduce((sum, item) => sum + item.valor, 0), color: '#f97316' },
    { name: 'Em Aberto', value: emAberto.reduce((sum, item) => sum + item.valor, 0), color: '#eab308' },
    { name: 'Pagas', value: pagas.reduce((sum, item) => sum + item.valor, 0), color: '#22c55e' },
  ];

  return (
    <div className="space-y-6">
      {/* Botões de Relatório */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Relatórios em PDF
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button onClick={() => generatePDFReport('summary')} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Relatório Resumido
            </Button>
            <Button onClick={() => generatePDFReport('detailed')} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Relatório Detalhado
            </Button>
            <Button onClick={generateChartPDF} variant="outline">
              <TrendingUp className="w-4 h-4 mr-2" />
              Gráfico em PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos */}
      <div ref={chartRef} className="bg-white p-6 rounded-lg">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Evolução Mensal */}
          <Card>
            <CardHeader>
              <CardTitle>Evolução Mensal</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="pago" stroke="#22c55e" name="Pago" strokeWidth={2} />
                  <Line type="monotone" dataKey="pendente" stroke="#eab308" name="Pendente" strokeWidth={2} />
                  <Line type="monotone" dataKey="vencido" stroke="#ef4444" name="Vencido" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Status Atual */}
          <Card>
            <CardHeader>
              <CardTitle>Status Atual</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={pieData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};