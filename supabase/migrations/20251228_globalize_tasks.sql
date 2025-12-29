-- Globalizar acesso à tabela tasks
-- Remove policy antiga e cria nova policy de acesso global

-- Drop policy antiga que pode estar filtrando por user
DROP POLICY IF EXISTS "Usuarios autenticados podem gerenciar tasks" ON public.tasks;

-- Criar nova policy de acesso GLOBAL
CREATE POLICY "Acesso global para tasks" ON public.tasks
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Comentário: SERVICE_ROLE_KEY bypassa RLS, mas esta policy garante que
-- usuários autenticados também vejam TODAS as tasks
