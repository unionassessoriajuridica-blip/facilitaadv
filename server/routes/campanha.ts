import { Router } from 'express';
import { whatsappService } from '../services/whatsappService';

const router = Router();

// Modelos de Mensagem (Templates)
const TEMPLATES: Record<string, string> = {
  'IMOBILIARIA': `Olá, *{{nome}}*! Tudo bem? 

Aqui é a Assistente Virtual do *Dr. Rafael Anastácio*, da Anastácio Soluções.

Localizamos sua imobiliária nos destaques de *{{cidade}}* e o Dr. Rafael pediu para entrar em contato.

Sabemos que a exigência de fiador trava muitos contratos. Trabalhamos com uma *Fiança Locatícia Digital* para aprovar inquilinos sem burocracia.

Posso pedir para nossa equipe enviar uma proposta de parceria?

Digite *SIM* para receber.`,

  'DENTISTA': `Olá, *{{nome}}*! Tudo bem? 

Aqui é a Assistente Virtual do *Dr. Rafael Anastácio*, da Anastácio Soluções.

Encontramos sua clínica nos destaques de *{{cidade}}*. Sabemos que muitos pacientes desistem de tratamentos de alto valor por falta de limite no cartão.

Temos uma linha de *Fiança Saúde* que permite parcelar no boleto, e a clínica recebe à vista.

Gostaria de uma simulação para aumentar seus fechamentos?

Digite *SIM* para receber.`,

  'ESTETICA': `Olá, equipe da *{{nome}}*! 

Sou a Assistente do *Dr. Rafael Anastácio*, da Anastácio Soluções.

Notamos que muitas cirurgias deixam de ser agendadas por falta de crédito nos bancos tradicionais.

Nossa *Fiança para Cirurgias* aprova o crédito para o paciente realizar o sonho agora, e a clínica recebe com segurança.

Faz sentido apresentarmos essa ferramenta?

Digite *SIM* se tiver interesse.`
};

// Nomes dos templates aprovados na Meta
const TEMPLATE_NAMES: Record<string, string> = {
  'IMOBILIARIA': 'abordagem_imobiliaria_v1',
  'DENTISTA': 'abordagem_dentista_v1',
  'ESTETICA': 'abordagem_estetica_v1'
};

// Função auxiliar de pausa (Jitter)
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

router.post('/disparar', async (req, res) => {
  try {
    const { leads, modelo } = req.body; 
    // leads = [{ nome, telefone, cidade }]
    // modelo = 'IMOBILIARIA' | 'DENTISTA' | 'ESTETICA'

    if (!leads || !Array.isArray(leads)) {
      return res.status(400).json({ error: 'Lista de leads inválida.' });
    }

    const templateBase = TEMPLATES[modelo] || TEMPLATES['IMOBILIARIA'];

    console.log(`🚀 [CAMPANHA] Iniciando disparo para ${leads.length} contatos. Modelo: ${modelo}`);

    // Processamento em Background (Não trava a resposta da API)
    (async () => {
      for (const [index, lead] of leads.entries()) {
        try {
          // 1. Formata o número (Garante 55 + DDD + Numero)
          // Remove caracteres não numéricos
          const numeroLimpo = lead.telefone.replace(/\D/g, '');
          const numeroFinal = numeroLimpo.startsWith('55') ? numeroLimpo : `55${numeroLimpo}`;

          // 2. Personaliza a mensagem
          const mensagem = templateBase
            .replace('{{nome}}', lead.nome || 'Parceiro')
            .replace('{{cidade}}', lead.cidade || 'sua região');

          // 3. Envia (Tenta enviar, se falhar loga e continua)
          console.log(`📨 Enviando (${index + 1}/${leads.length}) para ${lead.nome}...`);
          // Envia como TEMPLATE aprovado na Meta
          const templateName = TEMPLATE_NAMES[modelo] || TEMPLATE_NAMES['IMOBILIARIA'];
          await whatsappService.sendTemplate(numeroFinal, templateName, [lead.nome, lead.cidade]);

          // 4. Delay Humano (Entre 40s e 90s) para evitar bloqueio do WhatsApp
          const delay = Math.floor(Math.random() * (90000 - 40000 + 1) + 40000);
          await sleep(delay);

        } catch (erroEnvio) {
          console.error(`❌ Falha ao enviar para ${lead.nome}:`, erroEnvio);
          // Continua para o próximo mesmo com erro
        }
      }
      console.log(`✅ [CAMPANHA] Finalizada!`);
    })();

    // Responde imediatamente para o Python não ficar travado
    return res.json({ 
      success: true, 
      message: `Campanha iniciada para ${leads.length} contatos. O envio ocorrerá em segundo plano.` 
    });

  } catch (error) {
    console.error("Erro no endpoint de campanha:", error);
    return res.status(500).json({ error: "Erro interno ao processar campanha." });
  }
});

export default router;