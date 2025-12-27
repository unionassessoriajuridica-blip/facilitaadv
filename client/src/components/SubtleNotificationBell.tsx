import * as React from "react";
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bell,
  X,
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  User,
  Briefcase,
  ExternalLink,
  Loader2,
  Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { Database } from "@/integrations/supabase/types";

type Notificacao = Database['public']['Tables']['notificacoes']['Row'];

interface ProcessoInfo {
  numero_processo: string;
  id: string;
  responsavel_financeiro?: string;
}

export const SubtleNotificationBell: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Detalhes
  const [selectedNotif, setSelectedNotif] = useState<Notificacao | null>(null);
  const [processoLoading, setProcessoLoading] = useState(false);
  const [processosCliente, setProcessosCliente] = useState<ProcessoInfo[]>([]);

  // Seleção Múltipla
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      loadNotificacoes();
      checkAndCreateNotifications();
    }
  }, [user]);

  const loadNotificacoes = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotificacoes(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar notificações:', error);
    }
  };

  const checkAndCreateNotifications = async () => {
    try {
      if (!user) return;

      const today = new Date();
      const lastRunKey = `notif_last_run_${user.id}`;
      const lastRunDate = localStorage.getItem(lastRunKey);
      const todayString = today.toISOString().split('T')[0];

      if (lastRunDate === todayString) {
        console.log("[Notificações] Verificação diária já realizada hoje.");
        return;
      }

      const { data: financeiro, error } = await supabase
        .from('financeiro')
        .select('cliente_nome, status')
        .eq('status', 'PENDENTE');

      if (error) throw error;

      const clientesComParcelas: { [key: string]: number } = {};
      financeiro?.forEach(item => {
        if (item.cliente_nome) {
          clientesComParcelas[item.cliente_nome] = (clientesComParcelas[item.cliente_nome] || 0) + 1;
        }
      });

      let createdCount = 0;
      for (const [cliente_nome, count] of Object.entries(clientesComParcelas)) {
        if (count >= 3) {
          // Busca robusta: Qualquer notificação desse tipo para o cliente nos últimos 7 dias
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

          const { data: existingNotifications } = await supabase
            .from('notificacoes')
            .select('id')
            .eq('cliente_nome', cliente_nome)
            .eq('tipo', 'PARCELAS_EM_ABERTO')
            .gte('created_at', sevenDaysAgo.toISOString())
            .limit(1);

          if (!existingNotifications || existingNotifications.length === 0) {
            await supabase
              .from('notificacoes')
              .insert({
                user_id: user.id,
                tipo: 'PARCELAS_EM_ABERTO',
                titulo: 'Atenção: Parcelas em Aberto',
                mensagem: `O cliente ${cliente_nome} possui ${count} parcelas pendentes. Considere entrar em contato.`,
                cliente_nome: cliente_nome,
                lida: false
              });
            createdCount++;
          }
        }
      }

      if (createdCount > 0) {
        loadNotificacoes();
      }

      // Registra que a verificação de hoje foi concluída
      localStorage.setItem(lastRunKey, todayString);

    } catch (error: any) {
      console.error('Erro ao verificar parcelas:', error);
    }
  };

  const loadProcessosInfo = async (cliente_nome: string) => {
    try {
      setProcessoLoading(true);
      const trimmedName = cliente_nome.trim();

      // 1. Primeiro buscamos o cliente pelo nome para pegar o ID
      const { data: clienteData, error: clienteError } = await supabase
        .from('clientes')
        .select('id')
        .ilike('nome', `%${trimmedName}%`)
        .maybeSingle();

      if (clienteError || !clienteData) {
        setProcessosCliente([]);
        return;
      }

      // 2. Agora buscamos os processos vinculados a esse cliente
      const { data: processosData, error: processosError } = await supabase
        .from('processos')
        .select(`
          id, 
          numero_processo
        `)
        .eq('cliente_id', clienteData.id);

      if (processosError) throw processosError;

      if (!processosData || processosData.length === 0) {
        setProcessosCliente([]);
        return;
      }

      // 3. Opcionalmente buscamos o responsável financeiro para esses processos
      const processoIds = processosData.map(p => p.id);
      const { data: respData } = await supabase
        .from('responsavel_financeiro')
        .select('nome, processo_id')
        .in('processo_id', processoIds);

      const formattedData: ProcessoInfo[] = processosData.map(p => ({
        id: p.id,
        numero_processo: p.numero_processo,
        responsavel_financeiro: respData?.find(r => r.processo_id === p.id)?.nome
      }));

      setProcessosCliente(formattedData);
    } catch (error: any) {
      console.error('Erro ao carregar info dos processos:', error);
    } finally {
      setProcessoLoading(false);
    }
  };

  const handleOpenDetails = (notif: Notificacao) => {
    setSelectedNotif(notif);
    if (notif.cliente_nome) {
      loadProcessosInfo(notif.cliente_nome as string);
    }
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === currentItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(currentItems.map(item => item.id)));
    }
  };

  const marcarComoLida = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('id', id);

      if (error) throw error;

      setNotificacoes(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, lida: true } : notif
        )
      );

      if (selectedNotif?.id === id) {
        setSelectedNotif(prev => prev ? { ...prev, lida: true } : null);
      }

      toast({
        title: "Notificação marcada como lida",
        variant: "default"
      });
    } catch (error: any) {
      console.error('Erro ao marcar notificação:', error);
    }
  };

  const handleMassMarkRead = async () => {
    try {
      setLoading(true);
      const ids = Array.from(selectedIds);
      const { error } = await supabase
        .from('notificacoes')
        .update({ lida: true })
        .in('id', ids);

      if (error) throw error;

      setNotificacoes(prev =>
        prev.map(n => ids.includes(n.id) ? { ...n, lida: true } : n)
      );
      setSelectedIds(new Set());
      toast({ title: `${ids.length} notificações marcadas como lidas` });
    } catch (error: any) {
      console.error('Erro em massa:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMassDelete = async () => {
    try {
      setLoading(true);
      const ids = Array.from(selectedIds);
      const { error } = await supabase
        .from('notificacoes')
        .delete()
        .in('id', ids);

      if (error) throw error;

      setNotificacoes(prev => prev.filter(n => !ids.includes(n.id)));
      setSelectedIds(new Set());
      setSelectedNotif(null);
      toast({ title: `${ids.length} notificações excluídas` });
    } catch (error: any) {
      console.error('Erro ao excluir:', error);
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const notificacaoNaoLidas = notificacoes.filter(n => !n.lida);
  const totalPages = Math.ceil(notificacoes.length / itemsPerPage);
  const currentItems = notificacoes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (notificacoes.length === 0) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-4 h-4" />
            {notificacaoNaoLidas.length > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {notificacaoNaoLidas.length}
              </Badge>
            )}
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-6">
          <DialogHeader>
            <div className="flex items-center justify-between mr-8">
              <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                <Bell className="w-6 h-6 text-primary" />
                Notificações do Sistema
                {notificacaoNaoLidas.length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {notificacaoNaoLidas.length} não lidas
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Gerencie seus alertas financeiros e processos vinculados
              </DialogDescription>

              <div className="flex gap-2">
                {selectedIds.size > 0 && (
                  <>
                    <Button size="sm" variant="default" onClick={handleMassMarkRead} disabled={loading}>
                      <Check className="w-4 h-4 mr-1" /> Lido ({selectedIds.size})
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setShowDeleteConfirm(true)} disabled={loading}>
                      <Trash2 className="w-4 h-4 mr-1" /> Excluir ({selectedIds.size})
                    </Button>
                  </>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 flex-1 overflow-hidden">
            {/* Lista de Notificações */}
            <div className="flex flex-col gap-4 overflow-hidden border-r pr-4">
              <div className="flex items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedIds.size === currentItems.length && currentItems.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                  <label htmlFor="select-all" className="text-xs text-gray-500 cursor-pointer">Selecionar todos nesta página</label>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {currentItems.map((notificacao) => (
                  <div
                    key={notificacao.id}
                    className={`relative flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md ${selectedNotif?.id === notificacao.id
                      ? 'ring-2 ring-primary bg-primary/5 border-primary/20'
                      : !notificacao.lida
                        ? 'bg-orange-50 border-orange-200 border-l-4 border-l-orange-500'
                        : 'bg-white border-gray-100 opacity-80'
                      }`}
                  >
                    <Checkbox
                      checked={selectedIds.has(notificacao.id)}
                      onCheckedChange={() => toggleSelection(notificacao.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1"
                    />

                    <div className="flex-1 min-w-0" onClick={() => handleOpenDetails(notificacao)}>
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className={`w-4 h-4 ${!notificacao.lida ? 'text-orange-600' : 'text-gray-400'}`} />
                        <span className="font-semibold text-sm truncate">{notificacao.titulo}</span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {notificacao.mensagem}
                      </p>
                      <span className="text-[10px] text-gray-400 mt-2 block">
                        {new Date(notificacao.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    {!notificacao.lida && (
                      <div className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t mt-auto">
                  <p className="text-xs text-muted-foreground">
                    Página {currentPage} de {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => p - 1)}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => p + 1)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Detalhamento */}
            <div className="bg-gray-50/50 rounded-2xl border p-6 flex flex-col overflow-hidden">
              {selectedNotif ? (
                <div className="space-y-6 flex flex-col h-full overflow-hidden">
                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <ExternalLink className="w-5 h-5 text-primary" />
                      Detalhes do Alerta
                    </h3>

                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3 text-sm font-semibold text-gray-700 mb-2">
                          <User className="w-4 h-4 text-primary" />
                          Cliente / Responsável
                        </div>
                        <p className="text-sm font-bold text-primary pl-7">
                          {selectedNotif.cliente_nome || 'Não identificado'}
                        </p>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="flex items-center gap-3 text-sm font-semibold text-gray-700 mb-3">
                          <Briefcase className="w-4 h-4 text-primary" />
                          Processos Vinculados
                        </div>

                        <div className="pl-7 space-y-2">
                          {processoLoading ? (
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <Loader2 className="w-3 h-3 animate-spin" /> Carregando...
                            </div>
                          ) : processosCliente.length > 0 ? (
                            processosCliente.map((p) => (
                              <div
                                key={p.id}
                                onClick={() => {
                                  setOpen(false);
                                  navigate(`/processo/${p.id}`);
                                }}
                                className="p-3 bg-gray-50 rounded-lg border border-gray-100 group hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
                              >
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-bold text-gray-800 flex items-center gap-2 group-hover:text-primary">
                                    {p.numero_processo}
                                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </p>
                                </div>
                                {p.responsavel_financeiro && (
                                  <p className="text-[10px] text-gray-500 italic mt-1">
                                    Resp: {p.responsavel_financeiro}
                                  </p>
                                )}
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-gray-400 italic">Nenhum processo encontrado para este cliente.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto space-y-3 pt-6 border-t border-gray-200">
                    <p className="text-[11px] text-gray-500 italic leading-relaxed bg-white p-3 rounded-lg border">
                      "O alerta é gerado automaticamente toda **segunda-feira** quando o sistema detecta 3 ou mais parcelas pendentes acumuladas. O sistema evita duplicatas repetindo o alerta apenas após 7 dias."
                    </p>

                    <div className="flex gap-2">
                      {!selectedNotif.lida && (
                        <Button
                          className="flex-1 gap-2"
                          onClick={() => marcarComoLida(selectedNotif.id)}
                        >
                          <Check className="w-4 h-4" />
                          Marcar como Resolvido
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        className="w-12 h-10 p-0"
                        onClick={() => setSelectedNotif(null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <Bell className="w-16 h-16 mb-4 text-gray-300" />
                  <p className="text-sm font-medium text-gray-500">
                    Selecione um alerta na lista<br />para ver mais detalhes
                  </p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deseja realmente excluir as notificações?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação excluirá permanentemente as {selectedIds.size} notificações selecionadas. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleMassDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
