-- Migration: Adicionar políticas RLS para tabela notificacoes
-- Descrição: Permite que usuários autenticados leiam e criem suas próprias notificações

-- Ativar RLS na tabela notificacoes (se ainda não estiver)
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Usuários podem ver suas notificações" ON notificacoes;
DROP POLICY IF EXISTS "Usuários podem criar notificações" ON notificacoes;
DROP POLICY IF EXISTS "Usuários podem atualizar suas notificações" ON notificacoes;
DROP POLICY IF EXISTS "Usuários podem deletar suas notificações" ON notificacoes;

-- Política: Usuários podem ver SUAS PRÓPRIAS notificações
CREATE POLICY "Usuários podem ver suas notificações"
ON notificacoes FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Política: Usuários podem CRIAR notificações para si mesmos
CREATE POLICY "Usuários podem criar notificações"
ON notificacoes FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Política: Usuários podem ATUALIZAR suas notificações (marcar como lida, etc)
CREATE POLICY "Usuários podem atualizar suas notificações"
ON notificacoes FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Política: Usuários podem DELETAR suas notificações
CREATE POLICY "Usuários podem deletar suas notificações"
ON notificacoes FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Comentário explicativo
COMMENT ON TABLE notificacoes IS 'Tabela de notificações do sistema. RLS garante que cada usuário só vê suas próprias notificações.';
