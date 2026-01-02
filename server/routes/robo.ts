import { Router } from "express";
import { createClient } from '@supabase/supabase-js';

const router = Router();

// Configuração do Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Cliente com permissão total (Service Role)
const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);

// Função auxiliar para limpar formatação (apenas números)
function limparNumero(num: string) {
  return num.replace(/\D/g, '');
}

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
    // AVISO: Se o banco tiver formatação (pontos/traços), a busca deve ser exata.
    // Se o banco tiver apenas números, use a função limparNumero() antes.
    const { data: processos, error: procError } = await supabase
      .from('processos')
      .select('id')
      .eq('numero_processo', numero_processo)
      .limit(1);

    if (procError) throw procError;

    if (!processos || processos.length === 0) {
      console.log(`[ROBO] ❌ Processo não encontrado: ${numero_processo}`);
      return res.status(404).json({ error: "Processo não encontrado no sistema" });
    }

    const processoId = processos[0].id;

    // 3. ATUALIZAR A TABELA PROCESSOS (Mudança aqui!) 
    // Em vez de insert em observacoes, fazemos update no próprio processo
    const { error: updateError } = await supabase
      .from('processos')
      .update({ 
        movimentacoes: texto_movimentacoes,
        updated_at: new Date().toISOString() // Atualiza data de modificação
      })
      .eq('id', processoId);

    if (updateError) throw updateError;

    console.log(`[ROBO] ✅ Movimentações atualizadas na ficha do processo!`);
    return res.json({ success: true, message: "Ficha do processo atualizada com sucesso" });

  } catch (error: any) {
    console.error("[ROBO] Erro interno:", error);
    return res.status(500).json({ error: error.message });
  }
});

// ... (código anterior da rota POST /atualizar)

// NOVA ROTA: Lista todos os processos para o robô iterar
router.get("/listar", async (req, res) => {
  try {
    const { token_seguranca } = req.query;

    // 1. Segurança básica
    if (token_seguranca !== "SENHA_DO_SEU_ROBO_123") {
      return res.status(401).json({ error: "Acesso negado" });
    }

    // 2. Buscar apenas o necessário: Número e o Texto atual (para comparação)
    const { data: processos, error } = await supabase
      .from('processos')
      .select('numero_processo, movimentacoes')
      .eq('status', 'ATIVO') // Opcional: Só pega processos ativos
      .not('numero_processo', 'is', null);

    if (error) throw error;

    return res.json(processos);

  } catch (error: any) {
    console.error("[ROBO] Erro ao listar:", error);
    return res.status(500).json({ error: error.message });
  }
});

// export default router; (Mantenha isso no final)

export default router;
