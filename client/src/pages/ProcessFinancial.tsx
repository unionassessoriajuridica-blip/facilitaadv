import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { ArrowLeft, DollarSign, FileText, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast.ts";
import { supabase } from "@/integrations/supabase/client.ts";
import { useAuth } from "@/hooks/useAuth.ts";
import ParcelaCard from "@/components/ParcelaCard.tsx";
import FinanceiroSummary from "@/components/FinanceiroSummary.tsx";
import { useGlobalAccess } from "@/utils/accessUtils.ts";

interface FinanceiroItem {
  id: string;
  cliente_nome: string;
  valor: number;
  tipo: string;
  status: string;
  vencimento: string;
  data_pagamento?: string;
  created_at: string;
}

const ProcessFinancial = () => {
  const { clienteNome } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [financeiro, setFinanceiro] = useState<FinanceiroItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState<string>("TODOS");

  const {
    canViewAllFinancial: hasGlobalFinancialAccess,
    permissionsLoading: globalAccessLoading,
  } = useGlobalAccess();


  useEffect(() => {
    console.log('useEffect executado, user:', user, 'clienteNome:', clienteNome);
    console.log('Tem acesso global ao financeiro:', hasGlobalFinancialAccess);
    console.log(
      "useEffect executado, user:",
      user,
      "clienteNome:",
      clienteNome
    );
    if (user && clienteNome) {
      fetchFinanceiro();
    }
  }, [user, clienteNome, hasGlobalFinancialAccess]);

  const fetchFinanceiro = async () => {
    try {
      const decodedClienteNome = decodeURIComponent(clienteNome || '');

      let financeiroQuery = supabase
        .from('financeiro')
        .select('*')
        .eq('cliente_nome', decodedClienteNome)
        .order('vencimento', { ascending: true });

      // Sistema GLOBAL: Todos usuários veem TODOS os dados financeiros
      const { data, error } = await financeiroQuery;

      if (error) throw error;
      console.log('Dados encontrados para o cliente:', data);
      setFinanceiro(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar dados financeiros:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar dados financeiros",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBaixaPagamento = async (id: string) => {
    try {
      const { error } = await supabase
        .from("financeiro")
        .update({
          status: "PAGO",
          data_pagamento: new Date().toISOString().split("T")[0],
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Pagamento registrado!",
        description: "A baixa do pagamento foi realizada com sucesso.",
      });

      fetchFinanceiro();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao registrar pagamento",
        description: error.message,
      });
    }
  };

  const isVencido = (vencimento: string, status: string) => {
    if (status === "PAGO") return false;
    const hoje = new Date();
    const dataVencimento = new Date(vencimento);
    return dataVencimento < hoje;
  };

  const filteredData = financeiro.filter((item) => {
    const tipoMatch = filtroTipo === "TODOS" || item.tipo === filtroTipo;
    return tipoMatch;
  });

  // Agrupamento por tipo para melhor visualização
  const groupedData = {
    entrada: filteredData.filter((item) => item.tipo === "Entrada"),
    honorarios: filteredData.filter((item) => item.tipo === "Honorários"),
    tmp: filteredData.filter((item) => item.tipo === "TMP"),
  };

  const totais = {
    pendente: financeiro
      .filter((item) => item.status === "PENDENTE")
      .reduce((sum, item) => sum + item.valor, 0),
    pago: financeiro
      .filter((item) => item.status === "PAGO")
      .reduce((sum, item) => sum + item.valor, 0),
    vencido: financeiro
      .filter((item) => isVencido(item.vencimento, item.status))
      .reduce((sum, item) => sum + item.valor, 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando dados financeiros...</p>
        </div>
      </div>
    );
  }

  const renderGrupoFinanceiro = (
    titulo: string,
    items: FinanceiroItem[],
    icon: React.ReactNode
  ) => {
    if (items.length === 0) return null;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {icon}
            {titulo} ({items.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {items.map((item, index) => (
              <ParcelaCard
                key={item.id}
                id={item.id}
                clienteNome={item.cliente_nome}
                valor={item.valor}
                tipo={item.tipo}
                status={item.status}
                vencimento={item.vencimento}
                dataPagamento={item.data_pagamento}
                index={titulo === "Honorários" ? index : undefined}
                onBaixaPagamento={handleBaixaPagamento}
                showClienteName={false}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate("/financeiro")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              Financeiro - {decodeURIComponent(clienteNome || "")}
            </h1>
            <p className="text-muted-foreground">
              Gestão de parcelas e pagamentos
            </p>
          </div>
        </div>

        {/* Cards de Resumo usando o componente */}
        <FinanceiroSummary
          totalPendente={totais.pendente}
          totalPago={totais.pago}
          totalVencido={totais.vencido}
        />

        {/* Filtro */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <label className="text-sm font-medium mb-2 block">Tipo:</label>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="TODOS">Todos</option>
                <option value="Entrada">Entrada</option>
                <option value="Honorários">Honorários</option>
                <option value="TMP">TMP</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Seções por Tipo */}
        {filtroTipo === "TODOS" || filtroTipo === "Entrada"
          ? renderGrupoFinanceiro(
            "Entrada",
            groupedData.entrada,
            <DollarSign className="w-5 h-5 text-green-600" />
          )
          : null}

        {filtroTipo === "TODOS" || filtroTipo === "Honorários"
          ? renderGrupoFinanceiro(
            "Honorários",
            groupedData.honorarios,
            <FileText className="w-5 h-5 text-blue-600" />
          )
          : null}

        {filtroTipo === "TODOS" || filtroTipo === "TMP"
          ? renderGrupoFinanceiro(
            "TMP (Taxa de Manutenção Processual)",
            groupedData.tmp,
            <Calendar className="w-5 h-5 text-orange-600" />
          )
          : null}

        {filteredData.length === 0 && (
          <Card>
            <CardContent className="text-center py-8 text-muted-foreground">
              <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum registro financeiro encontrado para este cliente.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProcessFinancial;
