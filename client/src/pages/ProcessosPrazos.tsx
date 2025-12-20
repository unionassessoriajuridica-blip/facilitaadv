import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth.ts";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client.ts";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { Scale, ArrowLeft, AlertTriangle, Clock, FileText, User } from "lucide-react";
import { useGlobalAccess } from "@/utils/accessUtils.ts";

interface ProcessoComTarefas {
  id: string;
  numero_processo: string;
  tipo_processo: string;
  status: string | null;
  clientes: { nome: string } | null;
  tarefas: {
    id: string;
    title: string;
    due_date: string;
    priority: string;
    status: string;
  }[];
}

const ProcessosPrazos = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [processosVencidos, setProcessosVencidos] = useState<ProcessoComTarefas[]>([]);
  const [processosAVencer, setProcessosAVencer] = useState<ProcessoComTarefas[]>([]);
  const [loading, setLoading] = useState(true);
  const { canViewAllProcesses: hasGlobalProcessAccess } = useGlobalAccess();

  useEffect(() => {
    if (user) {
      loadProcessosComPrazos();
    }
  }, [user]);

  const loadProcessosComPrazos = async () => {
    try {
      const hoje = new Date().toISOString().split("T")[0];

      let processosQuery = supabase
        .from("processos")
        .select(`
          id,
          numero_processo,
          tipo_processo,
          status,
          clientes (nome)
        `);

      if (!hasGlobalProcessAccess && user?.id) {
        processosQuery = processosQuery.eq("user_id", user.id);
      }

      const { data: processos, error: processosError } = await processosQuery;

      if (processosError) {
        console.error("Erro ao carregar processos:", processosError);
        return;
      }

      if (!processos || processos.length === 0) {
        setProcessosVencidos([]);
        setProcessosAVencer([]);
        setLoading(false);
        return;
      }

      const processosIds = processos.map(p => p.id);

      const { data: tarefas, error: tarefasError } = await (supabase as any)
        .from("tasks")
        .select("id, title, due_date, priority, status, process_id")
        .in("process_id", processosIds)
        .neq("status", "concluida")
        .not("due_date", "is", null);

      if (tarefasError) {
        console.error("Erro ao carregar tarefas:", tarefasError);
        return;
      }

      const vencidos: ProcessoComTarefas[] = [];
      const aVencer: ProcessoComTarefas[] = [];

      processos.forEach(processo => {
        const tarefasDoProcesso = (tarefas || []).filter((t: any) => t.process_id === processo.id);
        
        const tarefasVencidas = tarefasDoProcesso.filter((t: any) => t.due_date < hoje);
        const tarefasAVencer = tarefasDoProcesso.filter((t: any) => t.due_date >= hoje);

        if (tarefasVencidas.length > 0) {
          vencidos.push({
            ...processo,
            tarefas: tarefasVencidas.sort((a: any, b: any) => a.due_date.localeCompare(b.due_date))
          });
        }

        if (tarefasAVencer.length > 0) {
          aVencer.push({
            ...processo,
            tarefas: tarefasAVencer.sort((a: any, b: any) => a.due_date.localeCompare(b.due_date))
          });
        }
      });

      vencidos.sort((a, b) => {
        const dataA = a.tarefas[0]?.due_date || "";
        const dataB = b.tarefas[0]?.due_date || "";
        return dataA.localeCompare(dataB);
      });

      aVencer.sort((a, b) => {
        const dataA = a.tarefas[0]?.due_date || "";
        const dataB = b.tarefas[0]?.due_date || "";
        return dataA.localeCompare(dataB);
      });

      setProcessosVencidos(vencidos);
      setProcessosAVencer(aVencer);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T12:00:00");
    return date.toLocaleDateString("pt-BR");
  };

  const getDiasRestantes = (dateStr: string) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const data = new Date(dateStr + "T12:00:00");
    const diff = Math.ceil((data.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const renderProcessoRow = (processo: ProcessoComTarefas, isVencido: boolean) => (
    <TableRow 
      key={processo.id}
      className="cursor-pointer hover:bg-muted/50"
      onClick={() => navigate(`/processo/${processo.id}`)}
      data-testid={`row-processo-${processo.id}`}
    >
      <TableCell className="font-medium">
        {processo.numero_processo}
        <p className="text-xs text-muted-foreground">{processo.tipo_processo}</p>
      </TableCell>
      <TableCell>{processo.clientes?.nome || "-"}</TableCell>
      <TableCell>
        <div className="space-y-1">
          {processo.tarefas.slice(0, 3).map(tarefa => (
            <div key={tarefa.id} className="text-sm">
              <span className="font-medium">{tarefa.title}</span>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{formatDate(tarefa.due_date)}</span>
                {isVencido ? (
                  <Badge variant="destructive" className="text-xs">
                    {Math.abs(getDiasRestantes(tarefa.due_date))} dias atrasado
                  </Badge>
                ) : (
                  <Badge 
                    variant={getDiasRestantes(tarefa.due_date) <= 3 ? "destructive" : "outline"}
                    className="text-xs"
                  >
                    {getDiasRestantes(tarefa.due_date) === 0 
                      ? "Hoje" 
                      : `${getDiasRestantes(tarefa.due_date)} dias`}
                  </Badge>
                )}
              </div>
            </div>
          ))}
          {processo.tarefas.length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{processo.tarefas.length - 3} tarefas
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={processo.status === "ativo" ? "default" : "secondary"}>
          {processo.status}
        </Badge>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900">
      <header className="w-full bg-slate-900 text-white">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Scale className="w-6 h-6 text-amber-400" />
            <span className="font-bold text-lg">Facilita ADV</span>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <button onClick={() => navigate("/dashboard")} className="text-sm text-amber-400 hover:text-amber-300 transition-colors font-medium" data-testid="nav-dashboard">Dashboard</button>
            <span className="text-sm text-white font-medium border-b-2 border-amber-400 pb-1">Processos</span>
            <button onClick={() => navigate("/audiencias")} className="text-sm text-amber-400 hover:text-amber-300 transition-colors font-medium" data-testid="nav-audiencias">Audiencias</button>
            <button onClick={() => navigate("/financeiro")} className="text-sm text-amber-400 hover:text-amber-300 transition-colors font-medium" data-testid="nav-financeiro">Financeiro</button>
            <button onClick={() => navigate("/user-management")} className="text-sm text-amber-400 hover:text-amber-300 transition-colors font-medium" data-testid="nav-configuracoes">Configuracoes</button>
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
            >
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            data-testid="button-voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Processos com Prazos</h1>
            <p className="text-muted-foreground">Gerencie os prazos dos seus processos</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
            <CardContent className="p-4 flex items-center gap-4">
              <AlertTriangle className="w-10 h-10 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Prazos Vencidos</p>
                <p className="text-3xl font-bold text-red-600">{processosVencidos.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="p-4 flex items-center gap-4">
              <Clock className="w-10 h-10 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">Prazos a Vencer</p>
                <p className="text-3xl font-bold text-amber-600">{processosAVencer.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-0">
            <Tabs defaultValue="vencidos" className="w-full">
              <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                <TabsTrigger 
                  value="vencidos" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:bg-transparent"
                >
                  <AlertTriangle className="w-4 h-4 mr-2 text-red-500" />
                  Vencidos ({processosVencidos.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="avencer"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent"
                >
                  <Clock className="w-4 h-4 mr-2 text-amber-500" />
                  A Vencer ({processosAVencer.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="vencidos" className="m-0">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : processosVencidos.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum processo com prazo vencido</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Processo</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Tarefas Vencidas</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processosVencidos.map(p => renderProcessoRow(p, true))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="avencer" className="m-0">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : processosAVencer.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum processo com prazo a vencer</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Processo</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Proximos Prazos</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processosAVencer.map(p => renderProcessoRow(p, false))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProcessosPrazos;
