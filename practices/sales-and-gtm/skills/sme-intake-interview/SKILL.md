---
name: sme-intake-interview
description: Use this skill when running the structured intake conversation that extracts the eleven SME profile artifacts from a domain expert. Trigger on phrases like "run intake with [expert]," "extract SME profile," "interview the domain expert," "draft SME artifacts from transcript," "start the intake conversation," or any setup for the ~90-minute structured conversation that produces v0 versions of Identity, Credibility Map, Pattern Library, Hot Takes, War Stories, Network Map, Refusal List, Voice/Vocabulary, Hypotheses, Time Boundaries, and Decision-Making Profile artifacts. Pairs with the canonical methodology at `~/code/work/practices/agentic-systems/reference/sme-extraction-methodology.md`. First test target: Will Rosellini for Konstellation AI.
---

# SME Intake Interview

The skill that operationalizes the eleven-artifact taxonomy. The operator runs a structured ~90-minute conversation with the SME, captures the transcript, and drafts v0 markdown for each of the eleven SME profile artifacts. Hermes picks up from there and routes approvals.

This skill belongs to GTM operators (Kepler is the primary runner). The methodology behind it lives in cross-practice canon. The conversation craft lives here.

## When to use

- A new SME is being onboarded for a venture or engagement
- The eleven SME profile artifacts in the venture's `artifacts/` folder are still stubs (Status = pending intake)
- The expert is available for a ~90-minute structured conversation
- No prior intake transcript exists, OR a prior intake exists but is stale and needs a fresh pass

Do NOT use this skill for:
- Quick check-ins with an SME (no taxonomy walk; just capture as a Learning)
- Approving artifacts (that's Hermes/expert-liaison)
- Drafting client-facing copy (that's `creative-copy`, `offer-extract`, or `copy-draft`)

## Prerequisites

Before the intake conversation, the operator MUST:

1. **Read the methodology.** `~/code/work/practices/agentic-systems/reference/sme-extraction-methodology.md`. The eleven artifacts and their purposes must be loaded into the operator's working memory; the conversation has to flow, not consult a checklist mid-question.
2. **Read the venture context.** The venture's `CLAUDE.md`, `reference/catalog.md` or equivalent, `reference/narrative.md`, `reference/locked-decisions.md`. The intake conversation references existing venture decisions; the operator should not need the SME to re-explain the venture.
3. **Read any prior transcripts or sessions.** If prior conversations with the SME exist (NotebookLM transcripts, meeting recordings, email threads), skim them for fragments that will be confirmed in the intake. Fragments captured pre-intake go into the artifact stubs as "known fragments from prior sessions."
4. **Confirm the eleven stubs exist.** Check `accounts/ventures/<venture>/artifacts/` for `sme-*-<expert-slug>-v0-<date>.md` files. If not present, create stubs first.
5. **Confirm the liaison base rows exist.** Check `Expert Artifacts` in `appbFsdqrC5vnxuIR` for the eleven matching rows. If not present, create them.
6. **Confirm recording method.** Live recording + transcript is required. The transcript is the source-of-truth artifact behind every v0 draft.

## The intake conversation

### Structure

~90 minutes, recorded. Five blocks of roughly equal time:

1. **Identity + Credibility (15 min)** ... who the SME is, where they have peer credibility, why.
2. **Patterns + Hot Takes (20 min)** ... what they've seen repeatedly, what they believe that's contrarian.
3. **War Stories + Network (20 min)** ... specific stories they can tell, who they know.
4. **Refusals + Voice (15 min)** ... what they won't do, how they naturally talk.
5. **Hypotheses + Time + Decision-Making (20 min)** ... what they think but haven't proven, how they want to spend time, how they decide.

The order matters. Identity grounds the conversation. Patterns and stories warm the SME up. Refusals and voice surface naturally once they're in storyteller mode. Hypotheses and time/decision-making close on the introspective register.

### Operator posture

- **Lead with open questions; probe with specifics.** "Tell me about a time when..." beats "Do you have war stories about..."
- **Echo language back.** When the SME says "where the f*** are my leads," do not paraphrase to "lead generation pain." Capture the verbatim phrasing for the Voice artifact.
- **Get permission for sensitivity at capture time.** "Can I use that story in cold copy?" beats discovering later that the story is private.
- **Don't validate every claim in the moment.** Hypotheses are valuable AS hypotheses. The operator's job is to capture, not to test the SME's beliefs against data live.
- **Push back when something doesn't make sense.** Not validating doesn't mean not asking. "Help me understand why X" is fine and often surfaces the strongest patterns.
- **Watch for cross-artifact moments.** A war story often contains a hot take, a refusal, and a pattern. Capture the whole moment; tag it across artifacts later.

### Question banks (lean, not exhaustive ... adapt to SME)

#### Identity + Credibility

- Walk me through your career in 3 minutes. Where were the inflection moments?
- What credential or experience earns you peer status with X audience? With Y? With Z?
- Where do you NOT have peer credibility? Where would your name not land?
- If a prospect Googles you before the call, what do you want them to find?
- What's the one-liner you use when introducing yourself in a sales conversation?

#### Patterns

- What's a thing you see go wrong repeatedly in [the SME's domain] that less-experienced people miss?
- Walk me through a failure mode you'd diagnose in under five minutes that someone else would take months to find.
- What's a pattern that's so obvious to you it's invisible until you name it for someone else?
- When you do an audit, what do you actually look at first?

#### Hot Takes

- What do you believe about [the SME's domain] that most people in your industry would disagree with?
- What's the prevailing wisdom that you think is wrong?
- Who gets attracted to you because of that opinion? Who gets repelled?
- What's the take you'd put on a billboard if you could?

#### War Stories

- Tell me about a specific time when you walked into a mess and solved it.
- What's the story you tell at the start of a sales call to establish credibility?
- What's a story that's only useful in private, never in writing? Why?
- What's the named-account story that you're permitted to tell, and what's the language you use?

#### Network

- Who in your network would you reach out to first if we needed a warm intro to [target segment]?
- Who would you NOT want to be in front of because of a personal-history conflict?
- Whose name can you drop in cold copy? Whose name absolutely cannot show up?
- Are there companies we should never target because of your prior relationship there?

#### Refusals

- What kinds of clients do you refuse to work with? Why?
- What deliverables or engagement shapes are you no longer willing to take on?
- What do you refuse to say in writing, even when prospects push?
- Where would you walk away from a deal that other people would take?

#### Voice

- (Capture from the conversation itself ... no need for explicit questions here. The operator transcribes Voice from how the SME has been talking for the prior 60+ minutes.)
- Optional probe: "Are there phrases or framings you find yourself using a lot? Anything you actively refuse to say?"

#### Hypotheses

- What's a belief you have about this market that you'd want to test before betting big on?
- What's something you think is true but haven't seen the data on?
- Where's your gut leading you that you wouldn't yet defend with a spreadsheet?
- What would you need to see to change your mind on [a strong stance the SME took earlier]?

#### Time Boundaries

- How do you want to spend your time on this engagement?
- What kinds of meetings or asks drain you? Which ones energize you?
- How many hours per week can you realistically give? What's the ceiling?
- What's the channel where I should reach you for [different ask types]?
- What do you NEVER want to be asked to do?

#### Decision-Making Profile

- How do you make decisions? Slow burn or quick yes/no?
- When I bring you a choice, how do you want it framed? Two options? Five? Open question? Recommendation with reasoning?
- What's a decision pattern you have that I should know about so I don't waste your time?
- Are there decision categories you delegate completely? Which ones do you want to keep?

## After the conversation

### Drafting v0 from transcript

1. **Index the transcript.** Use `ctx_fetch_and_index` or `ctx_index` to put the transcript in the FTS5 knowledge base under a descriptive source label (e.g., `sme-intake-will-rosellini-2026-MM-DD-transcript`). All eleven artifact drafts query against this index.
2. **Draft narrative artifacts first.** Identity, Voice, Time Boundaries, Decision-Making, Hypotheses. These are full-prose markdown. Lean drafts. Mark unknowns explicitly with `[TODO confirm: ...]`.
3. **Draft tabular artifacts second.** Credibility Map, Pattern Library, Hot Takes, War Stories, Network Map, Refusal List. Use the structured-list format documented in each stub. One entry per item. Capture verbatim language wherever possible.
4. **Cross-tag cross-artifact moments.** If a War Story contains a Hot Take, the Hot Take row references the War Story slug. If a Refusal is anchored in a War Story, same.
5. **Update each artifact's Status header.** Pending intake → Draft.
6. **Update each Expert Artifacts row in the liaison base.** Status stays "draft" until Hermes routes for approval. Bump Version from 0 to 1 when content is populated. Update File Path if name conventions shifted.

### Hermes handoff

Once all eleven artifacts are at Draft status with content populated:

1. **Group for batched approval.** Per the methodology, batch into 2-3 tranches by approval shape: Identity-Credibility, Patterns-Stories-HotTakes, Voice-Refusals-Hypotheses-Time-Decision. Eleven separate approval asks fatigues the SME.
2. **Draft the Exchange messages.** For each tranche, draft the approval ask in the SME's preferred channel format (email for most SMEs; Will is email-receptive per known fragments). Each Exchange row gets the Ask, Reason, and link to the Expert Artifacts.
3. **Send via the configured Hermes routing.** As of v0, this is manual (operator sends; logs the Exchange row). When Hermes is wired structurally, the routing becomes automatic.
4. **On approval:** flip the artifact Status to Approved, set Approval Date, set Approver name, capture Signature Ref (email message ID or equivalent). Update markdown header.
5. **On edits requested:** revise; bump Version; re-route.

## Running this skill the first time (Will Rosellini for KAI)

This is the first real test of the methodology. Expect the eleven categories to need adjustment based on what does and doesn't extract cleanly.

### Specific prep for Will

- Read `accounts/ventures/konstellation-ai/CLAUDE.md`, `reference/catalog.md`, `reference/narrative.md`, `reference/locked-decisions.md`.
- Read prior NotebookLM transcripts (KAI Offers notebook `9597dc22-56db-4291-a59e-4363b700e3f6`). Fragments captured in the stubs are starting points; confirm or correct during intake.
- Know what's already partially captured: refusals (skip enterprise, skip law firms), beachhead (medical device robotics), credentials (first US AI medical device approval), self-positioning ("agentic AI strategist"). Don't re-ask these from scratch; confirm and deepen.

### Specific watch-outs for Will

- Will is comfortable with bold profanity ("where the f*** are my leads"). Capture verbatim for Voice artifact; do NOT sanitize.
- Will will say "I don't know" plainly when he doesn't. Don't push when he does; mark as Hypothesis or context gap.
- Will is decisive in commercial moments and slower in brand/positioning moments. Watch for the speed-shift across categories and capture in Decision-Making Profile.
- Will is the sole expert AND sponsor for KAI. The intake produces expert-mode artifacts; sponsor-mode artifacts (Trajectory amendments) come through a different conversation.

### Output expected after Will's intake

- Eleven artifact markdown files in `accounts/ventures/konstellation-ai/artifacts/`, content populated, Status = Draft.
- Eleven Expert Artifacts rows in liaison base `appbFsdqrC5vnxuIR` updated to reflect populated content.
- One transcript indexed in the FTS5 knowledge base under source label `sme-intake-will-rosellini-<date>`.
- 2-3 Exchange messages drafted and queued for Hermes routing.
- A "what we learned about the methodology itself" note appended to the cross-practice canon doc, surfacing what to revise for v1.

## How this skill itself evolves

This is v0. After Will's intake, expect revisions:

- **Question banks tighten.** Some questions will land; others will fall flat. Keep the ones that produce content; drop the ones that don't.
- **Artifact boundaries may shift.** The eleven may collapse to nine or expand to thirteen depending on what actually extracts cleanly.
- **Time allocation may shift.** Five-block, ~90-min structure is a guess. May be too long, may be too short, may need uneven blocks.
- **Tranche groupings for Hermes may revise.** Eleven is a lot to approve; the batching scheme may need to change based on what Will actually approves in one sitting.

After Will's intake, the operator who ran it writes a short retrospective into `practices/sales-and-gtm/skills/sme-intake-interview/LEARNINGS.md` (create if absent). That retrospective becomes the v1 revision of this skill.

## Companion docs

- Methodology (canon): `~/code/work/practices/agentic-systems/reference/sme-extraction-methodology.md`
- Storage architecture: `~/code/work/practices/sales-and-gtm/reference/sme-storage-architecture-v0-2026-05-27.md`
- Artifact discipline (cross-practice canon): `~/code/work/practices/agentic-systems/reference/artifact-discipline.md`
- Expert-liaison methodology (Hermes routing): `~/code/work/practices/expert-liaison/reference/methodology.md`
- KAI venture context: `~/code/work/accounts/ventures/konstellation-ai/CLAUDE.md`
