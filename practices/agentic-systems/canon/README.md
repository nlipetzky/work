# Canon — the AOS knowledge capture log

The accumulation point for generalizable agentic-systems primitives, captured at the moment they surface, ready to seed the AOS build. This is an Architecture Decision Record (ADR) / engineering daybook: **append-only, dated, never rewritten.** Synthesis (clustering, dedup, ontology) is deferred to the AOS build — do not structure here, only capture.

## What belongs here vs in memory

- **Memory** (`~/.claude/.../memory/`) = operational. Binds the next session's behavior on a specific engagement. Per-client state, enforcement rules.
- **Canon** (this folder) = architectural. Engagement-agnostic truths about how agentic systems should be built. The primitives AOS will be assembled from.
- Some primitives are both. The canon entry references the memory file; it does not duplicate it.
- Rule of thumb: changes what the next Teknova session *does* → memory. A generalizable law of agentic architecture → canon.

## The capture trigger (the hard part)

Storage is easy; recognizing the moment is the discipline. Two triggers, both binding:

1. **Boris (gate on "done"):** when a rule/pattern is stated or applied that generalizes beyond the immediate task — especially a failure mode and the discipline that fixed it — append a canon entry in the same turn. This is a completion gate, same class as registry-update and scratch-teardown. Skipping it = not done. (Enforced via `feedback_canon_capture.md`.)
2. **Nick (human tag):** the phrase **"canon this"** in chat force-marks the current moment as canon-worthy. Capture is not solely Boris's judgment.

## Entry format

Append to `canon-log.md`, chronological (newest at bottom — append-only integrity over scan convenience; scanning is an AOS/Obsidian concern, deferred).

```
## YYYY-MM-DD — <short primitive title>
**Surfaced during:** <what we were doing>
**Primitive:** <the durable truth, stated crisply>
**Why it generalizes:** <why this is not task-specific>
**AOS implication:** <one line — what AOS must embody because of this>
**Refs:** <memory file / reference doc, if any>
**Source:** sources/<YYYY-MM-DD-thread>.md   ← REQUIRED for substantive entries
```

## Two-tier capture (the index is not the record)

A terse entry without its evidence is un-actionable later — the same defect as a policy with no enforcement. So:

- **Tier 1 — index:** the canon-log entry. Scannable.
- **Tier 2 — source-of-record:** `sources/<YYYY-MM-DD-thread>.md` — the *why*: lived reasoning, the failure that triggered it, decisions and their rationale. Agent-written in the same turn, sized to the primitive (not a transcript).
- **GATE:** a substantive entry is not done without its `Source:` link to a Tier-2 file. One source file per session/thread is correct; do not fragment per-entry.
- **Do NOT** depend on session-transcript retrieval for Tier 2 — that is a discretionary/unreliable mechanism the binding-layer canon forbids relying on. Whole-session linkage is the harness's job (it stamps `originSessionId`), never agent retrieval. Tier-2 is the reliable substrate; the session pointer is optional enrichment if the harness provides it.
- Synthesis / vectorization / dedup over Tier 2 is a later AOS-build concern, not a dependency now.

Obsidian-compatible: `[[wikilinks]]` allowed but never required. Plain markdown is the contract.
