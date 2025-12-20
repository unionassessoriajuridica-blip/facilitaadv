import * as React from "react";
// src/hooks/useCobrancaMessages.ts
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client.ts";
import { whatsappService } from "@/services/whatsappService.ts";
import { useToast } from "@/hooks/use-toast.ts";

export const useCobrancaMessages = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const enviarMensagemCobranca = async (financeiroId: string) => {
    setLoading(true);
    try {
      // Buscar dados do financeiro
      const { data: financeiroData, error: financeiroError } = await supabase
        .from("financeiro")
        .select("*")
        .eq("id", financeiroId)
        .single();

      if (financeiroError) throw financeiroError;
      if (!financeiroData) throw new Error("Registro financeiro não encontrado");

      // Buscar dados do cliente separadamente - CORREÇÃO AQUI
      const { data: clienteData, error: clienteError } = await supabase
        .from("clientes")
        .select("telefone, nome")
        .eq("nome", financeiroData.cliente_nome)
        .eq("user_id", financeiroData.user_id)
        .single();

      if (clienteError) throw clienteError;

      const telefone = clienteData?.telefone;
      if (!telefone) {
        throw new Error("Cliente não possui telefone cadastrado");
      }

      const vencimento = new Date(financeiroData.vencimento);
      const hoje = new Date();
      const diffDias = Math.floor(
        (vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
      );

      await whatsappService.sendCobrancaMessage(
        telefone, // AGORA telefone está definido
        financeiroData.cliente_nome,
        Number(financeiroData.valor),
        financeiroData.vencimento,
        diffDias,
        financeiroData.status
      );

      // Registrar o envio da mensagem
      const { error: updateError } = await supabase
        .from("financeiro")
        .update({
          ultimo_envio_cobranca: new Date().toISOString(),
          tentativas_cobranca: (financeiroData.tentativas_cobranca || 0) + 1,
        })
        .eq("id", financeiroId);

      if (updateError) throw updateError;

      toast({
        title: "Mensagem enviada!",
        description: "Mensagem de cobrança enviada com sucesso para o cliente.",
      });

    } catch (error: any) {
      console.error("Erro ao enviar mensagem:", error);
      toast({
        variant: "destructive",
        title: "Erro ao enviar mensagem",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return { enviarMensagemCobranca, loading };
};