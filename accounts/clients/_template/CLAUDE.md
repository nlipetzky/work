# Client: [Client Name]

## READ STATE.md FIRST

Before producing ANY client-facing artifact (email draft, status update, meeting brief, scope note, list, plan), read `STATE.md` in this folder. The active commitments, hard rules, and read-list there override default behavior. STATE.md is the session-bootstrapping file. If STATE.md does not exist yet, that itself is a signal: the engagement does not have an active Trajectory or operating protocol locked, and the first move is to draft one (route through Polaris / engagement-governance practice).

## Practice(s)

<!-- Which operator role(s) are active for this engagement -->
- revops

## Engagement scope

<!-- 1-3 sentences: what Nick is doing for this client, what is out of scope -->

## Sources

<!-- NotebookLM notebook name or URL. Ingested context lands in `sources/` using
     the convention `<source-type>-<scope>-<date>.md`. -->
NotebookLM notebook: [name]

## Active plays

<!-- Plays currently in flight. A play is one unit of outbound (defined audience,
     defined offer, defined sequence) — see vocabulary lock in architecture-notes.md.
     Format: <play-slug> -- current stage. Slug names the substance, not the timing. -->

## Folder shape

<!-- For reference. Do not edit unless restructuring.
clients/<this-client>/
  CLAUDE.md          ← this file
  sources/           ← ingested context (NotebookLM exports, transcripts, customer docs)
  artifacts/         ← produced context (capability outputs, named <practice>-<capability>-<play>.md)
  <practice>/        ← per-practice CLAUDE.md, added when a practice activates
-->

## Voice and tone

<!-- How this client communicates externally. What sounds right vs. off-brand -->

## Named accounts

<!-- Accounts Claude should recognize by name. Competitors, key targets, strategic partners -->

## Exclusions

<!-- People, companies, or segments that must never appear in outreach -->

## Expert and sponsor interactions route through their respective practices

<!-- Any operator working in this engagement defers human-facing interaction to the appropriate practice. Do not draft approval asks, choose channels, or send artifacts directly to the client's people from inside this folder.

- **Expert-side asks** (criteria, persona, ICP, classification rules, domain judgment) route through Hermes: `/Users/nplmini/code/work/practices/expert-liaison/CLAUDE.md`.
- **Sponsor-side asks** (engagement scope, Trajectory, weekly cadence, scope-change conversations) route through Polaris: `/Users/nplmini/code/work/practices/engagement-governance/CLAUDE.md`.

Name in "Named accounts" who fills the expert role and who fills the sponsor role for this engagement. -->

## Notes

<!-- Anything else that would surprise a new operator walking in cold -->
