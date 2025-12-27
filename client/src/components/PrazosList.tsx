import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { Calendar, Clock, AlertTriangle, CheckCircle, ExternalLink, ChevronDown, RefreshCw, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useGlobalLoading } from '@/contexts/LoadingContext';
import { cn } from '@/lib/utils';
import { useBuscaAvancada } from '@/hooks/useBuscaAvancada';
import { BuscaAvancada } from './prazos/BuscaAvancada';
import { FiltrosAtivosChips } from './prazos/FiltrosAtivosChips';
import { addDays } from 'date-fns';

interface Prazo {
    id: string;
    processo_id: string;
    movimento_descricao: string;
    tipo_prazo: string;
    dias_prazo: number;
    data_inicio: string;
    data_final: string;
    status: 'ATIVO' | 'CUMPRIDO' | 'VENCIDO' | 'CANCELADO';
    observacoes: string;
    created_at: string;
    processos?: {
        numero_processo: string;
        cliente_id: string;
        clientes?: {
            nome: string;
        };
    };
}

export const PrazosList: React.FC = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const { startLoading, stopLoading } = useGlobalLoading();

    const [prazos, setPrazos] = useState<Prazo[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'TODOS' | 'URGENTE' | 'ATENCAO' | 'MEDIO' | 'LONGO'>('TODOS');
    const [isOpen, setIsOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Busca Avançada
    const {
        filtros,
        updateFiltro,
        toggleUrgencia,
        removerFiltro,
        limparFiltros,
        getFiltrosAtivos,
        temFiltrosAtivos,
        drawerOpen,
        setDrawerOpen
    } = useBuscaAvancada();

    useEffect(() => {
        if (user) {
            loadPrazos();
        }
    }, [user, currentPage, filter, filtros]);

    const loadPrazos = async () => {
        try {
            setLoading(true);

            // Calcular datas para filtros
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            const tresDias = new Date(hoje);
            tresDias.setDate(tresDias.getDate() + 3);
            const seteDias = new Date(hoje);
            seteDias.setDate(seteDias.getDate() + 7);

            // Query base
            let baseQuery = (supabase as any)
                .from('prazos')
                .select(`
          *,
          processos(
            id,
            numero_processo,
            cliente_id
          )
        `, { count: 'exact' })
                .is('cumprido_em', null)
                .order('data_final', { ascending: true });

            // Aplicar filtros avançados
            if (filtros.cliente_id) {
                console.log('[PrazosList] Filtrando por cliente:', filtros.cliente_id, filtros.cliente_nome);

                // Buscar IDs dos processos do cliente
                const { data: processosDoCliente } = await (supabase as any)
                    .from('processos')
                    .select('id')
                    .eq('cliente_id', filtros.cliente_id);

                const processoIds = processosDoCliente?.map((p: any) => p.id) || [];
                console.log('[PrazosList] Processos do cliente:', processoIds.length);

                if (processoIds.length > 0) {
                    // Filtrar prazos pelos IDs dos processos
                    baseQuery = baseQuery.in('processo_id', processoIds);
                } else {
                    // Cliente sem processos - retornar vazio
                    setPrazos([]);
                    setTotalCount(0);
                    setLoading(false);
                    return;
                }
            }

            // Filtrar por processo específico
            if (filtros.processo_id) {
                console.log('[PrazosList] Filtrando por processo:', filtros.processo_id, filtros.numero_processo);
                baseQuery = baseQuery.eq('processo_id', filtros.processo_id);
            }

            // Aplicar filtros de urgência da busca avançada
            let usarFiltroAvancadoUrgencia = false;
            if (filtros.urgencias && filtros.urgencias.length > 0) {
                console.log('[PrazosList] Filtrando por urgências avançadas:', filtros.urgencias);
                usarFiltroAvancadoUrgencia = true;

                const hoje = new Date();
                hoje.setHours(0, 0, 0, 0);

                // Construir condições OR para cada urgência selecionada
                const condicoesOr: string[] = [];

                filtros.urgencias.forEach(urg => {
                    switch (urg) {
                        case 'urgente': {
                            const limite = new Date(hoje);
                            limite.setDate(limite.getDate() + 3);
                            condicoesOr.push(`data_final.lte.${limite.toISOString().split('T')[0]}`);
                            break;
                        }
                        case 'atencao': {
                            const min = new Date(hoje);
                            min.setDate(min.getDate() + 4);
                            const max = new Date(hoje);
                            max.setDate(max.getDate() + 7);
                            condicoesOr.push(`and(data_final.gte.${min.toISOString().split('T')[0]},data_final.lte.${max.toISOString().split('T')[0]})`);
                            break;
                        }
                        case 'medio': {
                            const min = new Date(hoje);
                            min.setDate(min.getDate() + 8);
                            const max = new Date(hoje);
                            max.setDate(max.getDate() + 15);
                            condicoesOr.push(`and(data_final.gte.${min.toISOString().split('T')[0]},data_final.lte.${max.toISOString().split('T')[0]})`);
                            break;
                        }
                        case 'longo': {
                            const min = new Date(hoje);
                            min.setDate(min.getDate() + 16);
                            condicoesOr.push(`data_final.gte.${min.toISOString().split('T')[0]}`);
                            break;
                        }
                    }
                });

                if (condicoesOr.length > 0) {
                    // Aplicar OR entre as condições
                    const orFilter = condicoesOr.join(',');
                    console.log('[PrazosList] OR Filter:', orFilter);
                    baseQuery = baseQuery.or(orFilter);
                }
            }

            // Aplicar filtro específico de urgência (botões rápidos) - APENAS se não houver filtro avançado
            let query;
            if (usarFiltroAvancadoUrgencia) {
                // Usar apenas baseQuery com filtros avançados
                console.log('[PrazosList] Usando filtros avançados de urgência, ignorando filtro rápido');
                query = baseQuery;
            } else if (filter === 'URGENTE') {
                const dataLimite = tresDias.toISOString().split('T')[0];
                console.log(`[PrazosList] Filtro URGENTE: data_final <= ${dataLimite}`);
                query = (supabase as any)
                    .from('prazos')
                    .select(`*,processos(id,numero_processo,cliente_id)`, { count: 'exact' })
                    .is('cumprido_em', null)
                    .lte('data_final', dataLimite)
                    .order('data_final', { ascending: true });
            } else if (filter === 'ATENCAO') {
                const dataMin = tresDias.toISOString().split('T')[0];
                const dataMax = seteDias.toISOString().split('T')[0];
                console.log(`[PrazosList] Filtro ATENÇÃO: ${dataMin} < data_final <= ${dataMax}`);
                query = (supabase as any)
                    .from('prazos')
                    .select(`*,processos(id,numero_processo,cliente_id)`, { count: 'exact' })
                    .is('cumprido_em', null)
                    .gt('data_final', dataMin)
                    .lte('data_final', dataMax)
                    .order('data_final', { ascending: true });
            } else if (filter === 'MEDIO') {
                const oitoDias = new Date(hoje);
                oitoDias.setDate(oitoDias.getDate() + 8);
                const quinzeDias = new Date(hoje);
                quinzeDias.setDate(quinzeDias.getDate() + 15);
                const dataMin = seteDias.toISOString().split('T')[0];
                const dataMax = quinzeDias.toISOString().split('T')[0];
                console.log(`[PrazosList] Filtro MÉDIO: ${dataMin} < data_final <= ${dataMax}`);
                query = (supabase as any)
                    .from('prazos')
                    .select(`*,processos(id,numero_processo,cliente_id)`, { count: 'exact' })
                    .is('cumprido_em', null)
                    .gt('data_final', dataMin)
                    .lte('data_final', dataMax)
                    .order('data_final', { ascending: true });
            } else if (filter === 'LONGO') {
                const quinzeDias = new Date(hoje);
                quinzeDias.setDate(quinzeDias.getDate() + 15);
                const dataMin = quinzeDias.toISOString().split('T')[0];
                console.log(`[PrazosList] Filtro LONGO: data_final > ${dataMin}`);
                query = (supabase as any)
                    .from('prazos')
                    .select(`*,processos(id,numero_processo,cliente_id)`, { count: 'exact' })
                    .is('cumprido_em', null)
                    .gt('data_final', dataMin)
                    .order('data_final', { ascending: true });
            } else {
                console.log('[PrazosList] Filtro TODOS: sem filtro de data');
                // TODOS - sem filtro de data
                query = baseQuery;
            }

            // Paginação
            const start = (currentPage - 1) * itemsPerPage;
            const end = start + itemsPerPage - 1;
            query = query.range(start, end);

            const { data, error, count } = await query;

            if (error) throw error;

            // Se não retornou dados mas há prazos, pode estar numa página inválida
            if ((!data || data.length === 0) && count && count > 0 && currentPage > 1) {
                console.warn('[PrazosList] Página atual inválida, voltando para página 1');
                setCurrentPage(1);
                return; // Vai recarregar na página 1
            }

            console.log('[PrazosList] Prazos carregados:', data?.length);

            // Buscar dados dos clientes para os processos retornados
            if (data && data.length > 0) {
                const clienteIds = data
                    .map((p: any) => p.processos?.cliente_id)
                    .filter(Boolean);

                console.log('[PrazosList] IDs de clientes encontrados:', clienteIds);

                if (clienteIds.length > 0) {
                    // Tentar query em lote
                    let clientesData: any[] = [];
                    let clientesError: any = null;

                    try {
                        const result = await (supabase as any)
                            .from('clientes')
                            .select('id, nome')
                            .in('id', clienteIds);

                        clientesData = result.data || [];
                        clientesError = result.error;

                        console.log('[PrazosList] Clientes carregados:', clientesData);
                        console.log('[PrazosList] Erro (se houver):', clientesError);

                        // Identificar IDs únicos
                        const uniqueClientIds = [...new Set(clienteIds)] as string[];
                        console.log('[PrazosList] Total de IDs únicos:', uniqueClientIds.length);
                        console.log('[PrazosList] Clientes carregados via Supabase:', clientesData.length);

                        // Se RLS bloqueou QUALQUER cliente (mesmo que parcialmente), buscar TODOS via API
                        if (clientesData.length < uniqueClientIds.length) {
                            console.warn(`[PrazosList] RLS bloqueou ${uniqueClientIds.length - clientesData.length} clientes! Buscando via API...`);

                            // Obter token de autenticação
                            const { data: { session } } = await supabase.auth.getSession();
                            const authToken = session?.access_token;

                            if (!authToken) {
                                console.error('[PrazosList] Sem token de autenticação para buscar clientes via API');
                            } else {
                                // Buscar TODOS os clientes únicos via API (sem limite)
                                const uniqueClientIds: string[] = [...new Set(clienteIds)] as string[];
                                console.log('[PrazosList] Buscando', uniqueClientIds.length, 'clientes únicos via API');
                                console.log('[PrazosList] IDs:', uniqueClientIds);

                                const clientesViaApi = await Promise.all(
                                    uniqueClientIds.map(async (id: string) => {
                                        try {
                                            console.log(`[PrazosList] → Fetching cliente ${id}...`);
                                            const res = await fetch(`/api/clientes/${id}`, {
                                                headers: {
                                                    'Authorization': `Bearer ${authToken}`
                                                }
                                            });
                                            if (res.ok) {
                                                const cliente = await res.json();
                                                console.log(`[PrazosList] ✓ Cliente ${id}: ${cliente.nome}`);
                                                return { id, nome: cliente.nome };
                                            } else {
                                                console.error(`[PrazosList] ✗ Cliente ${id}: status ${res.status}`);
                                            }
                                        } catch (e) {
                                            console.error(`[PrazosList] ✗ Erro ao buscar cliente ${id}:`, e);
                                        }
                                        return null;
                                    })
                                );

                                clientesData = clientesViaApi.filter(c => c !== null);
                                console.log('[PrazosList] Clientes carregados via API:', clientesData);
                            }
                        }
                    } catch (error) {
                        console.error('[PrazosList] Exceção ao carregar clientes:', error);
                    }

                    // Mapear clientes aos processos
                    const clientesMap = new Map(clientesData?.map((c: any) => [c.id, c]) || []);

                    data.forEach((prazo: any) => {
                        if (prazo.processos?.cliente_id) {
                            const cliente: any = clientesMap.get(prazo.processos.cliente_id);
                            if (cliente) {
                                prazo.processos.clientes = cliente;
                                console.log('[PrazosList] Cliente mapeado:', cliente.nome, 'para prazo', prazo.id);
                            } else {
                                console.warn('[PrazosList] Cliente não encontrado para ID:', prazo.processos.cliente_id);
                            }
                        }
                    });
                }
            }

            console.log('[PrazosList] Dados finais:', data);
            setPrazos(data || []);
            setTotalCount(count || 0);
        } catch (error: any) {
            console.error('Erro ao carregar prazos:', error);
            toast({
                title: 'Erro ao carregar prazos',
                description: error.message,
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const verificarNovosPrazos = async () => {
        try {
            startLoading('Verificando novos prazos processuais...');

            // Obter token
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) {
                throw new Error('Não autenticado');
            }

            // Iniciar job em background
            const response = await fetch('/api/datajud/check-prazos', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao verificar');
            }

            const { jobId } = await response.json();

            toast({
                title: '✅ Verificação iniciada',
                description: 'Processando em background... Você será notificado quando concluir.',
            });

            // Polling a cada 5 segundos
            const pollInterval = setInterval(async () => {
                try {
                    const statusRes = await fetch(`/api/datajud/check-prazos/${jobId}`);
                    if (!statusRes.ok) {
                        clearInterval(pollInterval);
                        stopLoading();
                        return;
                    }

                    const status = await statusRes.json();

                    if (status.status === 'completed') {
                        clearInterval(pollInterval);
                        stopLoading();

                        // Resetar filtros e página para mostrar TODOS os prazos ativos
                        setFilter('TODOS');
                        setCurrentPage(1);

                        toast({
                            title: '✅ Verificação concluída!',
                            description: `${status.result.prazosCreated || 0} novos prazos criados. Mostrando todos os prazos ativos.`,
                        });

                        // Recarregar lista após resetar state (aguardar render)
                        setTimeout(() => loadPrazos(), 200);
                    } else if (status.status === 'error') {
                        clearInterval(pollInterval);
                        stopLoading();

                        toast({
                            title: 'Erro ao verificar',
                            description: status.error,
                            variant: 'destructive'
                        });
                    }
                } catch (error) {
                    clearInterval(pollInterval);
                    stopLoading();
                }
            }, 5000);

        } catch (error: any) {
            stopLoading();
            toast({
                title: 'Erro ao iniciar verificação',
                description: error.message,
                variant: 'destructive'
            });
        }
    };

    const marcarComoCumprido = async (id: string) => {
        try {
            console.log('[PrazosList] Marcando prazo como cumprido:', id);

            const { error } = await (supabase as any)
                .from('prazos')
                .update({
                    status: 'CUMPRIDO',  // Necessário por causa da constraint
                    cumprido_em: new Date().toISOString()
                })
                .eq('id', id);

            if (error) {
                console.error('[PrazosList] Erro Supabase:', error);
                throw error;
            }

            console.log('[PrazosList] Prazo marcado com sucesso');
            setPrazos(prev => prev.filter(p => p.id !== id));
            setTotalCount(prev => prev - 1);

            toast({
                title: 'Prazo marcado como cumprido',
                variant: 'default'
            });
        } catch (error: any) {
            console.error('[PrazosList] Erro ao marcar prazo:', error);
            toast({
                title: 'Erro ao marcar prazo',
                description: error.message || 'Verifique suas permissões',
                variant: 'destructive'
            });
        }
    };

    const calcularDiasRestantes = (dataFinal: string): number => {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const vencimento = new Date(dataFinal);
        vencimento.setHours(0, 0, 0, 0);
        const diff = vencimento.getTime() - hoje.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const getUrgenciaConfig = (diasRestantes: number) => {
        if (diasRestantes <= 0) {
            return {
                cor: 'destructive' as const,
                icon: '🔴',
                label: 'VENCIDO',
                badge: 'destructive' as const
            };
        } else if (diasRestantes <= 3) {
            return {
                cor: 'destructive' as const,
                icon: '🔴',
                label: 'URGENTE',
                badge: 'destructive' as const
            };
        } else if (diasRestantes <= 5) {
            return {
                cor: 'default' as const,
                icon: '🟠',
                label: 'ATENÇÃO',
                badge: 'default' as const
            };
        } else if (diasRestantes <= 7) {
            return {
                cor: 'default' as const,
                icon: '🟡',
                label: 'ALERTA',
                badge: 'secondary' as const
            };
        } else {
            return {
                cor: 'default' as const,
                icon: '🟢',
                label: 'OK',
                badge: 'outline' as const
            };
        }
    };

    const formatDate = (dateStr: string): string => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR');
    };

    const contarPorUrgencia = () => {
        let urgente = 0;
        let atencao = 0;

        prazos.forEach(p => {
            const dias = calcularDiasRestantes(p.data_final);
            if (dias <= 3) urgente++;
            else if (dias > 3 && dias <= 7) atencao++;
        });

        return { urgente, atencao };
    };

    const { urgente, atencao } = contarPorUrgencia();

    const totalPages = Math.ceil(totalCount / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(start + itemsPerPage - 1, totalCount);

    if (loading && prazos.length === 0) {
        return (
            <Card>
                <CardContent className="py-6">
                    <div className="text-center text-muted-foreground">
                        Carregando prazos...
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div>
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" className="flex items-center gap-2 px-2">
                                    <Clock className="w-5 h-5" />
                                    <span className="font-semibold">Prazos Ativos</span>
                                    {totalCount > 0 && (
                                        <Badge variant="secondary">{totalCount}</Badge>
                                    )}
                                    {urgente > 0 && (
                                        <Badge variant="destructive">{urgente} urgentes</Badge>
                                    )}
                                    <ChevronDown className={cn(
                                        "w-4 h-4 transition-transform",
                                        isOpen && "rotate-180"
                                    )} />
                                </Button>
                            </CollapsibleTrigger>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={verificarNovosPrazos}
                                className="gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Verificar Novos Prazos
                            </Button>
                        </div>
                    </CardHeader>

                    <CollapsibleContent>
                        <CardContent>
                            {/* Busca Avançada */}
                            <div className="mb-4 space-y-3">
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setDrawerOpen(true)}
                                        className="gap-2"
                                    >
                                        <Filter className="h-4 w-4" />
                                        Busca Avançada
                                    </Button>
                                </div>

                                <FiltrosAtivosChips
                                    filtros={getFiltrosAtivos()}
                                    onRemove={(chave) => removerFiltro(chave as any)}
                                    onLimparTodos={limparFiltros}
                                />
                            </div>

                            {/* Filtros sempre visíveis */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                <Button
                                    size="sm"
                                    variant={filter === 'TODOS' ? 'default' : 'outline'}
                                    onClick={() => { setFilter('TODOS'); setCurrentPage(1); }}
                                >
                                    Todos
                                </Button>
                                <Button
                                    size="sm"
                                    variant={filter === 'URGENTE' ? 'destructive' : 'outline'}
                                    onClick={() => { setFilter('URGENTE'); setCurrentPage(1); }}
                                >
                                    🚨 Urgente (≤3 dias)
                                </Button>
                                <Button
                                    size="sm"
                                    variant={filter === 'ATENCAO' ? 'default' : 'outline'}
                                    onClick={() => { setFilter('ATENCAO'); setCurrentPage(1); }}
                                >
                                    ⚠️ Atenção (4-7 dias)
                                </Button>
                                <Button
                                    size="sm"
                                    variant={filter === 'MEDIO' ? 'secondary' : 'outline'}
                                    onClick={() => { setFilter('MEDIO'); setCurrentPage(1); }}
                                >
                                    📅 Médio (8-15 dias)
                                </Button>
                                <Button
                                    size="sm"
                                    variant={filter === 'LONGO' ? 'outline' : 'outline'}
                                    className={filter === 'LONGO' ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' : ''}
                                    onClick={() => { setFilter('LONGO'); setCurrentPage(1); }}
                                >
                                    🗓️ Longo (&gt;15 dias)
                                </Button>
                            </div>

                            {totalCount === 0 && (
                                <div className="text-center py-6 text-muted-foreground">
                                    <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>Nenhum prazo {filter !== 'TODOS' ? `no filtro "${filter === 'URGENTE' ? 'Urgente' :
                                        filter === 'ATENCAO' ? 'Atenção' :
                                            filter === 'MEDIO' ? 'Médio Prazo' :
                                                filter === 'LONGO' ? 'Longo Prazo' : ''
                                        }"` : 'ativo no momento'}</p>
                                </div>
                            )}

                            {totalCount > 0 && (
                                <>
                                    <Alert className="mb-4" variant="default">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertDescription className="text-xs">
                                            ⚠️ <strong>IMPORTANTE:</strong> Os prazos calculados são indicativos e baseados em dados públicos do DataJud/CNJ.
                                            SEMPRE confira na consulta processual oficial do tribunal antes de tomar qualquer ação.
                                            Este sistema não substitui o acompanhamento processual oficial.
                                        </AlertDescription>
                                    </Alert>

                                    <div className="space-y-3">
                                        {prazos.map((prazo) => {
                                            const diasRestantes = calcularDiasRestantes(prazo.data_final);
                                            const urgencia = getUrgenciaConfig(diasRestantes);
                                            const clienteNome = prazo.processos?.clientes?.nome || 'Sem cliente vinculado';
                                            const numeroProcesso = prazo.processos?.numero_processo || 'N/A';

                                            return (
                                                <Alert
                                                    key={prazo.id}
                                                    variant={urgencia.cor}
                                                    className="relative"
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="text-lg">{urgencia.icon}</span>
                                                                <Badge variant={urgencia.badge}>
                                                                    {urgencia.label} - {diasRestantes <= 0 ?
                                                                        `Vencido há ${Math.abs(diasRestantes)} dia(s)` :
                                                                        diasRestantes === 0 ? 'Vence hoje' :
                                                                            diasRestantes === 1 ? 'Vence amanhã' :
                                                                                `Vence em ${diasRestantes} dia(s)`
                                                                    }
                                                                </Badge>
                                                            </div>

                                                            <div className="space-y-1 text-sm">
                                                                <div className="flex items-center gap-2">
                                                                    <strong>Processo:</strong>
                                                                    <span className="font-mono">{numeroProcesso}</span>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        className="h-6 px-2"
                                                                        onClick={() => navigate(`/processo/${prazo.processo_id}`)}
                                                                    >
                                                                        <ExternalLink className="w-3 h-3" />
                                                                    </Button>
                                                                </div>

                                                                <div>
                                                                    <strong>Cliente:</strong> {clienteNome}
                                                                </div>

                                                                <div>
                                                                    <strong>Tipo:</strong> {prazo.tipo_prazo.replace('_', ' ')}
                                                                </div>

                                                                <div>
                                                                    <strong>Movimento:</strong> {prazo.movimento_descricao}
                                                                </div>

                                                                <div className="flex gap-4">
                                                                    <span>
                                                                        <strong>Prazo:</strong> {prazo.dias_prazo} dia(s) úteis
                                                                    </span>
                                                                    <span>
                                                                        <strong>Vencimento:</strong> {formatDate(prazo.data_final)}
                                                                    </span>
                                                                </div>

                                                                {prazo.observacoes && (
                                                                    <div className="text-xs text-muted-foreground mt-2 italic">
                                                                        💡 {prazo.observacoes}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="ml-4"
                                                            onClick={() => marcarComoCumprido(prazo.id)}
                                                        >
                                                            <CheckCircle className="w-4 h-4 mr-2" />
                                                            Marcar como Cumprido
                                                        </Button>
                                                    </div>
                                                </Alert>
                                            );
                                        })}
                                    </div>

                                    {totalPages > 1 && (
                                        <div className="mt-6 space-y-2">
                                            <div className="text-center text-sm text-muted-foreground">
                                                Mostrando {start}-{end} de {totalCount} prazos
                                            </div>

                                            <Pagination>
                                                <PaginationContent>
                                                    <PaginationItem>
                                                        <PaginationPrevious
                                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                                        />
                                                    </PaginationItem>

                                                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                                        const pageNum = i + 1;
                                                        return (
                                                            <PaginationItem key={pageNum}>
                                                                <PaginationLink
                                                                    onClick={() => setCurrentPage(pageNum)}
                                                                    isActive={currentPage === pageNum}
                                                                    className="cursor-pointer"
                                                                >
                                                                    {pageNum}
                                                                </PaginationLink>
                                                            </PaginationItem>
                                                        );
                                                    })}

                                                    {totalPages > 5 && (
                                                        <>
                                                            <PaginationItem>
                                                                <span className="px-2">...</span>
                                                            </PaginationItem>
                                                            <PaginationItem>
                                                                <PaginationLink
                                                                    onClick={() => setCurrentPage(totalPages)}
                                                                    isActive={currentPage === totalPages}
                                                                    className="cursor-pointer"
                                                                >
                                                                    {totalPages}
                                                                </PaginationLink>
                                                            </PaginationItem>
                                                        </>
                                                    )}

                                                    <PaginationItem>
                                                        <PaginationNext
                                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                                        />
                                                    </PaginationItem>
                                                </PaginationContent>
                                            </Pagination>
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </CollapsibleContent>
                </Card>
            </Collapsible>

            {/* Drawer de Busca Avançada */}
            <BuscaAvancada
                open={drawerOpen}
                onOpenChange={setDrawerOpen}
                filtros={filtros}
                onUpdateFiltro={updateFiltro}
                onToggleUrgencia={toggleUrgencia}
                onLimpar={limparFiltros}
                totalResultados={totalCount}
            />
        </div>
    );
};
