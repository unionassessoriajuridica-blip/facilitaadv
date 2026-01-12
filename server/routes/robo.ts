import { Router } from "express";
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// CORREÇÃO 1: Importando o nome EXATO que está no seu arquivo
import { gerarResumoMovimentacao } from "../services/aiService"; 
import { enviarMensagemWhatsApp, enviarTemplateWhatsApp } from "../services/whatsappService";

dotenv.config();
const router = Router();

// Configuração do Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("CRÍTICO: Variáveis do Supabase não encontradas.");
}

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);

// ==============================================================================
// ROTA: ATUALIZAR
// ==============================================================================
router.post("/atualizar", async (req, res) => {
  try {
    const { numero_processo, texto_movimentacoes, token_seguranca } = req.body;

    // 1. Verificação de Segurança
    if (token_seguranca !== "SENHA_DO_SEU_ROBO_123") {
      return res.status(401).json({ error: "Acesso negado: Senha incorreta" });
    }

    if (!numero_processo || !texto_movimentacoes) {
      return res.status(400).json({ error: "Dados incompletos" });
    }

    console.log(`[ROBO] Processando: ${numero_processo}`);

    // 2. Achar o processo e os dados do cliente
    const { data: processos, error: procError } = await supabase
      .from('processos')
      .select('id, movimentacoes, clientes (nome, telefone)')
      .eq('numero_processo', numero_processo)
      .limit(1);

    if (procError) throw procError;

    if (!processos || processos.length === 0) {
      console.log(`[ROBO] ❌ Processo não encontrado: ${numero_processo}`);
      return res.status(404).json({ error: "Processo não encontrado no sistema" });
    }

    const processo = processos[0];
    
    // Verifica se houve mudança real no texto
    const houveMudanca = processo.movimentacoes !== texto_movimentacoes;

    // 3. Atualizar a tabela
    const { error: updateError } = await supabase
      .from('processos')
      .update({ 
        movimentacoes: texto_movimentacoes,
        updated_at: new Date().toISOString()
      })
      .eq('id', processo.id);

    if (updateError) throw updateError;

    // 4. LÓGICA DE NOTIFICAÇÃO
    let debugMensagem = "Sem novidades, nenhuma mensagem enviada.";
    let enviouWhatsApp = false;

    if (houveMudanca && processo.clientes && processo.clientes.telefone) {
        console.log(`[ROBO] 🔔 Novidade detectada para ${processo.clientes.nome}.`);

        // A. Gerar IA (Usando sua função original)
        // CORREÇÃO 2: Passamos apenas o texto, pois seu aiService só aceita 1 argumento
        const resumoIA = await gerarResumoMovimentacao(texto_movimentacoes);
        
        if (resumoIA) {
          // Prepara o resumo e limita para evitar cortes no envio de template
          const resumoLimitado = resumoIA.length > 1000 ? resumoIA.substring(0, 997) + "..." : resumoIA;

          console.log(`[ROBO] 📤 Enviando TEMPLATE para ${processo.clientes.telefone}...`);

          // Envia o template criado no painel da Meta (nome: atualizacao_processual)
          enviouWhatsApp = await enviarTemplateWhatsApp(
            processo.clientes.telefone,
            "atualizacao_processual",
            [processo.clientes.nome, resumoLimitado]
          );

          if (enviouWhatsApp) {
            debugMensagem = "Template enviado com sucesso!";
          } else {
            debugMensagem = "Falha ao enviar Template (Verifique se o modelo foi aprovado e o número está correto).";
            // Opcional: tentar enviar mensagem de texto comum caso a janela esteja aberta
            // const mensagemFinal = `Olá, ${processo.clientes.nome}! 🏛️\n\n${resumoLimitado}\n\nQualquer dúvida, a equipe Rafael Anastácio Advogados está à disposição.`;
            // enviouWhatsApp = await enviarMensagemWhatsApp(processo.clientes.telefone, mensagemFinal);
          }
        } else {
          console.log("[ROBO] IA retornou vazio ou erro, pulando envio.");
          debugMensagem = "Erro na geração da IA.";
        }

    } else if (!houveMudanca) {
        console.log("[ROBO] Texto idêntico ao anterior. Ignorando envio.");
    }

    return res.json({ 
        success: true, 
        message: "Ficha do processo atualizada",
        detalhe_envio: debugMensagem,
        whatsapp_enviado: enviouWhatsApp
    });

  } catch (error: any) {
    console.error("[ROBO] Erro crítico:", error);
    return res.status(500).json({ error: error.message });
  }
});

// ==============================================================================
// ROTA: LISTAR (INTOCADA)
// ==============================================================================
router.get("/listar", async (req, res) => {
  try {
    const { token_seguranca } = req.query;

    if (token_seguranca !== "SENHA_DO_SEU_ROBO_123") {
      return res.status(401).json({ error: "Acesso negado" });
    }

    const { data: processos, error } = await supabase
      .from('processos')
      .select('numero_processo, movimentacoes')
      .eq('status', 'ATIVO')
      .not('numero_processo', 'is', null);

    if (error) throw error;

    return res.json(processos);

  } catch (error: any) {
    console.error("[ROBO] Erro ao listar:", error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;