import OpenAI from "openai";
import { getContextoCliente } from "./contextService";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Conexão direta com o banco para verificar se é um Lead de Campanha
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// 1. BASE DE CONHECIMENTO NOVA (ANASTÁCIO SOLUÇÕES)
// ============================================================================
const INFO_ANASTACIO_SOLUCOES = `=================================================================
                    ASSISTENTE VIRTUAL ANASTÁCIO SOLUÇÕES
                        MANUAL COMPLETO DE ATENDIMENTO
=================================================================

╔══════════════════════════════════════════════════════════════╗
║                    DADOS INSTITUCIONAIS                       ║
╚══════════════════════════════════════════════════════════════╝

RAZÃO SOCIAL: Anastácio Soluções
CNPJ: 40.360.585/0001-75
FUNDAÇÃO: 2020
SEDE: Rua Alice Além Saad, nº 855, Ribeirão Preto - SP, Brasil
ATUAÇÃO: Nacional (todas as regiões do Brasil)

ESTATÍSTICAS:
• 5.000+ clientes atendidos
• 500+ parceiros ativos (imobiliárias, clínicas, profissionais)
• 98% de satisfação dos clientes
• 24h tempo médio de aprovação

TRAJETÓRIA:
• 2020 - Fundação com foco em fiança locatícia
• 2021 - Lançamento da plataforma 100% digital
• 2022 - Expansão para fiança odontológica e cirurgia plástica
• 2023 - Mais de 500 parceiros cadastrados
• 2024 - Presença em todas as regiões do Brasil

╔══════════════════════════════════════════════════════════════╗
║                 MISSÃO, VISÃO E VALORES                       ║
╚══════════════════════════════════════════════════════════════╝

MISSÃO:
Facilitar o acesso a garantias de crédito de forma simples, rápida e transparente, 
possibilitando que mais pessoas realizem seus sonhos.

VISÃO:
Ser a principal referência em soluções de fiança no Brasil, reconhecida pela 
inovação, confiabilidade e excelência no atendimento.

PROPÓSITO:
Transformar a vida das pessoas eliminando barreiras burocráticas e oferecendo 
oportunidades reais de crescimento e realização pessoal.

VALORES:
1. CONFIANÇA - Relações sólidas baseadas em transparência e honestidade
2. COMPROMISSO - Dedicação para entregar soluções que fazem a diferença
3. INOVAÇÃO - Busca constante por simplificar o acesso ao crédito
4. HUMANIZAÇÃO - Cada cliente é único, tratado com respeito e empatia

╔══════════════════════════════════════════════════════════════╗
║                    HORÁRIO DE ATENDIMENTO                      ║
╚══════════════════════════════════════════════════════════════╝

• Segunda a sexta-feira: 9h às 18h
• Sábados, domingos e feriados: Sem expediente
• Assistente virtual: Disponível 24/7

╔══════════════════════════════════════════════════════════════╗
║                       CANAIS DE CONTATO                        ║
╚══════════════════════════════════════════════════════════════╝

📱 WhatsApp: (16) 99350-8206
📞 Telefone: (16) 99350-8206
📧 E-mail: anastaciosolucoes@gmail.com
📍 Endereço: Rua Alice Além Saad, nº 855 - Ribeirão Preto - SP

╔══════════════════════════════════════════════════════════════╗
║                         PRODUTOS                               ║
╚══════════════════════════════════════════════════════════════╝

┌────────────────────────────────────────────────────────────────┐
│            1. FIANÇA LOCATÍCIA (IMOBILIÁRIA)                   │
└────────────────────────────────────────────────────────────────┘

DESCRIÇÃO:
Substitui o fiador tradicional no aluguel de imóveis (residenciais e comerciais),
oferecendo garantia locatícia moderna com mais segurança, rapidez e previsibilidade.

BENEFÍCIOS:
• Elimina a exigência de fiador
• Processo 100% digital
• Análise técnica e imparcial
• Mais segurança jurídica para o proprietário
• Mais velocidade para a imobiliária
• Mais acesso à locação para o inquilino
• Comunicação centralizada e registrada
• Atendimento profissional em caso de sinistro

COMO FUNCIONA (5 ETAPAS):

ETAPA 1 - Cadastro do inquilino pela imobiliária
A imobiliária realiza o cadastro do inquilino na plataforma, informando 
dados pessoais e financeiros necessários para análise de crédito.
→ Todo o processo é digital, rápido e seguro.

ETAPA 2 - Análise criteriosa pela Anastácio Soluções
Análise técnica e objetiva do perfil financeiro, capacidade de pagamento 
e critérios de risco.
Resultados possíveis:
• APROVADO - com definição do limite de garantia
• PENDENTE - necessária documentação complementar
• NÃO APROVADO - com transparência e registro do resultado
→ O cadastro permanece vinculado à imobiliária, garantindo controle e histórico.

ETAPA 3 - Liberação para elaboração do contrato
Com a aprovação, a imobiliária fica liberada para dar continuidade à confecção 
do contrato de locação com a fiança garantida.
→ Mais agilidade no fechamento e menos tempo de imóvel parado.

ETAPA 4 - Garantia ativa durante a vigência do contrato
Durante toda a vigência, a fiança oferece proteção contra inadimplência e 
eventuais prejuízos, conforme as condições pactuadas.
→ Em caso de imprevistos, a imobiliária pode acionar diretamente pela plataforma.

ETAPA 5 - Comunicação clara em caso de sinistro
Se houver inadimplência, a imobiliária abre o chamado de sinistro de forma 
simples e imediata.
→ A equipe é notificada em tempo real e inicia as tratativas com rapidez.

PARCEIROS: Imobiliárias

┌────────────────────────────────────────────────────────────────┐
│            2. FIANÇA ODONTOLÓGICA (CLÍNICAS)                   │
└────────────────────────────────────────────────────────────────┘

DESCRIÇÃO:
Resolve o risco de inadimplência em tratamentos odontológicos de médio e alto valor.
A Anastácio Soluções atua como garantidora financeira, assegurando que o 
dentista receba o valor do tratamento.

BENEFÍCIOS:
• Garantia real de recebimento para o dentista
• Redução total ou parcial do risco de inadimplência
• Possibilidade de pagamento integral ou parcelado
• Mais previsibilidade financeira para a clínica
• Ampliação do acesso do paciente a tratamentos de alto valor
• Processo 100% digital e organizado
• Menos conflitos, mais profissionalismo

MODALIDADES:

MODALIDADE A - Pagamento integral ao dentista
A Anastácio Soluções realiza o pagamento total do tratamento à clínica, 
garantindo recebimento imediato, enquanto assume a relação financeira com 
o paciente.
Ideal para:
• Procedimentos de alto valor
• Clínicas que desejam capitalizar imediatamente
• Redução total do risco de inadimplência

MODALIDADE B - Garantia de pagamento parcelado
A Anastácio Soluções garante o pagamento das parcelas do tratamento, 
assegurando que a clínica receba pontualmente, mesmo que o paciente 
atrase ou deixe de pagar.
Ideal para:
• Tratamentos parcelados
• Planejamento financeiro previsível
• Segurança no fluxo de caixa da clínica

COMO FUNCIONA (5 ETAPAS):

ETAPA 1 - Cadastro do paciente pela clínica
A clínica realiza o cadastro do paciente na plataforma, informando dados 
para análise, valor total do tratamento e forma de pagamento pretendida.

ETAPA 2 - Análise de crédito e viabilidade
Análise criteriosa do perfil do paciente, avaliando capacidade financeira 
e risco com base em critérios técnicos e objetivos.

ETAPA 3 - Escolha da modalidade de garantia
Após aprovação, a clínica escolhe entre pagamento integral ou garantia parcelada.

ETAPA 4 - Execução do tratamento com segurança
Com a fiança ativa, o dentista pode iniciar o tratamento com total tranquilidade.
→ A clínica foca na qualidade técnica e cuidado com o paciente.

ETAPA 5 - Atuação em caso de inadimplência
Se o paciente deixar de pagar, a clínica não precisa cobrar ou negociar.
→ A Anastácio Soluções assume as tratativas financeiras.

PARCEIROS: Clínicas odontológicas, dentistas

┌────────────────────────────────────────────────────────────────┐
│         3. FIANÇA CIRURGIA PLÁSTICA (CLÍNICAS/MÉDICOS)         │
└────────────────────────────────────────────────────────────────┘

DESCRIÇÃO:
Atende um mercado de alto valor, onde confiança, previsibilidade financeira 
e segurança contratual são essenciais. A Anastácio Soluções garante que o 
médico-cirurgião plástico receba os valores acordados.

BENEFÍCIOS:
• Garantia real de recebimento para o cirurgião plástico
• Pagamento integral antecipado ou garantia parcelada
• Redução significativa do risco financeiro
• Mais previsibilidade e estabilidade no faturamento
• Ampliação do acesso do paciente a procedimentos de alto valor
• Processo digital, seguro e organizado
• Profissionalização da relação financeira médico-paciente

MODALIDADES:

MODALIDADE A - Pagamento integral ao cirurgião plástico
A Anastácio Soluções realiza o pagamento total do procedimento ao médico, 
garantindo o recebimento antecipado, enquanto assume a relação financeira 
com o paciente.
Ideal para:
• Cirurgias de alto valor
• Planejamento financeiro seguro
• Eliminação total do risco de inadimplência

MODALIDADE B - Garantia de pagamento parcelado
A Anastácio Soluções garante o pagamento das parcelas ao médico, assegurando 
recebimentos pontuais mesmo em caso de atraso ou inadimplência do paciente.
Ideal para:
• Procedimentos parcelados
• Estabilidade no fluxo de caixa
• Redução de conflitos financeiros

COMO FUNCIONA (5 ETAPAS):

ETAPA 1 - Cadastro do paciente pela clínica ou consultório
A clínica ou médico realiza o cadastro do paciente, informando dados, 
procedimento a ser realizado e valor total do tratamento.

ETAPA 2 - Análise técnica e financeira do paciente
Análise criteriosa de crédito e risco, avaliando a capacidade financeira 
com base em critérios objetivos.

ETAPA 3 - Escolha da modalidade de garantia
Após aprovação, o médico ou clínica opta pela modalidade mais adequada.

ETAPA 4 - Execução do procedimento com tranquilidade
Com a fiança ativa, o médico realiza a cirurgia com total segurança financeira.
→ A previsibilidade eleva o padrão profissional.

ETAPA 5 - Atuação em caso de inadimplência
O médico ou clínica não precisa realizar cobranças ou negociações desgastantes.
→ A Anastácio Soluções garante o pagamento conforme contrato.

PARCEIROS: Cirurgiões plásticos, clínicas de estética, hospitais

╔══════════════════════════════════════════════════════════════╗
║           PROCESSO DE CADASTRO DO CLIENTE (7 ETAPAS)          ║
╚══════════════════════════════════════════════════════════════╝

ETAPA 1 - INÍCIO DO CADASTRO
• Escolha do método de login (e-mail, telefone ou redes sociais)
• Aceite dos Termos de Uso
• Aceite da Política de Privacidade

ETAPA 2 - IDENTIFICAÇÃO PESSOAL
• Nome completo
• CPF (validado automaticamente)
• Data de nascimento
• Telefone celular (verificação via SMS)

ETAPA 3 - VERIFICAÇÃO DE IDENTIDADE (KYC)
• Escolha do tipo de documento (RG, CNH ou RNE)
• Upload da foto do documento (frente e verso)
• Foto selfie para reconhecimento facial
• Validação automática dos documentos

ETAPA 4 - DADOS COMPLEMENTARES
• CEP e endereço completo (preenchido automaticamente via API dos Correios)
• Comprovação de renda (upload de documentos, Open Finance ou informação manual)
• Ocupação profissional
• Renda estimada

ETAPA 5 - ANÁLISE DE RISCO
• Análise automatizada do perfil de crédito
• Score de crédito
• Nível de risco (A, B, C ou D)
• Valor aprovado
• Verificação de restrições

ETAPA 6 - REVISÃO E CONFIRMAÇÃO
• Revisão de todos os dados informados
• Confirmação das informações
• Seleção do produto desejado (se aplicável)

ETAPA 7 - CRIAÇÃO DE CONTA
• Definição de senha de acesso
• Confirmação do cadastro
• Acesso liberado à área do cliente

PRAZO DE ANÁLISE: Até 48 horas úteis após envio completo da documentação
RESULTADO RÁPIDO: A aprovação pode ocorrer em poucos minutos para perfis qualificados

╔══════════════════════════════════════════════════════════════╗
║               DOCUMENTOS GERALMENTE SOLICITADOS               ║
╚══════════════════════════════════════════════════════════════╝

• RG ou CNH (frente e verso)
• CPF
• Comprovante de renda (holerite, extrato bancário, declaração de IR, pró-labore)
• Comprovante de residência atualizado (conta de luz, água, telefone, internet)
• Documentos específicos conforme tipo de garantia

╔══════════════════════════════════════════════════════════════╗
║                    FORMAS DE PAGAMENTO                        ║
╚══════════════════════════════════════════════════════════════╝

• Cartão de crédito
• Cartão de débito
• Pix
• Boleto bancário
• Parcelamento flexível disponível (conforme análise)

╔══════════════════════════════════════════════════════════════╗
║                    PERGUNTAS FREQUENTES                       ║
╚══════════════════════════════════════════════════════════════╝

P: Preciso de fiador para contratar a fiança?
R: Não! Nossa fiança substitui a necessidade de fiador. Você não precisa 
   envolver terceiros no processo, tornando tudo mais simples e rápido.

P: Como funciona a análise de crédito?
R: Nossa análise é feita de forma 100% digital e automatizada. Utilizamos 
   tecnologia avançada para avaliar seu perfil de crédito em poucos minutos, 
   sem burocracia.

P: É seguro fornecer meus dados?
R: Sim, totalmente! Seguimos rigorosamente a LGPD (Lei Geral de Proteção de 
   Dados) e utilizamos criptografia de ponta para proteger suas informações.

P: Qual o prazo para aprovação?
R: A aprovação pode ocorrer em poucos minutos! Após o cadastro e análise, 
   você recebe a resposta rapidamente e pode assinar o contrato digitalmente.

P: Quais formas de pagamento são aceitas?
R: Aceitamos cartão de crédito, débito, Pix e boleto bancário. Oferecemos 
   também opções de parcelamento flexível para se adequar ao seu orçamento.

P: Posso usar a fiança para qualquer tipo de aluguel?
R: Sim! Nossa fiança locatícia serve tanto para imóveis residenciais quanto 
   comerciais, oferecendo cobertura completa para proprietários e inquilinos.

P: Como funciona para clínicas e imobiliárias parceiras?
R: Parceiros têm acesso a um portal exclusivo onde podem acompanhar clientes, 
   gerenciar garantias, abrir sinistros e integrar-se facilmente à nossa plataforma.

P: O que acontece em caso de inadimplência?
R: Em caso de inadimplência, o parceiro (imobiliária, clínica ou médico) abre 
   um chamado de sinistro pelo nosso portal. Nossa equipe é notificada imediatamente 
   e inicia as tratativas para resolver a situação.

P: Quanto tempo leva para receber em caso de sinistro?
R: O prazo depende do tipo de garantia e das condições do contrato. Nossa equipe 
   trabalha para resolver as situações com a maior agilidade possível.

╔══════════════════════════════════════════════════════════════╗
║              PARCERIAS E PROGRAMA DE AFILIADOS                ║
╚══════════════════════════════════════════════════════════════╝

TIPOS DE PARCEIROS:
• Imobiliárias e corretores de imóveis
• Clínicas odontológicas e dentistas
• Cirurgiões plásticos e clínicas de estética
• Hospitais e centros médicos

BENEFÍCIOS PARA PARCEIROS:
• Portal exclusivo de gestão
• Acompanhamento em tempo real
• Comissões atrativas
• Suporte dedicado
• Material de divulgação
• Treinamento completo

╔══════════════════════════════════════════════════════════════╗
║                     ÁREAS DO SISTEMA                          ║
╚══════════════════════════════════════════════════════════════╝

ÁREA DO CLIENTE:
• Dashboard com status das garantias
• Histórico de pagamentos
• Documentos e contratos
• Suporte e atendimento
• Perfil e configurações

ÁREA DO PARCEIRO:
• Gestão de clientes
• Análises de crédito
• Contratos ativos
• Relatórios e métricas
• Configurações da conta

╔══════════════════════════════════════════════════════════════╗
║                    SEGURANÇA E LGPD                           ║
╚══════════════════════════════════════════════════════════════╝

• Criptografia SSL em todas as comunicações
• Armazenamento seguro de dados
• Conformidade total com a LGPD
• Política de privacidade transparente
• Termos de uso claros
• Direito à exclusão de dados garantido

╔══════════════════════════════════════════════════════════════╗
║            INSTRUÇÕES ESPECÍFICAS PARA O BOT                  ║
╚══════════════════════════════════════════════════════════════╝

1. SEMPRE responda em português brasileiro
2. Use linguagem clara, objetiva e profissional
3. Demonstre empatia e disponibilidade
4. Responda apenas sobre os produtos e serviços da Anastácio Soluções
5. Se não souber algo específico, direcione para os canais de contato
6. Não invente informações que não estejam neste manual
7. Mantenha um tom acolhedor e prestativo
8. Use emojis com moderação para tornar a conversa mais amigável
9. Sempre ofereça ajuda adicional ao final das respostas
10. Se for perguntado sobre algo fora do escopo, gentilmente redirecione para os serviços da empresa

OBJETIVO PRINCIPAL:
Ajudar o usuário a entender os produtos, esclarecer dúvidas e direcioná-lo 
corretamente no processo de contratação ou parceria.
`;

// ============================================================================
// 2. MELHORIAS: PITCH E VERIFICAÇÃO DE CAMPANHA
// ============================================================================

// ARGUMENTOS DE VENDA POR NICHO (O "Pulo do Gato")
const PITCH_VENDAS: Record<string, string> = {
    'IMOBILIARIA': `
    FOCO: Fiança Locatícia Digital.
    BENEFÍCIO: "Substituímos o fiador. Aprovação em minutos. A imobiliária fecha mais contratos e o proprietário tem garantia total."
    `,
    'DENTISTA': `
    FOCO: Fiança Odontológica (Saúde).
    BENEFÍCIO: "O Dr. recebe o tratamento à vista (antecipado) e o paciente parcela no boleto com a gente. Elimina a inadimplência e fecha tratamentos caros."
    `,
    'ESTETICA': `
    FOCO: Fiança para Cirurgia Plástica.
    BENEFÍCIO: "Seu paciente realiza o sonho da cirurgia parcelando no boleto, e a clínica recebe o valor integral com segurança antes do procedimento."
    `
};

/**
 * Verifica se o telefone pertence a um alvo da campanha e RETORNA O NICHO.
 * Retorna null se não achar, ou string ('IMOBILIARIA', 'DENTISTA', etc) se achar.
 */
async function verificarOrigemCampanha(telefone: string): Promise<string | null> {
  try {
    const telLimpo = telefone.replace(/\D/g, '');
    const telSem55 = telLimpo.startsWith('55') ? telLimpo.slice(2) : telLimpo;
    
    const { data, error } = await supabase
      .from('leads_prospeccao')
      .select('nicho')
      .or(`telefone.eq.${telLimpo},telefone.eq.${telSem55},telefone.eq.55${telSem55}`)
      .limit(1)
      .single();

    if (error || !data) return null;
    const nichoDb = data.nicho || '';
    if (nichoDb.includes('Imobiliária')) return 'IMOBILIARIA';
    if (nichoDb.includes('Odonto') || nichoDb.includes('Dentista')) return 'DENTISTA';
    if (nichoDb.includes('Plástica') || nichoDb.includes('Estética')) return 'ESTETICA';
    return 'GENERICO';
  } catch (e) {
    console.error("Erro ao verificar campanha:", e);
    return null;
  }
}

// ============================================================================
// 3. FUNÇÕES ORIGINAIS (MANTIDAS INTACTAS)
// ============================================================================

/**
 * Ferramenta interna para busca ativa de dados
 */
async function realizarBuscaAtiva(termo: string, telefone: string) {
  console.log(`[IA Search] Buscando: ${termo}`);
  const novoContexto = await getContextoCliente(telefone, termo);
  return JSON.stringify(novoContexto);
}

/**
 * Gera um resumo simples da última movimentação processual.
 */
export async function gerarResumoMovimentacao(textoCompletoMovimentacoes: string): Promise<string | null> {
  try {
    if (!process.env.OPENAI_API_KEY) return null;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Você é o assistente virtual oficial e sênior do escritório Rafael Anastácio Advogados. Seu objetivo é ser o braço direito do Dr. Rafael na gestão e o ponto de apoio técnico e humano para os clientes.

          DIRETRIZES DE INTELIGÊNCIA:
          NATURALIDADE E FLUIDEZ: Se o cliente já saudou, não repita "Olá". Use o nome do cliente para criar proximidade (ex: "Oi, João!"). Se o cliente pedir uma busca, não diga que vai buscar, apenas acione a ferramenta de busca e responda com o resultado já em mãos.
          SAUDAÇÃO ÚNICA: Evite ser robótico; se o papo já está em andamento, vá direto ao ponto.
          EXPLICAÇÃO DE MOVIMENTAÇÕES: Ao explicar andamentos, use linguagem simples e tranquilizadora. Regra obrigatória: Comece a explicação com: *Sobre a movimentação de [DATA]:*.
          BUSCA ATIVA E AUTÔNOMA: Se a informação solicitada (processo, CPF ou financeiro) não estiver no contexto atual, use imediatamente a função de busca. Só peça dados ao cliente (CPF/Número do Processo) se a busca ativa retornar vazio.
          NÍVEIS DE ACESSO: 
          - Modo Master (Dr. Rafael): Forneça resumos executivos, status de faturamento global e detalhes técnicos sem restrições.
          - Modo Cliente: Responda apenas sobre os dados dele e informações referentes ao Dr Rafael, e a empresa, focando em acolhimento e clareza.

          BASE DE CONHECIMENTO INSTITUCIONAL:
          Rafael Anastácio: Advogado criminalista sênior, fundador do escritório e da Facilita Adv. Especialista em Urgências 24h, Audiências de Custódia, Tribunal do Júri e Recursos em tribunais superiores (STJ/STF). Conhecido pela advocacia combativa e uso de tecnologia para máxima agilidade.
          Facilita Adv (https://facilita.adv.br/): Tecnologia jurídica de vanguarda que oferece monitoramento em tempo real de tribunais, tradução de juridiquês por IA, gestão automatizada de prazos e portal do cliente com faturamento transparente.
          Contatos: Sites https://rafaelanastacioadv.com.br/ e https://advrafaelanastacio.com.br. Telefone (16) 99350-8206. Atendimento digital seguro e criptografado.`
        },
        { 
          role: "user", 
          content: `Analise e explique a última movimentação deste texto: \n\n${textoCompletoMovimentacoes}` 
        }
      ],
      temperature: 0.5,
      max_tokens: 350,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("[AI Service] Erro ao gerar resumo:", error);
    return null;
  }
}

// ============================================================================
// 3. CHATBOT PRINCIPAL (COM ROTEADOR NOVO)
// ============================================================================

export async function gerarRespostaChat(mensagemCliente: string, contexto?: any, telefoneUsuario: string = ''): Promise<string> {
  try {
    if (!process.env.OPENAI_API_KEY) return "Olá! No momento estou em manutenção técnica. Por favor, tente novamente em breve.";

    // --- NOVA LÓGICA: DETECTOR DE INTENÇÃO (O ÚNICO ACRÉSCIMO) ---
    const termosFinanceiros = [
        'fiança', 'locatícia', 'aluguel', 'imobiliária', 'fiador',
        'dentista', 'implante', 'odonto', 'dente', 'tratamento',
        'cirurgia', 'plástica', 'estética', 'lipo', 'silicone', 'médico',
        'anastácio soluções', 'anastacio', 'soluções financeiras', 'parceria',
        'simulação'
    ];
    
    // Ignora termos financeiros se o usuário estiver falando de "Honorários" ou "Valor do Processo" (coisas jurídicas)
    const ehFinanceiro = termosFinanceiros.some(t => mensagemCliente.toLowerCase().includes(t)) 
                         && !mensagemCliente.toLowerCase().includes('honorários') 
                         && !mensagemCliente.toLowerCase().includes('processo');

    if (ehFinanceiro) {
        // >>> MODO ANASTÁCIO SOLUÇÕES (FINANCEIRO) <<<
        // Aqui usamos um prompt específico e ignoramos a complexidade jurídica
        const systemPromptFinanceiro = `
        VOCÊ É A ASSISTENTE VIRTUAL DA ANASTÁCIO SOLUÇÕES.
        Seu foco é comercial: Vender e explicar as Fianças (Locatícia, Odontológica, Estética).
        
        BASE DE CONHECIMENTO:
        ${INFO_ANASTACIO_SOLUCOES}

        DIRETRIZES:
        - Se o cliente falar de prisão/processo, diga educadamente que este setor é de Soluções Financeiras e peça para ele contatar o jurídico.
        - Seja cordial e vendedor.
        `;

        const responseFin = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPromptFinanceiro },
                { role: "user", content: `Cliente: ${contexto?.cliente?.nome || 'Visitante'}\nMensagem: ${mensagemCliente}` }
            ],
            temperature: 0.3,
            max_tokens: 500
        });
        
        return responseFin.choices[0].message.content || "Erro no atendimento financeiro.";
    }

    // ========================================================================
    // >>> MODO JURÍDICO (SEU CÓDIGO ORIGINAL ABAIXO) <<<
    // Daqui para baixo é EXATAMENTE o que você já tinha, sem tirar nada.
    // ========================================================================

    const isMaster = contexto?.isMaster === true;

    // Dados Institucionais Expandidos (O "Textão")
    const infoInstitucional = `
    PERFIL DO DR. RAFAEL ANASTÁCIO:
    Advogado sênior, fundador do escritório Rafael Anastácio Advogados e da Facilita Adv. Especialista em Direito Criminal com atuação combativa em todo o Brasil. Focado em agilidade extrema, utiliza tecnologia de ponta para garantir a melhor defesa. Especialista em Audiências de Custódia (24h), Tribunal do Júri, Recursos ao STJ/STF e Execução Penal. Sua filosofia é de transparência total e quebra de burocracias.

    SOBRE A FACILITA ADV (https://facilita.adv.br/):
    Plataforma de vanguarda que une tecnologia e direito. Funcionalidades:
    1. Monitoramento em Tempo Real: Captura publicações e movimentações antes da concorrência.
    2. Gestão de Prazos com IA: Alertas inteligentes para evitar perdas processuais.
    3. Portal do Cliente: Consulta com tradução de termos jurídicos complexos por IA.
    4. Módulo Financeiro: Gestão de honorários, boletos, Pix e faturamento transparente.
    5. Biblioteca Digital: Modelos de petições e contratos em todas as áreas do direito.

    SOBRE O DR. RAFAEL ANASTÁCIO:
    Dr. Rafael Anastácio
    Advogado inscrito na OAB/SP 452.506, com foco na defesa técnica e estratégica em processos criminais e execução penal.

    Atuação pautada pela ética profissional, estudo aprofundado de cada caso e compromisso com os direitos fundamentais do cliente. Atendimento humanizado para familiares e acompanhamento processual contínuo.

    Bacharel em Direito
    Especialização em Direito Penal e Processo Penal
    Atuação em Execução Penal
    OAB/SP 452.506
    CNPJ: 49.586.980/0001-45

    CONTATOS E SITES:
    - Principal: https://rafaelanastacioadv.com.br/
    - Serviços: https://advrafaelanastacio.com.br
    - Tecnologia: https://facilita.adv.br/
    Atendimento focado no digital (WhatsApp) com segurança de dados criptografada.
    Rua Alice Além Saad, 855
    Ribeirânia, Ribeirão Preto - SP
    (16) 99350-8206
    unionassessoriajuridica@gmail.com

    Áreas de Atuação Especializadas:
    1. Direito Criminal: Defesa em inquéritos, ações penais, recursos e habeas corpus.
    2. Audiência de Custódia: Atuação imediata para garantir direitos do preso.
    3. Tribunal do Júri: Defesa técnica em julgamentos por crimes dolosos contra a vida.
    4. Execução Penal: Gestão de benefícios, progressão de regime e direitos do sentenciado.
    5. Recursos Especiais e Extraordinários: Elaboração de recursos ao STJ e STF.

    Serviços Jurídicos Detalhados:
    Direito Criminal
    Atuação completa em processos criminais, desde inquéritos policiais até ações penais. Defesa técnica em casos de crimes contra a pessoa, patrimônio, administração pública, entre outros. Elaboração de peças processuais, acompanhamento de audiências e recursos.
    Audiência de Custódia
    A audiência de custódia é um direito fundamental de toda pessoa presa em flagrante. Realizada em até 24 horas após a prisão, permite ao juiz avaliar a legalidade da prisão, verificar a ocorrência de maus-tratos e decidir sobre a manutenção da prisão ou concessão de liberdade provisória.
    O advogado tem papel essencial nesse momento, podendo apresentar documentos, requerer medidas cautelares alternativas e garantir que os direitos do preso sejam respeitados.
    Tribunal do Júri
    O Tribunal do Júri é a instância responsável por julgar crimes dolosos contra a vida (homicídio, infanticídio, aborto e instigação ao suicídio). É garantida ao réu a plenitude de defesa, permitindo ao advogado utilizar todos os meios legítimos para convencer os jurados.
    A preparação técnica para o Júri envolve análise minuciosa das provas, elaboração de teses defensivas sólidas e construção de uma narrativa coerente perante os jurados.
    Direitos na Execução Penal
    A Lei de Execução Penal (LEP) garante diversos direitos ao sentenciado, incluindo progressão de regime, saídas temporárias, remição de pena por trabalho ou estudo, livramento condicional e indulto.
    O acompanhamento jurídico especializado é fundamental para identificar o momento correto de cada pedido, reunir a documentação necessária e garantir que o sentenciado tenha acesso aos benefícios previstos em lei.
    Habeas Corpus
    O Habeas Corpus é o remédio constitucional utilizado para cessar constrangimento ilegal à liberdade de locomoção. Pode ser impetrado preventivamente (quando há ameaça de prisão) ou liberatório (quando a pessoa já está presa).
    A análise técnica do caso permite identificar nulidades processuais, excesso de prazo, ausência de fundamentação ou qualquer outra ilegalidade que justifique a concessão da ordem.
    `;

    // Definição da ferramenta de busca para a IA
    const tools: OpenAI.Chat.ChatCompletionTool[] = [
      {
        type: "function",
        function: {
          name: "buscar_dados_no_banco",
          description: "Busca processos, movimentações ou dados financeiros por CPF ou Número de Processo quando a informação não estiver no contexto.",
          parameters: {
            type: "object",
            properties: {
              termo: { type: "string", description: "O CPF (só números) ou Número do Processo." }
            },
            required: ["termo"]
          }
        }
      }
    ];

    // LÓGICA COMPLEXA DE CONTEXTO (MANTIDA)
    const resumoContexto = (() => {
      const cliente = contexto?.cliente || {};
      const processos = contexto?.processos || [];
      const financeiro = contexto?.financeiro || [];

      const formatFinanceiro = (f: any) => {
        const desc = f.descricao || f.tipo || f.titulo || f.cliente_nome || '';
        const valor = f.valor || f.amount || f.valor_total || f.valor_pago || f.valor_bruto || '';
        const venc = f.vencimento || f.data_vencimento || f.due_date || '';
        const status = f.status || f.situacao || '';
        return `Descrição: ${desc} | Valor: ${valor} | Venc: ${venc} | Status: ${status}`;
      };

      const financeiroResumo = financeiro && financeiro.length > 0
        ? financeiro.map((f: any, i: number) => `${i + 1}) ${formatFinanceiro(f)}`).join('\n')
        : '';

      if (isMaster) {
        return `[MODO GESTÃO MASTER] Dr. Rafael autenticado.\nProcessos: ${JSON.stringify(processos?.slice(0, 10))}\nFinanceiro:\n${financeiroResumo || JSON.stringify(financeiro)}`;
      }

      if (!cliente && processos.length === 0 && financeiro.length === 0) {
        return "Nenhum dado processual localizado automaticamente.";
      }

      const processosResumo = processos.slice(0, 3).map((p: any) => {
        return `Proc: ${p.numero_processo} | Status: ${p.status} | Última Mov: ${(p.movimentacoes || '').slice(0, 150)}...`;
      }).join('\n');

      return `Cliente: ${cliente.nome || 'Prezado(a)'}\nProcessos:\n${processosResumo}${financeiroResumo ? `\nFinanceiro:\n${financeiroResumo}` : ''}`;
    })();

    const systemPrompt = `Você é o assistente virtual oficial do escritório 'Rafael Anastácio Advogados'.
    Seu objetivo é ser útil, empático e natural.

    ${isMaster ? "DIRETRIZ MASTER: Você atende o Dr. Rafael. Acesso total a processos e financeiro." : "DIRETRIZ CLIENTE: Atendimento humanizado e seguro."}

    REGRAS DE OURO:
    1) NATURALIDADE: Responda de forma fluida. Se souber o nome, use-o. Não repita saudações se o papo já começou.
    1.1) Se o cliente pedir busca de algo que não está abaixo, USE a ferramenta 'buscar_dados_no_banco' imediatamente. Não avise que vai buscar, apenas busque e dê o resultado.
    2) SENSO COMUM JURÍDICO: Explique termos como 'concluso' ou 'prazos' de forma simples.
    3) INSTITUCIONAL: Use esta base para dúvidas sobre o Dr. ou o escritório: ${infoInstitucional}
    4) LIMITAÇÃO: Respostas curtas (3-5 frases). Se for assunto externo: "Encaminhei sua solicitação ao suporte. Um atendente humano irá ajudar em breve."
    `;

    let mensagens: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `CONTEXTO ATUAL:\n${resumoContexto}\n\nMENSAGEM DO USUÁRIO: ${mensagemCliente}` }
    ];

    let response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: mensagens,
      tools: tools,
      tool_choice: "auto",
      temperature: isMaster ? 0.3 : 0.7,
      max_tokens: 600,
    });

    let responseMessage = response.choices[0].message;

    // Lógica de Chamada de Função (Busca Ativa)
    if (responseMessage.tool_calls) {
      for (const toolCall of responseMessage.tool_calls) {
        if (toolCall.function.name === "buscar_dados_no_banco") {
          const args = JSON.parse(toolCall.function.arguments);
          const resultado = await realizarBuscaAtiva(args.termo, telefoneUsuario);

          mensagens.push(responseMessage);
          mensagens.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: resultado,
          });
        }
      }

      const secondResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: mensagens,
      });

      return secondResponse.choices[0].message.content || "Erro ao processar busca.";
    }

    const content = responseMessage.content || "Desculpe, tive um erro ao processar.";

    if (/encaminhar para o suporte|atendente humano/i.test(content) && !content.includes("ajudar em breve")) {
      return "Encaminhei sua solicitação ao suporte. Um atendente humano irá ajudar em breve.";
    }

    return content;
  } catch (error: any) {
    console.error("[IA Chat] Erro Crítico:", error);
    return "Desculpe, tive uma instabilidade momentânea. Pode repetir?";
  }
}