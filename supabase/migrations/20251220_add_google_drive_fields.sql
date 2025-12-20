-- Script para adicionar campos do Google Drive na tabela documentos_processo
-- Execute este script no SQL Editor do Supabase Dashboard

-- Adicionar campos para armazenar informações do Google Drive
ALTER TABLE documentos_processo
ADD COLUMN IF NOT EXISTS google_drive_file_id TEXT,
ADD COLUMN IF NOT EXISTS google_drive_folder_id TEXT,
ADD COLUMN IF NOT EXISTS google_drive_link TEXT;

-- Criar indice para buscar por file_id do Drive (apenas se nao existir)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_documentos_processo_drive_file_id') THEN
        CREATE INDEX idx_documentos_processo_drive_file_id ON documentos_processo(google_drive_file_id);
    END IF;
END$$;

-- Adicionar comentarios para documentacao
COMMENT ON COLUMN documentos_processo.google_drive_file_id IS 'ID do arquivo no Google Drive';
COMMENT ON COLUMN documentos_processo.google_drive_folder_id IS 'ID da pasta do processo no Google Drive';
COMMENT ON COLUMN documentos_processo.google_drive_link IS 'Link publico para visualizar o arquivo no Drive';
