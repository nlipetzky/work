-- 0006: repoint the Supabase -> Airtable sync to the new flat-upsert n8n workflow, for BOTH
-- companies and contacts.
--
-- Background: the old companies trigger posted flat rows to /webhook/supabase-companies-sync, which
-- is handled by an INACTIVE, update-only workflow (it can't insert new companies). The other
-- "active" workflows expect a rich enrichment-enveloped payload our promote does not send. So a new
-- workflow "Promote → Airtable (flat upsert)" (n8n id Hfb3N72nBmPBtE8d, path promote-airtable-sync)
-- upserts our flat canonical rows into the RevOps Surface base (appYBYH3aOHhTODAw) by Supabase ID:
--   companies -> Companies (tblnj3YlOI3thjrXp), contacts -> Contacts (tblWJksRL1yKSUgrm).
-- Verified end-to-end with probe records (company + contact) before this migration.
--
-- One generic trigger function (uses TG_TABLE_NAME + row_to_json) drives both tables. Async via
-- pg_net so promote is never blocked. The n8n workflow upserts to Airtable only, so no write-back
-- loop.

create or replace function public.notify_n8n_airtable_sync()
returns trigger
language plpgsql
security definer
as $fn$
declare
  payload jsonb;
begin
  payload := jsonb_build_object(
    'type',  TG_OP,
    'table', TG_TABLE_NAME,
    'record', row_to_json(NEW)::jsonb,
    'old_record', case when TG_OP = 'UPDATE' then row_to_json(OLD)::jsonb else null end
  );
  perform net.http_post(
    url     := 'https://instig8.app.n8n.cloud/webhook/promote-airtable-sync',
    body    := payload,
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  return NEW;
end;
$fn$;

-- companies: repoint from the old (dead) workflow to the new one
drop trigger if exists companies_n8n_sync on public.companies;
create trigger companies_n8n_sync
  after insert or update on public.companies
  for each row execute function public.notify_n8n_airtable_sync();

-- contacts: new sync (there was none before)
drop trigger if exists contacts_n8n_sync on public.contacts;
create trigger contacts_n8n_sync
  after insert or update on public.contacts
  for each row execute function public.notify_n8n_airtable_sync();

-- retire the old companies-only function (now unreferenced; pointed at the dead webhook path)
drop function if exists public.notify_n8n_companies_change();
