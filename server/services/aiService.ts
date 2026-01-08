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
export async function gerarRespostaChat(mensagemCliente: string, contexto?: any): Promise<string> {
  try {
    console.log('[IA Chat] gerarRespostaChat invoked');
    if (contexto) {
      try {
        const nome = contexto.cliente?.nome || 'N/A';
        const processosCount = (contexto.processos || []).length;
        console.log(`[IA Chat] contexto encontrado: cliente=${nome}, processos=${processosCount}`);
      } catch (e) {
        console.log('[IA Chat] erro ao logar contexto');
      }
    } else {
      console.log('[IA Chat] sem contexto fornecido');
    }
    if (!process.env.OPENAI_API_KEY) return "Olá! Recebi sua mensagem, mas estou sem conexão com a IA no momento.";

    // Constrói um contexto resumido para enviar ao modelo (limitar tamanho)
    const resumoContexto = (() => {
      if (!contexto || (!contexto.cliente && (!contexto.processos || contexto.processos.length === 0))) {
        return "Sem contexto disponível do cliente.";
      }
      const cliente = contexto.cliente || {};
      const processos = contexto.processos || [];
      const processosResumo = processos.slice(0, 5).map((p: any) => {
        return `#${p.numero_processo} | status:${p.status || 'N/A'} | atualizacao:${p.updated_at || 'N/A'} | movimentacoes:${(p.movimentacoes || '').slice(0,200)}`;
      }).join('\n');
      return `Cliente: ${cliente.nome || 'N/A'} | Telefone: ${cliente.telefone || 'N/A'}\nProcessos recentes:\n${processosResumo}`;
    })();

    const systemPrompt = `Você é o assistente virtual do escritório 'Rafael Anastácio Advogados'.

    Regras rígidas de operação:
    1) Você deve responder SOMENTE sobre os processos, movimentações e dados do cliente presentes no contexto fornecido.
    2) Use senso comum jurídico (explicar em linguagem simples), mas NÃO forneça pareceres jurídicos detalhados ou invente fatos processuais.
    3) Se a pergunta do cliente NÃO estiver relacionada ao contexto (assuntos comerciais, técnicos, financeiros não relacionados ao processo, pedidos pessoais, etc.), responda exatamente: "Encaminhei sua solicitação ao suporte. Um atendente humano irá ajudar em breve." — e não acrescente mais informações.
    4) Se o contexto for insuficiente para responder (por exemplo, o cliente pergunta sobre andamento e não há número de processo), peça educadamente para o cliente informar o número do processo ou CPF.
    5) Respostas curtas, claras e empáticas (máximo 3 frases). Comece com saudação curta.
    6) Nunca exponha dados sensíveis adicionais além do que está no contexto.
    7) Se o cliente solicitar ação (ex.: pedir parcelamento, alterar dados, enviar documentos), informe que o pedido será encaminhado ao suporte humano e use a frase do item 3.
    `;

    const userContent = `Contexto:
${resumoContexto}

Mensagem do cliente:
${mensagemCliente}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent }
      ],
      temperature: 0.0,
      max_tokens: 250,
    });

    const content = response.choices?.[0]?.message?.content || "Desculpe, não entendi.";
    console.log('[IA Chat] resposta do modelo recebida (primeiros 200 chars):', String(content).slice(0,200).replace(/\n/g,' '));
    // Segurança extra: se o modelo não seguir instruções, detecte frase de encaminhamento
    if (/suporte|encaminhei|atendente humano|encaminhar/i.test(content) && !/Encaminhei sua solicitação ao suporte/i.test(content)) {
      return "Encaminhei sua solicitação ao suporte. Um atendente humano irá ajudar em breve.";
    }

    return content;
  } catch (error: any) {
    console.error("[IA Chat] Erro:", error);
    return "Desculpe, estou com uma instabilidade momentânea.";
  }
}
