import { createClient } from '@supabase/supabase-js';
import { enviarTemplateWhatsApp } from "./whatsappService"; 

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

function formatarDinheiro(valor: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

function formatarData(dataString: string): string {
    if (!dataString) return dataString;
    const [ano, mes, dia] = dataString.split('-');
    return `${dia}/${mes}/${ano}`;
}

export async function processarCobrancasDiarias() {
  const hoje = new Date();
  const diasParaAviso = [5, 1, 0]; 

  console.log(`[Cobranca] Iniciando varredura financeira...`);

  for (const dias of diasParaAviso) {
    const dataAlvo = new Date();
    dataAlvo.setDate(hoje.getDate() + dias);
    const dataFormatada = dataAlvo.toISOString().split('T')[0];

    // CORREÇÃO CRÍTICA AQUI:
    // Mudamos o select para buscar o cliente ATRAVÉS da tabela processos
    // Sintaxe: processos ( clientes ( nome, telefone ) )
    const { data: parcelas, error } = await supabase
      .from('financeiro')
      .select('*, processos ( clientes ( nome, telefone ) )')
      .eq('status', 'PENDENTE') // Atenção: no seu schema o padrão é "PENDENTE" (maíusculo) ou "pendente"? Verifique no banco.
      .eq('vencimento', dataFormatada);

    if (error) {
      console.error(`[Cobranca] Erro ao buscar vencimentos para ${dataFormatada}:`, error.message);
      continue;
    }

    if (!parcelas || parcelas.length === 0) continue;

    console.log(`[Cobranca] Encontrados ${parcelas.length} pagamentos para ${dias === 0 ? 'HOJE' : 'daqui a ' + dias + ' dias'}.`);

    for (const parcela of parcelas) {
      // Navegamos pelos objetos aninhados para achar o cliente
      // parcela -> processos -> clientes
      // @ts-ignore (O TypeScript pode reclamar da tipagem aninhada dinâmica, o ignore resolve)
      const cliente = parcela.processos?.clientes;

      if (cliente && cliente.telefone && cliente.nome) {
        
        const valorFormatado = formatarDinheiro(parcela.valor);
        const dataVisual = dias === 0 ? "HOJE" : formatarData(parcela.vencimento);

        // Envia usando o modelo aprovado
        const enviou = await enviarTemplateWhatsApp(
            cliente.telefone, 
            "lembrete_cobranca", 
            [
                cliente.nome,   // {{1}}
                valorFormatado, // {{2}}
                dataVisual      // {{3}}
            ]
        );

        if (enviou) {
            console.log(`[Cobranca] ✅ Aviso enviado para ${cliente.nome} (Vence: ${dataVisual})`);
        } else {
            console.error(`[Cobranca] ❌ Falha ao enviar para ${cliente.nome}`);
        }
      } else {
          console.log(`[Cobranca] Cliente não identificado para a parcela ID ${parcela.id} (Verifique se o processo tem cliente vinculado)`);
      }
    }
  }
}