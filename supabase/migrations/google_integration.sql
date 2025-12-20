-- Tabela para armazenar a configuração centralizada da integração Google Calendar
-- Execute este SQL no Supabase Dashboard > SQL Editor
-- IMPORTANTE: Este SQL é seguro - tokens NÃO são expostos para usuários comuns

CREATE TABLE IF NOT EXISTS google_integration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  calendar_id VARCHAR(255) DEFAULT 'primary',
  calendar_name VARCHAR(255),
  expires_at TIMESTAMP WITH TIME ZONE,
  connected_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_google_integration_active ON google_integration(is_active);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_google_integration_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_google_integration_updated_at
  BEFORE UPDATE ON google_integration
  FOR EACH ROW
  EXECUTE FUNCTION update_google_integration_updated_at();

-- RLS (Row Level Security)
ALTER TABLE google_integration ENABLE ROW LEVEL SECURITY;

-- POLÍTICA DE SEGURANÇA: Apenas admins/master podem acessar a tabela diretamente
-- Usuários comuns NÃO podem ler tokens - usam apenas funções RPC
CREATE POLICY "Apenas admins podem gerenciar integracao"
  ON google_integration
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('master', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('master', 'admin')
    )
  );

-- Função RPC segura para verificar status da integração (NÃO expõe tokens)
CREATE OR REPLACE FUNCTION get_google_integration_status()
RETURNS TABLE (
  is_connected BOOLEAN,
  calendar_name VARCHAR(255),
  connected_at TIMESTAMP WITH TIME ZONE,
  connected_by_email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    true as is_connected,
    gi.calendar_name,
    gi.connected_at,
    p.email as connected_by_email
  FROM google_integration gi
  LEFT JOIN profiles p ON p.id = gi.connected_by
  WHERE gi.is_active = true
  LIMIT 1;
END;
$$;

-- Função RPC para criar evento no Google Calendar (executa no servidor)
-- Esta função usa os tokens internamente sem expô-los ao cliente
CREATE OR REPLACE FUNCTION create_google_calendar_event(
  p_title TEXT,
  p_description TEXT DEFAULT '',
  p_start_time TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_end_time TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_location TEXT DEFAULT '',
  p_event_type TEXT DEFAULT 'outros'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_access_token TEXT;
  v_calendar_id TEXT;
  v_response JSON;
BEGIN
  -- Buscar token ativo (apenas internamente, não exposto)
  SELECT access_token, calendar_id 
  INTO v_access_token, v_calendar_id
  FROM google_integration 
  WHERE is_active = true 
  LIMIT 1;
  
  IF v_access_token IS NULL THEN
    RETURN json_build_object('error', 'Integração não configurada');
  END IF;
  
  -- Nota: A criação real do evento deve ser feita via Edge Function
  -- Esta função prepara os dados e retorna instruções
  RETURN json_build_object(
    'success', true,
    'message', 'Use Edge Function para criar evento',
    'event_data', json_build_object(
      'title', '[FACILITA ADV] ' || p_title,
      'description', p_description,
      'start', p_start_time,
      'end', p_end_time,
      'location', p_location,
      'type', p_event_type
    )
  );
END;
$$;

-- Comentários para documentação
COMMENT ON TABLE google_integration IS 'Configuração centralizada da integração com Google Calendar - TOKENS PROTEGIDOS';
COMMENT ON COLUMN google_integration.access_token IS 'Token de acesso OAuth do Google - NUNCA exposto via RLS';
COMMENT ON COLUMN google_integration.refresh_token IS 'Token de refresh para renovar acesso - NUNCA exposto via RLS';
COMMENT ON COLUMN google_integration.calendar_id IS 'ID do calendário Google (default: primary)';
COMMENT ON COLUMN google_integration.connected_by IS 'ID do admin que configurou a integração';
COMMENT ON FUNCTION get_google_integration_status IS 'Retorna status da integração SEM expor tokens';
COMMENT ON FUNCTION create_google_calendar_event IS 'Prepara dados para criação de evento - use com Edge Function';
