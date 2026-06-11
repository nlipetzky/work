# New-play kickoff prompt

Usage: create the empty play folder (`accounts/<type>/<name>/plays/<play-slug>/`), launch
Claude Code from it, paste the prompt below verbatim. Generic across clients and ventures —
never add engagement-specific lines here; those belong in the engagement's CLAUDE.md.

---

New play kickoff. You are in an empty play folder: the folder name is the play slug, the path above it identifies the engagement. Work in this order and do not skip ahead.

1. Orient. Read `~/code/work/practices/agentic-systems/reference/operating-doctrine.md` FIRST — it defines how decisions are made in every session here (recommend-then-ratify, conflict handling, escalation routes). Then the engagement CLAUDE.md (walk up to `accounts/<type>/<name>/`), the revops practice context, and `~/code/work/systems/revops-engine/` CLAUDE.md + PLAY-AGENT-BRIEF.md. Then read the registry record for the system this play runs on — `~/code/work/registry/signal/signal-prospecting/system.md` — its agent-context rows carry the design decisions and prior-art citations earlier sessions banked; they are binding context, not trivia. Use `~/code/work/accounts/clients/teknova/plays/ngabs-next-gen-antibodies/` as the structural reference for a complete play bundle — copy its shape, never its content.

2. Intake first. Ask me for the play's source material: what the client/expert actually asked for, plus any docs, emails, or lists. Everything downstream must trace to provided material — if you find yourself inventing the offer or the targeting, stop and ask. Clarifying questions come one at a time, as plain chat text.

3. Build the strategic input bundle with the lead-gen-strategist skill (offer, segment criteria, disqualifiers, ICP titles, sender identity, channel, volume, copy constraints). Surface missing inputs as questions, not assumptions. **This step is a gate, not a suggestion: no sourcing, no staging load, and no spend until the play brief exists and I have approved it.** The bundle is where rule conflicts get settled — where play docs disagree with standing engagement rules (ICP caps, exclusions), raise it HERE, in one batched pass; per-play artifacts supersede standing engagement defaults once I confirm. A decision that surfaces mid-run instead of in the bundle means this step was shortcut.

If I ask for something out of sequence (a peek at data, a side question), serve it, then say where you are in the sequence and return to it — do not let my ad-hoc asks silently replace the process.

4. Delivery contract before transport. Derive the destination contract (required fields + screening pipeline) from the play docs BEFORE building any load or sync. Only fully-qualified records cross; "eligible" is not "qualified". Before marking ANY contract input as unavailable, missing, or a blocker, verify against the live system (n8n active state via n8n-mcp read-only, Supabase schema) — inventory and state docs are dated snapshots and lose to live state. Missing from a doc is not absent from the system.

5. Assemble the play bundle: criteria docs, classifier prompt + read-fields.json, dedup rules, stage1 SQL, prep-recipe.json (recipe may only name stages the stage registry knows).

6. Run — follow the RUNBOOK step by step (`~/code/work/systems/revops-engine/RUNBOOK.md`): each step ends in a SURFACE VERIFY (read the count from the surface/query, state it + the URL) before the next begins; a screened batch is step 3 of 7, never "done." Work the REGISTERED FLOW, never ad-hoc (doctrine rule 12). Map every data action to a flow node on `~/code/work/registry/signal/signal-prospecting/system.md` and use that node's registered implementation; answer transport / destination schema / capture policy (always full faithful capture) / reusability FROM the record. No registered implementation for your case = a declared gap: add the to-build asset row, build the piece into the engine, register it, then use it. Load the source batch to staging, then drive the prep funnel per the play-prep skill (recipe → readiness report → seed → stages → prep-plan artifact). Two hard stops where you wait for my explicit approval:
   - Before ANY paid-provider spend (Apollo, Explorium, etc.): show me a pilot plan first. The engine has no approval gate yet — you are the gate.
   - Before anything leaves the system (export, Airtable, outreach): show me the output validated against the delivery contract at a preview.

7. Exit. Update the play-folder artifacts, and if this session changed any system's state, write a proposal file to `~/code/work/registry/_review/` rather than editing the registry directly.

Standing constraints: artifacts go to files (full absolute paths in chat); keep chat lean and state decisions in chat rather than burying them in docs; no person names in any shared artifact, schema, or prompt — role language only; never modify an n8n webhook node, surface it as a manual ask instead; established criteria are prior-iteration learnings, so when evidence conflicts with a rule, flag the conflict instead of auto-resolving toward the rule.

Showing data: anything that lives in the system (staging tables, records, runs, duplicates, gaps) is shown on the projection surface — give the URL (`localhost:4180/staging`, `/records`, `/runs`) plus a one-line count. NEVER re-render database contents as a chat table; chat re-narration is unverifiable and bypasses the trust surface the system exists to provide. And no qualification judgments in prose ("clear target", "obvious cut") before the screen has run — eligible is not qualified, and the screen decides, not the narrator.
