# Gap 1: NA Wet-Lab Verification -- Implementation Steps

**Goal:** Add a G3 Verdict column that says "this company has a real wet-lab / PD / mfg site in North America" with cited evidence, so the playbook's G3 gate stops being trust-the-HQ-address.

**Inputs you already have:**
- `Lab & Process Job Openings` column with `Job Count` output (NA-scoped, 180-day window, bench/PD/mfg roles)
- `Country`, `HQ_STATE`, `HQ_CITY` (HQ-only, not site-level)
- `Name`, `Domain`, `LinkedIn URL`

**What you're adding:**
- 1 new AI research column (facilities page intelligence)
- 1 new formula column (G3 Verdict)

The job postings column is the second signal; you don't build a new one for it.

---

## Column 1: `NA Wet-Lab Sites (AI Research)`

### Setup

1. In the company table, scroll to the right edge → **+ Add column**
2. Search for **Use AI** → select it. If Clay offers multiple AI flavors, pick the one labeled "AI Web Search" or "Research with AI" (whichever variant has web browsing enabled). If only one Use AI exists, use it and explicitly instruct the model to search the web in the prompt.
3. Name the column: `NA Wet-Lab Sites (AI Research)`
4. Model: Claude Sonnet (default is fine; web research benefits from Claude or GPT-4 class)
5. Output format: **JSON** (single output) -- this lets you drill into subfields later

### Prompt

Paste this as the AI prompt body. Reference columns with `/` and pick from the column picker (Clay will replace with `{{Name}}` etc.).

```
You are verifying whether a company has a physical wet-lab, process development, or GMP manufacturing site in North America (United States, Canada, or Mexico).

Company: {{Name}}
Domain: {{Domain}}
LinkedIn URL: {{LinkedIn URL}}
Stated HQ: {{HQ_CITY}}, {{HQ_STATE}}, {{Country}}

Your task:

1. Search the company's own website. Specifically look for pages at /about, /facilities, /locations, /contact, /sites, /careers. If the domain has a subdomain for biotech operations (e.g., biotech.fujifilm.com), check that too.

2. Search for recent press releases or news (last 3 years) mentioning lab openings, facility expansions, GMP suites, or square footage announcements in NA.

3. Check FDA's establishment registration if the company manufactures drug substance for US human use. A US-registered facility is strong evidence of GMP manufacturing.

For each North American address you identify, categorize the activity:
- "rnd_wetlab" = research / discovery wet-lab
- "process_dev" = process development / PD
- "gmp_mfg" = GMP manufacturing or fill/finish
- "qc_analytical" = QC, analytical, environmental monitoring
- "sales_admin" = sales office, HQ shell, corporate admin only
- "unclear" = address listed but activity not stated

Return verdict:
- "yes" if at least one NA address is rnd_wetlab, process_dev, gmp_mfg, or qc_analytical
- "no" if the only NA presence is sales_admin or if the company has no NA presence at all
- "unclear" if you found NA addresses but cannot confirm what happens there

Return strictly this JSON shape, no other text:

{
  "verdict": "yes" | "no" | "unclear",
  "na_sites": [
    {
      "city": "string",
      "state": "string",
      "country": "United States" | "Canada" | "Mexico",
      "activity": "rnd_wetlab" | "process_dev" | "gmp_mfg" | "qc_analytical" | "sales_admin" | "unclear",
      "source_url": "string"
    }
  ],
  "reasoning": "one to three sentences explaining the verdict, citing what you found"
}

If you find no information, return verdict "unclear" with empty na_sites and reasoning explaining what you searched.
```

### Run settings

- **Auto-run:** off initially (you'll trigger manually for validation). Turn on after the validation run in the next section.
- **Only run if:** add condition `Has ngAbs Program is yes` -- there is no value verifying the wet-lab for companies the modality classifier already disqualified.

### Drill out subfields

Once the column has run on 1-2 rows, hover over the JSON output → drill into `verdict` → click **Add as column**. This creates `NA Wet-Lab Sites: verdict` as a clean text column. Do the same for `reasoning`. Leave `na_sites` as a nested array on the parent column (it's a list, can't be flattened to one cell cleanly).

---

## Column 2: `G3 Verdict` (formula)

### Setup

1. **+ Add column** → **Formula**
2. Name: `G3 Verdict`
3. Output type: Text

### Formula

```
=IF(
  {{NA Wet-Lab Sites: verdict}} = "yes",
  "confirmed",
  IF(
    AND({{NA Wet-Lab Sites: verdict}} = "unclear", {{Job Count}} >= 1),
    "confirmed",
    IF(
      AND({{NA Wet-Lab Sites: verdict}} = "no", {{Job Count}} >= 2),
      "needs_review",
      IF(
        AND({{NA Wet-Lab Sites: verdict}} = "unclear", {{Job Count}} = 0),
        "needs_review",
        IF(
          {{NA Wet-Lab Sites: verdict}} = "no",
          "excluded",
          "pending"
        )
      )
    )
  )
)
```

Replace `{{Job Count}}` with the exact column name from your `Lab & Process Job Openings` output (it may be `Lab & Process Job Openings: Job Count` in your table).

### What it does

| AI verdict | Job count | G3 Verdict | Why |
|---|---|---|---|
| yes | any | confirmed | AI found a wet-lab address; nothing to argue with |
| unclear | >= 1 | confirmed | AI was hesitant but the company is hiring bench scientists in NA -- the lab exists |
| unclear | 0 | needs_review | No address evidence and no hiring signal; could be a small private company or could be a dead lead. Surface for human eyes. |
| no | >= 2 | needs_review | AI says no NA lab but the company is hiring multiple NA bench scientists. Conflict; AI may have missed something. Surface for human eyes. |
| no | 0 or 1 | excluded | No address evidence and ≤1 NA bench posting (could be a remote-only role). Drop. |
| anything else | | pending | Catch-all if the AI column hasn't run yet |

---

## Validation before turning on auto-run

Don't bulk-run the AI column on all 420 rows yet. Validate on a curated subset first.

**Run on these 5 rows manually** (right-click row → **Run column on this row**):

1. **FUJIFILM Biotechnologies** -- known to have a large GMP suite in Morrisville NC. Expected verdict: yes.
2. **Piramal Pharma Solutions** -- known Lexington KY ADC facility. Expected verdict: yes.
3. **Seagen** -- Bothell WA antibody R&D + mfg site (now Pfizer-owned but site is real). Expected verdict: yes.
4. **Insilico Medicine** -- AI-discovery company, Boston address is small office, no wet-lab. Expected verdict: no.
5. **Recursion** -- already classified as "no" on ngAbs but has a real Salt Lake City wet-lab. Should not run (gated by `Only run if`). Verify the gate works.

**Pass criteria:**
- 3 of 3 "yes" expected returned "yes"
- Insilico returned "no" with sales_admin tag
- Recursion didn't run (Only run if blocked it)
- Each "yes" verdict cites a real URL you can open

**If any fail:**
- AI returned "unclear" for a known-good company: prompt may need a stronger search hint. Add to prompt: "Start by fetching {{Domain}}/about and {{Domain}}/locations -- these are the highest-value pages."
- AI returned "yes" for Insilico: tighten the sales_admin distinction. Add: "If the only NA evidence is a single small office and the company explicitly markets itself as AI-driven or computational, default activity to sales_admin."
- AI's source URL is hallucinated (doesn't actually load): switch model from default to one with browsing tools confirmed enabled, or add: "Only return source_url values that you actually fetched and read. If you did not fetch a URL, leave source_url empty."

Iterate prompt until 5/5 pass, then enable auto-run on the AI column.

---

## Order of operations

1. Add Column 1 (AI research). Set Only run if to `Has ngAbs Program is yes`.
2. Run manually on the 5 validation rows.
3. Iterate prompt until 5/5 pass.
4. Drill out `verdict` and `reasoning` subfields.
5. Add Column 2 (G3 Verdict formula).
6. Confirm formula evaluates correctly on the 5 validation rows (3 confirmed, 1 excluded, 1 pending).
7. Turn on auto-run for Column 1.
8. Trigger the existing `Lab & Process Job Openings` column on any classified rows missing it (per job-postings debug plan).
9. Sort the table by `G3 Verdict` and confirm the qualified set looks right.

---

## What you'll see after

For the 10 currently-qualified rows (ngAbs=yes + high confidence):

| Company | Likely G3 Verdict |
|---|---|
| Piramal Pharma Solutions | confirmed |
| FUJIFILM Biotechnologies | confirmed |
| FUJIFILM Diosynth | confirmed |
| AGC Biologics | confirmed |
| Seagen | confirmed (if LinkedIn URL alive) or needs_review |
| Curia | confirmed |
| Hovione | needs_review (East Windsor NJ exists but is smaller; AI may flag as unclear) |
| PCI Pharma Services | confirmed |
| Exelixis | confirmed |
| Summit Therapeutics | needs_review (smaller company; depends on AI finding their PD site) |

So you go from "10 qualified by modality alone" to "~7 fully gate-cleared, 2-3 needing eyeball review." That's the playbook delivered, not estimated.

---

## Cost

- Column 1: ~$0.02 per row with web search enabled, ~$8 for ~400 ngAbs-yes-or-unclear rows. Currently only 15 are classified, so initial cost is ~$0.30.
- Column 2: free.
- Validation: 5 rows × $0.02 = $0.10.

Total to ship Gap 1: under $10 in Clay credits.
