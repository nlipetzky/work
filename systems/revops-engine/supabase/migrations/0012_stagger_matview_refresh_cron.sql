-- 0012_stagger_matview_refresh_cron.sql — stop the audit-matview refreshes from saturating the DB.
--
-- Four pg_cron jobs refresh audit/health materialized views. They were all scheduled at
-- `*/5 * * * *` (every 5 min) and fired simultaneously, each REFRESH ... CONCURRENTLY full-scanning
-- the ~26k-row contacts table for 12-19s. On the Micro (t4g.micro) instance, four heavy scans at once
-- exhausted CPU and the DB went "Unhealthy" — the Management API / query path returned HTTP 544
-- "Connection terminated" for minutes at a time (blocked migration 0011 on 2026-06-09).
--
-- These are hygiene/audit views; nobody consumes them at 5-minute resolution. Fix = drop to hourly and
-- STAGGER them 15 min apart so only one ~19s refresh window exists at a time. The saturation was
-- four-at-once, not the refresh mode, so CONCURRENTLY is kept (non-blocking for readers).
--
-- NOTE: these cron jobs AND the matview definitions were created out-of-band (directly in the DB), so
-- this is their first tracked record. Capturing the four matview definitions in a migration is a
-- separate follow-up; the heaviest (v_contact_field_completeness, ~7.4KB def) is also a query-rework
-- candidate — 12-19s for 26k rows points at per-row jsonb extraction / self-joins.
--
-- Keyed by jobname (not jobid) so it is portable across environments. Idempotent.

do $$
begin
  perform cron.alter_job((select jobid from cron.job where jobname = 'refresh-mat-field-completeness'), schedule := '3 * * * *');
  perform cron.alter_job((select jobid from cron.job where jobname = 'refresh-mat-gate-distribution'),  schedule := '18 * * * *');
  perform cron.alter_job((select jobid from cron.job where jobname = 'refresh-mat-segment-hygiene'),    schedule := '33 * * * *');
  perform cron.alter_job((select jobid from cron.job where jobname = 'refresh-mat-domain-cap'),         schedule := '48 * * * *');
end
$$;
