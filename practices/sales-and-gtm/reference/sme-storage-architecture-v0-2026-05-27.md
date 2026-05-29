# SME Storage Architecture (v0)

**Status:** Draft recommendation, corrected. v0 first-cut proposed a new base; that was wrong. The liaison base already exists and is the right home. This doc now reflects the corrected call.
**Companion:** `sme-extraction-methodology-v0-2026-05-27.md` (defines the eleven-artifact taxonomy)
**Decision shape:** architecture call; Nick approves before any base or schema changes are made.

---

## Correction note (2026-05-27)

First version of this doc recommended minting a new "Expert Profiles" base. That recommendation was wrong because I did not verify whether a liaison base existed. It does: `appbFsdqrC5vnxuIR`, with three tables (Expert Artifacts, System Artifacts, Exchanges) already wired to mirror engagement-base artifacts upstream and feed Canon bindings downstream. Nick caught it by asking "why not the expert liaison base."

The gap: I read the cross-practice canon doc (`artifact-discipline.md`) which says Learnings live in engagement-specific surfaces today, and inferred from that no liaison base existed yet. Wrong inference. The cross-practice canon was describing where Learnings currently land per-engagement; the liaison base is the mirror layer that ingests from those engagement surfaces and tracks lineage centrally.

## Recommendation (corrected)

**Use the existing liaison base `appbFsdqrC5vnxuIR`. Register each of the eleven SME profile artifacts as a row in `Expert Artifacts`. Do not mint a new base.**

The liaison base is already designed for exactly this:
- `Expert Artifacts` (`tbl92c1kXhNB6yuJy`) ... one row per expert-generated artifact. Fields include Name, Engagement, Owner, Version, Status, File Path, Channel, Approval Date, Approver, Signature Ref.
- `Exchanges` (`tbl80rOtkFib7MLIm`) ... every approval ask and response. Channel, Sent, Ask, Reason, Response, Received, link to Expert Artifact.
- `System Artifacts` (`tblMkcr3E4E0g5ThU`) ... downstream engine outputs linked via Upstream to the Expert Artifact they derive from. Carries Projection Rule.

This is the lineage shape the methodology describes: expert produces → Expert Artifact row registered → Exchange tracks the approval ask → on approval, Signature Ref + Approval Date set → System Artifact rows link back via Upstream. SME profile artifacts are Expert Artifacts; they get the same treatment as offer drafts, copy artifacts, ICP titles.

## How the eleven artifacts map to the existing schema

Each of the eleven is a row in `Expert Artifacts`:

| SME artifact | Name (proposed) | Content location pointed to by File Path |
|---|---|---|
| Identity Profile | `sme-identity-will-rosellini` | markdown in venture artifacts folder |
| Credibility Map | `sme-credibility-will-rosellini` | markdown (v0) or child base later if scale |
| Pattern Library | `sme-patterns-will-rosellini` | markdown structured list (v0) |
| Hot Takes | `sme-hot-takes-will-rosellini` | markdown structured list (v0) |
| War Stories | `sme-war-stories-will-rosellini` | markdown structured list (v0) |
| Network Map | `sme-network-will-rosellini` | markdown (v0); promote to structured store when row count demands |
| Refusal List | `sme-refusals-will-rosellini` | markdown structured list (v0) |
| Vocabulary / Voice | `sme-voice-will-rosellini` | markdown |
| Bias Map (or "Hypotheses") | `sme-hypotheses-will-rosellini` | markdown |
| Time Boundaries | `sme-time-boundaries-will-rosellini` | markdown |
| Decision-Making Profile | `sme-decision-profile-will-rosellini` | markdown |

All markdown lives in `accounts/ventures/konstellation-ai/artifacts/sme-<artifact>-will-rosellini-v0-2026-MM-DD.md`. The Expert Artifact row's File Path field is the join.

## Engagement field handling

The `Engagement` field on `Expert Artifacts` is singleSelect. SMEs are conceptually cross-engagement, but in practice Will is currently KAI-only. Two options:

1. **For v0, tag all eleven Will artifacts with Engagement = "KAI" (or whatever the existing option is).** Re-evaluate if/when Will serves a second venture.
2. **Add a new Engagement option "Expert Profile (cross-engagement)" or similar.** Captures the conceptual distinction now.

Recommend (1) for v0. The shape stays simple; reality stays honest (Will is KAI-only today).

## What about the tabular artifacts long-term

Six of the eleven are conceptually tabular (Credibility Map per-segment rows, Pattern Library per-pattern rows, War Stories per-story rows, Hot Takes per-take rows, Network Map per-contact rows, Refusal List per-refusal rows). v0 keeps them as markdown structured-list files. This is fine until one of them outgrows markdown.

The promotion path when that happens:

1. **First sign of strain:** Network Map approaches ~50 rows, or War Stories needs cross-referencing by named-account. Markdown becomes awkward.
2. **Promote that single artifact to structured storage.** Options when the time comes: a child base, a Supabase table in Canon (`canon_experts_network_map` etc.), or a normalized Airtable structure inside the liaison base if Hermes wants it co-located.
3. **Do not pre-promote.** No structured tables until reality demands them. The Expert Artifact row stays as the canonical lineage entry; the File Path just shifts from a markdown file to a base view URL.

## What about Canon long-term

Per `artifact-discipline.md`, Canon (`canon_engine`, System `recggwUTDke8Y7UMe`) is the eventual unified home for `canon_artifacts` and `canon_learnings`. The kai-artifact-sync workflow in `expert-liaison/workflows/` already names `canon_artifact_bindings` as a downstream target.

When Canon is fully wired:
- The liaison base's Expert Artifacts table mirrors INTO `canon_artifacts`.
- SME profile artifacts get carried along automatically as a result.
- Cross-engagement, cross-SME pattern queries become possible (which SMEs share which refusal types; which Hot Take frames recur).

The liaison base stays as Hermes's operational surface; Canon becomes the analytical layer. SME profiles ride this path without needing a separate migration.

## What this means for the methodology doc

Update `sme-extraction-methodology-v0-2026-05-27.md`:
- Open design question #1 (Where these artifacts live) → flip to "Decision: liaison base for registry + lineage; markdown for content; promote individual artifacts to structured storage when scale demands."
- Recommendation A (per-venture markdown only) ... still partially correct for content; the missed piece was the lineage layer.

## What needs to be approved

1. Confirm liaison base (`appbFsdqrC5vnxuIR`) as the registry for SME profile artifacts.
2. Confirm the markdown-for-content / Expert-Artifacts-row-for-lineage split.
3. Confirm the Engagement field handling: v0 tag everything KAI; expand option when needed.
4. Confirm naming convention: `sme-<artifact>-<expert-slug>-vN-<date>.md` for files; `sme-<artifact>-<expert-slug>` for Expert Artifacts row Name.

## What I'd watch for

1. **Engagement field will not scale forever.** Singleselect with one option per engagement is fine for now; eventually this needs to be a multipleRecordLink to an Engagements table, or the SME profile artifacts need to live in a "no-engagement" bucket. Not a v0 problem.
2. **System Artifacts linkage.** When the sourcing engine consumes Will's Refusal List, that's a `System Artifacts` row with Upstream pointing to the Refusal List Expert Artifact. The Projection Rule field captures HOW the engine reads it. This wiring needs to happen as plays go live; it's not for v0 of the SME profile artifact setup itself.
3. **Don't preemptively build child schemas.** The temptation to model War Stories as a child table now is real. Resist. Wait for reality.

## Context gaps named

1. **I assumed no liaison base existed.** Should have done the verification before writing v0. The fix: when proposing storage architecture, the first check is always "what already exists." I added that to my mental loop.
2. **kai-artifact-sync workflow exists but I haven't read it.** It's already mirroring KAI's CRM Artifacts table into the liaison base. The SME profile artifacts will likely benefit from a similar sync workflow (markdown file → Expert Artifacts row). That's a v0.5 build, not a v0 schema concern.
3. **Hermes interface to Will still not wired.** Same gap as the methodology doc named. Liaison base existing doesn't solve the routing question; it just gives Hermes the registry to work against.

## Approval

**Approved 2026-05-27 by Nick.** On approval, executed:
- Eleven Expert Artifacts rows created in liaison base `appbFsdqrC5vnxuIR`, Status = draft (record IDs: identity reckYAwL6QeYY7taR, credibility recGqw4Faq5B305Ip, patterns recsSLaQJ3H9PCJ5G, hot-takes recVl5Z0vF0M3GTW3, war-stories recNxy7TFMp2ogh0Z, network reccoexOE00LFT0dY, refusals recwfJ5NZmZPbcBXj, voice rec0QxnD3ZucVTDlz, hypotheses recJ0RPkWwh7D8hug, time-boundaries recXLtyIPFycpWf3j, decision-profile recJAqyZP3m5Atuui).
- Eleven markdown stubs written to `accounts/ventures/konstellation-ai/artifacts/sme-*-will-rosellini-v0-2026-05-27.md`.
- Methodology doc updated: "Where these artifacts live" flipped from open question to logged decision.
- The methodology doc itself was moved to cross-practice canon at `~/code/work/practices/agentic-systems/reference/sme-extraction-methodology.md` (filename dropped date/v0 per canon convention; internal version field retained).

Remaining for the loop to close:
- Run Will's intake against the eleven-artifact taxonomy. Intake skill being drafted at `~/code/work/practices/sales-and-gtm/skills/`.
- Hermes interface to Will still notional; manual routing for v0.
- `Engagement` field on liaison base `Expert Artifacts` table still uses placeholder options (Engagement A/B/C). Eleven KAI rows have this field left blank; flag for sharpening when Engagement options are sorted.
