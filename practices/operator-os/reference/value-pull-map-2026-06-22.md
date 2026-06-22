# Value-Pull Map — 2026-06-22

**Question:** Across every relationship, what value does the market *demonstrably pull* from Nick? Not what he says he does — what people repeatedly ask for, pay for, expand, or refer.

**Method:** Mined canon_engine (Supabase `mzzjvoiwughcnmmqzbxv`: `email_threads`, `email_messages`, `transcripts`) for demand language + willingness-to-pay, cross-checked against contracted/delivered scope in `/Users/nplmini/code/work/accounts/`. Each line carries a strength grade and a citable source.

**Grade scale (strongest → weakest):**
`PAID/RENEWED/EXPANDED` > `REPEATED ASK` > `ONE-OFF INTEREST` > `ADMIRED-NOT-BOUGHT`

> Provenance note: most "account_name" values in canon are null/unlabeled; counterparties below were recovered by sender domain and transcript participants. Person names are used only as neutral source citations, never in a judging frame.

---

## Per-relationship value-pull

### Teknova (client — biotech ABM / RevOps) — `mmsinconline`→ no; domain `teknova.com`, 148 inbound msgs, 37 threads, active through 2026-06-22

- **PAID/RENEWED** — Recurring monthly retainer, paid on time: $8K ACH on invoice #1010 (2026-06-03) and #1011 (2026-06-17), plus prior months. The single clearest willingness-to-pay signal in the corpus.
  Source: canon thread "ALPHA TEKNOVA INC has initiated a payment" (2026-06-03); "Re: ALPHA TEKNOVA INC has initiated a payment" (2026-06-17); `/Users/nplmini/code/work/accounts/clients/teknova/artifacts/teknova-contractual-obligations-2026-05-27.md` (signed SPA + Exhibit A, 2025-09-30).
- **REPEATED ASK** — A *trusted, qualified contact list* — verified targets, deduped, with Salesforce-activity overlay so outreach never hits current customers/active opps. This is the recurring weekly pull (AAV → ngAbs → mRNA cohorts), reviewed gate-by-gate by the client's domain authority.
  Source: canon threads "mRNA company list for your review — 28 verified targets" (2026-06-15), "ngAbs target lists" (2026-06-16), "New AAV discovery approach" (2026-05-21); `/Users/nplmini/code/work/accounts/clients/teknova/plays/mrna-therapeutics/delivery-contract.md`.
- **REPEATED ASK** — *Classification / screening logic the client can correct.* The client repeatedly hands back refined screening criteria (conjugate subclasses, false-positive keyword logic) and Nick re-runs — i.e., they pull on the engine's correctability, not just its output.
  Source: canon thread "Re: ngAbs" (2026-06-05, Gate 1 criteria feedback).
- **EXPANDED (scope-pull)** — Engagement pulled adjacent into *system handover / documentation*: architecture diagram, Airtable system registry, n8n workflow transfer, credentials inventory. Client asked for the engine to become *theirs*, which is a buy on the operator's systematization, not just the leads.
  Source: transcript "2026-06-01 konstellationai — Nick / Jennifer Henry" (action items: system architecture diagram, system registry, account transfer); `/Users/nplmini/code/work/accounts/clients/teknova/teknova-engagement-going-forward-2026-05-12.md`.

### Miller Mechanical Specialties / MMS (client — ops automation) — domain `mmsinconline.com`, 41 inbound msgs

- **PAID** — Built and delivered a working order-intake automation (email → AI classify/extract → Airtable w/ confidence → Freshdesk), Phase 1 accepted; invoice paid by check (referenced in receivables threads).
  Source: `/Users/nplmini/code/work/accounts/clients/MMS/docs/phase1-completion-report-for-sarah.md` (2026-04-29, 7-item scope all delivered); canon "Re: Receivables" (2026-06-12, Miller Mechanical payment tracked); "Re: Fw: Invoice Submission – Konstellation AI LLC" (2026-05-14).
- **REPEATED ASK** — *Replace manual human classification/data-entry with a reliable AI pipeline that doesn't silently fail.* Client drove a specific 7-item Phase-1 punch list (dedup gate, confidence score, error isolation, title-format alignment) — concrete, paid-for operational reliability.
  Source: same completion report (client's Apr-27 email scope).
- **REPEATED ASK (expansion signal)** — Client engaged on Phase 2 (cancellation detection) and ongoing accuracy tuning.
  Source: same report ("deferred to Phase 2"); transcript "2026-03-25 — Sarah L / Nick" (workflow transfer to client's own n8n).

### Konstellation AI (venture — co-owned w/ domain-expert partner) — domain `konstellationai.com`, 275 msgs, 50 transcripts, the densest corpus

- **PAID/EXPANDED** — Partner repeatedly funds and draws against the venture, and treats Nick as the build engine behind the partner's AI-advisory offering. Owner draws processed ($5K + $4.8K), partner closing deals and depositing checks.
  Source: canon "Re: Receivables" (2026-06-12); untitled thread "Will confirms closing the Teknova deal… deposit Miller check… offers Nick another draw" (2026-06-18).
- **REPEATED ASK** — *Stand up the whole commercial machine for an expert*: CRM to track prospects/emails/meetings/learnings, warmed inbox, LinkedIn content for the expert to approve, outbound sequencing, daily action-item email. The partner pulls Nick as the operator who makes a credentialed expert sellable.
  Source: transcripts "2026-06-02 — Will / Nick" (build CRM, daily email, warm inboxes, LinkedIn content), "2026-05-26 — Will / Nick" (simple CRM + HeyReach + Sales Nav, activate LinkedIn).
- **REPEATED ASK** — *Reusable RevOps engine instance per business/department.* Partner asks to point the same engine at new domains (patent monetization, AI advisory) — pull is on the engine as a replicable product.
  Source: transcripts "2026-04-07 — Will / Nick" (set up RevOps engine instance for advisory business), "2026-05-20 — Nick / Will" (scale RevOps into venture-scale product).

### Darrow / SIM IP (prospect — IP-acquisition GTM) — domain `darrowindustries.com`, 40 msgs

- **ONE-OFF INTEREST → strategic doc produced** — A full GTM / deal-origination plan was authored (channels, KPIs, cadences) to retire key-man origination risk ahead of an IPO roadshow. Demand is for a *repeatable origination engine*, but this is partner-authored strategy, not yet a contracted/paid Nick build.
  Source: `/Users/nplmini/code/work/accounts/prospects/Darrow/SIM IP GTM Plan.docx.md`, `SIM IP Email Playbook.docx.md`, `SIM IP Referral One Pager.docx.md`. No payment trace in canon.

### Tweed / Absolute Mechanical (prospect — HVAC AI, expert-channel test) — partner "Larry/Lawrence"

- **REPEATED ASK** — Partner pulls Nick for the *AI-opportunity-brief → scoped-pilot* motion on an HVAC contractor; the relationship is being evaluated as a venture channel (does the partner carry the client conversation).
  Source: `/Users/nplmini/code/work/accounts/prospects/Tweed/collaboration/opportunity-brief.md`; transcript "2026-05-19 — Lawrence Tweed / Nick" (discovery questions, AI opportunity brief outline). No payment trace.

### RahrBSG (prospect — data infra / GTM) — domain `rahrbsg.com`, 12 msgs, via partner-sourced champion "Jari"

- **ONE-OFF INTEREST** — Champion pulls toward *database reconstruction → AI-ready infrastructure* and Salesforce-cost alternatives; discovery only, diagnostic pending.
  Source: transcript "2026-05-20 — Jari / Nick"; `/Users/nplmini/code/work/accounts/prospects/RahrBSG/discovery-snapshot.md` (mostly TBD). No payment trace.

### ETA Jets (client — content/ops automation) — primary contact via Cory Samuels

- **PAID/DELIVERED (V1 closeout)** — Built empty-leg ingestion → content-gen → Instagram publishing automation with human-in-loop pricing; migrating to client's own n8n.
  Source: `/Users/nplmini/code/work/accounts/clients/ETA/PROJECT.md` (V1 closeout, system built).

### Adjacent inbound pulls surfaced in transcripts (one-off, mostly unpaid — the demand "shape" matters)

- **REPEATED PATTERN — RevOps/GTM rebuild for a struggling funnel.** A PE-backed operator (K-12 payments / faith tech) pulled Nick for a roadmap to lift MQL→SQL from 17%→40% via data enrichment + signal modeling; agreed a 50-account pilot.
  Source: transcript "Nick and Shawn first meeting" (2026-05-26/27). `ONE-OFF INTEREST` (pilot scoped, no payment trace).
- **REPEATED PATTERN — "teach me the agent stack."** Multiple counterparties pull Nick to *show them how to build agents* (Claude model hierarchy, markdown agent config, co-work connectors, DB-backed memory, AWS deploy).
  Source: transcripts "2026-04-10 — Ed McConaghay / Nick"; "2026-04-17 — Sam Feintech / Cory Samuels". `ONE-OFF INTEREST`.
- **ONE-OFF — AI thought-partner / marketing assessment.** Source: transcript "2026-04-14 — Jori Sherer / Nick".
- **ONE-OFF — supply-side database build (newsletters/creators).** Source: transcript "2026-06-02 — Mika / Nick".

---

## The cross-cutting pattern — what the market demonstrably pays Nick for

Stated in market language, not Nick's:

1. **"Give me a trusted, ready-to-act list / dataset — verified, deduped, and safe to use — that I'd otherwise need a team to produce."** (Teknova: PAID, RENEWED, weekly REPEATED ASK.) The buyer is a *credentialed domain expert who is time-constrained* and wants the judgment-heavy filtering done and made correctable. This is the strongest, most-paid, most-repeated pull in the corpus.

2. **"Replace a manual, error-prone operational process with an AI pipeline that runs reliably and that I can eventually own."** (MMS: PAID. ETA: PAID/DELIVERED. Teknova handover: EXPANDED.) Buyers pay for *operational reliability + clean handover*, not novelty.

3. **"Be the operator who makes my expertise/credibility sellable — stand up the whole commercial machine (CRM, outbound, content, sequencing) behind me."** (Konstellation: PAID/EXPANDED, repeated. Tweed, Darrow, RahrBSG: the *demand shape* repeats even where unpaid.) The market pulls Nick as the **invisible operator behind a credentialed expert** — turning a domain expert into a running go-to-market.

**One-sentence synthesis:** the market pays Nick to be *the operator who turns an expert's judgment into a trustworthy, running system* — most reliably as verified, ready-to-act data/lists for time-constrained domain experts (1), and as own-able operational automations (2); the venture pull (3) repeats everywhere but has so far converted to cash mainly through the venture itself, not direct client contracts.

---

## COVERAGE GAPS — what could NOT be seen / verify

- **Transcript coverage is konstellationai-only** (50 of ~45–50 transcripts all tagged `konstellationai`; zero for teknova, MMS, ETA, Darrow, RahrBSG, Tweed as standalone). Absence of a transcript for an engagement is NOT absence of demand — MMS and ETA are clearly paid despite zero transcripts. Verbal demand language for those is invisible here.
- **Email account labels are mostly null** (~1,608 of ~1,860 threads unlabeled). Counterparties were reconstructed by sender domain; low-volume relationships (<4 msgs) and any using personal/Gmail addresses are likely undercounted or missed entirely.
- **Dollar amounts are partial and never a full P&L.** Canon shows specific paid invoices (Teknova $8K x2, Miller via check, Allied Vaughn AR) but the corpus is the operating inbox, not the books. Exact retainer sizes, total contract value, and margin are unverifiable from canon alone.
- **Willingness-to-pay UNVERIFIABLE for:** Darrow/SIM IP (strategy authored, no payment trace), Tweed/Absolute (channel test, no payment), RahrBSG (discovery only), and all adjacent transcript pulls (Shawn/K-12 payments, Ed, Jori, Mika, Kevin Pettit, Cory/Sam) — these are interest/scoped-pilot signals, graded ONE-OFF, not demand proven by cash.
- **"Allied Vaughn" and "instig8.ai"** appear as paying/operating entities in canon (AR line; separate Google Cloud/RB2B billing) but have **no engagement folder** under `accounts/` — relationship type and what was bought are unconfirmed. Flag for Nick: are these real client relationships missing from the OS, or vendor/infra noise?
- **Pre-2026-03 history is thin** in both transcripts and labeled threads; older engagements (if any) are out of view by the trust boundary (cannot read `~/code/aos` or `~/code/<client>` folders).
