import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth.ts";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client.ts";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
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
import { ArrowLeft, Calendar, Clock, Gavel } from "lucide-react";
import { useGlobalAccess } from "@/utils/accessUtils.ts";
import { AppHeader } from "@/components/AppHeader";

interface Processo {
  id: string;
  numero_processo: string;
  tipo_processo: string;
  prazo: string;
  status: string | null;
  descricao: string | null;
  clientes: { nome: string } | null;
}

const AudienciasProximas = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [processosHoje, setProcessosHoje] = useState<Processo[]>([]);
  const [processosSemana, setProcessosSemana] = useState<Processo[]>([]);
  const [processosMes, setProcessosMes] = useState<Processo[]>([]);
  const [loading, setLoading] = useState(true);
  const { canViewAllProcesses: hasGlobalProcessAccess } = useGlobalAccess();

  useEffect(() => {
    if (user) {
      loadProcessosComPrazos();
    }
  }, [user]);

  const loadProcessosComPrazos = async () => {
    try {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const hojeStr = hoje.toISOString().split("T")[0];

      const fimSemana = new Date(hoje);
      fimSemana.setDate(fimSemana.getDate() + 7);
      const fimSemanaStr = fimSemana.toISOString().split("T")[0];

      const fimMes = new Date(hoje);
      fimMes.setDate(fimMes.getDate() + 30);
      const fimMesStr = fimMes.toISOString().split("T")[0];

      let query = supabase
        .from("processos")
        .select(`
          id,
          numero_processo,
          tipo_processo,
          prazo,
          status,
          descricao,
          clientes (nome)
        `)
        .not("prazo", "is", null)
        .gte("prazo", hojeStr)
        .order("prazo", { ascending: true });

      if (!hasGlobalProcessAccess && user?.id) {
        query = query.eq("user_id", user.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Erro ao carregar processos:", error);
        return;
      }

      const processos = (data || []) as Processo[];

      const hoje_ = processos.filter(p => p.prazo === hojeStr);
      const semana = processos.filter(p => 
        p.prazo > hojeStr && p.prazo <= fimSemanaStr
      );
      const mes = processos.filter(p => 
        p.prazo > fimSemanaStr && p.prazo <= fimMesStr
      );

      setProcessosHoje(hoje_);
      setProcessosSemana(semana);
      setProcessosMes(mes);
    } catch (error) {
      console.error("Erro ao carregar processos:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T12:00:00");
    return date.toLocaleDateString("pt-BR", { 
      weekday: "long", 
      day: "2-digit", 
      month: "long" 
    });
  };

  const getDiasRestantes = (dateStr: string) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const data = new Date(dateStr + "T12:00:00");
    const diff = Math.ceil((data.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const renderProcessoRow = (processo: Processo) => (
    <TableRow 
      key={processo.id}
      className="cursor-pointer hover:bg-muted/50"
      onClick={() => navigate(`/processo/${processo.id}`)}
      data-testid={`row-processo-${processo.id}`}
    >
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">{formatDate(processo.prazo)}</span>
        </div>
      </TableCell>
      <TableCell className="font-medium">
        {processo.numero_processo}
        <p className="text-xs text-muted-foreground">{processo.tipo_processo}</p>
      </TableCell>
      <TableCell>{processo.clientes?.nome || "-"}</TableCell>
      <TableCell>
        <Badge variant={processo.status === "ativo" ? "default" : "secondary"}>
          {processo.status || "Nao definido"}
        </Badge>
      </TableCell>
      <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
        {processo.descricao || "-"}
      </TableCell>
      <TableCell>
        {getDiasRestantes(processo.prazo) === 0 ? (
          <Badge variant="destructive">Hoje</Badge>
        ) : (
          <Badge variant="secondary">
            {getDiasRestantes(processo.prazo)} dias
          </Badge>
        )}
      </TableCell>
    </TableRow>
  );

  const renderEmptyState = () => (
    <div className="p-8 text-center text-muted-foreground">
      <Gavel className="w-12 h-12 mx-auto mb-4 opacity-50" />
      <p>Nenhum compromisso agendado para este periodo</p>
    </div>
  );

  const renderLoading = () => (
    <div className="p-8 text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900">
      <AppHeader />

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
            <h1 className="text-2xl font-bold">Audiencias e Prazos</h1>
            <p className="text-muted-foreground">Acompanhe os prazos dos seus processos</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
            <CardContent className="p-4 flex items-center gap-4">
              <Calendar className="w-10 h-10 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Hoje</p>
                <p className="text-3xl font-bold text-red-600">{processosHoje.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="p-4 flex items-center gap-4">
              <Clock className="w-10 h-10 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">Esta Semana</p>
                <p className="text-3xl font-bold text-amber-600">{processosSemana.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
            <CardContent className="p-4 flex items-center gap-4">
              <Gavel className="w-10 h-10 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Proximo Mes</p>
                <p className="text-3xl font-bold text-blue-600">{processosMes.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-0">
            <Tabs defaultValue="hoje" className="w-full">
              <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                <TabsTrigger 
                  value="hoje" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:bg-transparent"
                >
                  <Calendar className="w-4 h-4 mr-2 text-red-500" />
                  Hoje ({processosHoje.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="semana"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent"
                >
                  <Clock className="w-4 h-4 mr-2 text-amber-500" />
                  Esta Semana ({processosSemana.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="mes"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent"
                >
                  <Gavel className="w-4 h-4 mr-2 text-blue-500" />
                  Proximo Mes ({processosMes.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="hoje" className="m-0">
                {loading ? renderLoading() : processosHoje.length === 0 ? renderEmptyState() : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Processo</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Descricao</TableHead>
                        <TableHead>Prazo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processosHoje.map(renderProcessoRow)}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="semana" className="m-0">
                {loading ? renderLoading() : processosSemana.length === 0 ? renderEmptyState() : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Processo</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Descricao</TableHead>
                        <TableHead>Dias</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processosSemana.map(renderProcessoRow)}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="mes" className="m-0">
                {loading ? renderLoading() : processosMes.length === 0 ? renderEmptyState() : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Processo</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Descricao</TableHead>
                        <TableHead>Dias</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processosMes.map(renderProcessoRow)}
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

export default AudienciasProximas;
