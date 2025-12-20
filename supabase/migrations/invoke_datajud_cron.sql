-- Script para invocar a Edge Function datajud-cron pelo Supabase SQL Editor
-- Este script chama a função que consulta TODOS os processos no DataJud

-- Habilitar extensão pg_net (se ainda não estiver habilitada)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Invocar a Edge Function datajud-cron
-- IMPORTANTE: Substitua as variáveis abaixo pelos valores corretos:
-- 1. SUA_URL_SUPABASE = sua URL do Supabase (ex: https://xxxxx.supabase.co)
-- 2. SUA_SERVICE_ROLE_KEY = sua chave service_role (encontrada em Settings > API)

SELECT net.http_post(
    url := 'https://zskyvltkzcpkelusvbbm.supabase.co/functions/v1/datajud-cron',
    headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 300000  -- 5 minutos de timeout
) AS request_id;

-- Alternativa: Se o método acima não funcionar, use este com a chave diretamente:
-- (Substitua SUA_SERVICE_ROLE_KEY pela chave real)
/*
SELECT net.http_post(
    url := 'https://zskyvltkzcpkelusvbbm.supabase.co/functions/v1/datajud-cron',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer SUA_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{}'::jsonb,
    timeout_milliseconds := 300000
) AS request_id;
*/

-- Para verificar o resultado da requisição HTTP:
-- SELECT * FROM net._http_response WHERE id = <request_id retornado acima>;

-- Para agendar execução diária à meia-noite (horário de Brasília = 03:00 UTC):
/*
SELECT cron.schedule(
    'datajud-daily-update',
    '0 3 * * *',
    $$
    SELECT net.http_post(
        url := 'https://zskyvltkzcpkelusvbbm.supabase.co/functions/v1/datajud-cron',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 300000
    );
    $$
);
*/
