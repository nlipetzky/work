# Deepline User Experience

**Document type:** Reference (operator-experience walkthrough)
**Pairs with:** `deepline-methodology.md`
**Subject:** Deepline ... what the operator actually does, sees, and decides
**Owner:** Nick Lipetzky
**Created:** 2026-06-08
**Purpose:** Definitive walkthrough of the lived user experience. The methodology doc explains the architecture; this doc explains the operator's day.

---

## 0. Frame ... who does what

Deepline is operated by a Claude Code agent, not by the human directly. The human's role is:

1. **Trigger** the work with a natural-language request
2. **Watch** what the agent is doing across three surfaces (chat, Session UI, Playground)
3. **Approve or redirect** at gated decision points
4. **Consume** the final deliverable (a CSV path + a Playground URL)

The agent's role is everything in between: picking providers, running pilots, drafting approval messages, executing at scale, registering outputs.

The framework is designed so the human never has to type a CLI command. If you find yourself typing `deepline enrich ...` directly, you're working around the framework, not with it.

---

## 1. First-time setup (one-time)

Before any session can run, three things must exist:

### 1.1 The Deepline CLI

```bash
curl -s "https://code.deepline.com/api/v2/cli/install" | bash
```

This installs the `deepline` binary and authenticates against your Deepline account. After install, you can verify with:

```bash
deepline billing balance
```

If that returns a credit count, the CLI is wired correctly.

### 1.2 The skills

The Claude Code skills from `getaero-io/gtm-eng-skills` must be installed into `~/.claude/skills/`. At minimum:

- `deepline-gtm` (mandatory ... the meta-skill)
- Whichever shim skills match common tasks (`build-tam`, `linkedin-url-lookup`, `clay-to-deepline`, `portfolio-prospecting`, `workflow-hello-world`)
- `deepline-analytics` if Snowflake work is in scope
- `deepline-quickstart` for first-time demos
- `deepline-feedback` for bug reporting

### 1.3 A working directory convention

You don't create it ... the agent does, on the first action of every task. But you should know where to look:

```
deepline/data/<task-slug>/
```

Always project-local, never `/tmp/`. The task slug describes what the task is so you can find files later.

---

## 2. Starting a session

The trigger is a natural-language request typed in Claude Code chat. Examples:

- "Find me 25 CTOs at NYC fintech startups with verified emails."
- "Build a TAM for medical device robotics companies in the US, $10M-$100M revenue."
- "Convert this Clay table to a Deepline script: <link>"
- "Resolve LinkedIn URLs for these 50 people."

The agent's first response should:

1. Restate the goal in one sentence
2. Name which skill/recipe it's routing through
3. Announce the working directory it's creating
4. Post the execution plan to the Session UI

You should see something like: *"Working on a TAM build for medical device robotics. Routing through `build-tam` recipe. Creating `deepline/data/medrobotics-tam-v0/`. Posting plan to Session UI now."*

If the agent jumps straight into commands without that announcement, it's skipping the framework. Stop it and ask it to follow the meta-skill routing.

---

## 3. The Session UI ... your primary watch surface

Once the agent posts the plan, open the Session UI in a browser. You'll see:

- **Step list** (top): named phases, each with a status (`pending` / `running` / `completed` / `error` / `skipped`)
- **Live sub-step messages**: free-form strings the agent writes as work happens ("Searching Apollo for matching companies," "LeadMagic returned no results, falling back to ZeroBounce")
- **Table cards**: every CSV the agent produces shows up as a clickable card
- **Alerts**: red banners when the agent needs your attention (typically: an approval is waiting in chat)
- **Credit usage panel**: live spend total for the session

Your job at this stage is mostly to watch. The Session UI is the operator's "what is the agent doing right now" view ... it's deliberately rich because the chat surface is too narrow to convey state.

Refresh-free. Updates stream in as the agent works.

---

## 4. The pilot phase

Before any paid action, the agent runs a 1-row pilot:

```bash
deepline enrich --rows 0:1 ...
```

You won't see the command. You'll see in Session UI: *"Running 1-row pilot against Apollo company search."* And in the Playground sheet (next section), you'll see exactly one row materialize with whatever fields the pilot produced.

The pilot exists to prove two things:
- The filter syntax actually returns what you intended
- The cost per row is what the agent estimated

If the pilot returns garbage (wrong company type, missing fields, wrong identity), the agent should NOT proceed to ask for full-run approval. It should iterate the prompt or change providers and re-pilot. If you see an approval message after a clearly-bad pilot, push back ... the framework was bypassed.

---

## 5. The approval gate ... the most important UX moment

Every paid full-run waits on an explicit approval message in chat. This is the framework's central safety primitive. The message has a strict 4-section format:

```markdown
Assumptions
- <one-line intent assumption>
- <one-line intent assumption>

CSV Preview (ASCII)
<verbatim table from the 1-row pilot>

Credits + Scope + Cap
- Provider: <name>
- Estimated credits: <number or range>
- Full-run scope: <rows or items>
- Spend cap: <hard ceiling>
- Pilot summary: <one short paragraph>

Approval Question
Approve full run?
```

Simultaneously, a red alert lands in the Session UI: *"Approval needed: run enrichment on 300 rows (~140 credits)."*

This is your decision point. Your options:

| Response | What happens |
| --- | --- |
| "Yes" / "approve" / "go" | Agent runs the full scope, capped at the stated max spend |
| "No" / specific redirect ("use Findymail first, not Hunter") | Agent does NOT run. Adjusts and re-pilots |
| Silence | Agent holds in `AWAIT_APPROVAL` state indefinitely. No spend |
| "What would 1000 rows cost?" | Agent re-estimates without spending |

If any of the four sections is missing from the approval message, you should refuse and ask for the proper template. The framework explicitly forbids running paid actions on incomplete approval requests.

---

## 6. The full run

Once you approve, the agent starts the scaled enrichment. Now three surfaces are live simultaneously, and they show different things:

| Surface | What it shows |
| --- | --- |
| **Chat (Claude Code)** | High-level progress, sub-step announcements, errors that need decisions |
| **Session UI** | Step status, live messages, credit usage, table cards as outputs land |
| **Playground sheet** | Row-by-row enrichment in real time. Watch cells populate, see errors per row, re-run individual cells if needed |

The Playground is the most interesting surface here. It's a live spreadsheet view of the CSV being enriched. You can:

- See which rows succeeded and which errored
- Click into any cell to see the raw provider response
- Manually re-run a single cell if a transient error hit it
- Stop the run if something looks off

You can also do nothing and let it complete. The framework's rate-limit handling and retry logic are built in ... you don't need to babysit.

---

## 7. Mid-run interjection

If you spot something wrong during the full run, you have three ways to redirect:

1. **Stop the agent in chat.** "Pause this ... I need to check something." The agent stops issuing new provider calls.
2. **Re-run a specific cell from Playground.** Useful when one row hit a transient error but the rest are fine.
3. **Adjust a downstream column.** If the enrichment is multi-pass, you can change the prompt on a later column without re-running the earlier ones.

This is the part of the UX that differs most from Clay. In Clay, the operator drives the interactive iteration. In Deepline, the agent drives the run but the operator can interrupt at any point with surgical precision.

---

## 8. End of run

When the work completes, the agent's final chat message reports:

- **Exact final CSV path**: `deepline/data/<task-slug>/<filename>.csv`
- **Exact Playground URL** to inspect the result interactively
- **Summary of what shipped**: row counts, success rates, any rows that failed and why
- **Total credit spend** for the run

The Session UI's last step flips to `completed`. The table card for the final CSV is the primary deliverable.

You should at this point:

1. Open the Playground URL and eyeball the final table
2. Confirm the row count matches what you expected
3. Confirm the high-value columns are populated for enough rows
4. Decide whether to consume the CSV directly (push to HeyReach, import to Airtable, etc.) or run additional passes

---

## 9. The end-of-session consent gate

Every completed run ends with one Yes/No question from the agent:

*"Would you like me to send this session activity to the Deepline team so they can improve the experience? (Yes/No)"*

- **Yes** → agent runs `deepline session send --current-session`. Your data goes to Deepline's team for product improvement.
- **No** → nothing sent.

Asked once per session. Not re-asked unless you start a new run.

This is a deliberate UX choice ... the framework treats your session telemetry as opt-in, not opt-out. Worth being intentional about. If the session involved client-sensitive identifiers (real prospect names, specific revenue figures, etc.), default to "No."

---

## 10. Closing out

When the work is fully done:

```bash
deepline backend stop --just-backend
```

The agent typically runs this automatically unless you've explicitly asked to keep the backend running for follow-up work. The Session UI stops showing live state when the backend is down.

---

## 11. Common UX patterns by task type

### Pattern A ... single-shot enrichment ("enrich this CSV")

1. You: provide the CSV path + what you want added (emails, LinkedIn URLs, etc.)
2. Agent: posts plan, runs `csv show --summary`, picks providers
3. Agent: 1-row pilot, approval message
4. You: approve
5. Agent: full run with live Playground sheet
6. You: review final CSV path

Typical duration: 2-10 minutes for <500 rows.

### Pattern B ... discovery + enrichment ("find me 50 CTOs at X")

1. You: describe target (industry, geo, title, size)
2. Agent: posts plan, searches for company-search providers, runs discovery pilot
3. Agent: approval for full discovery run
4. You: approve
5. Agent: runs discovery, then pivots to people-search, then to enrichment
6. Multiple approval gates ... one per paid phase
7. You: approve each
8. Final CSV with enriched contacts

Typical duration: 10-30 minutes including approval waits.

### Pattern C ... ICP classification ("does this list fit my play")

1. You: provide CSV + criteria
2. Agent: drafts the classifier prompt, runs 5-row pilot
3. Agent: shows you 5 classified rows in chat with reasoning
4. You: confirm the reasoning matches your intent (or tighten the prompt)
5. Agent: approval for full classification
6. You: approve
7. Agent: classifies, aggregates, reports breakdown
8. Final CSV with `fits_play` + `sub_segment` + `exclusion_reason` columns

Typical duration: 5-20 minutes.

### Pattern D ... cloud workflow ("build me a recurring scraper")

Different rhythm. No row-by-row enrichment. Instead:

1. You: describe the trigger (cron, webhook) + what should happen on each fire
2. Agent: drafts workflow spec, runs `execution_mode: smoke_test`
3. Agent: shows you the smoke-test output
4. You: confirm behavior
5. Agent: deploys workflow (free), provides workflow ID
6. You: monitor via Session UI for future fires

Different deliverable ... not a CSV but a persistent workflow.

---

## 12. UX failure modes (what bad looks like)

The framework is designed to prevent these, but they happen if the framework is bypassed:

### "The agent ran something expensive without asking"

Cause: agent skipped the pilot-then-approval gate. Either the gate wasn't enforced or the agent's approval message was missing required sections.
Recovery: stop the agent. Check `deepline billing usage` to confirm spend. Insist on the 4-section template on the next run.

### "The Playground shows half-populated cells"

Cause: provider rate-limit hit or provider returned errors mid-run. Often transient.
Recovery: re-run only the failed rows via `deepline enrich --in-place --with-force <alias>` on the cells that need recompute. Don't re-run the whole sheet.

### "The agent loaded the CSV with Read and the conversation died"

Cause: framework violation. The skill explicitly forbids this and it's the single most common failure mode.
Recovery: start a fresh session. Insist the agent use `deepline csv show` or an Explore subagent.

### "I asked for 50 rows but the agent only delivered 38"

Cause: over-provision-then-filter rule kicked in. The agent pulled ~70 candidates expecting natural falloff and 38 was the best-complete count. This is correct behavior.
Recovery: ask for more pre-provisioning next time ("pull 2x my target") if 50 is a hard requirement.

### "Session UI shows nothing"

Cause: agent didn't post a plan, or the backend is stopped.
Recovery: ask the agent to post the plan. If backend is stopped, restart with any `deepline` command.

### "The approval message has no CSV preview"

Cause: agent didn't actually run the 1-row pilot (or the pilot errored and the agent papered over it).
Recovery: refuse the approval. Ask for a real pilot with verbatim preview.

---

## 13. The operator's mental model

If you internalize three things, the framework starts feeling natural:

1. **The agent operates the CLI; you operate the agent.** Your interface is natural language in chat + decisions at gates. The terminal is the agent's workspace, not yours.

2. **Three surfaces, three jobs.** Chat is for decisions and announcements. Session UI is for state ("what is happening right now"). Playground is for inspection ("what does the data actually look like"). When you're confused, check whichever surface answers the kind of question you have.

3. **The approval gate is the steering wheel.** Most of your influence on a Deepline run is exercised at approval gates, not during the run. Spend your attention there. The run itself is mostly watching.

---

## 14. UX comparison ... Clay vs Deepline

| Moment | Clay UX | Deepline UX |
| --- | --- | --- |
| Starting a task | Open browser, navigate to table, configure columns by clicking | Type a natural-language request in chat |
| Setting up an enrichment column | Click "Add column," pick provider from dropdown, configure params | Agent picks provider, drafts config, runs pilot, asks for approval |
| Watching it run | Refresh the table, watch cells fill | Session UI updates live; Playground shows row-by-row |
| Approving spend | Implicit (column runs when you save it) | Explicit 4-section approval message in chat |
| Stopping mid-run | Pause column in UI | "Stop" in chat or pause from Playground |
| Final deliverable | The Clay table itself | CSV file + Playground URL |
| Iteration speed | Fast for exploration; slow for repeated runs | Slow for one-off; fast for repeated runs (replay the same prompt) |
| Operator skill required | Spreadsheet fluency | Prompt fluency + comfort with approval-gate decisions |
| Cost surprise risk | Higher (easy to misconfigure a column and spend) | Lower (every spend is gated) |

The two systems have inverted strengths. Clay's UX rewards visual exploration. Deepline's UX rewards repeatability and discipline.

---

## 15. UX-level recommendation

For first-time Deepline use, the right onboarding is the `deepline-quickstart` skill ... it runs a small canned recipe (find 5 CTOs in NY) end-to-end so the operator experiences all four surfaces (chat, Session UI, Playground, final CSV) on a low-stakes task. ~10 minutes, ~1 credit.

After the quickstart, the next session should be a real task you'd otherwise have done in Clay. Run them parallel if you want a direct comparison. Note where you reach for which surface and how often you have to interject.

The UX takes 2-3 real sessions to feel natural. Before that, the approval-gate rhythm feels like friction; after that, it feels like the steering wheel you wish Clay had.
