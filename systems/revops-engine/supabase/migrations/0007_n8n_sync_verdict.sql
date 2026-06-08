-- 0007: include the promote verdict + play in the n8n -> Airtable sync payload.
--
-- The verdict (companies: IN/NARROW; contacts: eligible/...) and play name are not on the canonical
-- row — they live in the staging_promotions ledger. The sync trigger looks them up (latest
-- promotion for this record) and adds `verdict` + `play_name` to the webhook payload, so the n8n
-- workflow can write them to the Airtable "Promote Verdict" / "Promote Play" fields. Null for
-- records that weren't promoted via a play (e.g. a plain enrichment update).

create or replace function public.notify_n8n_airtable_sync()
returns trigger
language plpgsql
security definer
as $fn$
declare
  payload   jsonb;
  v_verdict text;
  v_play    text;
begin
  select sp.verdict, sp.play_name into v_verdict, v_play
  from public.staging_promotions sp
  where sp.canonical_record_id = NEW.id
  order by sp.promoted_at desc
  limit 1;

  payload := jsonb_build_object(
    'type',  TG_OP,
    'table', TG_TABLE_NAME,
    'record', row_to_json(NEW)::jsonb,
    'old_record', case when TG_OP = 'UPDATE' then row_to_json(OLD)::jsonb else null end,
    'verdict',   v_verdict,
    'play_name', v_play
  );

  perform net.http_post(
    url     := 'https://instig8.app.n8n.cloud/webhook/promote-airtable-sync',
    body    := payload,
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  return NEW;
end;
$fn$;
