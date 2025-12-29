-- ====================================================================
-- Script SQL: Atualizar Prazos para Status "CUMPRIDO"
-- Tabela: public.prazos
-- Data: 2025-12-28 00:51:39 -03:00
-- ====================================================================

-- SCHEMA DA TABELA PRAZOS:
-- - status: 'ATIVO', 'CUMPRIDO', 'VENCIDO', 'CANCELADO'
-- - cumprido_em: timestamp with time zone
-- - tipo_prazo: 'INTIMACAO', 'RESPOSTA', 'RECURSO', 'CIENCIA', etc.

-- ====================================================================
-- OPÇÃO 1: Atualizar prazos ATIVOS com data_final anterior a 2025-11-01
-- ====================================================================
UPDATE public.prazos
SET 
  status = 'CUMPRIDO',
  cumprido_em = '2025-12-28 00:56:13-03:00'::timestamp with time zone,
  updated_at = NOW()
WHERE status = 'VENCIDO'
  AND data_final < '2025-11-01'::date;

-- ====================================================================
-- OPÇÃO 2: Atualizar apenas prazos ATIVOS e VENCIDOS (data_final no passado)
-- ====================================================================
-- UPDATE public.prazos
-- SET 
--   status = 'CUMPRIDO',
--   cumprido_em = '2025-12-28 00:51:39-03:00'::timestamp with time zone,
--   updated_at = NOW()
-- WHERE status = 'ATIVO'
--   AND data_final < CURRENT_DATE;

-- ====================================================================
-- OPÇÃO 3: Atualizar prazos ATIVOS de um processo específico
-- (Substitua 'SEU_PROCESSO_ID' pelo ID real do processo)
-- ====================================================================
-- UPDATE public.prazos
-- SET 
--   status = 'CUMPRIDO',
--   cumprido_em = '2025-12-28 00:51:39-03:00'::timestamp with time zone,
--   updated_at = NOW()
-- WHERE status = 'ATIVO'
--   AND processo_id = 'SEU_PROCESSO_ID'::uuid;

-- ====================================================================
-- OPÇÃO 4: Atualizar prazos por tipo (ex: apenas INTIMACAO)
-- ====================================================================
-- UPDATE public.prazos
-- SET 
--   status = 'CUMPRIDO',
--   cumprido_em = '2025-12-28 00:51:39-03:00'::timestamp with time zone,
--   updated_at = NOW()
-- WHERE status = 'ATIVO'
--   AND tipo_prazo = 'INTIMACAO';

-- ====================================================================
-- VERIFICAÇÃO: Consultar status dos prazos após update
-- ====================================================================
-- SELECT 
--   status,
--   tipo_prazo,
--   COUNT(*) as quantidade,
--   COUNT(CASE WHEN cumprido_em IS NOT NULL THEN 1 END) as com_data_cumprimento
-- FROM public.prazos
-- GROUP BY status, tipo_prazo
-- ORDER BY status, tipo_prazo;

-- ====================================================================
-- VERIFICAÇÃO DETALHADA: Ver últimos prazos atualizados
-- ====================================================================
-- SELECT 
--   id,
--   tipo_prazo,
--   status,
--   data_inicio,
--   data_final,
--   cumprido_em,
--   movimento_descricao
-- FROM public.prazos
-- WHERE status = 'CUMPRIDO'
-- ORDER BY cumprido_em DESC
-- LIMIT 10;

-- ====================================================================
-- ROLLBACK: Para testar com segurança (execute ANTES do UPDATE)
-- ====================================================================
-- BEGIN;
-- -- Seu UPDATE aqui
-- -- SELECT para verificar
-- ROLLBACK; -- Se quiser desfazer
-- COMMIT; -- Se quiser confirmar
