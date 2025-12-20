// src/services/cobrancaScheduler.ts
import { supabase } from "@/integrations/supabase/client.ts";
import { whatsappService } from "./whatsappService.ts";

export class CobrancaScheduler {
  // Substitua a função verificarVencimentos por:
  static async verificarVencimentos() {
    try {
      const hoje = new Date();
      const tresDias = new Date();
      tresDias.setDate(hoje.getDate() + 3);

      console.log(
        "Verificando vencimentos para:",
        hoje.toISOString().split("T")[0]
      );

      // Buscar todas as parcelas pendentes que vencem em até 3 dias ou estão vencidas
      const { data: parcelas, error } = await supabase
        .from("financeiro")
        .select("*")
        .eq("status", "PENDENTE")
        .lte("vencimento", tresDias.toISOString().split("T")[0])
        .order("vencimento", { ascending: true });

      if (error) throw error;

      console.log(
        `Encontradas ${parcelas?.length || 0} parcelas para processar`
      );

      for (const parcela of parcelas || []) {
        const vencimento = new Date(parcela.vencimento);
        const diffDias = Math.floor(
          (vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Aplicar os novos critérios de envio
        const deveEnviar =
          diffDias === 3 || // 3 dias antes
          diffDias === 0 || // No dia do vencimento
          (diffDias < 0 && Math.abs(diffDias) % 5 === 0); // A cada 5 dias após vencimento

        if (!deveEnviar) {
          console.log(
            `Pulando parcela ${parcela.id} - não atende aos critérios (${diffDias} dias)`
          );
          continue;
        }

        // Buscar telefone do cliente
        const { data: clienteData, error: clienteError } = await supabase
          .from("clientes")
          .select("telefone")
          .eq("nome", parcela.cliente_nome)
          .eq("user_id", parcela.user_id)
          .single();

        if (clienteError) {
          console.error("Erro ao buscar cliente:", clienteError);
          continue;
        }

        const telefone = clienteData?.telefone;
        if (!telefone) {
          console.log(`Cliente ${parcela.cliente_nome} não possui telefone`);
          continue;
        }

        await whatsappService.sendCobrancaMessage(
          telefone,
          parcela.cliente_nome,
          Number(parcela.valor),
          parcela.vencimento,
          diffDias,
          parcela.status
        );

        // Atualizar registro
        const { error: updateError } = await supabase
          .from("financeiro")
          .update({
            ultimo_envio_cobranca: new Date().toISOString(),
            tentativas_cobranca: (parcela.tentativas_cobranca || 0) + 1,
          })
          .eq("id", parcela.id);

        if (updateError) {
          console.error("Erro ao atualizar parcela:", updateError);
        }
      }

      console.log("Processamento de cobranças concluído!");
    } catch (error) {
      console.error("Erro no agendador de cobranças:", error);
    }
  }
}
