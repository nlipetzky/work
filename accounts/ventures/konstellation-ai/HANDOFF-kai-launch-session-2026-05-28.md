# HANDOFF ... KAI LinkedIn Outreach Launch Prep

**Session date:** 2026-05-28
**Owner:** Nick Lipetzky
**Engagement:** Konstellation AI (KAI) ... Internal Medical Device Robotics Play
**Purpose of this handoff:** Capture state of the LinkedIn HeyReach launch prep so the next session can resume without re-orienting.

---

## Where things stand

The goal of this session was to launch a LinkedIn outreach campaign today under Will Rosellini's personal account targeting medical device robotics CEOs in the $10-100M revenue band. We did not launch. Here's why and what's required to launch.

### What got done

1. **Eleven SME artifacts populated for Will Rosellini** at `accounts/ventures/konstellation-ai/artifacts/sme-*-will-rosellini-v0-2026-05-27.md`. Extracted from 21 Nick+Will transcripts in the "Will and Nick" NotebookLM notebook (id `5291592c-1cfc-476c-9f37-33944775807b`). Each is v0.1, populated, with a per-artifact Gap List section. Status: pending Hermes intake.

2. **Consolidated SME extraction gap list** at `artifacts/sme-extraction-gap-list-will-rosellini-2026-05-27.md`. Inventory of unresolved questions tagged by artifact and downstream impact. Hermes decides routing.

3. **HeyReach LinkedIn cold copy** ... three versions exist:
   - `clay-heyreach-copy-v0-2026-05-27.md` (v0.2 internally; the pre-skill version with the manufactured "commercial motions split" hook)
   - `clay-heyreach-copy-expert-panel-debrief-2026-05-27.md` (six-expert critique synthesizing Braun, Lavender, Gong, Holland, Batrawy, Bay)
   - `clay-heyreach-copy-v0.3-2026-05-28.md` ← **this is the current version**. Built under the copy-draft skill discipline. Every line source-tagged. Eight flags surface ship-blockers.

4. **New global skill: `copy-draft`** at `~/.claude/skills/copy-draft/`. Enforces source-tagging and refuse-to-invent discipline on any SME-attributed copy. Co-located with offer-extract, segment-criteria, creative-copy. Skill description references match the placeholder in the existing segment-criteria skill.

5. **Skill validation runs** in `~/.claude/skills/copy-draft-workspace/iteration-1/`. 88% pass rate with skill vs 53% baseline across three test cases. Discipline-enforcement test (no-SME-artifacts case): skill 100%, baseline 0%.

### What blocks launch

The v0.3 copy artifact lists eight flags. Four are ship-blockers requiring Will via Hermes:

- **Flag 1:** Touch 3 "I keep hearing from CEOs in this band" overclaim. Has a default replacement if Will doesn't respond.
- **Flag 2:** "90-day window" claim from offer artifact. Currently dropped from copy. Need Will to confirm whether literal or rhetorical.
- **Flag 3:** "Actively allocating capital in this segment" framing. Currently dropped. Need Will to confirm if he'd own this in cold copy.
- **Flag 4:** Naming the specific FDA-approved device/company. Currently uses bare credential only. Need device, company, year from Will.

Flags 5-8 are passes / deliberate omissions documented in the source map.

### Clay workbook state

Nick was building the Clay workbook in parallel during this session. State unknown to this handoff — confirm from Nick directly. The workflow spec lives at `clay-workflow-medical-device-robotics-v0-2026-05-27.md`. HeyReach campaign on Will's personal LinkedIn must be ACTIVE with auto-pause on reply.

---

## To resume next session

### Immediate next moves

1. **Route Flags 1-4 to Will via Hermes.** Hermes owns the cadence/channel. Pull the four asks from the v0.3 copy's flag list section.
2. **Finish Clay workbook** if not done. Verify 5-row Clay-to-HeyReach test fires cleanly before scaling to 50.
3. **Set up reply notification path.** Positive replies have a 4-hour SLA per Bay; HeyReach must push to Nick's phone/Slack.
4. **Decide on Flag 1 default** if Will is unreachable: ship with the replacement line, or hold the whole sequence.

### Sequence to ship (once Flags 1-4 are resolved)

Either v0.3 as-is (with defaults applied) or v0.4 (with Will's confirmed inputs incorporated). Paste-ready copy is in `clay-heyreach-copy-v0.3-2026-05-28.md` under "The copy" section.

### Test cohort targets

- Connection accept rate: 25-35%
- Reply rate after Touch 2: 5-10% of accepts
- Yes-signal rate: 30-50% of replies
- Booked meeting rate from yes signals: 50%+

If accept rate is under 15% after 50 sends, pause and revise targeting or hook.

---

## Process learnings worth keeping

1. **The copy-draft skill exists now.** Use it for any SME-attributed copy in any engagement. The discipline isn't optional ... it's the difference between Will's credibility being an asset vs. a liability.

2. **Hermes owns SME routing.** Operators (Kepler, Boris, etc.) do not decide cadence, channel, or batching of asks to the expert. They produce the inventory and hand it to Hermes.

3. **"It sounds good" is not a source.** This session's biggest failure mode was the "watching commercial motions split" hook ... manufactured insider framing that almost shipped under Will's name. The copy-draft skill exists to prevent that systematically.

4. **CTA mechanics: interest-based at cold stage, time-bound after warm signal.** Research-backed across 304K-email studies, Gong, Lavender, Braun. Calendar links go in the manual reply after a yes, not in cold touches.

---

## File paths reference

All paths absolute; rooted at `/Users/nplmini/code/work/`.

**KAI engagement state:**
- Engagement root: `accounts/ventures/konstellation-ai/`
- This handoff: `accounts/ventures/konstellation-ai/HANDOFF-kai-launch-session-2026-05-28.md`
- All artifacts: `accounts/ventures/konstellation-ai/artifacts/`

**Active artifacts (most recent):**
- Copy: `artifacts/clay-heyreach-copy-v0.3-2026-05-28.md`
- Clay workflow: `artifacts/clay-workflow-medical-device-robotics-v0-2026-05-27.md`
- Offer: `artifacts/kai-internal-offer-medical-device-robotics-v0-2026-05-27.md`
- Play: `artifacts/kai-internal-play-medical-device-robotics-v0-2026-05-26.md`
- ICP: `artifacts/kai-internal-icp-titles-v0-2026-05-26.md`
- Trajectory: `artifacts/kai-internal-trajectory-v0-2026-05-26.md`
- SME bundle (11 files): `artifacts/sme-*-will-rosellini-v0-2026-05-27.md`
- SME gap list: `artifacts/sme-extraction-gap-list-will-rosellini-2026-05-27.md`
- Expert panel debrief: `artifacts/clay-heyreach-copy-expert-panel-debrief-2026-05-27.md`

**Global skill (outside repo):**
- `~/.claude/skills/copy-draft/SKILL.md`
- `~/.claude/skills/copy-draft/references/source-tagging-schema.md`
- `~/.claude/skills/copy-draft/references/cta-research.md`
- `~/.claude/skills/copy-draft/references/concrete-visual-falsifiable.md`
- `~/.claude/skills/copy-draft/references/output-template.md`

**Skill eval workspace (outside repo):**
- `~/.claude/skills/copy-draft-workspace/iteration-1/` ... benchmark.json + report.html + per-run grading/timing

---

## Note on the broader repo state

This session committed only the KAI venture folder. The work repo has many other uncommitted files from prior sessions (Teknova artifacts, agentic-systems handoffs, revops workflow drafts, the practices/expert-liaison and practices/engagement-governance directories). Those are intentionally not in this commit ... they belong to their own sessions. Surfacing the fact so a future session knows the dirty state is real and pre-existing.
