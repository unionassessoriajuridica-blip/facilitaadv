import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth.ts";
import { usePermissions } from "@/hooks/usePermissions.ts";
import { useUserRole } from "@/hooks/useUserRole.ts";
import { Button } from "@/components/ui/button.tsx";
import {
  canViewAllProcesses,
  canViewAllFinancial,
  useGlobalAccess,
} from "@/utils/accessUtils.ts";
import { useDashboardStats, useDashboardProcessos } from "@/hooks/useDashboardData";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import {
  FileText,
  Calendar,
  Users,
  DollarSign,
  Plus,
  Search,
  Edit,
  Trash2,
  Bell,
  User,
  Settings,
  MessageCircle,
  Scale,
  Bot,
  PenTool,
  Database,
  CheckSquare,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client.ts";
import { useNavigate } from "react-router-dom";
import { ClienteDataButton } from "@/components/ClienteDataButton.tsx";
import { NotificacoesTarefas } from "@/components/NotificacoesTarefas";
import Swal from "sweetalert2";
import { useToast } from "@/hooks/use-toast";
declare global {
  interface Window {
    __debugPermissions?: {
      permissions: string[];
      hasPermission: (perm: string) => boolean;
      userId: string | undefined;
    };
  }
}
const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    hasPermission,
    permissions,
    loading: permissionsLoading,
  } = usePermissions();

  const { isMaster, isAdmin } = useUserRole();
  const [searchTerm, setSearchTerm] = useState("");
  const [showTarefasModal, setShowTarefasModal] = useState(false);
  const [tarefasComProcessos, setTarefasComProcessos] = useState<any[]>([]);

  const {
    canViewAllProcesses: hasGlobalProcessAccess,
    canViewAllFinancial: hasGlobalFinancialAccess,
    canViewAllClients: hasGlobalClientAccess,
    permissionsLoading: globalAccessLoading,
  } = useGlobalAccess();

  // Usar React Query com cache para dados do dashboard
  const { data: statsData, isLoading: statsLoading } = useDashboardStats();
  const { data: processosData, isLoading: processosLoading } = useDashboardProcessos();

  const stats = statsData || {
    processosAtivos: 0,
    audienciasHoje: 0,
    clientes: 0,
    tarefasPendentes: 0,
  };
  const processos = processosData || [];
  const loading = statsLoading || processosLoading;


  const filteredProcessos = processos.filter((processo) => {
    if (!searchTerm) return true;

    const term = searchTerm.toLowerCase();
    return (
      processo.numero_processo?.toLowerCase().includes(term) ||
      processo.clientes?.nome?.toLowerCase().includes(term) ||
      processo.tipo_processo?.toLowerCase().includes(term)
    );
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProcessos = filteredProcessos.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredProcessos.length / itemsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };



  const loadTarefasComProcessos = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("tasks")
        .select(`
          *,
          processos (
            id,
            numero_processo,
            tipo_processo,
            clientes (nome)
          )
        `)
        .neq("status", "concluida")
        .order("due_date", { ascending: true });

      if (error) {
        console.error("Erro ao carregar tarefas:", error);
        return;
      }

      setTarefasComProcessos(data || []);
      setShowTarefasModal(true);
    } catch (error) {
      console.error("Erro ao carregar tarefas:", error);
    }
  };

  const handleEditProcesso = (processoId: string, processoUserId: string) => {
    // 🔥 CORREÇÃO: Permitir editar se tem acesso GLOBAL ou se é o dono
    if (hasGlobalProcessAccess || processoUserId === user?.id) {
      navigate(`/processo/${processoId}`);
    } else {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para editar este processo",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProcesso = async (processoId: string, processoUserId?: string) => {
    if (!hasGlobalProcessAccess && processoUserId !== user?.id) {
      toast({
        title: "Acesso negado",
        description: "Voce nao tem permissao para excluir este processo",
        variant: "destructive",
      });
      return;
    }

    const result = await Swal.fire({
      title: "Tem certeza?",
      text: "Esta acao nao pode ser desfeita!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sim, excluir!",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      try {
        const { error } = await supabase
          .from("processos")
          .delete()
          .eq("id", processoId);

        if (error) throw error;

        Swal.fire(
          "Excluido!",
          "O processo foi excluido com sucesso.",
          "success"
        );

        // Invalidar cache para recarregar dados
        window.location.reload();
      } catch (error) {
        console.error("Erro ao excluir processo:", error);
        Swal.fire("Erro!", "Ocorreu um erro ao excluir o processo.", "error");
      }
    }
  };

  // Função para formatar a data corretamente (resolvendo o problema do -1 dia)
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";

    const date = new Date(dateString);
    // Adiciona um dia para corrigir o problema do fuso horário
    date.setDate(date.getDate() + 1);

    return date.toLocaleDateString("pt-BR");
  };

  // Função para determinar a cor com base na proximidade do prazo
  const getPrazoColor = (prazo: string) => {
    if (!prazo) return "default";

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const dataPrazo = new Date(prazo);
    dataPrazo.setHours(0, 0, 0, 0);

    const diffTime = dataPrazo.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return "destructive"; // Vencido - vermelho
    } else if (diffDays === 0) {
      return "destructive"; // Vence hoje - também vermelho
    } else if (diffDays <= 5) {
      return "warning"; // 5 dias ou menos - laranja
    } else {
      return "success"; // Em dia - verde
    }
  };

  // Função para obter o texto descritivo do prazo
  const getPrazoText = (prazo: string) => {
    if (!prazo) return "-";

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const dataPrazo = new Date(prazo);
    dataPrazo.setHours(0, 0, 0, 0);

    const diffTime = dataPrazo.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Vencido há ${Math.abs(diffDays)} dia(s)`;
    } else if (diffDays === 0) {
      return "Vence hoje";
    } else if (diffDays === 1) {
      return "Vence amanhã";
    } else {
      return `Vence em ${diffDays} dias`;
    }
  };

  // Função para determinar a classe CSS da linha com base no prazo
  const getRowClassName = (prazo: string | null) => {
    if (!prazo) return "";
    const color = getPrazoColor(prazo);

    if (color === "destructive") {
      return "bg-destructive/10 hover:bg-destructive/20"; // Vermelho para vencidos
    } else if (color === "warning") {
      return "bg-warning/10 hover:bg-warning/20"; // Laranja para próximos
    }

    return ""; // Sem cor especial para em dia
  };

  const statsCards = [
    {
      title: "Processos Ativos",
      value: stats.processosAtivos.toString(),
      icon: FileText,
      color: "text-primary",
    },
    {
      title: "Audiências Hoje",
      value: stats.audienciasHoje.toString(),
      icon: Calendar,
      color: "text-success",
    },
    {
      title: "Clientes",
      value: stats.clientes.toString(),
      icon: Users,
      color: "text-purple",
    },
  ];

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

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900">
      {/* Header */}
      <header className="w-full bg-slate-900 text-white">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Scale className="w-6 h-6 text-amber-400" />
            <span className="font-bold text-lg">Facilita ADV</span>
          </div>

          {/* Menu horizontal */}
          <nav className="hidden md:flex items-center gap-6">
            <span className="text-sm text-white font-medium border-b-2 border-amber-400 pb-1">Dashboard</span>
            <button onClick={() => navigate("/processos")} className="text-sm text-amber-400 hover:text-amber-300 transition-colors font-medium">Processos</button>
            <button onClick={() => navigate("/audiencias")} className="text-sm text-amber-400 hover:text-amber-300 transition-colors font-medium">Audiencias</button>
            <button onClick={() => navigate("/financeiro")} className="text-sm text-amber-400 hover:text-amber-300 transition-colors font-medium">Financeiro</button>
            <button onClick={() => navigate("/user-management")} className="text-sm text-amber-400 hover:text-amber-300 transition-colors font-medium">Configuracoes</button>
          </nav>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-amber-400" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {user?.email?.split("@")[0] || "Usuario"}
                </span>
                <span className="text-xs text-gray-400">Advogado</span>
              </div>
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={signOut}
              className="border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-slate-900"
              data-testid="button-sair"
            >
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Grid - Cards escuros */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-6 text-white">
            <div className="flex flex-col items-center text-center">
              <FileText className="w-10 h-10 text-amber-400 mb-2" />
              <span className="text-sm text-gray-300">Processos Ativos</span>
              <span className="text-4xl font-bold">{stats.processosAtivos}</span>
            </div>
          </div>
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-6 text-white">
            <div className="flex flex-col items-center text-center">
              <Calendar className="w-10 h-10 text-amber-400 mb-2" />
              <span className="text-sm text-gray-300">Audiencias Hoje</span>
              <span className="text-4xl font-bold">{stats.audienciasHoje}</span>
            </div>
          </div>
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-6 text-white">
            <div className="flex flex-col items-center text-center">
              <Users className="w-10 h-10 text-amber-400 mb-2" />
              <span className="text-sm text-gray-300">Clientes</span>
              <span className="text-4xl font-bold">{stats.clientes}</span>
            </div>
          </div>
          <div 
            className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-6 text-white cursor-pointer hover:from-slate-700 hover:to-slate-800 transition-all"
            onClick={loadTarefasComProcessos}
            data-testid="kpi-tarefas"
          >
            <div className="flex flex-col items-center text-center">
              <CheckSquare className="w-10 h-10 text-amber-400 mb-2" />
              <span className="text-sm text-gray-300">Tarefas Pendentes</span>
              <span className="text-4xl font-bold">{stats.tarefasPendentes}</span>
            </div>
          </div>
        </div>

        {/* Notificacoes de Tarefas */}
        <div className="mb-6">
          <NotificacoesTarefas />
        </div>

        {/* Quick Actions Grid - Linha 1 (4 cards) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {hasPermission("novo_processo") && (
            <div
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-4 text-white cursor-pointer hover:from-slate-700 hover:to-slate-800 transition-all"
              onClick={() => navigate("/novo-processo")}
              data-testid="card-novo-processo"
            >
              <div className="flex flex-col items-center text-center">
                <Plus className="w-8 h-8 text-green-400 mb-2" />
                <h3 className="font-semibold text-sm">Novo Processo</h3>
                <p className="text-xs text-gray-400">Criar processo judicial</p>
              </div>
            </div>
          )}
          
          {hasPermission("financeiro") && (
            <div
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-4 text-white cursor-pointer hover:from-slate-700 hover:to-slate-800 transition-all"
              onClick={() => navigate("/whatsapp")}
              data-testid="card-whatsapp"
            >
              <div className="flex flex-col items-center text-center">
                <MessageCircle className="w-8 h-8 text-green-400 mb-2" />
                <h3 className="font-semibold text-sm">WhatsApp</h3>
                <p className="text-xs text-gray-400">Enviar cobrancas e gerenciar conexao</p>
              </div>
            </div>
          )}

          {hasPermission("ia_facilita") && (
            <div
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-4 text-white cursor-pointer hover:from-slate-700 hover:to-slate-800 transition-all"
              onClick={() => navigate("/ia-facilita")}
              data-testid="card-ia-facilita"
            >
              <div className="flex flex-col items-center text-center">
                <Bot className="w-8 h-8 text-amber-400 mb-2" />
                <h3 className="font-semibold text-sm">IA Facilita</h3>
                <p className="text-xs text-gray-400">Assistente inteligente</p>
              </div>
            </div>
          )}

          {hasPermission("facilisign") && (
            <div
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-4 text-white cursor-pointer hover:from-slate-700 hover:to-slate-800 transition-all"
              onClick={() => navigate("/facilisign")}
              data-testid="card-facilisign"
            >
              <div className="flex flex-col items-center text-center">
                <PenTool className="w-8 h-8 text-indigo-400 mb-2" />
                <h3 className="font-semibold text-sm">FaciliSign</h3>
                <p className="text-xs text-gray-400">Assinatura digital</p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions Grid - Linha 2 (3 cards) */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {hasPermission("google_integration") && (
            <div
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-4 text-white cursor-pointer hover:from-slate-700 hover:to-slate-800 transition-all"
              onClick={() => navigate("/google-integration")}
              data-testid="card-google"
            >
              <div className="flex flex-col items-center text-center">
                <Settings className="w-8 h-8 text-red-400 mb-2" />
                <h3 className="font-semibold text-sm">Google</h3>
                <p className="text-xs text-gray-400">Integracoes Google</p>
              </div>
            </div>
          )}

          {hasPermission("financeiro") && (
            <div
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-4 text-white cursor-pointer hover:from-slate-700 hover:to-slate-800 transition-all"
              onClick={() => navigate("/financeiro")}
              data-testid="card-financeiro"
            >
              <div className="flex flex-col items-center text-center">
                <DollarSign className="w-8 h-8 text-green-400 mb-2" />
                <h3 className="font-semibold text-sm">Financeiro</h3>
                <p className="text-xs text-gray-400">Gestao financeira</p>
              </div>
            </div>
          )}

          {hasPermission("agenda") && (
            <div
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-4 text-white cursor-pointer hover:from-slate-700 hover:to-slate-800 transition-all"
              onClick={() => navigate("/calendar")}
              data-testid="card-agenda"
            >
              <div className="flex flex-col items-center text-center">
                <Calendar className="w-8 h-8 text-blue-400 mb-2" />
                <h3 className="font-semibold text-sm">Agenda</h3>
                <p className="text-xs text-gray-400">Gestao de compromissos</p>
              </div>
            </div>
          )}

          {(isMaster || isAdmin) && (
            <div
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-4 text-white cursor-pointer hover:from-slate-700 hover:to-slate-800 transition-all"
              onClick={() => navigate("/google-calendar-config")}
              data-testid="card-google-calendar-config"
            >
              <div className="flex flex-col items-center text-center">
                <Calendar className="w-8 h-8 text-amber-400 mb-2" />
                <h3 className="font-semibold text-sm">Google Calendar</h3>
                <p className="text-xs text-gray-400">Config. centralizada</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons - Pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {hasPermission("novo_processo") && (
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full"
              onClick={() => navigate("/novo-processo")}
              data-testid="button-novo-processo"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Processo
            </Button>
          )}

          {hasPermission("financeiro") && (
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white rounded-full"
              onClick={() => navigate("/financeiro")}
              data-testid="button-financeiro"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Financeiro
            </Button>
          )}

          {hasPermission("facilisign") && (
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full"
              onClick={() => navigate("/facilisign")}
              data-testid="button-facilisign"
            >
              <PenTool className="w-4 h-4 mr-2" />
              FaciliSign
            </Button>
          )}

          {hasPermission("google_integration") && (
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => navigate("/google-integration")}
              data-testid="button-google"
            >
              <Settings className="w-4 h-4 mr-2" />
              Integracao Google
            </Button>
          )}

          {hasPermission("agenda") && (
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => navigate("/calendar")}
              data-testid="button-agenda"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Agenda
            </Button>
          )}

          <ClienteDataButton />
        </div>

        {/* Processes Section */}
        <Card className="bg-white dark:bg-slate-800 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-amber-500" />
                Processos
              </CardTitle>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar processos ativos..."
                  className="pl-10 w-full md:w-80"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  data-testid="input-search-processos"
                />
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Active Processes */}
        <Card className="mt-4 bg-white dark:bg-slate-800 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <CardTitle className="text-base font-medium">Processos Ativos</CardTitle>
              <span className="text-sm text-muted-foreground">
                {processos.length} processo(s) ativo(s)
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">
                Carregando...
              </p>
            ) : processos.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                Nenhum processo cadastrado. Clique em "Novo Processo" para
                começar.
              </p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>AÇÕES</TableHead>
                      <TableHead>Nº PROCESSO</TableHead>
                      <TableHead>CLIENTE</TableHead>
                      <TableHead>TIPO DO PROCESSO</TableHead>
                      <TableHead>CLIENTE PRESO</TableHead>
                      <TableHead>PRAZO</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentProcessos.map((processo) => (
                      <TableRow
                        key={processo.id}
                        className={getRowClassName(processo.prazo)}
                      >
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditProcesso(processo.id, processo.user_id)}
                              data-testid={`button-edit-${processo.id}`}
                            >
                              <Edit className="w-4 h-4 text-success" />
                            </Button>
                            {hasPermission("excluir_processo") && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleDeleteProcesso(processo.id, processo.user_id)
                                }
                                data-testid={`button-delete-${processo.id}`}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">
                          {processo.numero_processo}
                        </TableCell>
                        <TableCell>
                          {processo.clientes?.nome || "Cliente não encontrado"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="bg-primary/10 text-primary border-primary/20"
                          >
                            {processo.tipo_processo}
                          </Badge>
                        </TableCell>
                        <TableCell>
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
                        </TableCell>
                        <TableCell>
                          {processo.prazo ? (
                            <div className="flex flex-col">
                              <Badge
                                className={`
                                  w-fit mb-1 
                                  ${
                                    getPrazoColor(processo.prazo) ===
                                    "destructive"
                                      ? "bg-destructive text-destructive-foreground"
                                      : ""
                                  }
                                  ${
                                    getPrazoColor(processo.prazo) === "warning"
                                      ? "bg-amber-500 text-amber-50"
                                      : ""
                                  }
                                  ${
                                    getPrazoColor(processo.prazo) === "success"
                                      ? "bg-green-500 text-green-50"
                                      : ""
                                  }
                                `}
                              >
                                {getPrazoColor(processo.prazo) ===
                                  "destructive" && "Vencido"}
                                {getPrazoColor(processo.prazo) === "warning" &&
                                  "Próximo"}
                                {getPrazoColor(processo.prazo) === "success" &&
                                  "Em dia"}
                              </Badge>
                              <div className="text-sm">
                                {formatDate(processo.prazo)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {getPrazoText(processo.prazo)}
                              </div>
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {/* Controles de paginação */}
                <div className="flex justify-between items-center mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                  >
                    Próxima
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Tarefas */}
      <Dialog open={showTarefasModal} onOpenChange={setShowTarefasModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-amber-400" />
              Tarefas Pendentes ({tarefasComProcessos.length})
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-4">
            {tarefasComProcessos.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma tarefa pendente encontrada.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarefa</TableHead>
                    <TableHead>Processo</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Data Final</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tarefasComProcessos.map((tarefa) => (
                    <TableRow 
                      key={tarefa.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        setShowTarefasModal(false);
                        if (tarefa.processos?.id) {
                          navigate(`/processo/${tarefa.processos.id}`);
                        }
                      }}
                    >
                      <TableCell className="font-medium">
                        {tarefa.title}
                        {tarefa.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {tarefa.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {tarefa.processos?.numero_processo || "-"}
                        {tarefa.processos?.tipo_processo && (
                          <p className="text-xs text-muted-foreground">
                            {tarefa.processos.tipo_processo}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {tarefa.processos?.clientes?.nome || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            tarefa.priority === "alta" ? "destructive" : 
                            tarefa.priority === "media" ? "outline" : 
                            "secondary"
                          }
                          className={tarefa.priority === "media" ? "border-amber-500 text-amber-600" : ""}
                        >
                          {tarefa.priority === "alta" ? "Alta" : 
                           tarefa.priority === "media" ? "Media" : 
                           "Baixa"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {tarefa.due_date ? (
                          <div>
                            <div className="text-sm">{formatDate(tarefa.due_date)}</div>
                            <div className="text-xs text-muted-foreground">
                              {getPrazoText(tarefa.due_date)}
                            </div>
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={tarefa.status === "pendente" ? "outline" : "default"}>
                          {tarefa.status === "pendente" ? "Pendente" : 
                           tarefa.status === "em_andamento" ? "Em Andamento" : 
                           tarefa.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
