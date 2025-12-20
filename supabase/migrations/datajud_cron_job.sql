-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres user
GRANT USAGE ON SCHEMA cron TO postgres;

-- Schedule the DataJud cron job to run daily at midnight (Brazil time, UTC-3)
-- This schedules for 03:00 UTC which is 00:00 BRT
SELECT cron.schedule(
  'datajud-daily-update',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/datajud-cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Alternative: If using Supabase Dashboard, add this cron job manually:
-- Name: datajud-daily-update
-- Schedule: 0 3 * * * (runs at 03:00 UTC = 00:00 BRT)
-- Command: SELECT net.http_post(...)

-- To verify cron jobs:
-- SELECT * FROM cron.job;

-- To remove a cron job:
-- SELECT cron.unschedule('datajud-daily-update');
