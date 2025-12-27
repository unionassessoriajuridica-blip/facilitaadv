-- Migration: Globalizar acesso para notificações, financeiro, clientes e processos
-- Descrição: Remove as restrições de user_id das políticas RLS para permitir visibilidade compartilhada

-- 1. Tabela notificacoes
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuários podem ver suas notificações" ON notificacoes;
DROP POLICY IF EXISTS "Usuários podem criar notificações" ON notificacoes;
DROP POLICY IF EXISTS "Usuários podem atualizar suas notificações" ON notificacoes;
DROP POLICY IF EXISTS "Usuários podem deletar suas notificações" ON notificacoes;

CREATE POLICY "Acesso global para notificações" ON notificacoes
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. Tabela financeiro
ALTER TABLE financeiro ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own financial records" ON financeiro;
DROP POLICY IF EXISTS "Users can insert their own financial records" ON financeiro;
DROP POLICY IF EXISTS "Users can update their own financial records" ON financeiro;
DROP POLICY IF EXISTS "Users can delete their own financial records" ON financeiro;
DROP POLICY IF EXISTS "Todos podem ver financeiro" ON financeiro;

CREATE POLICY "Acesso global para financeiro" ON financeiro
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. Tabela clientes
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own clients" ON clientes;
DROP POLICY IF EXISTS "Users can insert their own clients" ON clientes;
DROP POLICY IF EXISTS "Users can update their own clients" ON clientes;
DROP POLICY IF EXISTS "Users can delete their own clients" ON clientes;

CREATE POLICY "Acesso global para clientes" ON clientes
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Tabela processos
ALTER TABLE processos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own processes" ON processos;
DROP POLICY IF EXISTS "Users can insert their own processes" ON processos;
DROP POLICY IF EXISTS "Users can update their own processes" ON processos;
DROP POLICY IF EXISTS "Users can delete their own processes" ON processos;

CREATE POLICY "Acesso global para processos" ON processos
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. Tabela responsavel_financeiro
ALTER TABLE responsavel_financeiro ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuários podem ver seus responsáveis financeiros" ON responsavel_financeiro;
DROP POLICY IF EXISTS "Usuários podem criar responsáveis financeiros" ON responsavel_financeiro;

CREATE POLICY "Acesso global para responsavel_financeiro" ON responsavel_financeiro
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Comentário Final
COMMENT ON TABLE notificacoes IS 'Tabela de notificações global - Todos os usuários autenticados compartilham os alertas.';
COMMENT ON TABLE financeiro IS 'Tabela financeira global - Visibilidade total para o escritório.';
