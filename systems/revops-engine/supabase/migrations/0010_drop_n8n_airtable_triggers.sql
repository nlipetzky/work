-- Structural kill-switch: no row write on companies or contacts can emit an outbound sync call.
-- The triggers were disabled by hand on 2026-06-08 after a bulk sf-reverse-sync generated ~26k
-- webhook calls and DoS'd the n8n instance. This migration makes it permanent and removes the
-- dead function. Sync is now an explicit consequence of a promote event handled by Inngest.
drop trigger if exists companies_n8n_sync on public.companies;
drop trigger if exists contacts_n8n_sync on public.contacts;
drop function if exists public.notify_n8n_airtable_sync();
