import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button.tsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { ArrowLeft, DollarSign, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast.ts";
import { supabase } from "@/integrations/supabase/client.ts";
import { useAuth } from "@/hooks/useAuth.ts";
import { formatCurrency } from "@/utils/currency.ts";
import ParcelaCard from "@/components/ParcelaCard.tsx";
import FinanceiroSummary from "@/components/FinanceiroSummary.tsx";
import { FinancialReports } from "@/components/FinancialReports.tsx";
import { SubtleNotificationBell } from "@/components/SubtleNotificationBell.tsx";
import { ResponsavelFinanceiro } from "@/components/ResponsavelFinanceiro.tsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.tsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx";
import { useFinanceiroData, useClientesData } from "@/hooks/useFinanceiroData";
import { FinanceiroFiltroCliente } from "@/components/FinanceiroFiltroCliente.tsx";
import { AppHeader } from "@/components/AppHeader";

const Financial = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { financeiro, isLoading: loading, refetch: fetchFinanceiro } = useFinanceiroData();
  const { clientes } = useClientesData();
  const [filtroStatus, setFiltroStatus] = useState<string>("TODOS");
  const [filtroTipo, setFiltroTipo] = useState<string>("TODOS");
  const [filtroCliente, setFiltroCliente] = useState<string>("TODOS");
  const [excluirDialogOpen, setExcluirDialogOpen] = useState(false);
  const [parcelaParaExcluir, setParcelaParaExcluir] = useState<{
    id: string;
    cliente: string;
  } | null>(null);

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

  const handleExcluirParcela = async (id: string) => {
    try {
      const { error } = await supabase.from("financeiro").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Parcela excluída!",
        description: "A parcela foi excluída com sucesso.",
      });

      fetchFinanceiro();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir parcela",
        description: error.message,
      });
    } finally {
      setExcluirDialogOpen(false);
      setParcelaParaExcluir(null);
    }
  };

  const handleExcluirTodasParcelas = async (clienteNome: string) => {
    if (!user?.id) return;
    try {
      const { error } = await supabase
        .from("financeiro")
        .delete()
        .eq("cliente_nome", clienteNome);

      if (error) throw error;

      toast({
        title: "Parcelas excluídas!",
        description: `Todas as parcelas de ${clienteNome} foram excluídas.`,
      });

      fetchFinanceiro();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir parcelas",
        description: error.message,
      });
    } finally {
      setExcluirDialogOpen(false);
      setParcelaParaExcluir(null);
    }
  };

  const confirmarExclusaoParcela = (id: string, cliente: string) => {
    setParcelaParaExcluir({ id, cliente });
    setExcluirDialogOpen(true);
  };

  const filteredData = financeiro.filter((item) => {
    const statusMatch =
      filtroStatus === "TODOS" || item.status === filtroStatus;
    const tipoMatch = filtroTipo === "TODOS" || item.tipo === filtroTipo;
    const clienteMatch =
      filtroCliente === "TODOS" || item.cliente_nome === filtroCliente;

    return statusMatch && tipoMatch && clienteMatch;
  });

  const isVencido = (vencimento: string | null, status: string | null) => {
    if (!vencimento || status === "PAGO") return false;
    const hoje = new Date();
    const dataVencimento = new Date(vencimento);
    return dataVencimento < hoje;
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

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="flex items-center gap-4 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold">Gestao Financeira</h1>
          <SubtleNotificationBell />
        </div>

        {/* Cards de Resumo usando o componente */}
        <FinanceiroSummary
          totalPendente={totais.pendente}
          totalPago={totais.pago}
          totalVencido={totais.vencido}
        />

        <Tabs defaultValue="financeiro" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 h-auto">
            <TabsTrigger value="financeiro" className="text-xs sm:text-sm">Gestão Financeira</TabsTrigger>
            <TabsTrigger value="relatorios" className="text-xs sm:text-sm">Relatórios e Gráficos</TabsTrigger>
          </TabsList>

          <TabsContent value="financeiro" className="space-y-6">

            {/* Filtros */}
            <Card>
              <CardHeader>
                <CardTitle>Filtros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Status:
                    </label>
                    <select
                      value={filtroStatus}
                      onChange={(e) => setFiltroStatus(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    >
                      <option value="TODOS">Todos</option>
                      <option value="PENDENTE">Pendente</option>
                      <option value="PAGO">Pago</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Tipo:
                    </label>
                    <select
                      value={filtroTipo}
                      onChange={(e) => setFiltroTipo(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    >
                      <option value="TODOS">Todos</option>
                      <option value="Honorários">Honorários</option>
                      <option value="Entrada">Entrada</option>
                      <option value="TMP">TMP</option>
                    </select>
                  </div>

                  <FinanceiroFiltroCliente
                    clientes={clientes}
                    value={filtroCliente}
                    onChange={(val) => setFiltroCliente(val)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Lista de Pagamentos Agrupados por Cliente */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Clientes e Pagamentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredData.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum registro financeiro encontrado.</p>
                  </div>
                ) : (
                  (() => {
                    // Agrupar por cliente
                    const clientesUnicos = [
                      ...new Set(filteredData.map((item) => item.cliente_nome)),
                    ];
                    console.log("Clientes únicos encontrados:", clientesUnicos);

                    return (
                      <div className="space-y-6">
                        {clientesUnicos.map((cliente) => {
                          const parcelasCliente = filteredData.filter(
                            (item) => item.cliente_nome === cliente
                          );
                          const totalPendente = parcelasCliente
                            .filter((item) => item.status === "PENDENTE")
                            .reduce((sum, item) => sum + item.valor, 0);
                          const totalPago = parcelasCliente
                            .filter((item) => item.status === "PAGO")
                            .reduce((sum, item) => sum + item.valor, 0);

                          return (
                            <div
                              key={cliente}
                              className="border rounded-lg p-6 bg-muted/30"
                            >
                              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                                <div>
                                  <h3 className="text-lg font-semibold">
                                    {cliente}
                                  </h3>
                                  <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mt-1">
                                    <span>
                                      Parcelas: {parcelasCliente.length}
                                    </span>
                                    <span>
                                      Pendente: {formatCurrency(totalPendente)}
                                    </span>
                                    <span>
                                      Recebido: {formatCurrency(totalPago)}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      console.log(
                                        "Navegando para cliente:",
                                        cliente
                                      );
                                      navigate(
                                        `/financeiro/cliente/${encodeURIComponent(
                                          cliente
                                        )}`
                                      );
                                    }}
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    Ver Todas as Parcelas (
                                    {parcelasCliente.length})
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() =>
                                      confirmarExclusaoParcela("all", cliente)
                                    }
                                  >
                                    Excluir Todas
                                  </Button>
                                </div>
                              </div>

                              {/* Mostrar próximas parcelas pendentes usando o componente ParcelaCard */}
                              <div className="space-y-3">
                                <h4 className="font-medium text-sm text-muted-foreground">
                                  Próximos vencimentos:
                                </h4>
                                {parcelasCliente
                                  .filter((item) => item.status === "PENDENTE")
                                  .slice(0, 3)
                                  .map((item) => (
                                    <ParcelaCard
                                      key={item.id}
                                      id={item.id}
                                      clienteNome={item.cliente_nome}
                                      valor={item.valor}
                                      tipo={item.tipo}
                                      status={item.status || "PENDENTE"}
                                      vencimento={item.vencimento || ""}
                                      dataPagamento={item.data_pagamento || undefined}
                                      onBaixaPagamento={handleBaixaPagamento}
                                      onExcluirParcela={
                                        confirmarExclusaoParcela
                                      }
                                      showClienteName={false}
                                    />
                                  ))}

                                {parcelasCliente.filter(
                                  (item) => item.status === "PENDENTE"
                                ).length > 3 && (
                                    <div className="text-center pt-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          navigate(
                                            `/financeiro/cliente/${encodeURIComponent(
                                              cliente
                                            )}`
                                          )
                                        }
                                      >
                                        Ver mais{" "}
                                        {parcelasCliente.filter(
                                          (item) => item.status === "PENDENTE"
                                        ).length - 3}{" "}
                                        parcelas pendentes...
                                      </Button>
                                    </div>
                                  )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="relatorios">
            <FinancialReports financeiro={financeiro} />
          </TabsContent>
        </Tabs>

        {/* Dialog de confirmação para exclusão */}
        <AlertDialog
          open={excluirDialogOpen}
          onOpenChange={setExcluirDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                {parcelaParaExcluir?.id === "all"
                  ? `Tem certeza que deseja excluir TODAS as parcelas de ${parcelaParaExcluir.cliente}? Esta ação não pode ser desfeita.`
                  : "Tem certeza que deseja excluir esta parcela? Esta ação não pode ser desfeita."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (parcelaParaExcluir?.id === "all") {
                    handleExcluirTodasParcelas(parcelaParaExcluir.cliente);
                  } else if (parcelaParaExcluir?.id) {
                    handleExcluirParcela(parcelaParaExcluir.id);
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div >
    </div >
  );
};

export default Financial;
