# HANDOFF — Artifact Lineage / Provenance viewer (rebuild the Context tab) — 2026-06-25

**To start:** `Read and execute this handoff: /Users/nplmini/code/work/practices/agentic-systems/HANDOFF-artifact-lineage-viewer-2026-06-25.md`

Owner: agentic-systems (Boris builds; OS infrastructure). Surface: projection-ui (:4180 launchd, `npm run dev`, hot-compiles; do NOT start a 2nd dev server). Canon: `mzzjvoiwughcnmmqzbxv`.

## The ask (Nick, verbatim intent)
"For any artifact, I want to know what inputs were used to generate it. I need a trail for everything so I can ensure and check it's using the proper context and ALL the context available." The Context tab in projection-ui today is the wrong thing for this and needs to become this.

## What the Context tab is today (the problem)
`app/context/page.tsx` + `app/api/context/list/route.ts`: a **disk markdown file browser** — it walks `~/code/work/accounts/**/*.md` and renders raw files with ReactMarkdown. It has ZERO connection to governed artifacts (canon_artifacts), no lineage, no "what produced this." It shows files on disk, not the system's actual governed context or how it was made. That does not serve the intent.

## The job: an artifact + input-lineage explorer
Rebuild the Context tab (or add a primary view to it) so that for any GOVERNED artifact Nick can:
1. **See the artifact** — its content, version, status (draft/approved/superseded), who proposed it, who approved it, its standard (`done_when` / rubric), and `required_expertise`.
2. **See its input lineage** — the exact inputs used to produce it, each labeled by role (HINGE / SUBSTANCE / VOICE / HARD_RULES / FORM), with the input's type + version (for artifacts) or file path (for disk inputs).
3. **Drill recursively** — each artifact-input is a link; clicking it shows THAT input's own lineage. The offer ladder's inputs are 5 other approved artifacts, each of which has its own inputs ... a lineage tree. This is how Nick verifies "proper context + all available context."
4. **See curation lineage** — `source_assessments` rows that fed the artifact (which transcripts/emails/docs were assessed and fed by the Expert Liaison loop; they carry `artifact_id`).
5. (nice-to-have) **Reverse view** — what an artifact FEEDS (its consumers), e.g. the offer-architecture feeds the offer-ladder feeds the copy sequences.

## What already exists to build on
- `canon_artifacts` — governed artifacts: `content_md`, `version`, `status`, `approver`, `confirmed_by`, `metadata` jsonb. THE artifacts to view.
- `canon_artifact_manifest` — per-engagement input contract: `standard_rules`, `standard_rubric`, `required_expertise`, `needs`. Joined to `canon_artifact_types` for `layer` + `done_when`.
- **`outreach_sequences.inputs` jsonb — THE MODEL TO COPY.** The copy producer (`produce-sequence.mjs`) already records full input lineage per row: `[{role, artifact_type, version, artifact_id} | {role, file, missing?}]`. The viewer should render this verbatim; every producer should record lineage this way.
- `source_assessments` (migration 004) — source→artifact curation lineage (`artifact_id`, `source_type`, `source_id`, `snippet`, `fed_to_assembler`). Already surfaced on /expert-liaison as the "curation ledger."
- Producers: `systems/canon-engine/scripts/govern-artifacts.mjs` (context artifacts), `produce-sequence.mjs` (sequences), `assemble-offer-ladder-source.mjs` (assembles the offer-ladder's source from 5 approved artifacts).
- Query/surface patterns: `lib/queries/outreach.ts` (reads `inputs`), `lib/queries/governedArtifacts.ts`, `app/system/[constellation]/[slug]/AssemblerActions.tsx` (`ArtifactChip` content fetch via `/api/system/artifact/[id]`).

## The recording gap to close FIRST (without this the viewer has thin data)
`govern-artifacts.mjs` does NOT record input lineage. When it proposes a canon artifact it stores only `metadata = {layer, driver}`. So context artifacts (incl. the offer-architecture, the offer-ladder) have NO explicit `inputs` trail the way outreach sequences do. To give every artifact a real trail:
1. **Record lineage at produce time.** In `govern-artifacts.mjs`, capture which inputs fed each artifact (its `draftSource` file, and ... critically ... any upstream approved artifacts that source was assembled from) and write them into `canon_artifacts.metadata.inputs` in the same shape as `outreach_sequences.inputs`. For most context artifacts the source is a single `context/<layer>/<type>.md` file (record it as a FORM/SOURCE file input). For assembled artifacts like the offer-ladder, record the 5 upstream approved artifacts (the assemble script already knows them ... have it emit a sidecar lineage, or move assembly into the driver and record there).
2. **Backfill the offer-ladder.** Its lineage is known and deterministic (see `assemble-offer-ladder-source.mjs` HINGE list: offer-architecture-and-pricing, icp-and-disqualifiers, mechanism-of-action, customer-problem-model, faithfulness-constraints, + the offer doctrine). Write it into that artifact's `metadata.inputs`.
3. Decide: keep lineage in `canon_artifacts.metadata.inputs` (no migration) OR add a dedicated `artifact_inputs` table (cleaner for recursive queries + reverse lookups). Recommendation: a small `artifact_inputs(artifact_id, role, input_artifact_id, input_artifact_type, input_version, input_file, missing)` table makes the recursive tree and reverse view trivial; metadata-jsonb works for v0 but is awkward to traverse. Builder's call.

## Build shape (suggested)
- `lib/queries/lineage.ts` — given an artifact id (or engagement+type), return the artifact + its inputs (resolved to live artifact rows where they're artifacts) + its source_assessments + (optional) consumers. Recursive to depth N.
- Rebuild `app/context/page.tsx` as the explorer: left = browse governed artifacts by engagement/layer (from canon, not disk); right = selected artifact (content + metadata) and its lineage tree (expandable), with the disk-markdown browser demoted to a secondary mode if still wanted.
- Read-only. No new write path beyond the producer lineage-recording change.

## Verification
- Open the rebuilt Context tab, select the CIPO `outreach-offer-ladder`: see its content + status + approver, and its input lineage listing the 5 upstream approved artifacts + the offer doctrine, each clickable to its own lineage.
- Select a CIPO `outreach_sequences` row's source artifact chain: confirm HINGE→SUBSTANCE→VOICE→HARD_RULES→FORM renders from `inputs`.
- Confirm an artifact with `source_assessments` shows its curation lineage.
- Confirm "proper + all available context" is answerable at a glance: missing inputs are flagged, present inputs show version.

## Scope guard (NOT in this build)
Editing artifacts from the viewer; a new approval path; diffing versions (nice later); anything that sends/exports. This is a read + verify surface plus the producer lineage-recording change.
