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

    const MAX_BYTES = 30000; // margem segura abaixo do limite Meta (32768)

    // Limpa variáveis e garante strings
    const cleaned = (variaveis || []).map(v => limparTextoParaTemplate(String(v || "")));

    // Calcula tamanho total em bytes UTF-8
    const byteLen = (s: string) => Buffer.byteLength(s || "", "utf8");
    let total = cleaned.reduce((acc, v) => acc + byteLen(v), 0);

    // Se exceder, reduz a maior variável até caber
    if (total > MAX_BYTES) {
      console.warn(`[WhatsApp Template] Texto muito grande (${total} bytes). Aplicando truncamento para ${MAX_BYTES} bytes.`);
      // índices e tamanhos
      const sizes = cleaned.map(v => byteLen(v));
      while (total > MAX_BYTES) {
        // pega o índice da maior string
        let idx = sizes.indexOf(Math.max(...sizes));
        if (sizes[idx] === 0) break;
        // remove último caracter (preserva utf8 razoavelmente)
        cleaned[idx] = cleaned[idx].slice(0, -1);
        const newSize = byteLen(cleaned[idx]);
        total -= (sizes[idx] - newSize);
        sizes[idx] = newSize;
      }
      console.warn(`[WhatsApp Template] Truncamento aplicado. Novo tamanho total: ${total} bytes.`);
    }

    const parameters = cleaned.map(valor => ({
      type: "text",
      text: valor
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