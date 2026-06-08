-- promote_staging_batch: move a staging batch into the working contacts/companies tables,
-- on-rails. Stamps per-field provenance, declares recipe context (so the enrichment-pipeline
-- enforce trigger passes), records a run, writes the staging_promotions ledger and an
-- entity_activity_log event per record. Idempotent per (batch_id, source_record_id).
--
-- Target: working public.contacts / public.companies (NOT the canonical_* identity layer).
-- Identity: exact natural key (contacts=email, companies=domain), case-insensitive.
--   0 matches -> insert; 1 match -> update (survivorship: only real values, linkedin_url is
--   manual_only so never overwritten); >1 match -> reject (ambiguous, no auto-merge).
-- Per-row subtransaction: a row that fails (e.g. a data-quality trigger rejection) is counted
--   as rejected and skipped; the batch continues.
--
-- Staging table convention: staging.<entity>_<batch_id>, one row per record, with:
--   - id uuid           (the source_record_id; stable, set by the loader)
--   - engine_account_id, account_id  (NOT NULL on targets, so required here)
--   - any subset of canonical column names to promote.

create schema if not exists staging;

create or replace function public.promote_staging_batch(
  p_batch_id    text,
  p_entity      text,                       -- 'contacts' | 'companies'
  p_promoted_by text default 'projection-ui'
) returns table(promoted int, inserted int, updated int, rejected int, run_id uuid)
language plpgsql
as $fn$
declare
  v_staging_rel  text;
  v_target_cols  text[];
  v_staging_cols text[];
  v_promote_cols text[];
  v_excluded     text[] := array['id','field_provenance','created_at','updated_at',
                                 'canonical_contact_id','canonical_company_id'];
  v_key_field    text;
  v_run_id       uuid;
  v_done         uuid[];
  v_row          jsonb;
  v_src_id       uuid;
  v_real         jsonb;
  v_prov         jsonb;
  v_present      text[];
  v_col          text;
  v_val          jsonb;
  v_sval         text;
  v_key_val      text;
  v_match_id     uuid;
  v_match_count  int;
  v_set_list     text;
  v_col_list     text;
  v_sel_list     text;
  v_new_id       uuid;
  c_promoted int := 0; c_inserted int := 0; c_updated int := 0; c_rejected int := 0;
begin
  if p_entity not in ('contacts','companies') then
    raise exception 'p_entity must be contacts or companies, got %', p_entity;
  end if;

  v_staging_rel := format('staging.%I', p_entity || '_' || p_batch_id);
  v_key_field   := case p_entity when 'contacts' then 'email' else 'domain' end;

  -- on-rails: declare who is writing, for the enrichment-pipeline enforce trigger + attribution
  perform set_config('my_app.recipe_id', 'ingest:'||p_batch_id, true);

  select array_agg(column_name) into v_target_cols
  from information_schema.columns where table_schema='public' and table_name=p_entity;

  select array_agg(column_name) into v_staging_cols
  from information_schema.columns where table_schema='staging' and table_name=p_entity||'_'||p_batch_id;

  if v_staging_cols is null then
    raise exception 'staging table % not found', v_staging_rel;
  end if;

  select array_agg(c) into v_promote_cols
  from unnest(v_staging_cols) c
  where c = any(v_target_cols) and c <> all(v_excluded);

  select coalesce(array_agg(source_record_id), '{}') into v_done
  from public.staging_promotions where batch_id = p_batch_id;

  -- A promotion is audited by staging_promotions + entity_activity_log, grouped by this run
  -- id. We do NOT write enrichment_runs: that table is the list-enrichment fast path (requires
  -- list_id/recipe_id/target_account_id), a different kind of run. The projection UI Runs page
  -- can later union promotion runs in from staging_promotions.
  v_run_id := gen_random_uuid();

  for v_row, v_src_id in
    execute format('select to_jsonb(t), t.id from %s t', v_staging_rel)
  loop
    if v_src_id = any(v_done) then
      continue;  -- already promoted in a prior run (idempotent)
    end if;

    begin
      v_real := '{}'::jsonb; v_prov := '{}'::jsonb; v_present := '{}';
      foreach v_col in array v_promote_cols loop
        v_val := v_row -> v_col;
        if v_val is null or v_val = 'null'::jsonb then continue; end if;
        if jsonb_typeof(v_val) = 'string' then
          v_sval := trim(v_val #>> '{}');
          if v_sval = '' then continue; end if;
        end if;
        v_real := v_real || jsonb_build_object(v_col, v_val);
        v_prov := v_prov || jsonb_build_object(v_col, jsonb_build_object(
                    'source','ingest:'||p_batch_id, 'action','promote', 'timestamp', now()));
        v_present := array_append(v_present, v_col);
      end loop;

      if array_length(v_present,1) is null then
        c_rejected := c_rejected + 1; continue;
      end if;

      v_key_val := lower(nullif(trim(coalesce(v_row->>v_key_field,'')),''));
      v_match_id := null; v_match_count := 0;
      if v_key_val is not null then
        execute format('select count(*) from public.%I where lower(%I)=$1', p_entity, v_key_field)
          using v_key_val into v_match_count;
        if v_match_count = 1 then
          execute format('select id from public.%I where lower(%I)=$1', p_entity, v_key_field)
            using v_key_val into v_match_id;
        end if;
      end if;

      if v_match_count > 1 then
        c_rejected := c_rejected + 1; continue;  -- ambiguous; route to dup review, never auto-merge
      elsif v_match_count = 1 then
        select string_agg(format('%I = r.%I', c, c), ', ') into v_set_list
        from unnest(v_present) c where c <> v_key_field and c <> 'linkedin_url';
        if v_set_list is not null then
          execute format(
            'update public.%I t set %s, field_provenance = t.field_provenance || $2, updated_at = now()
               from jsonb_populate_record(null::public.%I, $1) r where t.id = $3',
            p_entity, v_set_list, p_entity) using v_real, v_prov, v_match_id;
        end if;
        v_new_id := v_match_id; c_updated := c_updated + 1;
      else
        select string_agg(quote_ident(c), ', '), string_agg('r.'||quote_ident(c), ', ')
          into v_col_list, v_sel_list from unnest(v_present) c;
        execute format(
          'insert into public.%I (%s, field_provenance) select %s, $2
             from jsonb_populate_record(null::public.%I, $1) r returning id',
          p_entity, v_col_list, v_sel_list, p_entity) using v_real, v_prov into v_new_id;
        c_inserted := c_inserted + 1;
      end if;

      insert into public.entity_activity_log
        (entity_type, entity_id, activity_type, outcome, triggered_by, recipe_id, details, created_at)
      values
        (case p_entity when 'contacts' then 'contact' else 'company' end, v_new_id,
         'staging_promotion', 'success',
         p_promoted_by, 'ingest:'||p_batch_id,
         jsonb_build_object('batch_id',p_batch_id,'source_record_id',v_src_id,'run_id',v_run_id,
                            'action', case when v_match_count=1 then 'updated' else 'inserted' end), now());

      insert into public.staging_promotions
        (batch_id, source_record_type, source_record_id, canonical_record_id, enrichment_run_ids, promoted_by, promoted_at)
      values
        (p_batch_id, 'staging_'||(case p_entity when 'contacts' then 'contact' else 'company' end),
         v_src_id, v_new_id, array[v_run_id], p_promoted_by, now());

      c_promoted := c_promoted + 1;

    exception when others then
      c_rejected := c_rejected + 1;  -- row rejected by a trigger/constraint; subtransaction rolls back this row
    end;
  end loop;

  promoted := c_promoted; inserted := c_inserted; updated := c_updated;
  rejected := c_rejected; run_id := v_run_id; return next;
end;
$fn$;
