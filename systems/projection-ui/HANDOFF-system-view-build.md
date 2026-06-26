# HANDOFF: build the standardized System view (/system detail) from the anatomy template

Date: 2026-06-23. For: a fresh Boris (agentic-systems) session. Sibling to
`HANDOFF-work-surface-redesign.md` (the /work job) — this is the /system job.

## The one job

Turn the System tab's detail view into the **standardized 10-part "anatomy of a system"** template, so
every system renders the same way, populated from canon data. Read any system → one habit.

- **The template (source of truth):** `/Users/nplmini/code/work/practices/agentic-systems/reference/system-anatomy.md`
  — the 10 parts, each mapped to its canon field(s), plus a "standardized visual" layout section. Read
  it first and in full; it is the spec.
- **A Claude Design kickoff prompt already exists** for this view:
  `/Users/nplmini/code/work/systems/projection-ui/DESIGN-PROMPT-system-view.md`.
- **The target file:** `/Users/nplmini/code/work/systems/projection-ui/app/system/[constellation]/[slug]/page.tsx`
  (the per-system detail page). The list/map/inventory pages under `app/system/` already exist.

## The 10 parts (from system-anatomy.md)

1. Identity (name, purpose, ladder to goal→vision, lifecycle, owner, type)
2. Trigger (what starts it)
3. The AI brain (model, instructions, context, tools, guardrails, loop pattern) — only if it uses a model
4. Logic (deterministic driver / code)
5. Data (reads, writes, state, retrieval, ledger)
6. Connections (upstream deps, downstream consumers, external integrations)
7. Activities — the run layer (needs-you vs runs-without-you, automation level, channel)
8. Guarantee & observability (what it guarantees, verification, where watched)
9. Human & authority (owner, autonomous-vs-needs-approval)
10. Assets — the concrete typed implementation inventory (grouped by type, with locators)

Proposed visual (also in the doc): header/identity band → engine flow `Trigger ▸ Brain ▸ Logic ▸ Output`
over a Data band → Connections → the Activities run-layer list → a Guarantee/Human foot strip → the
typed Assets inventory. I rendered this as a mockup against Canon Ingestion earlier; the doc's prose is
the durable version.

## Build path

Recommended (consistent with the /work workflow Nick chose):
1. Run `DESIGN-PROMPT-system-view.md` through Claude Design (link the projection-ui repo via "Link
   local code", paste the prompt). Get the HTML export.
2. **Reproduce that export faithfully** — port its real layout/CSS, do NOT re-interpret with existing
   components. (This is the exact mistake that sank the /work build; see that handoff.) Then wire real
   canon data into the slots.

Or, if skipping Claude Design: build `app/system/[constellation]/[slug]/page.tsx` directly from
`system-anatomy.md` + the proposed layout, faithfully.

Either way: the design defines the **look**; canon defines the **data**. Don't hardcode example content.

## Data wiring — this is a fuller build than /work

Unlike /work (whose data layer was already correct), the /system detail likely needs its data source
checked/repointed. **First, read `lib/queries/registry.ts` and `app/api/system/detail/route.ts` to see
what the current detail view reads** — per project memory, the /system surface has read the *filesystem*
`registry/`, while the canonical data now lives in canon (`mzzjvoiwughcnmmqzbxv`). Repoint to canon.

Canon tables to render from:
- `public.systems` — identity/logic/data/guarantee fields: `name, system_slug, purpose, status,
  system_type, class, constellation, owner, goal_id→goals, loop_pattern, guardrails,
  ai_context_location, inputs, outputs, contract, flow, process_state_location, key_metrics,
  success_criteria, observability_locations, depends_on[]`.
- `public.activities` — the run layer (built this session): `name, current_automation_level,
  target_automation_level, channel, architecture, ai_role, ensured, owner, system_id`. Reuse the
  needs-you/runs-without-you + plain-language helpers from `app/work/page.tsx`.
- `public.assets` — the typed implementation inventory (standardized this session): `name, asset_type
  (controlled vocab), source_path/url/external_id (locator), deployed_version, lifecycle_state,
  reconciled_against_reality, activity_id`. Group by `asset_type`; show locator + a "verified" tick
  when `reconciled_against_reality=true`.

## Honest stubs (render, never fabricate) — these are real canon gaps, per system-anatomy.md

- **Trigger** — no field yet. Stub or omit.
- **AI brain decomposition** — only `loop_pattern`/`guardrails`/`ai_context_location` exist; model,
  instructions-location, tools, context-contract, output-contract are NOT modeled. Render what exists,
  stub the rest.
- **Connections** — only `depends_on` (upstream). Downstream consumers + external integrations not
  stored. Stub.
- **Authority boundaries** — no field. Stub.
- **Asset inventory** — n8n layer reconciled (55/56 verified, 1 orphan "Airtable AAV Mover"); the
  catalogue is verified-but-incomplete (uncatalogued revops workflows remain). Render "verified present,
  not yet complete" honesty. A finish-reconciliation task is already in canon for Atlas to surface.
- **Run layer** — only ~2 systems are decomposed into activities so far; most systems will show an empty
  run layer honestly ("not yet decomposed").

## Environment (same as the /work handoff — don't churn)

- `localhost:4180` is the always-on launchd server (`com.nick.projection-ui`, KeepAlive). Never `kill`
  it (it respawns). Nick views there. Fresh compile after edits:
  `rm -rf .next && launchctl kickstart -k gui/$(id -u)/com.nick.projection-ui`.
- Verify on a throwaway preview server (`preview_start` → 4181), screenshot, `preview_stop`. `tsc`-clean
  is NOT proof it renders — always screenshot. Tailwind cwd trap is fixed (postcss.config.mjs).

## Definition of done

Every system at `/system/<constellation>/<slug>` renders the same 10-part anatomy from canon, with honest
stubs for the gaps above, and (if the Claude Design path) matches the export. Nick confirms it reads
clearly for any system — including ones with no AI and no decomposed activities.

## Reference

- Template/spec: `practices/agentic-systems/reference/system-anatomy.md`
- Claude Design prompt: `DESIGN-PROMPT-system-view.md` (this dir)
- The system-building methodology (what a system is): `practices/operator-os/reference/system-building-methodology-draft.md`
- Sibling handoff (/work, and the "reproduce don't reinterpret" lesson): `HANDOFF-work-surface-redesign.md` (this dir)
