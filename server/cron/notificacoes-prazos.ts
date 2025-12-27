import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';
import { sendDeadlineReminder } from '../services/resendService';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const EMAIL_DESTINATARIO = 'unionassessoriajuridica@gmail.com';

/**
 * Cron job para enviar notificações de prazos urgentes
 * Executa diariamente às 09:00
 */
export function startPrazosEmailNotifications() {
    // Executar todos os dias às 09:00
    cron.schedule('0 9 * * *', async () => {
        console.log('📧 [Email Prazos] Iniciando envio de notificações diárias...');

        try {
            await enviarNotificacoesPrazos();
        } catch (error) {
            console.error('❌ [Email Prazos] Erro ao enviar notificações:', error);
        }
    });

    console.log('✅ [Email Prazos] Cron de notificações iniciado - Executa às 09:00 diariamente');
}

/**
 * Envia notificações de prazos urgentes (≤3 dias)
 */
async function enviarNotificacoesPrazos() {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const tresDias = new Date(hoje);
    tresDias.setDate(tresDias.getDate() + 3);

    // Buscar prazos urgentes (≤3 dias)
    const { data: prazos, error } = await supabase
        .from('prazos')
        .select(`
            *,
            processos(
                numero_processo,
                clientes(nome)
            )
        `)
        .is('cumprido_em', null)
        .lte('data_final', tresDias.toISOString().split('T')[0]);

    if (error) {
        console.error('❌ [Email Prazos] Erro ao buscar prazos:', error);
        return;
    }

    if (!prazos || prazos.length === 0) {
        console.log('ℹ️ [Email Prazos] Nenhum prazo urgente encontrado');
        return;
    }

    console.log(`📧 [Email Prazos] ${prazos.length} prazos urgentes encontrados`);

    // Agrupar prazos por urgência
    const prazosUrgentes = [];
    const prazosAtencao = [];

    for (const prazo of prazos) {
        const dataFinal = new Date(prazo.data_final);
        const diasRestantes = Math.ceil(
            (dataFinal.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diasRestantes <= 1) {
            prazosUrgentes.push({ ...prazo, diasRestantes });
        } else if (diasRestantes <= 3) {
            prazosAtencao.push({ ...prazo, diasRestantes });
        }
    }

    // Enviar email resumo se houver prazos urgentes
    if (prazosUrgentes.length > 0 || prazosAtencao.length > 0) {
        await enviarEmailResumo(prazosUrgentes, prazosAtencao);
    }

    // Enviar email individual para cada prazo que vence HOJE ou AMANHÃ
    for (const prazo of prazosUrgentes) {
        if (prazo.diasRestantes <= 1) {
            await enviarEmailIndividual(prazo);
            // Aguardar 1s entre emails para não sobrecarregar
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    console.log(`✅ [Email Prazos] Notificações enviadas com sucesso`);
}

/**
 * Envia email resumo com todos os prazos urgentes
 */
async function enviarEmailResumo(prazosUrgentes: any[], prazosAtencao: any[]) {
    const totalPrazos = prazosUrgentes.length + prazosAtencao.length;

    console.log(`📧 [Email Prazos] Enviando email resumo (${totalPrazos} prazos)`);

    try {
        await sendDeadlineReminder({
            to: EMAIL_DESTINATARIO,
            processNumber: `${totalPrazos} PRAZOS URGENTES`,
            clientName: 'Resumo Diário',
            deadline: new Date().toLocaleDateString('pt-BR'),
            description: montarDescricaoResumo(prazosUrgentes, prazosAtencao),
            daysRemaining: prazosUrgentes.length > 0 ?
                Math.min(...prazosUrgentes.map((p: any) => p.diasRestantes)) :
                Math.min(...prazosAtencao.map((p: any) => p.diasRestantes))
        });

        console.log('✅ [Email Prazos] Email resumo enviado');
    } catch (error) {
        console.error('❌ [Email Prazos] Erro ao enviar email resumo:', error);
    }
}

/**
 * Monta descrição HTML do resumo de prazos
 */
function montarDescricaoResumo(prazosUrgentes: any[], prazosAtencao: any[]): string {
    let html = '<h3>📊 Resumo de Prazos Urgentes</h3>';

    if (prazosUrgentes.length > 0) {
        html += `<h4 style="color: #ef4444;">🚨 Prazos Críticos (${prazosUrgentes.length})</h4><ul>`;

        prazosUrgentes.slice(0, 5).forEach((prazo: any) => {
            const numeroProcesso = prazo.processos?.numero_processo || 'N/A';
            const cliente = prazo.processos?.clientes?.nome || 'Sem cliente';
            const dias = prazo.diasRestantes === 0 ? 'HOJE' :
                prazo.diasRestantes === 1 ? 'AMANHÃ' :
                    `${prazo.diasRestantes} dias`;

            html += `<li><strong>${numeroProcesso}</strong> - ${cliente} - Vence <strong>${dias}</strong></li>`;
        });

        if (prazosUrgentes.length > 5) {
            html += `<li><em>... e mais ${prazosUrgentes.length - 5} prazos críticos</em></li>`;
        }

        html += '</ul>';
    }

    if (prazosAtencao.length > 0) {
        html += `<h4 style="color: #f59e0b;">⚠️ Prazos de Atenção (${prazosAtencao.length})</h4><ul>`;

        prazosAtencao.slice(0, 5).forEach((prazo: any) => {
            const numeroProcesso = prazo.processos?.numero_processo || 'N/A';
            const cliente = prazo.processos?.clientes?.nome || 'Sem cliente';

            html += `<li><strong>${numeroProcesso}</strong> - ${cliente} - Vence em ${prazo.diasRestantes} dias</li>`;
        });

        if (prazosAtencao.length > 5) {
            html += `<li><em>... e mais ${prazosAtencao.length - 5} prazos</em></li>`;
        }

        html += '</ul>';
    }

    html += '<p><a href="http://localhost:5000/dashboard">Acessar Sistema</a></p>';

    return html;
}

/**
 * Envia email individual para prazo específico
 */
async function enviarEmailIndividual(prazo: any) {
    const numeroProcesso = prazo.processos?.numero_processo || 'N/A';
    const cliente = prazo.processos?.clientes?.nome || 'Sem cliente';
    const dataFinal = new Date(prazo.data_final);
    const tipoPrazo = prazo.tipo_prazo || 'Prazo';

    console.log(`📧 [Email Prazos] Enviando email individual: ${numeroProcesso}`);

    try {
        await sendDeadlineReminder({
            to: EMAIL_DESTINATARIO,
            processNumber: numeroProcesso,
            clientName: cliente,
            deadline: dataFinal.toLocaleDateString('pt-BR'),
            description: `${tipoPrazo} - ${prazo.movimento_descricao || 'Sem descrição'}`,
            daysRemaining: prazo.diasRestantes
        });

        console.log(`✅ [Email Prazos] Email enviado para processo ${numeroProcesso}`);
    } catch (error) {
        console.error(`❌ [Email Prazos] Erro ao enviar email para ${numeroProcesso}:`, error);
    }
}
