-- Script SIMPLIFICADO para criar a tabela zapsign_documents no Supabase
-- Use este script se o script principal der erro de RLS
-- Execute no SQL Editor do Supabase Dashboard

-- Criar a tabela zapsign_documents
CREATE TABLE IF NOT EXISTS zapsign_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER,
    processo_id UUID,
    cliente_id UUID,
    nome TEXT NOT NULL,
    zapsign_token TEXT,
    zapsign_open_id INTEGER,
    status TEXT DEFAULT 'pending',
    original_file_url TEXT,
    signed_file_url TEXT,
    signatarios JSONB,
    external_id TEXT,
    date_limit_to_sign TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar indices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_zapsign_docs_processo ON zapsign_documents(processo_id);
CREATE INDEX IF NOT EXISTS idx_zapsign_docs_status ON zapsign_documents(status);

-- Habilitar RLS com politica permissiva para usuarios autenticados
ALTER TABLE zapsign_documents ENABLE ROW LEVEL SECURITY;

-- Politica simples: usuarios autenticados podem tudo
CREATE POLICY "Authenticated users full access" ON zapsign_documents
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Permitir acesso anonimo para o backend (via anon key)
CREATE POLICY "Anon key access for backend" ON zapsign_documents
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);
