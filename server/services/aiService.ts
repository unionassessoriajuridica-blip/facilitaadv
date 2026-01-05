import OpenAI from "openai";

// Certifique-se de ter a chave OPENAI_API_KEY no seu arquivo .env
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function gerarResumoMovimentacao(textoCompletoMovimentacoes: string): Promise<string | null> {
  try {
    // Verificação de segurança caso a chave não esteja configurada
    if (!process.env.OPENAI_API_KEY) {
        console.warn("[AI Service] OPENAI_API_KEY não configurada. Pulei a geração de resumo.");
        return null;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Modelo rápido e eficiente em custo
      messages: [
        {
          role: "system",
          content: `Você é um assistente jurídico sênior do escritório 'Rafael Anastácio Advogados'. 
          Sua função é analisar o histórico de movimentações processuais recebido, IDENTIFICAR APENAS A ÚLTIMA MOVIMENTAÇÃO (a mais recente baseada na data) e explicá-la para o cliente leigo.
          
          Regras de Resposta:
          1. Identifique a data mais recente no texto.
          2. Explique o que aconteceu naquela data em linguagem simples, clara e tranquilizadora (sem juridiquês excessivo).
          3. Não invente passos futuros, apenas explique o fato ocorrido.
          4. Seja breve e direto (formato ideal para WhatsApp).
          5. Comece a resposta com: "*Sobre a movimentação de [DATA]:*"
          `
        },
        {
          role: "user",
          content: `Analise estas movimentações e extraia a explicação da última: \n\n${textoCompletoMovimentacoes}`
        }
      ],
      temperature: 0.5,
      max_tokens: 350,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("[AI Service] Erro ao gerar resumo:", error);
    return null; // Retorna nulo para não quebrar o fluxo do robô
  }
}


// NOVA FUNÇÃO: Chatbot Geral
export async function gerarRespostaChat(mensagemCliente: string): Promise<string> {
  try {
    if (!process.env.OPENAI_API_KEY) return "Olá! Recebi sua mensagem, mas estou sem conexão com a IA no momento.";

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Você é o assistente virtual do escritório 'Rafael Anastácio Advogados'.
          
          Diretrizes:
          1. Seja educado, profissional e empático.
          2. Se o cliente perguntar sobre andamento de processo, peça para ele informar o número ou CPF (pois por aqui você ainda não tem acesso direto ao banco).
          3. Se for dúvida jurídica complexa, diga que vai passar para o Dr. Rafael.
          4. Respostas curtas (máximo 3 frases).
          5. NÃO invente informações processuais.`
        },
        { role: "user", content: mensagemCliente }
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    return response.choices[0].message.content || "Desculpe, não entendi.";
  } catch (error) {
    console.error("[IA Chat] Erro:", error);
    return "Desculpe, estou com uma instabilidade momentânea.";
  }
}
