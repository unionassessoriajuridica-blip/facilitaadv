import { createClient } from '@supabase/supabase-js';
import { enviarMensagemWhatsApp } from "./whatsappService";
import { format } from "date-fns"; // Sugestão para formatar datas

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function verificarEPresentarCobrancas() {
  const hoje = new Date();
  
  // Definimos os intervalos de aviso (ex: 7 dias antes, 1 dia antes e no dia)
  const diasParaAviso = [7, 1, 0]; 

  for (const dias of diasParaAviso) {
    const dataAlvo = new Date();
    dataAlvo.setDate(hoje.getDate() + dias);
    const dataFormatada = dataAlvo.toISOString().split('T')[0];

    // Busca parcelas pendentes para a data específica
    const { data: parcelas, error } = await supabase
      .from('financeiro')
      .select('*, clientes(nome, telefone)')
      .eq('status', 'pendente')
      .eq('data_vencimento', dataFormatada);

    if (error) {
      console.error(`[Cobranca] Erro ao buscar vencimentos para D+${dias}:`, error);
      continue;
    }

    for (const parcela of (parcelas || [])) {
      if (parcela.clientes?.telefone) {
        const textoDias = dias === 0 ? "vence HOJE" : `vence em ${dias} dias`;
        const mensagem = `Olá, ${parcela.clientes.nome}! 🏛️\n\nPassando para lembrar que sua parcela de honorários no valor de R$ ${parcela.valor} ${textoDias} (${parcela.data_vencimento}).\n\nCaso já tenha efetuado o pagamento, por favor desconsidere.`;
        
        await enviarMensagemWhatsApp(parcela.clientes.telefone, mensagem);
        console.log(`[Cobranca] Lembrete enviado para ${parcela.clientes.nome} (D+${dias})`);
      }
    }
  }
}
