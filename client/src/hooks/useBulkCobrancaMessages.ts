import * as React from "react";
import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client.ts";
import { whatsappService } from "@/services/whatsappService.ts";
import { useToast } from "@/hooks/use-toast.ts";

export const useBulkCobrancaMessages = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const enviarCobrancasEmMassa = async () => {
    setLoading(true);
    try {
      const hoje = new Date();
      const tresDias = new Date();
      tresDias.setDate(hoje.getDate() + 3);

      // Buscar todas as parcelas pendentes que estão dentro dos critérios
      const { data: parcelas, error } = await supabase
        .from("financeiro")
        .select("*")
        .eq("status", "PENDENTE")
        .lte("vencimento", tresDias.toISOString().split("T")[0])
        .order("vencimento", { ascending: true });

      if (error) throw error;

      if (!parcelas || parcelas.length === 0) {
        toast({
          title: "Nenhuma cobrança pendente",
          description: "Não há cobranças dentro do período estabelecido.",
        });
        return;
      }

      console.log(`📋 Encontradas ${parcelas.length} parcelas para processar`);

      // Preparar dados para envio
      const cobrancasParaEnviar = [];

      for (const parcela of parcelas) {
        const vencimento = new Date(parcela.vencimento);
        const diffDias = Math.floor(
          (vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
        );

        const deveEnviar = (() => {
          if (diffDias > 0) {
            // parcelas futuras: envia nos 3 dias anteriores
            return diffDias <= 3;
          } else if (diffDias === 0) {
            // vence hoje: sempre envia
            return true;
          } else {
            // atrasadas: envia a cada 3 dias
            const diasAtraso = Math.abs(diffDias);
            return diasAtraso % 3 === 0; // a cada 3 dias
          }
        })();

        if (deveEnviar) {
          // Buscar telefone do cliente
          const { data: clienteData } = await supabase
            .from("clientes")
            .select("telefone")
            .eq("nome", parcela.cliente_nome)
            .eq("user_id", parcela.user_id)
            .single();

          if (clienteData?.telefone) {
            cobrancasParaEnviar.push({
              telefone: clienteData.telefone,
              clienteNome: parcela.cliente_nome,
              valor: Number(parcela.valor),
              vencimento: parcela.vencimento,
              dias: diffDias,
              status: parcela.status,
              parcelaId: parcela.id
            });
          }
        }
      }

      if (cobrancasParaEnviar.length === 0) {
        toast({
          title: "Nenhuma cobrança para enviar",
          description: "Nenhuma cobrança atende aos critérios de envio no momento.",
        });
        return;
      }

      console.log(`📤 Preparando envio de ${cobrancasParaEnviar.length} mensagens`);

      // Enviar mensagens em massa
      const resultados = await whatsappService.sendBulkCobrancaMessages(cobrancasParaEnviar);

      // Atualizar registros no banco
      for (const resultado of resultados) {
        if (resultado.success) {
          const parcela = cobrancasParaEnviar.find(c => c.telefone === resultado.telefone && c.clienteNome === resultado.clienteNome);
          if (parcela) {
            await supabase
              .from("financeiro")
              .update({
                ultimo_envio_cobranca: new Date().toISOString(),
                tentativas_cobranca: (parcela.tentativas_cobranca || 0) + 1,
              })
              .eq("id", parcela.parcelaId);
          }
        }
      }

      const sucessos = resultados.filter(r => r.success).length;
      const falhas = resultados.filter(r => !r.success).length;

      toast({
        title: "Envio em massa concluído",
        description: `Foram enviadas ${sucessos} mensagens com sucesso e ${falhas} falhas.`,
      });

    } catch (error: any) {
      console.error("Erro no envio em massa:", error);
      toast({
        variant: "destructive",
        title: "Erro no envio em massa",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return { enviarCobrancasEmMassa, loading };
};