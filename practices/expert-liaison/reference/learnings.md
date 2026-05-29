# Expert Liaison Practice Learnings

Append-only log of operational learnings about the expert-liaison practice itself. Distinct from per-engagement Learnings (which live in each engagement's surface). When `canon_learnings` ships, these rows ingest there with `engagement_type='practice'` and `engagement_id='expert-liaison'`.

Format: each entry is a self-contained block. Newest at top.

---

## 2026-05-26 ... First-contact protocol undefined

- **Type:** context_gap
- **Source:** conversation (Nick + Hermes, KAI artifact sync build)
- **Status:** proposed

**Summary:** Expert-liaison loop assumes the expert is already briefed on the system; first-contact protocol with a new expert is undefined.

**Details:**
The methodology defines the steady-state loop (catch natural output → translate → diff → route → approve → bind → surface lineage). It assumes the expert understands what the artifact is, why they are being asked, what happens when they approve, and where this fits in an established cadence.

That assumption holds for an expert already inside the loop. It fails on first contact. A new expert receiving a system-routed approval ask cold has no frame for it: no idea what the artifact is, why an AI is sending them anything, what their approval triggers downstream, or whether this is a one-off or the start of recurring asks. The ask reads as noise or worse, and rubber-stamping (or ignoring) is the rational response.

This breaks pillars 1 (translation faithfulness ... if the expert doesn't understand the ask, the approval doesn't reflect intent) and 3 (burden minimization ... a cold ask is high-burden because the expert has to figure out the entire context themselves).

**What is needed:**
A first-contact protocol that runs before the AI-routed loop begins. Probably:
1. A human (the engagement owner) briefs the expert in their natural channel: what is the system, what artifacts will surface, what the expert's role is, what their approval does, what the cadence looks like.
2. The expert sees a sample artifact (concrete, theirs, in the channel they will use) before any approval is asked.
3. The first ask is sent only after the expert has acknowledged the briefing.
4. The "established cadence" assumption only holds from that point forward.

**Why it matters:** This will repeat with every future expert (Will, Ellie, anyone after). Without it, the first artifact in any new engagement risks the expert losing trust before the system has earned any.

**Resulting artifact (when approved):**
Add a first-contact protocol section to `practices/expert-liaison/reference/methodology.md`, or a sibling `first-contact.md`. Either way, before any engagement onboards a new expert, run this protocol explicitly.

**Originating context:** KAI artifact sync build, 2026-05-26. Three artifacts were staged for Will, n8n workflow was nearly ready to route the first ask, Nick paused on send because Will had not been briefed.
