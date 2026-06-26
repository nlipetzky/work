# Cold Email Doctrine

Source: "Cold Email" NotebookLM notebook (single source: 7-hour cold-email masterclass video, Lead Gen Jay lineage). Extracted 2026-06-23.

This is **doctrine** — the why + the hard numbers. It is the constraint set the RevOps engine and the downstream copy/sending layer should enforce. Treat the thresholds as defaults, not law (they are one operator's learnings); flag rule-vs-evidence conflicts when our own data disagrees.

Companion implementation reference: `cold-email-clay-column-map.md` (how Lead Gen Jay's Clay template realizes pillars 2-3).

---

## 1. Sending infrastructure & deliverability
- `.com` domains only. Age **30 days minimum** (60-90 ideal) before first send.
- Custom tracking domain via CNAME.
- Google Workspace. **Max 5 mailboxes/domain.** **20-25 emails/day/mailbox** (~100/day/domain). Hard ceiling **50/day/mailbox**, never scale past it.
- Every domain: verified SPF, DKIM, DMARC. DMARC `p=quarantine` or `p=reject`.
- Warmup from day 1, ramp +1-2/day until it equals the cold limit. Warmup reply rate 30-100%. Run warmup indefinitely.
- Campaign slow-ramp on. **Never mailbox-forward** replies — reply from the tool's centralized inbox.
- Auto-pause a campaign 14-30 days if inbox placement drops below 50-80% or hits a blacklist.

## 2. Data & list building  *(largely already in our engine)*
- ICP: decision-makers (Founder/C-suite). Avoid middle management. Hunt "blue oceans" — ignored industries, young companies, newly-hired execs.
- Bulk extract (~10k leads/$50 via scraper + Apollo filters). Scrape one state at a time to avoid dup exports.
- Verify every address. Million Verifier → expect 70-80% valid. Never send to unverified (bounce → blacklist).
- Catch-all recovery: ~25% come back risky/catch-all, ~50% of those are deliverable — re-run through a secondary verifier (FindEmail), don't delete.
- AI qualification against company description intentionally shrinks the list **30-50%** — that shrink is the point (kills spam complaints from non-fits).

## 3. Copywriting  *(downstream — Kepler owns the message layer)*
- "Triple Tap": preview text → body → CTA, each step earns the next.
- Max **6 sentences**, 6th-grade reading level.
- Preview = curiosity question, never signal the sale, no bait-and-switch.
- Body: their problem + your mechanism + social proof in 2-3 sentences. First name always. Company name/location only if it reads human.
- AI personalization = **2-8 words max** from web research (a recent partnership, podcast, hire), never the whole email.
- CTA = one-word reply, readable+repliable one-handed in <1 min.
- Email 1: **no HTML, links, images, opt-out, or unsubscribe.** Mandatory SpinTax on greetings.

## 4. Offer
- Must solve a direct pain, uniquely positioned. No absurd uncredible guarantees.
- Front-end plays for commodities: Loss Leader (sell at cost to build trust), Trojan Horse (non-sales pretext, e.g. interview), Reverse Lead Magnet ("let me research and build this for you" — raises perceived value via custom 1:1 framing).

## 5. Sequencing & follow-ups
- **Max 3 emails.** Longer sequences only for tiny TAM.
- Space 2-5 days.
- E1 = triple-tap, plain text, no links. E2 = short nudge, same thread, links/image now OK. E3 = "dump" (case studies, video, links).
- A/B: one variable at a time (3 subjects × 3 bodies × 3 CTAs = 9 variants). Find winning audience by cloning control 10× across 10 industries with identical copy.

## 6. Metrics & feedback loop
- Good: ~60% open, 1-2% reply, ~0.5-1% positive opportunity rate. High: >70% open, >5% reply.
- **Disable open/click tracking** (pixels kill deliverability). True metric = **positive reply rate**.
- Know your **"J" variable**: emails per booked call (e.g. 500:1) → drives mailbox-count math for scaling.
- Diagnose: sudden reply-rate drop = hitting spam → GlockApps live test with exact copy. Spam in Gmail but inboxing elsewhere = copy triggers a filter. Blacklist hit = pause, warmup-only, heal 30 days.

---

## How this maps to what we own
- **Pillar 2** is mostly built: `revops-engine` does dedup, classify, contacts-screen, verify, CRM-suppression gate, AI-research gate, route, export. Doctrine adds explicit thresholds to encode (70-80% valid, catch-all recovery, 30-50% AI-qual shrink).
- **Pillars 1, 5, 6** are NOT in the engine yet — they're the *sending system* (infra provisioning, sequence orchestration, deliverability monitoring + the J-variable feedback loop). This is the build gap.
- **Pillars 3-4** live downstream with Kepler (copy) and offer-extract (offer). The engine's job is to hand a send-ready list across that boundary, not write the copy.
