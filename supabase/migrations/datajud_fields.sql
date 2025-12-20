-- Adiciona campos para armazenar dados do DataJud na tabela processos

ALTER TABLE processos ADD COLUMN IF NOT EXISTS datajud_tribunal TEXT;
ALTER TABLE processos ADD COLUMN IF NOT EXISTS datajud_classe TEXT;
ALTER TABLE processos ADD COLUMN IF NOT EXISTS datajud_classe_codigo INTEGER;
ALTER TABLE processos ADD COLUMN IF NOT EXISTS datajud_sistema TEXT;
ALTER TABLE processos ADD COLUMN IF NOT EXISTS datajud_formato TEXT;
ALTER TABLE processos ADD COLUMN IF NOT EXISTS datajud_grau TEXT;
ALTER TABLE processos ADD COLUMN IF NOT EXISTS datajud_data_ajuizamento TEXT;
ALTER TABLE processos ADD COLUMN IF NOT EXISTS datajud_movimentos JSONB;
ALTER TABLE processos ADD COLUMN IF NOT EXISTS datajud_ultima_atualizacao_cnj TIMESTAMPTZ;
ALTER TABLE processos ADD COLUMN IF NOT EXISTS datajud_ultima_movimentacao TIMESTAMPTZ;
ALTER TABLE processos ADD COLUMN IF NOT EXISTS datajud_atualizado_em TIMESTAMPTZ;
ALTER TABLE processos ADD COLUMN IF NOT EXISTS datajud_sigilo BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN processos.datajud_tribunal IS 'Tribunal do processo (ex: TJSP, TRF1)';
COMMENT ON COLUMN processos.datajud_sigilo IS 'Indica se o processo está sob sigilo/segredo de justiça';
COMMENT ON COLUMN processos.datajud_classe IS 'Classe processual (ex: Execução da Pena)';
COMMENT ON COLUMN processos.datajud_movimentos IS 'Movimentações do processo em formato JSON';
COMMENT ON COLUMN processos.datajud_ultima_atualizacao_cnj IS 'Data da última atualização no CNJ';
COMMENT ON COLUMN processos.datajud_ultima_movimentacao IS 'Data da última movimentação processual';
COMMENT ON COLUMN processos.datajud_atualizado_em IS 'Data em que o sistema atualizou os dados do DataJud';
