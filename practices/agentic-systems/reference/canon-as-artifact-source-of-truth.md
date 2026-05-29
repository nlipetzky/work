# Canon as source of truth for artifacts ... design framing

How to use `canon_engine` (Supabase project `mzzjvoiwughcnmmqzbxv`) as the canonical layer for the artifact discipline we're building. Design framing, not a build plan. Holds loosely.

## The first question to settle: what does "source of truth" mean for an artifact?

An artifact has several distinct kinds of data. Each has its own natural home:

| Data | Natural home | Why |
|---|---|---|
| **Content** (the actual document text) | Filesystem | Files are editable, git-versioned, easy to author, work with every editor and every Claude session. |
| **Metadata** (version, approver, approval_date, engagement, engine_bindings) | Canon | Structured fields. Belong in a database, not file frontmatter. Queryable. |
| **Lineage** (what derived from what, supersession, conflicts) | Canon | Graph relations. Need joins, not file metadata. |
| **Indexed content** (chunks, embeddings, FTS) | Canon | Already its job today. |
| **Approval signature** (when, by whom, in what channel) | Canon | Audit trail belongs in a database. |
| **Engine bindings** (which engines consume which artifact version) | Canon | Cross-engine relationship. |

The honest answer: "source of truth" is a misnomer if treated as one place. Filesystem is canonical for content; Canon is canonical for everything *about* the content.

This split is consistent with how the registry already works (Assets table holds metadata, files hold content). Canon extends the pattern to the knowledge layer.

## Four integration models (pick one)

### A. Canon-as-master, filesystem-as-projection
All artifact bodies live in Canon. Files on disk are generated views. Edit goes through Canon's API or UI.
- Pro: single source of truth, zero drift.
- Con: breaks the editing workflow that every practice currently uses. Claude Code can't natively edit. Major behavioral change.
- Verdict: rejected, too high a friction cost for too little gain.

### B. Filesystem-as-master, Canon-as-index (my lean for v0)
Files on disk are authoritative for content. Canon ingests them and adds metadata, lineage, indexing, query.
- Pro: preserves current workflow. Canon adds capability without changing how artifacts get authored.
- Con: drift possible if files change without Canon noticing. Need a sync mechanism.
- Verdict: simplest path to value; risk manageable with the right sync trigger.

### C. Two-way state with bidirectional sync
Files canonical for content; Canon canonical for metadata. Both reflect each other via sync triggers in both directions.
- Pro: best of both for queryability and editability.
- Con: more complex; harder to reason about which side wins on conflicts.
- Verdict: aspirational v1.5 once v0 is in real use and the failure modes are known.

### D. Canon-as-workflow-gate
Every artifact change must go through Canon. Files don't get touched directly.
- Pro: forces discipline.
- Con: very high friction. Defeats low-friction file editing. Operator-hostile.
- Verdict: rejected.

**Lean (revised 2026-05-26 after Nick's correction): A, with files allowed as drafts.** Canon is the runtime source of truth. Engines pull from Canon at execution time; disk doesn't work for runtime because workflows need network-accessible artifact context. Files on disk become the *authoring surface* (low-friction editing in Claude Code sessions), but they are drafts, not artifacts, until approval lands them in Canon. The original B framing was anchored to authoring convenience and missed the runtime constraint.

## What canon_engine needs to add to be the artifact knowledge layer

The legacy schema is most of the way there. Specific additions:

1. **New `canon_artifacts` table** (or extend `canon_docs`).
   - Keep `canon_docs` as the legacy governance corpus.
   - Create `canon_artifacts` as the new primary table for the artifact discipline.
   - First-class columns: engagement_type, engagement_id, artifact_type, name, version, path, approver, approval_date, approval_channel, approval_ref, supersedes_id, superseded_by_id.
   - jsonb metadata field for anything not yet first-classed.
   - tsvector search column.

2. **New `canon_artifact_relations` table.**
   - From the supersedes pattern (1:1 chain) to arbitrary lineage edges.
   - artifact_id, related_artifact_id, relation_type (`derives_from`, `supersedes`, `conflicts_with`, `consumes`).
   - Enables consistency checks and richer cross-artifact queries.

3. **New `canon_artifact_bindings` table.**
   - Which engine consumes which artifact version at what time.
   - artifact_id, engine_system_id (matches registry), binding_type, bound_at, unbound_at.
   - Enables engine outputs to traceback ("this came from artifact v3 bound to revops-engine since date X").

4. **Ingestion source: `source_type = 'artifact'`.**
   - New row class in `ingestion_manifest`.
   - source_path = filesystem path under `ventures/`, `clients/`, `practices/`.
   - Trigger options (pick one for v0): git post-commit hook, filesystem watcher, manual `canon sync` command, scheduled poll.
   - Lean for v0: **manual `canon sync` command + scheduled poll.** Operators run sync after editing; poll catches anything missed.

5. **Query interface.**
   - MCP tool or REST endpoint that hybrid-retrieves over canon_artifacts (vector + tsvector + metadata filters).
   - Consuming engines (GTM, RevOps, future) call this when they need context.

6. **Re-attribution job for orphaned chunks.**
   - 3,967 email chunks have NULL account_name. Map by from_address / to_address → engagement.
   - One-time backfill, then live attribution at ingest.

7. **Smoke-test cleanup.**
   - Delete the 7 cluster rows from May 5.

8. **New `canon_learnings` table** (the fourth pillar from expert-liaison).
   - Captures every Learning produced by AI exposure to reality (transcript extraction, run outcomes, conversation insights).
   - Columns: `id`, `engagement_type`, `engagement_id`, `learning_type` (enum: `update_artifact` / `propose_artifact` / `context_gap`), `source_type` (transcript / run / conversation / observation), `source_ref`, `summary` (text), `details` (markdown), `proposed_artifact_name`, `proposed_artifact_type`, `targets_artifact_id` (uuid, when update), `context_gap_description`, `status` (proposed / approved / rejected / acted-on), `approver`, `approval_date`, `acted_on_at`, `resulting_artifact_id` (uuid, when approval led to a new or updated artifact), `created_at`.
   - Approval flows through expert-liaison, same as artifact approval. The Learning queue is itself an artifact stream.
   - This is the substrate for the agentic alignment loop: AI exposes itself to reality → Learnings surface → expert approves → artifact taxonomy grows or sharpens → AI is smarter next round.

9. **Index Learnings into the chunk/embedding layer.**
   - Each Learning gets chunked + embedded into `chunks` with `source_type='learning'`.
   - Cross-engagement queries become possible ("show me all context-gap learnings about K-12 payment processors") for pattern recognition.

10. **Roadmap-signal projection from `canon_learnings`.**
    - Context-gap Learnings should surface to the engagement-governance layer as proposed roadmap items.
    - Propose-artifact Learnings should surface to the consuming practice's CLAUDE.md as taxonomy expansion candidates.
    - Update-artifact Learnings already flow through the artifact approval loop.

## The artifact lifecycle through Canon (the loop, end to end)

```
1. Practice (Kepler / Hermes / Boris / future) drafts artifact
   → writes to ventures/<v>/artifacts/<name>-vN-YYYY-MM-DD.md
2. Expert-liaison routes approval ask to expert
3. Expert approves (email reply / Airtable verdict / Slack ack)
4. Expert-liaison captures approval signature, writes:
   - artifact file with frontmatter (or sidecar metadata file)
   - canon_artifacts row via insert (version, approver, approval_date, path)
   - canon_artifact_bindings row (engine_system_id, binding_type='active')
   - older version's row updated (superseded_by_id = new row's id)
   - chunks row generated (re-chunked + re-embedded)
5. Engine consumes the artifact via canon query API
   → engine output references the artifact_id + version it used
6. Future query "what's the current approved <artifact_type> for <engagement>"
   → canon answers from canon_artifacts where superseded_by_id IS NULL
   AND status='approved' AND engagement_id=<x>
```

## Open design questions

1. **Frontmatter or sidecar metadata?** Should the file itself carry minimal frontmatter (engagement, type, version) that canon parses on ingest, or should metadata live entirely in canon's row with the file body kept clean?
2. **One artifact = one file (versioned filename) or one file (mutable content + canon tracks versions)?** Versioned filenames keep git history clean and survive canon outage. Mutable filenames require canon to be reliable. Lean: versioned filenames.
3. **Where do client-facing artifacts (proposals, decks) live?** Same canon_artifacts table or a separate one? Client-facing artifacts are often the same content as internal artifacts but distributed. Lean: same table, with a `visibility` field (internal / client-facing).
4. **What's the retention policy for superseded versions?** Forever (audit trail) or N most recent? Lean: forever, soft-delete only.
5. **Cross-engagement queries (e.g., "all approved AAV criteria across clients").** Powerful but raises confidentiality questions when clients can see other clients' artifacts. Out of scope until multi-tenant access controls land.

## Phased delivery (loosely)

**v0 (weeks):**
- New `canon_artifacts` table.
- Manual `canon sync` command that walks engagement folders and upserts.
- Hybrid query MCP tool.
- One real engagement using it end to end (probably KAI dogfood).

**v0.5 (weeks-months):**
- Lineage + bindings tables wired in.
- Expert-liaison workflows update canon directly on approval.
- Engine outputs reference artifact versions.

**v1 (months):**
- Consistency check surface.
- Cross-engagement queries with access controls.
- Drive ingestion either restored or formally retired.

**v1.5+:**
- Bidirectional sync (Option C) if drift becomes a problem.
- Cluster concept revived for real grouping use cases if they emerge.
