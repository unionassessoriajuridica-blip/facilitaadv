import { Router } from "express";
import { gerarRespostaChat } from "../services/aiService";
import { enviarMensagemWhatsApp } from "../services/whatsappService";
import { getContextoCliente } from "../services/contextService";

const router = Router();

// Validação necessária para manter o vínculo com a Meta
router.get("/", (req, res) => {
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (token === "senha_facilita_webhook") {
    return res.status(200).send(challenge);
  }
  return res.status(403).send("Forbidden");
});

// Processamento de mensagens recebidas
router.post("/", async (req, res) => {
  try {
    const body = req.body;

    // Navega pela estrutura JSON da Meta para pegar a mensagem
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    // DEBUG: log raw message structure (truncado)
    try {
      console.log('[WEBHOOK] raw message preview:', JSON.stringify(message).slice(0,1000));
    } catch (e) {
      console.log('[WEBHOOK] raw message: <erro ao serializar>');
    }

    if (message && message.type === "text") {
      const customerPhone = message.from;
      const customerText = message.text.body;

      console.log(`[BOT] Mensagem de ${customerPhone}: ${customerText}`);

      // 1. Busca o contexto do cliente no Supabase
      const contexto = await getContextoCliente(customerPhone);

      // 2. Gera a resposta usando a lógica de IA (passando o contexto)
      const respostaIA = await gerarRespostaChat(customerText, contexto);

      // DEBUG: logar parte da resposta da IA para facilitar diagnóstico
      try {
        console.log(`[BOT] Resposta IA (preview): ${String(respostaIA).slice(0,300).replace(/\n/g, ' ')}${String(respostaIA).length > 300 ? '…' : ''}`);
      } catch (e) {
        console.log('[BOT] Resposta IA: <erro ao serializar>');
      }

      // 3. Envia de volta para o cliente
      const enviado = await enviarMensagemWhatsApp(customerPhone, respostaIA);

      if (enviado) {
        console.log(`[BOT] Resposta enviada com sucesso para ${customerPhone}`);
      } else {
        console.error(`[BOT] Falha ao enviar resposta para ${customerPhone}`);
      }
    }

    return res.status(200).send("EVENT_RECEIVED");
  } catch (error) {
    console.error("[WEBHOOK ERROR]", error);
    res.sendStatus(500);
  }
});

export default router;