// server/services/whatsappService.ts
import fetch from 'node-fetch'; // Se seu Node for < 18, senão o fetch é nativo

// === FUNÇÃO AUXILIAR NOVA (CORREÇÃO DO ERRO #132018) ===
// A Meta proíbe quebras de linha (ENTER), TABS ou muitos espaços dentro de variáveis de modelo.
function limparTextoParaTemplate(texto: string): string {
    if (!texto) return "";
    
    return texto
        // Troca quebra de linha por " - " para o texto ficar linear mas legível
        .replace(/\r?\n|\r/g, ' - ') 
        // Troca TAB por espaço simples
        .replace(/\t/g, ' ')
        // Remove espaços excessivos (mais de 4 seguidos dão erro)
        .replace(/  +/g, ' ')
        .trim();
}

// === FUNÇÃO ORIGINAL (MANTIDA INTACTA) ===
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

// === FUNÇÃO DE TEMPLATE (ATUALIZADA COM LIMPEZA) ===
export async function enviarTemplateWhatsApp(telefone: string, templateName: string, variaveis: string[]) {
  try {
    const apiToken = process.env.WHATSAPP_API_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;

    if (!apiToken || !phoneId) {
      console.error("[WhatsApp] ERRO: Credenciais não encontradas");
      return false;
    }

    const formattedPhone = telefone.replace(/\D/g, '');
    const url = `https://graph.facebook.com/v17.0/${phoneId}/messages`;

    // Transforma o array de strings no formato que o WhatsApp exige
    // AQUI ESTÁ A MUDANÇA: Usamos limparTextoParaTemplate() em cada variável
    const parameters = variaveis.map(valor => ({
      type: "text",
      text: limparTextoParaTemplate(valor)
    }));

    const body = {
      messaging_product: "whatsapp",
      to: formattedPhone,
      type: "template",
      template: {
        name: templateName,
        language: { code: "pt_BR" },
        components: [
          {
            type: "body",
            parameters: parameters
          }
        ]
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
      console.error('[WhatsApp Template] Erro API Meta:', JSON.stringify(data, null, 2));
      return false;
    }

    return true;

  } catch (error: any) {
    console.error('[WhatsApp Template] Erro interno:', error.message);
    return false;
  }
}

// ============================================================================
// 🚨 A CORREÇÃO MÁGICA (ADICIONE ISTO NO FINAL)
// ============================================================================
// Isso cria o objeto que os novos scripts (campanha/maps) estão procurando
export const whatsappService = {
    // Mapeia 'sendMessage' (novo) para 'enviarMensagemWhatsApp' (velho)
    sendMessage: enviarMensagemWhatsApp,
    
    // Mapeia 'sendTemplate' (novo) para 'enviarTemplateWhatsApp' (velho)
    sendTemplate: enviarTemplateWhatsApp
};