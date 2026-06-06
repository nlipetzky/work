# Deepline Evaluation (2026-06-04)

**Status:** Vendor snapshot. Decays. Re-evaluate before citing past 2026-12.
**Authors:** Nick + Boris.
**Source:** Live session 2026-06-04 ... ran CLI, read privacy policy, audited skill bundle, ran one paid enrichment, screenshotted the UI.

## Purpose

Capture the Deepline evaluation as a vendor doc so the session's research is not lost. Vendor docs decay; the load-bearing artifact from this evaluation is `observability-projection-pattern.md`, which lives independent of the vendor.

## What it is

Deepline (deepline.com, operated by Aero AI Labs, Inc.) is a CLI + web UI + workflow runtime that wraps ~50 data providers behind one interface, with a built-in observability layer over the resulting data.

Three product surfaces:

1. **Provider abstraction.** One CLI verb (`deepline enrich`) calls any of ~50 providers via JSON specs. Includes composite "plays" like `person_linkedin_to_email_waterfall` that chain 7 providers in cost-optimal order with first-hit-wins logic. Providers covered: Apollo, Crustdata, Findymail, Prospeo, Hunter, Lusha, ContactOut, RocketReach, Wiza, PDL, Explorium, BuiltWith, Bloomberry, Forager, LeadMagic, IcyPeas, Datagma, Salesforce, HubSpot, Attio, HeyReach, Smartlead, Instantly, Lemlist, and others.
2. **Workflow surface.** Visual workflow builder with cron/webhook triggers. Cloud-runnable. Functions similar in shape to Inngest functions wearing a UI.
3. **Customer Database.** Per-org hosted Postgres (`org_<id>_ingest_v2`, Postgres 16.14) with typed views over Data / People / Companies / Raw Events. This is the observability projection layer — records, runs, provenance, gaps, all surfaced.

## Cost and privacy

### Cost model

Per-action, per-provider. Some providers are free at Deepline's negotiated wholesale rate (Prospeo, Forager, LeadMagic observed during eval). Others meter per result. Native Contact emails cost $0.10 each in the eval run. ~$0.10 per "Deepline Credit", purchased in bundles.

Customer Database reads are **free** (confirmed by running a 100-row query; balance unchanged). No separate storage line item — bundled with the platform. No documented row/storage caps on the free tier observed during eval, but pricing page should be re-verified before scale.

Workflow runs metered the same as enrichment: cost is what the underlying provider call cost, not a workflow overhead.

### Privacy posture

Privacy policy (April 2026 version) operated by Aero AI Labs:

- **No training on customer data.** Policy does not claim training rights.
- **Not sold to third parties.** Explicit.
- **Customer source data not retained by Aero.** Claims ephemeral processing in customer-isolated containers destroyed after use. **Caveat:** this applies to data flowing through enrichment; the Customer Database tab obviously does persist data the operator explicitly writes there. Policy framing is partially misleading.
- **CLI diagnostics** are crash-triggered only. Excludes CSV contents, prospect data, full command args, env vars. Opt-out: `export DEEPLINE_DISABLE_FAILURE_REPORTING=1`.

Posture is meaningfully better than Clay (which trains and is opaque about retention) but "private" still requires keeping canonical records in your own systems and treating Customer DB as scratch.

## Skill bundle (~/.claude/skills/, installed by Deepline)

Nine Claude Code skills ship with the install.

| Skill | What it does |
|---|---|
| `deepline-quickstart` | Demo recipe (CTO search + email waterfall) for first-run onboarding |
| `deepline-gtm` | Catch-all GTM workflow: prospecting, enrichment, qualification, scoring, campaign activation across all providers |
| `deepline-feedback` | Sends bug reports with session transcript to the Deepline team |
| `workflow-hello-world` | Creates a cloud workflow with cron/webhook trigger, inspects, validates end-to-end |
| `clay-to-deepline` | Migrates a Clay table config to local Deepline scripts. Migration path for Clay users. |
| `build-tam` | Builds a TAM list by sourcing accounts + contacts from Apollo, Crustdata, PDL |
| `linkedin-url-lookup` | Resolves LinkedIn URLs from name + company with strict identity validation |
| `portfolio-prospecting` | Finds companies backed by a specific investor or accelerator, builds personalized outbound |
| `niche-signal-discovery` | Discovers buying signals in niche segments |

Bundle shape: two entry points (quickstart, gtm), one migration skill (clay-to-deepline), six pre-packaged plays. All are sales surfaces, not engineering scaffolds. Their bet is the CLI + workflow UI are self-explanatory once a recipe runs.

## Wedge analysis for Nick

Deepline is a **Clay replacement, not a stack replacement.** That is the right frame.

### Why it does not replace what Nick has

- **Orchestration.** Nick has 107 RevOps Inngest functions in `/Users/nplmini/code/ARCHIVE/aos/workflows/revops/`, including a fully event-driven discovery → enrichment → classification → gate → wave (campaign) lifecycle. Deepline workflows are less sophisticated; they are Inngest functions wearing a UI. Migrating off would be regression.
- **Data layer.** Nick has `revops-engine-dev` Supabase with canonical Companies and Contacts, plus the multi-client Surface base. Customer Database is a single per-org Postgres with no schema customization. Adopting it for canonical records would lose the existing architecture (see `revops-architecture-spec.md`).
- **Per-client surfaces.** Deepline has one UI for one org. Nick's RevOps Surface routes data to N client bases with per-client classifier stamps. Deepline does not model this.

### Where it could plug in

1. **Provider SDK inside Inngest functions.** Instead of maintaining direct Apollo + Crustdata + Findymail + Hunter SDK code in each archived function, call Deepline tools from inside the function. One auth, one credit balance, one upgrade path. The waterfall logic becomes a primitive instead of a hand-rolled chain.
2. **Wholesale pricing on metered providers.** If Deepline's per-call rate beats Nick's direct accounts (true today for Prospeo, Forager, LeadMagic — confirmed free during eval), the per-result savings compound across plays.
3. **On-ramp for new clients before archive is rehydrated.** While the 107 functions are still archived, Deepline can run the pilot enrichment for a new client's first play without rebuilding from scratch. The data lands in Nick's Supabase via psql, not Customer Database.

### The observability lesson

The real value of the evaluation is **not** any of the above. It is the architectural pattern Deepline forced into focus: records ↔ runs cross-link, per-field provenance, dedup surface, gaps as views. Nick had built the engine but not the projection over it.

That pattern is captured separately in [observability-projection-pattern.md](/Users/nplmini/code/work/practices/agentic-systems/reference/observability-projection-pattern.md). Implementing it in `revops-engine-dev` and `canon-crm-feed` is the actual outcome of this evaluation. Deepline is a footnote in that work, not the work itself.

## What this forbids

- **Adopting Customer Database as a system of record.** It is per-org, single-tenant, no schema customization. Nick's architecture is multi-tenant with per-client schemas. Use as scratch warehouse only, if at all.
- **Migrating archived Inngest functions to Deepline workflows.** Regression in capability. Use Deepline tools FROM Inngest, not the reverse.
- **Trusting "we do not store data" claim without caveat.** Policy is true for ephemeral enrichment processing. Customer Database explicitly stores what operators write to it. Distinguish before quoting the policy to anyone.

## File references

- `/Users/nplmini/code/work/practices/agentic-systems/reference/observability-projection-pattern.md` — the load-bearing artifact from this evaluation. Vendor-agnostic pattern doc.
- `/Users/nplmini/code/work/practices/agentic-systems/reference/clay-replacement-research-2026-05-08.md` — prior Clay evaluation. Same conclusion shape: the vendor is incidental, the pattern is the work.
- `/Users/nplmini/code/work/practices/agentic-systems/reference/revops-architecture-spec.md` — why Customer Database cannot be a system of record (per-client schema model).
- `/Users/nplmini/code/work/practices/agentic-systems/reference/inngest-projection-pattern.md` — the orchestration side; Deepline does not replace.

## Decay notes

This doc carries a date because the vendor landscape shifts. By 2026-12, expect:
- Pricing has changed.
- Provider list has churned (additions and removals).
- Skill bundle has been updated.
- Privacy policy may have moved.

Before citing this doc for a decision, run `deepline --version`, check `https://deepline.com/pricing`, re-read the privacy policy, and compare against this snapshot. If material drift, write a new evaluation rather than editing this one.
