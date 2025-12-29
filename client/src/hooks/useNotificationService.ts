import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface NotificationServiceConfig {
    enableLocalStorageThrottle?: boolean; // Default: true
    throttleWindowHours?: number;         // Default: 24h
}

export const useNotificationService = (config?: NotificationServiceConfig) => {
    const { user } = useAuth();
    const [isChecking, setIsChecking] = useState(false);

    const cfg = {
        enableLocalStorageThrottle: config?.enableLocalStorageThrottle ?? true,
        throttleWindowHours: config?.throttleWindowHours ?? 24,
    };

    /**
     * Verifica se rotina já executou recentemente (throttle via localStorage)
     */
    const shouldThrottle = (checkType: string): boolean => {
        if (!cfg.enableLocalStorageThrottle || !user) return false;

        const key = `notif_last_check_${checkType}_${user.id}`;
        const lastRun = localStorage.getItem(key);

        if (!lastRun) return false;

        const lastRunDate = new Date(lastRun);
        const now = new Date();
        const hoursSinceLastRun = (now.getTime() - lastRunDate.getTime()) / (1000 * 60 * 60);

        return hoursSinceLastRun < cfg.throttleWindowHours;
    };

    /**
     * Marca que verificação foi executada
     */
    const markChecked = (checkType: string) => {
        if (!cfg.enableLocalStorageThrottle || !user) return;

        const key = `notif_last_check_${checkType}_${user.id}`;
        localStorage.setItem(key, new Date().toISOString());
    };

    /**
     * Verifica se já existe notificação duplicada
     * 
     * @param tipo - Tipo da notificação (ex: 'PARCELAS_EM_ABERTO')
     * @param clienteNome - Nome do cliente (opcional)
     * @param windowDays - Janela de tempo para verificar duplicatas (padrão: 7 dias)
     */
    const checkDuplicate = async (
        tipo: string,
        clienteNome?: string,
        windowDays: number = 7
    ): Promise<boolean> => {
        try {
            const windowDate = new Date();
            windowDate.setDate(windowDate.getDate() - windowDays);

            let query = supabase
                .from('notificacoes')
                .select('id')
                .eq('tipo', tipo)
                .gte('created_at', windowDate.toISOString())
                .limit(1);

            if (clienteNome) {
                query = query.eq('cliente_nome', clienteNome);
            }

            const { data } = await query;
            return (data && data.length > 0);
        } catch (error) {
            console.error('[NotificationService] Erro ao verificar duplicata:', error);
            return false;
        }
    };

    /**
     * Cria notificação genérica
     */
    const createNotification = async (params: {
        tipo: string;
        titulo: string;
        mensagem: string;
        clienteNome?: string;
    }): Promise<boolean> => {
        try {
            if (!user) {
                console.warn('[NotificationService] Usuário não autenticado');
                return false;
            }

            const { error } = await supabase
                .from('notificacoes')
                .insert({
                    user_id: user.id,
                    tipo: params.tipo,
                    titulo: params.titulo,
                    mensagem: params.mensagem,
                    cliente_nome: params.clienteNome || null,
                    lida: false,
                });

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('[NotificationService] Erro ao criar notificação:', error);
            return false;
        }
    };

    /**
     * Verificação de Alertas Financeiros (3+ parcelas pendentes)
     */
    const checkFinancialAlerts = async (): Promise<number> => {
        try {
            if (!user) return 0;

            // Throttle: Verificar apenas 1x por dia
            if (shouldThrottle('financial')) {
                console.log('[NotificationService] Verificação financeira já realizada hoje');
                return 0;
            }

            setIsChecking(true);

            // Buscar parcelas PENDENTES agrupadas por cliente
            const { data: financeiro, error } = await supabase
                .from('financeiro')
                .select('cliente_nome, status')
                .eq('status', 'PENDENTE');

            if (error) throw error;

            // Agrupar por cliente e contar
            const clientesComParcelas: Record<string, number> = {};
            financeiro?.forEach((item) => {
                if (item.cliente_nome) {
                    clientesComParcelas[item.cliente_nome] =
                        (clientesComParcelas[item.cliente_nome] || 0) + 1;
                }
            });

            let alertsCreated = 0;

            // Para cada cliente com 3+ parcelas
            for (const [clienteNome, count] of Object.entries(clientesComParcelas)) {
                if (count >= 3) {
                    // Verificar duplicata (janela de 7 dias)
                    const isDuplicate = await checkDuplicate(
                        'PARCELAS_EM_ABERTO',
                        clienteNome,
                        7
                    );

                    if (!isDuplicate) {
                        const success = await createNotification({
                            tipo: 'PARCELAS_EM_ABERTO',
                            titulo: 'Atenção: Parcelas em Aberto',
                            mensagem: `O cliente ${clienteNome} possui ${count} parcelas pendentes. Considere entrar em contato.`,
                            clienteNome,
                        });

                        if (success) alertsCreated++;
                    }
                }
            }

            // Marcar verificação como concluída
            markChecked('financial');
            return alertsCreated;

        } catch (error) {
            console.error('[NotificationService] Erro ao verificar alertas financeiros:', error);
            return 0;
        } finally {
            setIsChecking(false);
        }
    };

    return {
        isChecking,
        checkFinancialAlerts,
        createNotification,
        checkDuplicate,
    };
};
