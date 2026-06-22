-- 0008: promote_staging_batch must run as definer.
--
-- The staging tables are granted to `postgres` only. promote_staging_batch was created
-- SECURITY INVOKER, so when the projection-ui calls it through PostgREST (as the
-- authenticated/service_role role) it has no privilege on staging.* and
-- information_schema.columns returns nothing -> the function raises
-- "staging table staging.<entity>_<batch> not found" even though the table exists.
--
-- The sibling read RPCs (list_staging_batches, staging_batch_preview) are already
-- SECURITY DEFINER. Bring promote in line. Every table/type in the body is
-- schema-qualified, so an empty search_path is safe and satisfies the linter.

alter function public.promote_staging_batch(text, text, text)
  security definer
  set search_path = '';
