-- 0013: a batch points at its play FOLDER, not just two file paths.
-- The staging surface enumerates the folder (playbook, guidance, delivery contract,
-- recipe, classifier bundle) so the operator sees ALL context governing a batch.
-- Also captures two previously out-of-band objects into tracked migrations
-- (DB-hygiene thread): staging_batch_meta and list_staging_batches.

create table if not exists public.staging_batch_meta (
  batch_id           text not null,
  entity             text not null,
  segment_id         uuid,
  segment_name       text,
  playbook_name      text,
  play_file_path     text,
  created_at         timestamptz default now(),
  created_by         text,
  guidance_file_path text
);

alter table public.staging_batch_meta add column if not exists play_dir text;

-- return-type change requires drop + recreate
drop function if exists public.list_staging_batches();
create or replace function public.list_staging_batches()
 returns table(table_name text, entity text, batch_id text, row_count bigint,
               segment_name text, playbook_name text, play_file_path text,
               guidance_file_path text, play_dir text)
 language plpgsql
 security definer
 set search_path to 'public', 'staging', 'pg_temp'
as $function$
declare r record; cnt bigint; v_bid text;
begin
  for r in
    select c.relname as tname
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'staging' and c.relkind = 'r'
    order by c.relname
  loop
    execute format('select count(*) from staging.%I', r.tname) into cnt;
    v_bid := substr(r.tname, length(split_part(r.tname, '_', 1)) + 2);
    table_name := r.tname;
    entity     := split_part(r.tname, '_', 1);
    batch_id   := v_bid;
    row_count  := cnt;
    select m.segment_name, m.playbook_name, m.play_file_path, m.guidance_file_path, m.play_dir
      into segment_name, playbook_name, play_file_path, guidance_file_path, play_dir
      from public.staging_batch_meta m where m.batch_id = v_bid;
    return next;
  end loop;
end;
$function$;
