# ngAbs Classification Brief (free-fetch reproduction of the Clay pipeline)

You classify biotech/pharma companies for Teknova's next-generation-antibody (ngAbs) outreach.
Reproduce two Clay AI steps using ONLY free web research. HARD RULE: do not call any paid
provider. No Apollo, no Exa, no Crustdata, no Deepline credits, no Apify. Use ONLY the
context-mode fetch tool `ctx_fetch_and_index` (free) and, if needed, `ctx_search` over what you
fetched. If a site is unreachable, record that and move on. Do not spend money.

For each company you are given (name + domain):

## Step 1 — Program check (Clay "Research company ICP with AI")

Fetch the company site (homepage, then whatever of these exist: /pipeline, /platform,
/technology, /services, /capabilities, /about, /products, recent press). Determine whether the
company develops, manufactures, or provides contract services for any antibody-based
next-generation-antibody program. In-scope modalities:
- Bispecific antibodies, Multispecific antibodies, Trispecific antibodies
- Antibody-drug conjugates (ADCs), Bispecific ADCs
- Fc-fusion proteins
- Antibody fragments (scFv, Fab, VHH, nanobodies), BiTEs
- Immunocytokines, Radioimmunoconjugates (RDCs)
- ANTIBODY OLIGONUCLEOTIDE CONJUGATES (AOCs)  <-- added per client; treat AOC, "antibody
  oligonucleotide conjugate", "radioconjugate/RDC", "immunocytokine" as in-scope conjugate signals.

Return "no" if the company is purely one of: small-molecule developer; gene-therapy-only with
no antibody program; cell-therapy-only with no antibody program; AI/computational-discovery-only
with no wet lab; reagent/media supplier (competitor); distributor or pure CRO with no antibody
bioprocessing; vaccine-only; diagnostics-only; peptide-only CDMO.

NEGATIVE CONSTRAINTS (client-supplied false-positive patterns — do NOT let these trip a "yes"):
- "fusion protein"/"Fc" alone on a non-antibody product (e.g. IL-15 superagonist) -> not qualifying
- "conjugate"/"PEG" on a PEGylated enzyme or non-antibody -> not qualifying
- "bispecific" modifying a CAR / cell-therapy construct -> not qualifying
- "aflibercept/anti-VEGF/Fc" on an AAV gene-therapy vector product -> not qualifying
Require the signal to be tied to a genuine antibody-based molecule or service, not vocabulary overlap.

Output fields:
- has_ngabs_program: "yes" | "no" | "unclear" (unclear ONLY if the site truly lacks info to decide)
- programs: named programs/platforms/services tied to ngAbs, or "none disclosed"
- modality_types: comma-separated from the in-scope set above, or "none"
- role: "developer" | "CDMO service provider" | "platform company" | "academic" | "not applicable"
- evidence_quote: a verbatim quote from a specific page, prefixed with the page label,
  e.g. From the Biologics page: "..."; or "no evidence found" only if site inaccessible
- disqualifier_reason: the DQ category if has_ngabs_program is "no", else "none"
- confidence: "high" | "medium" | "low"

## Step 2 — North American site check (Clay "NA Site Classification")

ONLY run if has_ngabs_program == "yes". Fetch /about, /locations, /facilities, /sites,
/contact, /manufacturing, /careers as available. Find every physical site in North America
(US, Canada, Mexico) and classify each: rnd_wetlab, process_dev, gmp_mfg, qc_analytical,
sales_admin, or unclear. HQ alone (sales_admin only) does NOT qualify.

Output fields:
- na_site_verdict: "yes" (>=1 site tagged rnd_wetlab, process_dev, or gmp_mfg in NA) |
  "no" (no NA sites, or only sales_admin) | "unclear" (insufficient evidence)
- na_site_reasoning: 1-2 sentences
- na_sites: short list like "Philadelphia PA (gmp_mfg); Toronto ON (process_dev)"

If has_ngabs_program != "yes", set na_site_verdict="n/a", na_site_reasoning="program gate not passed", na_sites="".

## Step 3 — Provisional G3 verdict (you compute this)

- has_ngabs_program == "no"            -> g3="excluded"
- program "yes" AND na_site "yes"      -> g3="confirmed"
- program "yes" AND na_site "unclear"  -> g3="needs_review"  (flag: jobs_tiebreaker_needed=true)
- program "yes" AND na_site "no"       -> g3="excluded"       (flag: jobs_tiebreaker_needed=true)
- has_ngabs_program == "unclear"       -> g3="needs_review"
Add field jobs_tiebreaker_needed: true|false (true only in the two flagged cases above; the
paid Apollo job-postings check would later break the tie).

## Output

Write a JSON array (one object per company, all fields above plus company + domain) to the
output file path given in your task. Print only a one-line summary to chat (counts by g3).
Do NOT paste full records into chat.
