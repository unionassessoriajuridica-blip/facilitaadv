import cron from 'node-cron';
import { mapsScraperService } from '../services/mapsScraperService';
import { whatsappService } from '../services/whatsappService';
import { createClient } from '@supabase/supabase-js';

// Configuração Supabase (ajuste se suas envs forem diferentes)
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const CIDADE = "Ribeirão Preto, SP";
const QUANTIDADE = 5;

const TEMPLATES: Record<string, string> = {
  'IMOBILIARIA': `Olá, *{{nome}}*! Tudo bem? \n\nAqui é a Assistente Virtual do *Dr. Rafael Anastácio*, da Anastácio Soluções.\n\nLocalizamos sua imobiliária nos destaques de *{{cidade}}* e o Dr. Rafael pediu para entrar em contato.\n\nSabemos que a exigência de fiador trava contratos. Temos uma *Fiança Locatícia Digital* para aprovar inquilinos sem burocracia.\n\nPosso pedir para nossa equipe enviar uma proposta de parceria?\n\nDigite *SIM* para receber.`,
  'DENTISTA': `Olá, *{{nome}}*! Tudo bem? \n\nAqui é a Assistente Virtual do *Dr. Rafael Anastácio*, da Anastácio Soluções.\n\nEncontramos sua clínica nos destaques de *{{cidade}}*. Temos uma linha de *Fiança Saúde* que permite parcelar tratamentos no boleto, e a clínica recebe à vista.\n\nGostaria de uma simulação para aumentar seus fechamentos?\n\nDigite *SIM* para receber.`,
  'ESTETICA': `Olá, equipe da *{{nome}}*! \n\nSou a Assistente do *Dr. Rafael Anastácio*, da Anastácio Soluções.\n\nNossa *Fiança para Cirurgias* aprova o crédito para o paciente realizar o sonho agora, e a clínica recebe com segurança.\n\nFaz sentido apresentarmos essa ferramenta?\n\nDigite *SIM* se tiver interesse.`
};

const NICHOS = [
  { termo: "Imobiliária", modelo: "IMOBILIARIA" },
  { termo: "Clínica Odontológica", modelo: "DENTISTA" },
  { termo: "Cirurgião Plástico", modelo: "ESTETICA" }
];

export async function executarProspeccao() {
  console.log("🚀 [AUTO-PROSPECÇÃO] Iniciando ciclo...");

  for (const item of NICHOS) {
    try {
      const leads = await mapsScraperService.minerarLeads(item.termo, CIDADE, QUANTIDADE);

      for (const lead of leads) {
        // Verifica duplicidade no banco
        const { data: existente } = await supabase
          .from('leads_prospeccao')
          .select('id')
          .eq('telefone', lead.telefoneLimpo)
          .single();

        if (existente) {
          console.log(`⏩ [PULADO] Já contatado: ${lead.nome}`);
          continue;
        }

        const msg = TEMPLATES[item.modelo]
          .replace('{{nome}}', lead.nome)
          .replace('{{cidade}}', lead.cidade);

        if (lead.telefoneLimpo.length >= 10) {
             console.log(`📨 [ENVIANDO] Para ${lead.nome}...`);
             // Envia mensagem (ajuste o sufixo @c.us conforme sua lib de whats)
             await whatsappService.sendMessage(`${lead.telefoneLimpo}@c.us`, msg);
             
             // Salva no banco
             await supabase.from('leads_prospeccao').insert({
               nome_empresa: lead.nome,
               telefone: lead.telefoneLimpo,
               nicho: item.termo,
               cidade: lead.cidade,
               mensagem_enviada: msg
             });

             // Delay humano (40s a 80s)
             const delay = Math.floor(Math.random() * (80000 - 40000) + 40000);
             await new Promise(r => setTimeout(r, delay));
        }
      }
    } catch (erro) {
      console.error(`❌ Erro nicho ${item.termo}:`, erro);
    }
    await new Promise(r => setTimeout(r, 60000)); // Pausa entre nichos
  }
  console.log("💤 [AUTO-PROSPECÇÃO] Finalizado.");
}

// Cron: Roda a cada 2 dias às 10:00
export const prospeccaoJob = cron.schedule('0 10 */2 * *', executarProspeccao, { scheduled: false });