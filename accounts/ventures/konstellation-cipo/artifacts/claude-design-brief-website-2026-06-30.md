# Claude Design brief — Konstellation CIPO website

**One-file handoff. Self-contained — assume no other context.** Redesign the visual
presentation of an existing, content-complete site. The copy is written, sourced, and
approved-in-pattern; your job is the **design**, not the words. Re-dress it into
something credible and high-trust. Minor copy tightening is fine; inventing claims,
changing the offer, or breaking the constraints below is not.

There is a current build (screenshot-ugly: unstyled stacked text, no hierarchy, no
hero, numbered steps rendering as tiny artifacts, flat full-width bands). Treat it as
a content map, not a design reference. Start the visual system from scratch.

---

## 1. What this is

**Konstellation CIPO** is a *fractional Chief IP Officer* service for venture-backed
startups. The model: an AI intelligence layer runs the IP analysis (freedom-to-operate,
prior art, landscape, competitor filings); a human Chief IP Officer (Will Rosellini,
15 years in IP monetization) turns that analysis into strategy and the investor
narrative. Sold as a continuous subscription, replacing unpredictable hourly IP-firm
billing.

**Audience:** founders/CEOs of venture-backed, technology-differentiated
medical-device / biotech / deep-tech companies, typically Series A, raising or
preparing to raise, where IP is material to valuation. Technical, skeptical, busy.
They respond to precision and credibility, not hype.

**The site's single job (lead-gen):** get the visitor to **request a Competitor
Filing Teardown** — a custom, 1:1 piece of work ("tell us your top competitor, we'll
research their recent filings and put a teardown together for you"). That opt-in is
the only conversion. Everything points to it. No calendar, no payment, no signup.

**Tone:** authoritative, plain-spoken, a little blunt. "Fractional executive /
boutique advisory," not "legal SaaS," not "startup playful."

---

## 2. NON-NEGOTIABLE constraints (ship-blockers — verify every one)

These come from the expert's hard rules. Any violation kills the page.

1. **Banned words — never appear anywhere (copy, alt text, labels, metadata):**
   `agentic`, `agent`, `canon`, `constellation`, `orbit`, `star` / `star systems`.
   (Yes, even though the AI layer is the product — it is never called an "agent.")
2. **Never call Will an `attorney`, `lawyer`, or `counsel`,** or imply a current law
   license. His title is **"Chief IP Officer"** / **"fractional Chief IP Officer"** only.
3. **No pricing figures. Anywhere.** No dollar amounts, no "/mo", no "from $X". The
   three tiers (Scout / Shield / Arsenal) appear as named shapes with a deliberate
   **"[pricing pending]"**-style treatment (make it look intentional — e.g. "Pricing
   shared on the call" — not like a broken placeholder).
4. **No fabricated proof.** No customer logos, no invented metrics, no fake
   testimonials, no stock "happy client" photography. The only proof is the mechanism
   + Will's real track record (provided below). There is a deliberate line owning the
   absence of logos — keep it.
5. **No space / astronomy / "constellation" visual motifs.** No starfields, orbits,
   galaxies, night-sky gradients, connected-dots-as-stars. This is an explicit
   refusal, not a style preference.
6. **Keep the DRAFT banner** at the very top: "DRAFT — staging preview. Copy pending
   Will sign-off; pricing and visual identity not yet approved." (Style it as an
   unobtrusive top strip; it gets removed at launch.)
7. **This is a strategy/judgment service, not legal representation** — that line stays
   in the footer and the objections.

---

## 3. Visual direction (PROVISIONAL — propose, don't assume it's locked)

The brand's visual identity is genuinely undecided and will be reviewed by the expert.
So: execute **one strong, coherent direction** below as a candidate, with the taste to
swap the accent later. Do not over-commit to a logo.

**Style archetype:** *Trust & Authority + Minimalism*, with an *Editorial / magazine*
layer (Swiss-modern restraint, editorial hierarchy, generous whitespace). Think
top-tier boutique advisory: serious, precise, confident. Sources: this matches the
curated "Legal Services → Trust & Authority + Minimalism, Swiss Modernism 2.0" and
"Editorial Grid / Magazine" patterns.

**Color (recommended candidate):** deep navy ink + warm paper + a single restrained
authority accent (brass/gold, which reads "established" rather than generic-SaaS blue).
- Ink / primary: `#0F172A`  ·  Secondary text: `#334155`  ·  Muted: `#64748B`
- Background paper: `#FAF8F3` (warm) or `#F8FAFC` (cool) — pick one and commit
- Surface / cards: `#FFFFFF`  ·  Borders: `#E2E8F0`
- Accent (CTAs, rules, emphasis): brass `#A16207` (WCAG-safe on white)
- Conservative alternative accent if brass feels off: deep blue `#0369A1`
Keep it light-mode-first. One accent only — no rainbow, no gradients-as-decoration.

**Typography:** serif display for authority + clean sans for body + (optional) mono
for labels/data, which reinforces the "precision / analysis" angle.
- Display/headings: an editorial serif — **Source Serif 4** or **EB Garamond** (avoid
  Playfair; too fashion). Big, tight, confident.
- Body/UI: **Inter** (400–600).
- Labels / eyebrows / step numbers / "[pricing pending]" / section tags: a mono —
  **IBM Plex Mono** or **JetBrains Mono**, uppercase, tracked. Use this to make the
  numbered steps and eyebrows feel designed, not like artifacts.
- Scale: Hero 44–56px / H2 28–32px / body 17–19px / labels 12px mono uppercase.
  Set a reading measure (~68–72ch) on prose — current build runs lines edge-to-edge.

**Layout & components:**
- Real above-the-fold **hero**: eyebrow (mono) → the promise as the dominant
  typographic element → subhead → one primary CTA button → a quiet proof strip.
- Clear section rhythm with breathing room; alternate paper/white sparingly, not as
  faint full-width stripes.
- **How it works**: a proper 3-step sequence with large serif/mono numerals, a title,
  and a line each — not tiny highlighted "1/2/3" boxes.
- **Proof**: render the founder quote as an editorial **pull-quote**; the two
  credibility anchors as clean stat/credential blocks.
- **Tiers (Scout/Shield/Arsenal)**: three tasteful cards, the "[pricing pending]"
  treatment intentional. No price = a feature of the pitch ("set on the call"), not a gap.
- **Objections ("Honest answers")**: a refined Q&A (stacked or two-column), confident,
  not an accordion gimmick.
- **Capture form**: single column, 4 fields, prominent submit, a clear success state.

**Motion:** restrained reveal-on-scroll at most. No parallax, glassmorphism, blur,
holographic, or gradient-text. Performance and clarity over effects.

**Imagery:** prefer typographic and light diagrammatic treatment over photos. If any
visual metaphor is used, a restrained "filing landscape / white-space map" diagram fits
the teardown (data/precision) — never anything astronomical. No stock photography.

---

## 4. The content, verbatim (keep this copy; restyle its presentation)

### Global
- Brand wordmark: **Konstellation CIPO**
- Top DRAFT banner (see constraint #6).
- Nav: `Konstellation CIPO` (left) · `Approach` · **`Request a teardown`** (button, right).
- Footer: "Konstellation CIPO — fractional Chief IP Officer services. Led by Will
  Rosellini." + "This is a strategy and judgment service, not legal representation."

### Page: Home (`/`)
- Eyebrow: "For venture-backed founders raising or preparing to raise"
- H1 (the promise): "Continuous IP intelligence, plus a Chief IP Officer's judgment —
  at a subscription, not by the hour."
- Subhead: "The AI does the analysis. A fractional Chief IP Officer does the judgment.
  You get both."
- Primary CTA: **"Get a teardown of your top competitor's filings"** → `/competitor-teardown`
- Proof strip: "Led by Will Rosellini" · "15 years in IP monetization" · "Raised a
  Series A himself"
- Pull-quote: "Hourly billing makes deferral the rational choice... until the bill
  comes due at the raise: a thin portfolio, a weaker round, blocking patents nobody saw."
- Credential anchors:
  - "15 years in IP monetization."
  - "I raised a Series A myself at the end of a Phase 2 — so I know exactly what an
    investor wants the IP story to look like."
- Logo-absence line: "No customer logos yet — at this stage the proof is the mechanism
  and the track record, not a wall of logos."
- Section: **How it works** — "Episodic consulting creates blind spots, and deferral
  compounds the risk. A subscription replaces the open-ended meter with continuous
  coverage."
  1. **Automated analysis** — "Freedom-to-operate, prior art, landscape, and competitor
     filings — run continuously, not once a quarter."
  2. **A Chief IP Officer's judgment** — "Analysis becomes strategy: portfolio framing
     and the investor narrative your round needs."
  3. **Continuous monitoring** — "A monthly cadence catches the landscape shifts and
     competitor filings episodic consulting misses."
- Section: **The shape of the engagement** — "One continuous relationship, three depths
  of coverage. Pricing is set with Will before any figure is published."
  - **Scout** — [pricing pending] — "Continuous freedom-to-operate and landscape
    monitoring, with monthly IP strategy read-outs."
  - **Shield** — [pricing pending] — "Everything in Scout, plus competitor-filing
    intelligence and investor-narrative preparation."
  - **Arsenal** — [pricing pending] — "Everything in Shield, plus outcome-aligned
    participation when you monetize the portfolio."
- Section: **Honest answers**
  - "Why not a patent firm?" — "Continuous versus episodic, and a predictable
    subscription versus open-ended hourly billing."
  - "Why not wait until we raise?" — "That is exactly when the bill comes due. The
    portfolio you wish you had takes months to build."
  - "Is this legal representation?" — "No. Will is your fractional Chief IP Officer —
    strategy and judgment, not legal representation."
- Closing CTA band + the capture form (see form spec below):
  - Heading: "See where a competitor is boxing you in — before your next raise."
  - Sub: "Tell us your top competitor. We will research their recent filings and put a
    teardown together for you. No calendar, no commitment."

### Page: Competitor Teardown (`/competitor-teardown`) — the lead magnet
- H1: "A competitor filing teardown, prepared for you"
- Sub: "We'll tear down your top competitor's recent patent filings — where they're
  building a wall, and the white space they've left you."
- Body: "Tell us your top competitor. We'll spend the time researching their filings
  and put a teardown together for you specifically — reviewed by a Chief IP Officer."
- CTA: "Jump to the request form" → the form.
- The capture form (see spec below).

### Page: Approach (`/approach`) — depth for the skeptic
- H1: "The approach, in depth"
- Sub: "Built for the founder who wants to see the mechanism before they trust it."
- Body: "The same continuous-intelligence model, with more room to show how the
  analysis and the judgment fit together."
- Reuses: the same **How it works** 3 steps, the pull-quote, the credential anchors,
  the logo-absence line, and **Honest answers** (above).
- Closing: "Ready to see it on your own competitor? Request a teardown of their recent
  filings." + CTA to `/competitor-teardown`.

### The capture form (the one conversion; on Home closing band + the teardown page)
- Heading: "Request your competitor teardown"
- Helper line: "For venture-backed founders. Not a fit for law firms or
  patent-prosecution-only needs. Note: patent applications publish on an ~18-month lag,
  so a teardown reflects what is public to date."
- Fields (all required): **Name**, **Work email**, **Company**, **Your top competitor
  (or the space you're worried about)**.
- Submit button: "Send me the teardown"
- Success state: a brief confirmation ("We'll research and send your teardown.") — no
  redirect needed.

---

## 5. Tech target (so the output drops into the codebase)

The site is **Next.js (App Router) + React + Tailwind**, part of a monorepo where the
visual components live in a shared, theme-token-driven kit (all colors come from
`--kit-*` CSS variables; components carry no literal colors). Ideal deliverable:
- A coherent visual system expressed as **design tokens** (the palette + type + spacing
  + radius above), plus
- Styled, responsive (mobile-first) section/components matching the inventory in §3–4.
If you output standalone HTML/CSS or React, keep colors as variables/tokens so they map
onto the kit. Mobile and desktop both matter; founders read on phones.

---

## 6. Acceptance checklist (the redesign is done when…)

- [ ] Strong above-the-fold hero; the promise is the dominant element; one clear primary CTA.
- [ ] Real section rhythm + whitespace; prose set to a readable measure (not edge-to-edge).
- [ ] 3-step "How it works" reads as a designed sequence (large numerals), not artifacts.
- [ ] Tiers are clean cards; the no-pricing treatment looks intentional.
- [ ] Founder quote is an editorial pull-quote; credentials styled as stat/credential blocks.
- [ ] "Honest answers" is a confident, legible Q&A.
- [ ] Capture form: single column, 4 fields, prominent submit, success state. Present on
      Home closing band and the teardown page.
- [ ] Responsive on mobile + desktop. Light-mode. Restrained motion only.
- [ ] **Zero banned words** (agentic/agent/canon/constellation/orbit/star;
      attorney/lawyer/counsel for Will). **Zero pricing figures.** DRAFT banner present.
      No fabricated logos/metrics. No space/astronomy motifs.

---

## 7. What is deliberately left open (propose, we decide with the expert)

- Final brand identity, wordmark/logo treatment, and the exact accent color — these go
  to the expert (Will) for sign-off. Give a strong candidate; expect iteration.
- Domain is unconfirmed (KonstellationAI.com vs its own) — don't hard-code a domain.
- All copy is pending the expert's final sign-off; keep it editable (token/data-driven),
  not baked into images.
