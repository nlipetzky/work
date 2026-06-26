-- Both hybrid search functions were missing 'extensions' in their search_path,
-- causing the pgvector <=> operator to be unresolvable at call time.
ALTER FUNCTION public.fn_canon_chunks_hybrid_search(vector, text, text[], integer, integer)
SET search_path = public, extensions, pg_catalog, pg_temp;

ALTER FUNCTION public.fn_cluster_hybrid_search(uuid, vector, text, uuid[], integer, integer)
SET search_path = public, extensions, pg_catalog, pg_temp;
