import { Router } from "express";
import { gerarRespostaChat } from "../services/aiService";
import { enviarMensagemWhatsApp } from "../services/whatsappService";
import { getContextoCliente } from "../services/contextService";
import { createClient } from '@supabase/supabase-js';

const router = Router();

// Inicialização do cliente Supabase para buscas diretas se necessário
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * Validação do Webhook (Método GET)
 */
router.get("/", (req, res) => {
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (token === "senha_facilita_webhook") {
    console.log("[WEBHOOK] Validação concluída com sucesso.");
    return res.status(200).send(challenge);
  }
  
  console.warn("[WEBHOOK] Tentativa de validação falhou: Token incorreto.");
  return res.status(403).send("Forbidden");
});

/**
 * Processamento de mensagens recebidas (Método POST)
 */
router.post("/", async (req, res) => {
  try {
    const body = req.body;

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (!message) {
      return res.status(200).send("EVENT_RECEIVED");
    }

    console.log('[WEBHOOK] Mensagem recebida:', JSON.stringify(message).slice(0, 500));

    if (message.type === "text") {
      const customerPhone = message.from;
      const customerText = message.text.body;

      console.log(`[BOT] Processando mensagem de ${customerPhone}: "${customerText}"`);

      // 1. Busca o contexto do cliente pelo telefone
      let contexto = await getContextoCliente(customerPhone);
      
      // DEBUG: Log do contexto encontrado por telefone
      console.log(`[DEBUG] Cliente por telefone: ${contexto.cliente?.nome || 'NÃO ENCONTRADO'}`);
      console.log(`[DEBUG] Qtd processos por telefone: ${contexto.processos?.length || 0}`);

      // 2. Lógica Extra: Busca por Número de Processo mencionado na mensagem
      // Tenta capturar padrões de números de processo (padrão CNJ ou sequências numéricas longas)
      const processoMatch = customerText.match(/\d{7}-\d{2}\.\d{4}|\d{15,20}/);
      
      if (processoMatch) {
        const numeroCitado = processoMatch[0];
        console.log(`[BOT] Identificado número de processo no texto: ${numeroCitado}`);
        
        // Busca direta na tabela de processos ignorando o telefone
        const { data: processoDireto } = await supabase
          .from('processos')
          .select('id, numero_processo, movimentacoes, updated_at, status')
          .ilike('numero_processo', `%${numeroCitado}%`)
          .maybeSingle();

        if (processoDireto) {
          console.log(`[BOT] Processo ${numeroCitado} encontrado no banco via busca direta.`);
          contexto.processos = contexto.processos || [];
          // Adiciona o processo encontrado ao contexto se ele ainda não estiver lá
          if (!contexto.processos.some(p => p.id === processoDireto.id)) {
            contexto.processos.unshift(processoDireto);
          }
        }
      }

      // 3. Gera a resposta usando a IA com o contexto enriquecido
      const respostaIA = await gerarRespostaChat(customerText, contexto);
      console.log(`[DEBUG] IA gerou resposta? ${!!respostaIA}`);

      if (respostaIA) {
        console.log(`[BOT] Resposta gerada (preview): ${respostaIA.substring(0, 100)}...`);
        
        // 4. Envia a resposta de volta
        const enviado = await enviarMensagemWhatsApp(customerPhone, respostaIA);

        if (enviado) {
          console.log(`[BOT] Resposta enviada com sucesso para ${customerPhone}`);
        } else {
          console.error(`[BOT] Erro ao enviar WhatsApp para ${customerPhone}.`);
        }
      }
    }

    return res.status(200).send("EVENT_RECEIVED");
  } catch (error) {
    console.error("[WEBHOOK ERROR] Falha crítica:", error);
    return res.status(200).send("EVENT_RECEIVED_WITH_ERROR");
  }
});

export default router;