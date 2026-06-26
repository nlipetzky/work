-- canon_clusters: scoping fields
-- All columns and indexes already exist on Canon Supabase (mzzjvoiwughcnmmqzbxv)
-- as of 2026-05-05. Kept here for reproducibility.

ALTER TABLE canon_clusters
  ADD COLUMN IF NOT EXISTS account_id  uuid NULL,
  ADD COLUMN IF NOT EXISTS tags        text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS visibility  text NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('private','account','global'));

CREATE INDEX IF NOT EXISTS canon_clusters_account_idx ON canon_clusters(account_id);
CREATE INDEX IF NOT EXISTS canon_clusters_tags_gin ON canon_clusters USING gin(tags);

-- cluster_items: curation extensions
ALTER TABLE cluster_items
  ADD COLUMN IF NOT EXISTS pinned_excerpt text,
  ADD COLUMN IF NOT EXISTS note          text;

-- cluster_chat_turns: session lookup index
CREATE INDEX IF NOT EXISTS cluster_chat_turns_session_idx
  ON cluster_chat_turns(cluster_id, session_id, created_at);
