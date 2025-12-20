// src/services/whatsappService.ts
class WhatsAppService {
  private apiUrl: string;
  private apiToken: string;
  private isConnected: boolean = false;

  constructor() {
    this.apiUrl = import.meta.env.VITE_WHATSAPP_API_URL;
    this.apiToken = import.meta.env.VITE_WHATSAPP_API_TOKEN;
    this.checkConnection();
  }

  async checkConnection() {
    try {
      const response = await fetch(`${this.apiUrl}/health`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
        },
      });

      this.isConnected = response.ok;
      return this.isConnected;
    } catch (error) {
      this.isConnected = false;
      return false;
    }
  }

  getConnectionStatus() {
    return this.isConnected;
  }

  // Adicione este método à classe WhatsAppService
async sendBulkCobrancaMessages(cobrancas: Array<{
  telefone: string;
  clienteNome: string;
  valor: number;
  vencimento: string;
  dias: number;
  status: string;
}>) {
  try {
    console.log(`📤 Iniciando envio em massa para ${cobrancas.length} cobranças`);
    
    const results = [];
    
    for (const cobranca of cobrancas) {
      try {
        const result = await this.sendCobrancaMessage(
          cobranca.telefone,
          cobranca.clienteNome,
          cobranca.valor,
          cobranca.vencimento,
          cobranca.dias,
          cobranca.status
        );
        
        results.push({
          success: true,
          telefone: cobranca.telefone,
          clienteNome: cobranca.clienteNome,
          result
        });
        
        // Pequeno delay para evitar bloqueio
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Erro ao enviar para ${cobranca.telefone}:`, error);
        results.push({
          success: false,
          telefone: cobranca.telefone,
          clienteNome: cobranca.clienteNome,
          error: error.message
        });
      }
    }
    
    console.log(`✅ Envio em massa concluído: ${results.filter(r => r.success).length} sucessos, ${results.filter(r => !r.success).length} falhas`);
    return results;
    
  } catch (error) {
    console.error("❌ Erro no envio em massa:", error);
    throw error;
  }
}

  async sendWhatsAppMessageSimple(message: any) {
    try {
      console.log("📤 Enviando mensagem via API WhatsApp:", {
        to: message.to,
        body: message.body.substring(0, 50) + "...",
      });

      // Usar a função Edge do Supabase em vez da API diretamente
      const response = await fetch(
        `${
          import.meta.env.VITE_SUPABASE_URL
        }/functions/v1/twilio-send-message`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            phone: message.to.replace(/\D/g, ""),
            message: message.body,
          }),
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          `API error: ${response.status} - ${
            responseData.error || "Erro desconhecido"
          }`
        );
      }

      console.log("✅ Mensagem enviada com sucesso:", responseData);
      return responseData;
    } catch (error) {
      console.error("❌ Erro ao enviar mensagem:", error);
      throw error;
    }
  }

  async sendCobrancaMessage(
    telefone: string,
    clienteNome: string,
    valor: number,
    vencimento: string,
    dias: number,
    status: string
  ) {
    try {
      console.log("📊 Dados da cobrança:", {
        telefone,
        clienteNome,
        valor,
        vencimento,
        dias,
        status,
      });

      let body = "";

      if (status === "PENDENTE" && dias === 3) {
        body = `💡 Lembrete: Sr(a). ${clienteNome}, seu pagamento de ${this.formatCurrency(
          valor
        )} vence em ${new Date(vencimento).toLocaleDateString("pt-BR")}.`;
      } else if (status === "PENDENTE" && dias === 0) {
        body = `⏰ Hoje: Sr(a). ${clienteNome}, seu pagamento de ${this.formatCurrency(
          valor
        )} vence hoje!`;
      } else if (status === "PENDENTE" && dias < 0) {
        body = `🚨 Atraso: Sr(a). ${clienteNome}, seu pagamento de ${this.formatCurrency(
          valor
        )} está atrasado desde ${new Date(vencimento).toLocaleDateString(
          "pt-BR"
        )}.`;
      }

      console.log("📝 Mensagem gerada:", body);

      if (!body) {
        console.log(
          "⚠️ Nenhuma mensagem para enviar - condições não atendidas"
        );
        return;
      }

      const message = {
        to: `55${telefone.replace(/\D/g, "")}`,
        body: body,
      };

      console.log("📤 Enviando mensagem:", message);
      return this.sendWhatsAppMessageSimple(message);
    } catch (error) {
      console.error("❌ Erro no sendCobrancaMessage:", error);
      throw error;
    }
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  }
}

export const whatsappService = new WhatsAppService();
