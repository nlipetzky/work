# Gap 1 Solution Research: Verifying NA Wet-Lab Footprint

**Problem:** The Clay table treats "HQ is in US/Canada/Mexico" as satisfying playbook gate G3. The playbook explicitly says that isn't enough. A company can be HQ'd in Boston but do all its actual antibody work in Switzerland, Korea, or at a contract site. Teknova can't sell reagents to a Boston sales office.

**Goal:** Add a verification step that produces a yes/no/unclear verdict on the question "does this company operate a physical wet-lab, process development, or manufacturing site in North America?" with cited evidence.

---

## The signals available

Five kinds of evidence can answer the question. Listed strongest to weakest.

### 1. Job postings with NA locations (strongest)

If a company is actively hiring a Scientist II for Cell Culture Process Development in Cambridge MA, that's near-proof of a Cambridge wet-lab. Companies don't post bench-scientist roles for offices that don't have benches.

The table already has a `Mfg & Process Job Openings` column. Today it returns ✅ or ❌ at the company level. Extending it to capture the **location of each posting** and the **role family** (bench scientist, mfg associate, PD engineer vs. sales rep, IT, finance) turns it into the primary signal.

Tightest version: "Are there one or more open job postings in the last 6 months for upstream, downstream, formulation, cell line, MSAT, or QC roles, located in US/Canada/Mexico?"

Limitation: small biotechs may not be hiring during the window. Absence of postings is not absence of a lab.

### 2. Company website "Locations" / "Facilities" page (strong)

Most biotechs with real wet-lab capacity say so on their site. They list addresses, square footage, GMP suite count, certifications (ISO 13485, FDA-registered). This is the source the AI should hit first.

Approach: AI research column that fetches the company's `/about`, `/facilities`, `/locations`, `/contact` pages and extracts every listed address with a tag for what happens there.

### 3. FDA establishment registration (strong, narrow)

Any facility that manufactures drug substance for US human use must register with the FDA. The FDA's Drug Establishments Current Registration Site (DECRS) is queryable by company name and returns addresses. If a company is on it with a US address, GMP manufacturing is happening there.

Limitation: only catches GMP-stage, not R&D-only sites. A clinical-stage biotech doing PD but not GMP won't be registered. Useful as a confirming signal, not a sole signal.

### 4. LinkedIn company "Locations" field (medium)

LinkedIn lets companies list multiple office locations. Clay can pull this via the LinkedIn enrichment. Useful but noisy: sales offices and HQs show up alongside labs with no distinction.

Treat as a candidate-address generator, not a verdict.

### 5. Press releases and grant announcements (weakest, supportive)

"Acme Bio opened a 30,000 sqft GMP suite in Research Triangle Park" is gold when it exists. It rarely exists for the rows that need it most (the smaller biotechs).

Treat as confirming-only.

---

## Recommended Clay implementation

Add two columns to the existing table, then a third that scores them together.

### Column A: `NA Wet-Lab Sites (AI Research)`

Type: AI research column.

Prompt the AI to do this work explicitly, with a structured output:

> Determine whether {{company_name}} ({{domain}}) operates a physical wet-lab, process development, or manufacturing facility in the United States, Canada, or Mexico. Check the company's own website (look for /about, /facilities, /locations, /contact pages) and recent press releases. For each NA address you find, tag what happens there: R&D wet-lab, process development, GMP manufacturing, QC, sales/admin only, or unclear. Return JSON: `{verdict: yes|no|unclear, na_sites: [{city, state, country, activity, source_url}], reasoning: "..."}`. If the only NA presence is sales/admin/HQ shell and all wet work is overseas, return verdict=no.

Output: structured verdict + citations.

### Column B: `NA Bench Job Postings (last 180 days)`

Extends the existing `Mfg & Process Job Openings` column. Instead of just yes/no, capture per-posting:
- title
- location (city, state, country)
- role family (upstream / downstream / formulation / cell line / MSAT / QC / other)

Filter: only count postings located in US/Canada/Mexico AND in a bench/mfg/PD role family.

Output: count of qualifying postings + a list of {title, location} tuples.

Source: Apollo job postings API (already in the toolkit) or LinkedIn jobs scrape via an Apify actor.

### Column C: `G3 Verdict (NA Wet-Lab Confirmed)`

A formula column that combines A and B:

| Column A verdict | Column B count | G3 Verdict |
|---|---|---|
| yes | any | confirmed |
| unclear | >= 1 | confirmed |
| no | >= 2 in bench/mfg roles | review (conflict... AI missed something) |
| no | 0 or 1 | excluded |
| unclear | 0 | needs human review |

This makes the gate auditable. Every company has a verdict + a reason + cited URLs.

---

## What this costs

- Column A is ~1 credit per row for AI research + page fetches. ~$0.01 per row at typical Clay pricing. 420 rows = ~$4 + some credits.
- Column B is a job-postings API call. Apollo includes it in plan. Marginal cost is roughly zero for Teknova's existing seat.
- Column C is free (formula).

Net: roughly $5 and an afternoon of prompt iteration to add an auditable G3 verdict to all 420 rows.

---

## Order of operations

1. Pick 10 rows where the modality verdict is already in (the ten ngAbs=yes rows). Run Column A on those manually first. Confirm the AI's verdict matches what you'd say if you read their facilities page yourself.
2. If the AI is right on 8+/10, run Column A across the full 420.
3. Add Column B (job postings with location + role family).
4. Add Column C (formula scoring).
5. Re-score the 10 confirmed-qualified accounts and see how many survive G3 under the new rule. That's the real list size.

---

## What this doesn't solve

The "wet-lab in NA" check still doesn't verify the lab does **antibody-relevant work**. A company could have a real US lab that does small-molecule chemistry only, and the modality classifier already said they're ngAbs developers. In practice these contradict each other rarely, so the combined verdict (G1 ngAbs=yes AND G3 NA wet-lab=confirmed) is probably enough.

If a contradiction shows up, route to human review rather than auto-excluding.
