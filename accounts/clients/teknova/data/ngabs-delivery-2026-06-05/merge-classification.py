#!/usr/bin/env python3
import csv, json, glob, os

D = "/Users/nplmini/code/work/accounts/clients/teknova/data/ngabs-delivery-2026-06-05"
recs = []
for f in sorted(glob.glob(os.path.join(D, "classify-batch-*.json"))):
    try:
        with open(f) as fh:
            data = json.load(fh)
        recs.extend(data if isinstance(data, list) else [data])
    except Exception as e:
        print(f"WARN could not parse {os.path.basename(f)}: {e}")

# Resilience pilot (done manually, confirmed)
recs.append({
    "company": "Resilience", "domain": "resilience.com",
    "has_ngabs_program": "yes", "role": "CDMO service provider",
    "modality_types": "bispecific antibodies, Fc-fusion proteins, non-cytotoxic conjugation",
    "evidence_quote": "From the Biologics page Product Types: mAbs, Enzymes, Fusion proteins, Bispecifics, Non-cytotoxic conjugation",
    "confidence": "high", "disqualifier_reason": "none",
    "na_site_verdict": "yes", "na_site_reasoning": "Four NA facilities: Blue Ash OH (HQ), Cincinnati OH, Philadelphia PA, Toronto ON; biologics PD + clinical/commercial mfg.",
    "na_sites": "Blue Ash OH (gmp_mfg); Cincinnati OH; Philadelphia PA; Toronto ON",
    "g3_verdict": "confirmed", "jobs_tiebreaker_needed": False,
})

from collections import Counter
g3 = Counter((r.get("g3_verdict","?") or "?") for r in recs)
print("total classified:", len(recs))
print("g3:", dict(g3))

print("\n--- NOT excluded (confirmed / needs_review) ---")
for r in recs:
    v = (r.get("g3_verdict","") or "")
    if v != "excluded":
        print(f"  [{v}] {r.get('company')} | prog={r.get('has_ngabs_program')} | NA={r.get('na_site_verdict')} | tiebreaker={r.get('jobs_tiebreaker_needed')}")
        print(f"        {(r.get('na_site_reasoning') or r.get('disqualifier_reason') or '')[:120]}")

print("\n--- jobs_tiebreaker_needed (candidates for paid Apollo job-postings check) ---")
for r in recs:
    if r.get("jobs_tiebreaker_needed"):
        print(f"  {r.get('company')} | prog={r.get('has_ngabs_program')} NA={r.get('na_site_verdict')} | {r.get('domain')}")

with open(os.path.join(D, "classify-results-merged.json"), "w") as fh:
    json.dump(recs, fh, indent=2)
print("\nmerged ->", os.path.join(D, "classify-results-merged.json"))
