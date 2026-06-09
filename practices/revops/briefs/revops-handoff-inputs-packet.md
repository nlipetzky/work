# RevOps session — status change + inputs packet request

**Stop building the ingest pipeline.** After mapping the live Supabase engine (project
`revops-engine-dev` / `mrmnyscurmkfppicqqhk`), the architecture is more involved than the
brief assumed: two table layers (`contacts`/`companies` working tables + `canonical_*` master
layer), on-rails enforcement triggers on the working tables, and the Supabase→Airtable sync
currently runs through **n8n** — which Nick is replacing with an **Inngest** function.

The engine build is moving to the **agentic-systems session**, which holds the architecture map
and the Supabase access. Two sessions building the same engine would collide, and building from
the archived `aos/` code is out of bounds. So you do **not** write to Supabase, build the
loader/promotion/sync, or touch the archive.

This supersedes the earlier brief `onrails-ingest-and-records-to-client-wiring.md`.

## Your one deliverable: the batch-#1 inputs packet (ngAbs, 128 contacts)

Produce a short markdown file with these four things, then report its path and stand down on
this workstream:

1. **Final dataset** — absolute path to the finalized, corrected 128-contact file. Confirm it
   is the real data, not the Clay export where rich columns collapsed to the string "Response".
2. **Column mapping** — each source column → the `contacts` field it maps to (e.g. work email →
   `email`, → `first_name`, `last_name`, `title`, `linkedin_url`, company linkage → `company_id`
   or domain). Flag any source column with no canonical home. Note: contacts with personal-email
   domains will be rejected by a data-quality trigger — flag any you already know about.
3. **Airtable target** — the ngAbs Airtable base ID + the Contacts (and Companies, if used)
   table IDs. This is the delivery destination the Inngest sync writes to.
4. **Scope IDs** — the ngAbs `account_id` / `engine_account_id` and the play/segment these 128
   belong to, so the records are scoped correctly in the engine.

That's it. A markdown file with those four sections is the whole job.
