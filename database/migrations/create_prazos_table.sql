-- ============================================
-- Script SQL: Criar Tabela de Prazos
-- ============================================
-- 
-- IMPORTANTE: Execute este script no Supabase SQL Editor
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql
--

-- Criar tabela de prazos
CREATE TABLE IF NOT EXISTS public.prazos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  processo_id uuid NOT NULL REFERENCES public.processos(id) ON DELETE CASCADE,
  
  -- Movimentação que gerou o prazo
  movimento_codigo integer NOT NULL,
  movimento_descricao text NOT NULL,
  movimento_data timestamp with time zone NOT NULL,
  
  -- Configuração do prazo
  tipo_prazo text NOT NULL CHECK (tipo_prazo IN (
    'INTIMACAO',
    'RESPOSTA', 
    'RECURSO',
    'CIENCIA',
    'MANIFESTACAO',
    'CONTRARRAZOES',
    'IMPUGNACAO',
    'VERIFICACAO',
    'DESPACHO'
  )),
  dias_prazo integer NOT NULL CHECK (dias_prazo > 0 AND dias_prazo <= 365),
  data_inicio date NOT NULL,
  data_final date NOT NULL,
  dias_corridos boolean NOT NULL DEFAULT false,
  
  -- Status do prazo
  status text NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'CUMPRIDO', 'VENCIDO', 'CANCELADO')),
  cumprido_em timestamp with time zone,
  observacoes text,
  
  -- Metadata
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT prazos_data_final_check CHECK (data_final >= data_inicio),
  CONSTRAINT prazos_cumprido_status_check CHECK (
    (status = 'CUMPRIDO' AND cumprido_em IS NOT NULL) OR
    (status != 'CUMPRIDO' AND cumprido_em IS NULL)
  )
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_prazos_user_status 
  ON public.prazos(user_id, status) 
  WHERE status IN ('ATIVO', 'VENCIDO');

CREATE INDEX IF NOT EXISTS idx_prazos_data_final 
  ON public.prazos(data_final) 
  WHERE status = 'ATIVO';

CREATE INDEX IF NOT EXISTS idx_prazos_processo 
  ON public.prazos(processo_id);

CREATE INDEX IF NOT EXISTS idx_prazos_created 
  ON public.prazos(created_at DESC);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_prazos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prazos_updated_at_trigger
  BEFORE UPDATE ON public.prazos
  FOR EACH ROW
  EXECUTE FUNCTION update_prazos_updated_at();

-- Função para marcar prazos vencidos automaticamente
CREATE OR REPLACE FUNCTION marcar_prazos_vencidos()
RETURNS void AS $$
BEGIN
  UPDATE public.prazos
  SET status = 'VENCIDO'
  WHERE status = 'ATIVO'
    AND data_final < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Comentários nas colunas
COMMENT ON TABLE public.prazos IS 'Armazena prazos processuais calculados automaticamente a partir de movimentações do DataJud';
COMMENT ON COLUMN public.prazos.tipo_prazo IS 'Tipo do prazo processual (ex: INTIMACAO, RECURSO)';
COMMENT ON COLUMN public.prazos.dias_corridos IS 'true = dias corridos, false = dias úteis';
COMMENT ON COLUMN public.prazos.status IS 'Status atual do prazo (ATIVO, CUMPRIDO, VENCIDO, CANCELADO)';

-- RLS (Row Level Security)
ALTER TABLE public.prazos ENABLE ROW LEVEL SECURITY;

-- Policy: Todos usuários autenticados veem TODOS os prazos (compartilhado)
CREATE POLICY "Usuários veem todos os prazos"
  ON public.prazos
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy: Usuários podem atualizar qualquer prazo (marcar como cumprido)
CREATE POLICY "Usuários atualizam prazos"
  ON public.prazos
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Policy: Sistema pode inserir prazos (via service role)
CREATE POLICY "Sistema pode inserir prazos"
  ON public.prazos
  FOR INSERT
  WITH CHECK (true);

-- Grant permissões
GRANT SELECT, UPDATE ON public.prazos TO authenticated;
GRANT INSERT ON public.prazos TO service_role;

-- ============================================
-- Script de Teste (Opcional)
-- ============================================

-- Inserir prazo de teste
-- INSERT INTO public.prazos (
--   user_id,
--   processo_id,
--   movimento_codigo,
--   movimento_descricao,
--   movimento_data,
--   tipo_prazo,
--   dias_prazo,
--   data_inicio,
--   data_final,
--   dias_corridos,
--   status
-- ) VALUES (
--   auth.uid(),
--   'UUID_DO_PROCESSO_AQUI',
--   246,
--   'Intimação para resposta',
--   now(),
--   'INTIMACAO',
--   5,
--   CURRENT_DATE,
--   CURRENT_DATE + interval '5 days',
--   false,
--   'ATIVO'
-- );

-- Consultar prazos ativos
-- SELECT * FROM public.prazos 
-- WHERE user_id = auth.uid() 
--   AND status = 'ATIVO' 
-- ORDER BY data_final ASC;
