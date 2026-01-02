import { Router } from "express";
import { createClient } from '@supabase/supabase-js';

const router = Router();

// Configuração do Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ [ROBO] Erro Crítico: Falta configuração do Supabase no .env");
}

// Cliente com permissão total (Service Role) para escrever no banco
const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);

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

    console.log(`[ROBO] Recebendo dados para processo: ${numero_processo}`);

    // 2. Achar o processo no banco
    const { data: processos, error: procError } = await supabase
      .from('processos')
      .select('id, user_id, clientes(nome)')
      .eq('numero_processo', numero_processo)
      .limit(1);

    if (procError) throw procError;

    if (!processos || processos.length === 0) {
      console.log(`[ROBO] Processo não encontrado: ${numero_processo}`);
      return res.status(404).json({ error: "Processo não encontrado no sistema" });
    }

    const processo = processos[0];
    // Pega o nome do cliente de forma segura
    const clienteNome = (processo.clientes as any)?.nome || "Cliente Desconhecido";

    // 3. Salvar na tabela 'observacoes_processo'
    const { error: insertError } = await supabase
      .from('observacoes_processo')
      .insert({
        user_id: processo.user_id,
        processo_id: processo.id,
        cliente_nome: clienteNome,
        titulo: "Movimentações (Importado pelo Robô)",
        conteudo: texto_movimentacoes
      });

    if (insertError) throw insertError;

    console.log(`[ROBO] Movimentações salvas com sucesso!`);
    return res.json({ success: true, message: "Importação concluída" });

  } catch (error: any) {
    console.error("[ROBO] Erro interno:", error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
