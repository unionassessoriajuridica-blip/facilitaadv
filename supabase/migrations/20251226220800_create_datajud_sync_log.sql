-- Migration: Criar tabela de controle de sincronização DataJud
-- Descrição: Tabela para registrar checkpoints temporais e evitar duplicatas

-- Criar tabela de log de sincronizações
CREATE TABLE IF NOT EXISTS datajud_sync_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  ultimo_sync timestamp with time zone NOT NULL,
  processos_consultados integer DEFAULT 0,
  prazos_novos integer DEFAULT 0,
  prazos_atualizados integer DEFAULT 0,
  status text DEFAULT 'success' CHECK (status IN ('success', 'error', 'partial')),
  error_message text,
  created_at timestamp with time zone DEFAULT now()
);

-- Índice para buscar última sincronização rapidamente
CREATE INDEX IF NOT EXISTS idx_datajud_sync_log_created_at 
ON datajud_sync_log(created_at DESC);

-- Índice para filtrar por status
CREATE INDEX IF NOT EXISTS idx_datajud_sync_log_status 
ON datajud_sync_log(status);

-- Comentários para documentação
COMMENT ON TABLE datajud_sync_log IS 'Log de sincronizações do DataJud com checkpoint temporal para evitar duplicatas';
COMMENT ON COLUMN datajud_sync_log.ultimo_sync IS 'Timestamp da última consulta bem-sucedida ao DataJud';
COMMENT ON COLUMN datajud_sync_log.processos_consultados IS 'Quantidade de processos que foram consultados nesta execução';
COMMENT ON COLUMN datajud_sync_log.prazos_novos IS 'Quantidade de prazos novos inseridos';
COMMENT ON COLUMN datajud_sync_log.prazos_atualizados IS 'Quantidade de prazos que foram atualizados';
COMMENT ON COLUMN datajud_sync_log.status IS 'Status da sincronização: success, error ou partial';
COMMENT ON COLUMN datajud_sync_log.error_message IS 'Mensagem de erro caso status seja error';

-- Política RLS (Row Level Security)
-- Permitir leitura apenas para usuários autenticados
ALTER TABLE datajud_sync_log ENABLE ROW LEVEL SECURITY;

-- Usuários autenticados podem visualizar logs
CREATE POLICY "Usuários podem visualizar logs de sincronização"
ON datajud_sync_log FOR SELECT
TO authenticated
USING (true);

-- Apenas via service role pode inserir (backend)
-- Não criamos política de INSERT pois será via service role key
