---
type: artifact-approval
system: signal-prospecting
evidence: systems/revops-engine/supabase/migrations/0013_batch_meta_play_dir.sql
proposed: "Record on signal-prospecting: batches are now context-bound at load (play_dir + meta row required by the loader; staging surface enumerates the full play folder)"
created: 2026-06-11
---

The companies loader now refuses context-orphaned batches (play folder required, --no-play is
the explicit escape) and writes the staging_batch_meta row including play_dir. The staging
surface renders an "all context" enumeration of the play folder per batch. Migration 0013 also
captured staging_batch_meta and list_staging_batches into tracked migrations (partial DB-hygiene
win). Approving updates the signal-prospecting record's loader asset note and adds the context
binding to its contract outputs.
