import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  ArrowLeft,
  Edit,
  User,
  DollarSign,
  FileText,
  Users,
  Check,
  X,
  RefreshCw,
  Gavel,
  Loader2,
  CheckSquare,
  FileSignature,
  Bot, // Ícone para o Robô
} from "lucide-react";
import { ProcessoTarefas } from "@/components/ProcessoTarefas";
import { ProcessoArquivos } from "@/components/ProcessoArquivos";
import { datajudService, DatajudMovimento } from "@/services/datajudService";
import { useToast } from "@/hooks/use-toast.ts";
import { supabase } from "@/integrations/supabase/client.ts";
import { useAuth } from "@/hooks/useAuth.ts";
import { usePermissions } from "@/hooks/usePermissions.ts";
import { useGlobalAccess } from "@/utils/accessUtils.ts";

const ProcessView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [processo, setProcesso] = useState<any>(null);
  const [cliente, setCliente] = useState<any>(null);
  const [financeiro, setFinanceiro] = useState<any[]>([]);
  const [observacoes, setObservacoes] = useState<any[]>([]);
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [responsavel, setResponsavel] = useState<any>(null);
  const [atualizandoDatajud, setAtualizandoDatajud] = useState(false);

  // --- NOVO: Estado para as movimentações do Robô ---
  const [observacoesRobo, setObservacoesRobo] = useState<any[]>([]);

  const {
    canViewAllProcesses: hasGlobalProcessAccess,
    permissionsLoading: globalAccessLoading,
  } = useGlobalAccess();

  const {
    loading: permissionsLoading,
  } = usePermissions();

  useEffect(() => {
    if (id && user && !permissionsLoading && !globalAccessLoading) {
      loadProcessData();
    }
  }, [id, user, permissionsLoading, globalAccessLoading]);

  // --- NOVO: Effect para buscar e ouvir movimentações do Robô em Tempo Real ---
  useEffect(() => {
    if (!id) return;

    const carregarMovimentacoesRobo = async () => {
      const { data } = await supabase
        .from('observacoes_processo')
        .select('*')
        .eq('processo_id', id)
        .order('created_at', { ascending: false });
      
      if (data) setObservacoesRobo(data);
    };

    carregarMovimentacoesRobo();

    // Inscrição no canal Realtime do Supabase
    const canal = supabase
      .channel('obs-robo-realtime')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'observacoes_processo', filter: `processo_id=eq.${id}` }, 
        (payload) => {
          console.log("Nova movimentação recebida via robô!", payload);
          carregarMovimentacoesRobo(); // Recarrega a lista
          toast({
            title: "Nova Movimentação!",
            description: "O robô acabou de atualizar este processo.",
            className: "bg-green-500 text-white border-none"
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(canal); };
  }, [id, toast]);
  // -----------------------------------------------------------------------

  const loadProcessData = async () => {
    try {
      setLoading(true);

      if (!id) return;

      // Fetch processo - sem filtro de user_id para permitir acesso global
      let processoQuery = supabase
        .from("processos")
        .select(`*, clientes (*)`)
        .eq("id", id);

      const { data: processoData, error: processoError } =
        await processoQuery.single();

      if (processoError) {
        console.error("[ProcessView] Error loading processo:", processoError);
        toast({
          variant: "destructive",
          title: "Erro",
          description:
            "Processo não encontrado ou você não tem permissão para acessá-lo.",
        });
        navigate("/dashboard");
        return;
      }

      console.log("[ProcessView] Processo loaded:", processoData);
      setProcesso(processoData);

      // Buscar cliente via API (usa SERVICE_ROLE_KEY para ignorar RLS)
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      const headers = {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      };

      // Buscar dados relacionados em paralelo usando as novas rotas de API
      let clienteData = null;

      // Tentar buscar cliente por cliente_id primeiro
      if (processoData.cliente_id) {
        const clienteRes = await fetch(`/api/clientes/${processoData.cliente_id}`, { headers });
        clienteData = clienteRes.ok ? await clienteRes.json() : null;
      }

      // Fallback: Se não conseguiu buscar por ID, usar dados do join (para processos antigos)
      if (!clienteData && processoData.clientes) {
        console.log("[ProcessView] Using cliente data from join (processo antigo)");
        clienteData = processoData.clientes;
      }

      // Buscas paralelas via API (mantendo para outros recursos)
      const [financeiroRes, observacoesRes, responsavelRes] = await Promise.all([
        fetch(`/api/processos/${id}/financeiro`, { headers }),
        fetch(`/api/processos/${id}/observacoes`, { headers }),
        fetch(`/api/processos/${id}/responsavel`, { headers })
      ]);

      // Busca de documentos HÍBRIDA (Legado + Novo) via Supabase Client direto
      // Isso resolve problemas de proxy/RLS e garante retrocompatibilidade
      const [docsLegadoRes, docsDriveRes] = await Promise.all([
        supabase.from("documentos_processo").select("*").eq("processo_id", id),
        supabase.from("processo_documentos_drive").select("*").eq("processo_id", id)
      ]);

      const [financeiroData, observacoesData, responsavelData] = await Promise.all([
        financeiroRes.ok ? financeiroRes.json() : [],
        observacoesRes.ok ? observacoesRes.json() : [],
        responsavelRes.ok ? responsavelRes.json() : null
      ]);

      // Combinar e normalizar documentos
      const docsLegado = docsLegadoRes.data || [];
      const docsDrive = docsDriveRes.data || [];

      const documentosCombinados = [
        ...docsLegado,
        ...docsDrive.map((doc: any) => ({
          ...doc,
          url_arquivo: doc.google_drive_link, // Normaliza field para compatibilidade
        }))
      ];

      setCliente(clienteData);
      setFinanceiro(financeiroData);
      setObservacoes(observacoesData);
      setDocumentos(documentosCombinados);
      setResponsavel(responsavelData);

    } catch (error) {
      console.error("Erro ao carregar dados do processo:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar dados do processo.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (
    financeiroId: string,
    novoStatus: string
  ) => {
    try {
      const { error } = await supabase
        .from("financeiro")
        .update({
          status: novoStatus,
          data_pagamento:
            novoStatus === "PAGO"
              ? new Date().toISOString().split("T")[0]
              : null,
        })
        .eq("id", financeiroId);

      if (error) {
        console.error("Erro ao atualizar status:", error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Erro ao atualizar status do pagamento.",
        });
        return;
      }

      // Atualizar estado local
      setFinanceiro((prevFinanceiro) =>
        prevFinanceiro.map((item) =>
          item.id === financeiroId
            ? {
              ...item,
              status: novoStatus,
              data_pagamento:
                novoStatus === "PAGO"
                  ? new Date().toISOString().split("T")[0]
                  : null,
            }
            : item
        )
      );

      toast({
        title: "Status atualizado!",
        description: `Pagamento marcado como ${novoStatus.toLowerCase()}.`,
      });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao atualizar status do pagamento.",
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const handleAtualizarDatajud = async () => {
    if (!processo?.numero_processo) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Número do processo não encontrado.",
      });
      return;
    }

    setAtualizandoDatajud(true);
    try {
      const result = await datajudService.lookupProcess(
        processo.numero_processo,
        processo.id
      );

      if (result.sigilo) {
        toast({
          variant: "destructive",
          title: "Processo sob Sigilo",
          description: "Este processo está classificado como Segredo de Justiça.",
        });
        await loadProcessData();
      } else if (result.success) {
        toast({
          title: "Dados atualizados!",
          description: "Informações do processo foram obtidas do DataJud.",
        });
        await loadProcessData();
      } else {
        toast({
          variant: "destructive",
          title: "Erro ao consultar DataJud",
          description: result.error || "Não foi possível obter os dados.",
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar DataJud:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao consultar a API do DataJud.",
      });
    } finally {
      setAtualizandoDatajud(false);
    }
  };

  const getMovimentos = (): DatajudMovimento[] => {
    if (!processo?.datajud_movimentos) return [];
    return datajudService.parseMovimentos(
      typeof processo.datajud_movimentos === 'string'
        ? processo.datajud_movimentos
        : JSON.stringify(processo.datajud_movimentos)
    );
  };

  if (permissionsLoading || globalAccessLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando permissões...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Carregando dados do processo...</p>
        </div>
      </div>
    );
  }

  if (!processo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">
            Processo não encontrado
          </p>
          <Button onClick={() => navigate("/dashboard")} className="mt-4">
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button variant="outline" onClick={() => navigate("/dashboard")} size="sm">
              <ArrowLeft className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Voltar</span>
            </Button>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold">Dados do Cliente</h1>
              <p className="text-muted-foreground text-sm sm:text-base truncate max-w-[200px] sm:max-w-none">{cliente?.nome || "Cliente não disponível"}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => navigate(`/novo-processo?edit=${id}`)}
              className="bg-primary hover:bg-primary/90"
              size="sm"
            >
              <Edit className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Editar</span>
            </Button>

            <Button
              onClick={() => navigate(`/novo-processo?edit=${id}&step=2`)}
              variant="outline"
              size="sm"
            >
              <Edit className="w-4 h-4 sm:mr-2" />
              <span className="hidden md:inline">Dados do Processo</span>
              <span className="md:hidden">Processo</span>
            </Button>

            <Button
              onClick={() => navigate(`/novo-processo?edit=${id}&step=3`)}
              variant="outline"
              size="sm"
              className="hidden sm:flex"
            >
              <Edit className="w-4 h-4 mr-2" />
              Financeiro
            </Button>

            <Button
              onClick={() => navigate(`/novo-processo?edit=${id}&step=4`)}
              variant="outline"
              size="sm"
              className="hidden lg:flex"
            >
              <Edit className="w-4 h-4 mr-2" />
              Anexos
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-3 sm:p-6">
            <Tabs defaultValue="dados-pessoais" className="w-full">
              <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
                <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:grid-cols-6 gap-1">
                  <TabsTrigger
                    value="dados-pessoais"
                    className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap"
                  >
                    <User className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Dados Pessoais</span>
                    <span className="sm:hidden">Dados</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="financeiro"
                    className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap"
                  >
                    <DollarSign className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Financeiro ({financeiro.length})</span>
                    <span className="sm:hidden">Fin.</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="responsavel"
                    className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap"
                  >
                    <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Responsável</span>
                    <span className="sm:hidden">Resp.</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="tarefas"
                    className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap"
                    data-testid="tab-tarefas"
                  >
                    <CheckSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                    Tarefas
                  </TabsTrigger>
                  <TabsTrigger
                    value="arquivos"
                    className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap"
                  >
                    <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Arquivos ({documentos.length})</span>
                    <span className="sm:hidden">Arq.</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="info-processo"
                    className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap"
                    data-testid="tab-info-processo"
                  >
                    <Gavel className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Info. Processo</span>
                    <span className="sm:hidden">Info</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="dados-pessoais" className="mt-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      Dados Pessoais
                    </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <div>
    <label className="text-sm font-medium text-muted-foreground">
      Nome Completo
    </label>
    <p className="text-base font-medium">{cliente?.nome || "-"}</p>
  </div>
  
  {/* ADICIONE ESTE BLOCO DO RG */}
  <div>
    <label className="text-sm font-medium text-muted-foreground">
      RG
    </label>
    <p className="text-base">{cliente?.rg || "-"}</p>
  </div>

  <div>
    <label className="text-sm font-medium text-muted-foreground">
      CPF
    </label>
    <p className="text-base">{cliente?.cpf_cnpj || "-"}</p>
  </div>
  
  <div>
    <label className="text-sm font-medium text-muted-foreground">
      Telefone
    </label>
    <p className="text-base">{cliente?.telefone || "-"}</p>
  </div>
  
  <div>
    <label className="text-sm font-medium text-muted-foreground">
      E-mail
    </label>
    <p className="text-base">{cliente?.email || "-"}</p>
  </div>

  <div className="md:col-span-2">
    <label className="text-sm font-medium text-muted-foreground">
      Endereço Completo
    </label>
    <p className="text-base">{cliente?.endereco || "-"}</p>
  </div>
</div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">
                        Dados do Processo
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAtualizarDatajud}
                        disabled={atualizandoDatajud || !processo?.numero_processo}
                        data-testid="button-atualizar-datajud"
                      >
                        {atualizandoDatajud ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4 mr-2" />
                        )}
                        Atualizar Processo
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Número do Processo
                        </label>
                        <div className="flex items-center gap-2">
                          <p className="text-base font-mono">
                            {processo.numero_processo}
                          </p>
                          {processo.datajud_sigilo && (
                            <Badge variant="destructive" className="text-xs">
                              Segredo de Justiça
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Tipo do Processo
                        </label>
                        <Badge
                          variant="outline"
                          className="bg-primary/10 text-primary border-primary/20"
                        >
                          {processo.tipo_processo}
                        </Badge>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Cliente Preso
                        </label>
                        <Badge
                          variant="outline"
                          className={
                            processo.cliente_preso
                              ? "bg-destructive/10 text-destructive border-destructive/20"
                              : "bg-success/10 text-success border-success/20"
                          }
                        >
                          {processo.cliente_preso ? "SIM" : "NÃO"}
                        </Badge>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Prazo
                        </label>
                        <p className="text-base">
                          {processo.prazo ? formatDate(processo.prazo) : "-"}
                        </p>
                      </div>
                      {processo.descricao && (
                        <div className="md:col-span-2">
                          <label className="text-sm font-medium text-muted-foreground">
                            Descrição
                          </label>
                          <p className="text-base">{processo.descricao}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {observacoes.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        Observações
                      </h3>
                      <div className="space-y-4">
                        {observacoes.map((obs, index) => (
                          <Card key={index}>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base">
                                {obs.titulo}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground">
                                {obs.conteudo}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="financeiro" className="mt-6">
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">
                    Informações Financeiras
                  </h3>

                  {financeiro.length > 0 ? (
                    <div className="space-y-4">
                      {["Entrada", "Honorários", "TMP"].map((tipo) => {
                        const itens = financeiro.filter((f) => f.tipo === tipo);
                        if (itens.length === 0) return null;

                        return (
                          <div key={tipo}>
                            <h4 className="font-medium text-base mb-3">
                              {tipo}
                            </h4>
                            <div className="grid gap-4">
                              {itens.map((item, index) => (
                                <Card key={index}>
                                  <CardContent className="p-4">
                                    <div className="flex justify-between items-center">
                                      <div className="flex-1">
                                        <p className="font-medium">
                                          {formatCurrency(Number(item.valor))}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                          Vencimento:{" "}
                                          {formatDate(item.vencimento)}
                                        </p>
                                        {item.data_pagamento && (
                                          <p className="text-sm text-success">
                                            Pago em:{" "}
                                            {formatDate(item.data_pagamento)}
                                          </p>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge
                                          variant="outline"
                                          className={
                                            item.status === "PAGO"
                                              ? "bg-success/10 text-success border-success/20"
                                              : "bg-warning/10 text-warning border-warning/20"
                                          }
                                        >
                                          {item.status}
                                        </Badge>
                                        {item.status === "PENDENTE" ? (
                                          <Button
                                            size="sm"
                                            onClick={() =>
                                              handleStatusChange(
                                                item.id,
                                                "PAGO"
                                              )
                                            }
                                            className="bg-success hover:bg-success/90"
                                          >
                                            <Check className="w-4 h-4 mr-1" />
                                            Dar Baixa
                                          </Button>
                                        ) : (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                              handleStatusChange(
                                                item.id,
                                                "PENDENTE"
                                              )
                                            }
                                            className="border-warning text-warning hover:bg-warning/10"
                                          >
                                            <X className="w-4 h-4 mr-1" />
                                            Cancelar Baixa
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      Nenhuma informação financeira cadastrada.
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="responsavel" className="mt-6">
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">
                    Responsável Financeiro
                  </h3>

                  {responsavel ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Nome
                        </label>
                        <p className="text-base">{responsavel.nome}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          CPF
                        </label>
                        <p className="text-base">{responsavel.cpf}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          RG
                        </label>
                        <p className="text-base">{responsavel.rg || "-"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Data de Nascimento
                        </label>
                        <p className="text-base">
                          {formatDate(responsavel.data_nascimento)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Telefone
                        </label>
                        <p className="text-base">{responsavel.telefone}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          E-mail
                        </label>
                        <p className="text-base">{responsavel.email}</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          Endereço
                        </label>
                        <p className="text-base">
                          {responsavel.endereco_completo}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          CEP
                        </label>
                        <p className="text-base">{responsavel.cep}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      Nenhum responsável financeiro cadastrado.
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="tarefas" className="mt-6">
                <ProcessoTarefas processoId={id || ""} />
              </TabsContent>

              <TabsContent value="arquivos" className="mt-6">
                <ProcessoArquivos
                  processoId={id!}
                  clienteNome={cliente?.nome || ""}
                  numeroProcesso={processo.numero_processo}
                  documentos={documentos}
                  onDocumentosChange={loadProcessData}
                />
              </TabsContent>

              <TabsContent value="info-processo" className="mt-6">
                {/* --- NOVA SEÇÃO: MOVIMENTAÇÕES DO ROBÔ (ATUALIZADA) --- */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Bot className="w-5 h-5 text-primary" />
                    Movimentações (TJSP/Robô)
                  </h3>
                  
                  <div className="rounded-md bg-gray-50 p-4 border border-gray-200 shadow-sm">
                    {processo?.movimentacoes ? (
                      <>
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                          <span className="text-sm font-medium text-gray-500">
                            Última sincronização
                          </span>
                          {processo.updated_at && (
                            <Badge variant="outline" className="text-xs">
                              {new Date(processo.updated_at).toLocaleString('pt-BR')}
                            </Badge>
                          )}
                        </div>
                        <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-sans">
                          {processo.movimentacoes}
                        </pre>
                      </>
                    ) : (
                      <div className="p-8 text-center text-muted-foreground">
                        <Bot className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>Nenhuma movimentação importada ainda.</p>
                        <p className="text-xs mt-2 italic">
                          O robô atualizará este campo automaticamente.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                {/* ----------------------------------------------------- */}

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      Informações do Processo (DataJud)
                    </h3>
                    {processo?.datajud_atualizado_em && (
                      <span className="text-sm text-muted-foreground">
                        Atualizado em: {datajudService.formatDateTime(processo.datajud_atualizado_em)}
                      </span>
                    )}
                  </div>

                  {processo?.datajud_tribunal ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            Tribunal
                          </label>
                          <p className="text-base font-semibold">
                            {processo.datajud_tribunal}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            Classe Processual
                          </label>
                          <p className="text-base">{processo.datajud_classe || "-"}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            Grau
                          </label>
                          <Badge variant="outline">
                            {processo.datajud_grau || "-"}
                          </Badge>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            Sistema
                          </label>
                          <p className="text-base">{processo.datajud_sistema || "-"}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            Formato
                          </label>
                          <p className="text-base">{processo.datajud_formato || "-"}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            Data de Ajuizamento
                          </label>
                          <p className="text-base">
                            {datajudService.formatDataAjuizamento(processo.datajud_data_ajuizamento)}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            Última Atualização CNJ
                          </label>
                          <p className="text-base">
                            {datajudService.formatDateTime(processo.datajud_ultima_atualizacao_cnj)}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            Última Movimentação
                          </label>
                          <p className="text-base font-semibold text-primary">
                            {datajudService.formatDateTime(processo.datajud_ultima_movimentacao)}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-base font-semibold mb-4">
                          Movimentações ({getMovimentos().length})
                        </h4>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {getMovimentos().length > 0 ? (
                            getMovimentos().map((mov, index) => (
                              <Card key={index}>
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                      <p className="font-medium">{mov.nome}</p>
                                      {mov.complementosTabelados && mov.complementosTabelados.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {mov.complementosTabelados.map((comp, i) => (
                                            <Badge key={i} variant="secondary" className="text-xs">
                                              {comp.nome}
                                            </Badge>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                                      {datajudService.formatDateTime(mov.dataHora)}
                                    </span>
                                  </div>
                                </CardContent>
                              </Card>
                            ))
                          ) : (
                            <p className="text-muted-foreground">
                              Nenhuma movimentação encontrada.
                            </p>
                          )}
                        </div>
                      </div>
                    </>
                  ) : processo?.datajud_sigilo ? (
                    <div className="text-center py-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
                        <Gavel className="w-8 h-8 text-destructive" />
                      </div>
                      <h3 className="text-lg font-semibold text-destructive mb-2">
                        Processo sob Sigilo
                      </h3>
                      <p className="text-muted-foreground max-w-md mx-auto mb-4">
                        Este processo está classificado como Segredo de Justiça e seus dados não estão disponíveis na base pública do DataJud (CNJ).
                      </p>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Para obter informações sobre este processo, acesse diretamente o portal do tribunal responsável utilizando suas credenciais de advogado.
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Gavel className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">
                        Nenhuma informação do DataJud disponível.
                      </p>
                      <Button
                        onClick={handleAtualizarDatajud}
                        disabled={atualizandoDatajud || !processo?.numero_processo}
                        data-testid="button-consultar-datajud"
                      >
                        {atualizandoDatajud ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4 mr-2" />
                        )}
                        Consultar DataJud
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProcessView;