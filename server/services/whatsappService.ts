// server/services/whatsappService.ts
import fetch from 'node-fetch'; // Se seu Node for < 18, senão o fetch é nativo

export async function enviarMensagemWhatsApp(telefone: string, mensagem: string) {
  try {
    const apiToken = process.env.WHATSAPP_API_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;

    // Verifica se as chaves estão no .env
    if (!apiToken || !phoneId) {
      console.error("[WhatsApp] ERRO: Credenciais (Token ou ID) não encontradas no .env");
      return false;
    }

    // Formata o telefone (remove caracteres não numéricos)
    const formattedPhone = telefone.replace(/\D/g, '');
    
    // URL oficial da Meta (Cloud API)
    const url = `https://graph.facebook.com/v17.0/${phoneId}/messages`;

    const body = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: formattedPhone,
      type: "text",
      text: { 
        preview_url: false,
        body: mensagem
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[WhatsApp] Erro API Meta:', JSON.stringify(data, null, 2));
      return false;
    }

    return true;

  } catch (error: any) {
    console.error('[WhatsApp] Erro interno:', error.message);
    return false;
  }
}
