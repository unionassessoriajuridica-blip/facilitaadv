-- Script para criar a tabela zapsign_documents no Supabase
-- Execute este script no SQL Editor do Supabase Dashboard

-- Criar a tabela zapsign_documents
CREATE TABLE IF NOT EXISTS zapsign_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER REFERENCES users(id),
    processo_id UUID REFERENCES processos(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES clientes(id),
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

-- Criar indices para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_zapsign_documents_processo_id ON zapsign_documents(processo_id);
CREATE INDEX IF NOT EXISTS idx_zapsign_documents_user_id ON zapsign_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_zapsign_documents_status ON zapsign_documents(status);
CREATE INDEX IF NOT EXISTS idx_zapsign_documents_zapsign_token ON zapsign_documents(zapsign_token);

-- Adicionar comentarios nas colunas para documentacao
COMMENT ON TABLE zapsign_documents IS 'Documentos enviados para assinatura digital via ZapSign';
COMMENT ON COLUMN zapsign_documents.zapsign_token IS 'Token unico do documento no ZapSign para consultas';
COMMENT ON COLUMN zapsign_documents.zapsign_open_id IS 'ID publico do documento no ZapSign';
COMMENT ON COLUMN zapsign_documents.status IS 'Status do documento: pending, signed, refused, canceled';
COMMENT ON COLUMN zapsign_documents.signatarios IS 'Array JSON com dados dos signatarios e seus status';
COMMENT ON COLUMN zapsign_documents.external_id IS 'ID externo para referencia (geralmente o processo_id)';

-- Habilitar Row Level Security (RLS)
ALTER TABLE zapsign_documents ENABLE ROW LEVEL SECURITY;

-- Politica para usuarios autenticados verem seus proprios documentos
CREATE POLICY "Users can view own zapsign documents" ON zapsign_documents
    FOR SELECT
    USING (auth.uid()::text IN (
        SELECT auth_id FROM users WHERE id = zapsign_documents.user_id
    ));

-- Politica para usuarios autenticados inserirem documentos
CREATE POLICY "Users can insert own zapsign documents" ON zapsign_documents
    FOR INSERT
    WITH CHECK (auth.uid()::text IN (
        SELECT auth_id FROM users WHERE id = zapsign_documents.user_id
    ));

-- Politica para usuarios autenticados atualizarem seus documentos
CREATE POLICY "Users can update own zapsign documents" ON zapsign_documents
    FOR UPDATE
    USING (auth.uid()::text IN (
        SELECT auth_id FROM users WHERE id = zapsign_documents.user_id
    ));

-- Politica para permitir acesso via service role (backend)
CREATE POLICY "Service role full access" ON zapsign_documents
    FOR ALL
    USING (auth.role() = 'service_role');

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_zapsign_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_zapsign_documents_updated_at
    BEFORE UPDATE ON zapsign_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_zapsign_documents_updated_at();
