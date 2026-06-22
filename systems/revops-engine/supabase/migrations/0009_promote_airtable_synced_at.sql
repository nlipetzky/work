alter table public.staging_promotions
  add column if not exists airtable_synced_at timestamptz;

comment on column public.staging_promotions.airtable_synced_at is
  'Stamped by projection-ui Inngest sync after a successful Airtable upsert.';
