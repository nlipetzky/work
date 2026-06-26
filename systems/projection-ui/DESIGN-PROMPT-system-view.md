# Claude Design kickoff: the /system anatomy view (2026-06-23)

Launch Claude Design in the browser (claude.ai/design) with the projection-ui repo linked via
"Link local code" → /Users/nplmini/code/work/systems/projection-ui. Then paste the block below.

---

Design the `/system/[slug]` detail view for this app — the standardized "anatomy of a system" view.
Build it with this codebase's real design system: the dark `ink` palette, accent/ok/warn colors, and
the existing card/badge patterns. Keep the calm, dark, terminal-clean aesthetic. Don't introduce a new
visual language.

What this view is for: every agentic system in the operator OS renders the SAME way here, so reading
any system is one habit. It is populated from a database (systems, activities, assets tables). It must
INTERPRET, not dump fields. Render these ten parts, in this order:

1. Identity (header band): system name, what it ensures (one line), the ladder "→ goal → vision",
   lifecycle pill (emerging/building/operating/archived), owner, and an autonomy gauge (share of its
   ensured activities that run without the human).

2. The engine (a left-to-right flow): Trigger ▸ Brain ▸ Logic ▸ Output. The Brain box is the AI
   component (model, instructions, context, tools, guardrails) and is visually distinct (accent
   border); show it as "deterministic — no AI" when a system has no model. Logic is the code/driver.

3. Data layer (a band under the engine): reads · writes · state/checkpoints · retrieval/context · the
   runs/events ledger.

4. Connections: upstream systems in, downstream consumers out, external integrations (n8n, Supabase,
   APIs, MCP servers).

5. Activities — the run layer: led by NEEDS YOU (manual activities, flagged, with their channel) vs
   RUNS WITHOUT YOU (automated/autonomous, quiet). Plain language, never jargon.

6. The concrete asset inventory: the actual named, TYPED artifacts that implement the system, grouped
   by type — n8n workflow / inngest function / script / edge function / cron / database / table /
   airtable base / mcp server / agent definition / prompt / schema-spec / context artifact. Each asset
   shows its name, a small type badge, a locator (workflow id / path / url), lifecycle, and a
   "verified" tick when reconciled against live. This is the part that answers "what database, what
   workflows, n8n vs Inngest vs script."

7. Guarantee & observability + Human & authority (a foot strip): what it guarantees, how it's verified,
   where it's watched; and what runs autonomously vs needs human approval.

8. Honest gaps: an explicit note for what the catalogue does NOT yet know — e.g. "asset inventory
   verified present but not complete; some live workflows not yet catalogued." Trust comes from
   admitting gaps.

Use Canon Ingestion as the worked example to design against: operating, ladders to "Build the operator
OS", 5 activities (1 needs you — "reconcile sources", via review queue; 4 run without you), assets
include n8n workflows (Ingest & triage email, Ingest transcripts), scripts (chunk+embed, checkpoints),
and a database.

Make it scannable on one screen, calm, and lead with what needs a human. When it's right, Export →
"Hand off to Claude Code" and paste the bundle back into a Claude Code session here to build into
`app/system/[constellation]/[slug]/page.tsx`.
