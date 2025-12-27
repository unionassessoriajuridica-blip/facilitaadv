import type { ProcessAlert } from '../types/datajud';

/**
 * Detecta se um processo tem movimentação recente (≤ 5 dias)
 */
export function detectRecentMovement(
    processId: string,
    numeroProcesso: string,
    userId: string,
    clientName: string,
    movements: any[],
    daysThreshold = 5
): ProcessAlert | null {
    if (!movements.length) return null;

    const latestMovement = movements[0]; // Já ordenado DESC
    const movementDate = new Date(latestMovement.dataHora);
    const now = new Date();
    const daysDiff = Math.floor(
        (now.getTime() - movementDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff <= daysThreshold) {
        return {
            processoId: processId,
            numeroProcesso: numeroProcesso,
            userId: userId,
            clienteNome: clientName,
            movementDate: latestMovement.dataHora,
            movementDescription: latestMovement.descricao || 'Sem descrição',
            daysAgo: daysDiff
        };
    }

    return null;
}

/**
 * Cria notificação de movimentação recente
 */
export async function createNotification(alert: ProcessAlert): Promise<boolean> {
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const daysText = alert.daysAgo === 0 ? 'hoje' :
        alert.daysAgo === 1 ? 'ontem' :
            `há ${alert.daysAgo} dias`;

    const shortDesc = alert.movementDescription.length > 150
        ? alert.movementDescription.substring(0, 147) + '...'
        : alert.movementDescription;

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/notificacoes`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_SERVICE_KEY!,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                user_id: alert.userId,
                tipo: 'MOVIMENTO_PROCESSO',
                titulo: '📋 Nova Movimentação Processual',
                mensagem: `Processo ${alert.numeroProcesso} teve movimentação ${daysText}:\n\n${shortDesc}`,
                cliente_nome: alert.clienteNome,
                lida: false,
                created_at: new Date().toISOString()
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        return true;
    } catch (error: any) {
        console.error(`[Alerts] Erro ao criar notificação: ${error.message}`);
        return false;
    }
}

/**
 * Cria notificações em lote
 */
export async function batchCreateAlerts(alerts: ProcessAlert[]): Promise<number> {
    let created = 0;

    for (const alert of alerts) {
        const success = await createNotification(alert);
        if (success) created++;

        // Pequeno delay entre notificações
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    return created;
}
