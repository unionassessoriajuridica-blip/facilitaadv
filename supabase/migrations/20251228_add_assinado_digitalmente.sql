-- Migration: Adicionar colunas para documentos assinados digitalmente
-- Data: 2025-12-28
-- Descrição: Adiciona suporte para rastrear documentos do ZapSign vinculados a processos

-- Adicionar coluna para marcar documentos assinados digitalmente
ALTER TABLE documentos_processo 
ADD COLUMN IF NOT EXISTS assinado_digitalmente BOOLEAN DEFAULT FALSE;

-- Adicionar coluna para armazenar token do ZapSign
ALTER TABLE documentos_processo
ADD COLUMN IF NOT EXISTS zapsign_token TEXT;

-- Criar índice para buscas por token do ZapSign
CREATE INDEX IF NOT EXISTS idx_documentos_processo_zapsign 
ON documentos_processo(zapsign_token) 
WHERE zapsign_token IS NOT NULL;

-- Comentários nas colunas
COMMENT ON COLUMN documentos_processo.assinado_digitalmente IS 'Indica se o documento foi assinado digitalmente via ZapSign';
COMMENT ON COLUMN documentos_processo.zapsign_token IS 'Token único do documento no ZapSign para rastreamento';
