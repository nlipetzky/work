# Schema: Play Brief

The play brief is the **single address** for a play's strategic input bundle. The RevOps engine (and any downstream data-prep agent) reads one file to know what the play is, which of the strategic inputs exist, where each one lives, and whether the bundle is ready to execute. It is produced and maintained by the `lead-gen-strategist` skill.

It is not a copy of the input artifacts. It points at them and records their state. The individual artifacts (offer, segment, ICP titles, sender voice, copy) remain the source of truth for their own content; the play brief is the index and the readiness ledger over them.

Path: `accounts/<type>/<name>/artifacts/revops-play-brief-<play-slug>.md`
(`<type>` is `clients`, `ventures`, or `prospects`.)

---

## Required structure

### Header metadata

```
# Play Brief: <play title>

- **Play slug:** <kebab-case, named for substance not timing>
- **Engagement:** <type>/<name> (e.g. ventures/konstellation-ai)
- **Operator:** Ferris (RevOps)
- **Created:** <YYYY-MM-DD>
- **Last updated:** <YYYY-MM-DD>
- **Readiness:** <ready-to-execute | blocked | partial>
```

### What you actually need to know (plain English)

The first section of every brief, written for a human reader who does not hold this system's vocabulary in their head. Three short paragraphs at most:

1. **What the play is**, in one or two plain sentences. What's being sold, to whom, and what the prospect actually gets. No slug, no input numbers.
2. **Where it stands and what's blocking it**, in plain terms. If it's blocked on an event (an intake, an approval), name the event and the date. Say plainly whether it should go to outreach yet.
3. **What the human can do now**, if anything, that isn't blocked. One concrete action or "nothing until X."

Close with a one-line pointer that the rest of the brief is agent-facing and the human doesn't need to track it.

**Hard rule: no persona names in this section.** "Ferris," "Hermes," "Polaris," "Kepler" are banned here, as is any input-number or status-enum jargon. If the human needs to know that someone has to sign off on the sender, write "someone has to OK whose name this goes out under," not "route to Polaris." This section exists precisely because the rest of the brief is written in system vocabulary the human can't be expected to memorize. If you cannot explain a blocker without a persona name, you do not yet understand the blocker well enough to write it down.

### The one-sentence play

One sentence: who's getting hit, with what, why now. Lifted from or consistent with the offer artifact's headline. If this sentence cannot be written, the brief is not ready and no input below matters yet. (This is the agent-facing restatement; the plain-English version lives in the section above.)

### Input ledger

A table covering all 11 strategic inputs from `deepline-upstream-inputs.md` (Section 2). Every input appears in every brief, even deferred ones. The ledger is the heart of the artifact.

Columns:

- **#** — input number (1-11, matching the contract).
- **Input** — the input name.
- **Status** — one of:
  - `locked` — a skill-produced artifact exists and is final.
  - `draft` — an artifact exists and is skill-produced, but is not final: it carries open placeholders, `TBD` markers, or a stated "vN, pending X" caveat. The content is real and trustworthy as far as it goes, but a required input in `draft` does not satisfy readiness. Distinct from `operator-filled` (which is about *who* produced it) and from `gap` (which is about *whether anything exists*).
  - `operator-filled` — content exists but a human wrote it directly, no skill produced it (no skill exists yet, or the operator overrode). Quality varies; the engine should treat it as lower-confidence. May itself be draft; if so, note it.
  - `deferred` — intentionally not produced for this play; the engine runs without it. Must carry a reason.
  - `gap` — required for this play, not yet produced, and not intentionally deferred. A `gap` on a required input means `Readiness` is `blocked` or `partial`.
- **Source** — `skill-produced` (name the skill), `operator-filled`, `notebooklm`, or `n/a`.
- **Artifact** — relative path to the input artifact, or `—` if none.
- **Notes** — one line. For `deferred`/`gap`, state why and what would close it.

### Hand-off log

A short log of anything routed outside RevOps and its status. Three rows max in most plays:

- **Hermes (expert-liaison)** — any input that needed expert capture or expert approval (e.g. ICP refinement, sender voice, proof verification). What was routed, current status.
- **Polaris (engagement-governance)** — any sponsor-side dependency (e.g. sender identity sign-off from the account sponsor). What's pending.
- **Kepler (sales-and-gtm)** — any copy/creative-brief work handed to the sales practice. What was handed, status.

Omit a row if nothing was routed to that practice.

### Readiness verdict

Two to four sentences. State plainly: can the engine run this play now? If `ready-to-execute`, say so. If `blocked` or `partial`, name the specific inputs holding it up and who owns closing each. No hedging, no "mostly ready."

---

## Rules

- **Every input appears.** A missing row is worse than a `gap` row... it hides the gap. The contract has exactly 11 strategic inputs; the ledger has exactly 11 rows.
- **`operator-filled` is honest, not shameful.** Five of the 11 inputs have no skill yet. The point of the status field is to tell the engine which inputs are skill-grade and which are hand-filled, so input quality is legible downstream. Do not launder operator-filled content as `locked`.
- **`deferred` and `gap` are different.** Deferred is a decision (we chose to run without it). Gap is a debt (we need it and don't have it). Conflating them lets debt masquerade as a decision.
- **The brief points, it does not duplicate.** If you find yourself pasting the offer's body into the brief, stop. Link the artifact.
- **Readiness is a verdict, not a vibe.** It must follow mechanically from the ledger: any `gap` or `draft` on a required input ⇒ not `ready-to-execute`. A play whose required inputs are all `draft` pending one event (an intake, an approval) is `blocked` on that event... name it.
- **The plain-English section comes first and carries no jargon.** Every brief opens with "What you actually need to know," written for a human who does not track this system's persona names or status enums. The human should be able to read that one section, close the file, and know what the play is, whether it's go, and what (if anything) they personally need to do. The rest of the brief serves the agents; this section serves the operator. If a brief is missing it, the brief is incomplete regardless of how complete the ledger is.
