#!/usr/bin/env python3
"""Recompute g3 from program+NA fields, merge batches + Resilience, and fold the
reclassified verdicts into the corrected companies table. No providers."""
import csv, json, glob, os

D = "/Users/nplmini/code/work/accounts/clients/teknova/data/ngabs-delivery-2026-06-05"
FULL_IN = os.path.join(D, "ngabs-companies-corrected-2026-06-05.csv")
FULL_OUT = os.path.join(D, "ngabs-companies-corrected-2026-06-05.csv")  # overwrite our own working copy
CLEAN_OUT = os.path.join(D, "ngabs-confirmed-clean-2026-06-05.csv")

recs = []
for f in sorted(glob.glob(os.path.join(D, "classify-batch-*.json"))):
    with open(f) as fh:
        data = json.load(fh)
    recs.extend(data if isinstance(data, list) else [data])
recs.append({
    "company":"Resilience","domain":"resilience.com","has_ngabs_program":"yes",
    "role":"CDMO service provider",
    "modality_types":"bispecific antibodies, Fc-fusion proteins, non-cytotoxic conjugation",
    "evidence_quote":"From the Biologics page Product Types: mAbs, Enzymes, Fusion proteins, Bispecifics, Non-cytotoxic conjugation",
    "confidence":"high","disqualifier_reason":"none","na_site_verdict":"yes",
    "na_site_reasoning":"Four NA facilities: Blue Ash OH (HQ), Cincinnati OH, Philadelphia PA, Toronto ON; biologics PD + clinical/commercial mfg.",
    "na_sites":"Blue Ash OH (gmp_mfg); Cincinnati OH; Philadelphia PA; Toronto ON",
})

def g3_of(r):
    p=(r.get("has_ngabs_program","") or "").strip().lower()
    na=(r.get("na_site_verdict","") or "").strip().lower()
    if p=="no": return "excluded"
    if p=="yes" and na=="yes": return "confirmed"
    if p=="yes" and na=="unclear": return "needs_review"
    if p=="yes" and na=="no": return "excluded"
    if p=="unclear": return "needs_review"
    return "needs_review"

for r in recs: r["g3"]=g3_of(r)
from collections import Counter
print("recomputed g3:", dict(Counter(r["g3"] for r in recs)))

def normdom(s):
    s=(s or "").strip().lower().replace("https://","").replace("http://","").replace("www.","")
    return s.split("/")[0]
by_dom={normdom(r.get("domain")):r for r in recs}

with open(FULL_IN, newline="", encoding="utf-8-sig") as f:
    rd=csv.DictReader(f); fields=[c.lstrip("﻿") for c in rd.fieldnames]
    rows=[{k.lstrip("﻿"):v for k,v in row.items()} for row in rd]

for c in ["Reclassify Verdict","Reclassify Evidence"]:
    if c not in fields: fields.append(c)

applied=0
for row in rows:
    if (row.get("Site Verdict","") or "").strip()!="pending":
        row.setdefault("Reclassify Verdict",""); row.setdefault("Reclassify Evidence","")
        continue
    m=by_dom.get(normdom(row.get("Domain")))
    row.setdefault("Reclassify Verdict",""); row.setdefault("Reclassify Evidence","")
    if not m: continue
    applied+=1
    row["Site Verdict"]=m["g3"]
    row["Reclassify Verdict"]=m["g3"]
    row["Reclassify Evidence"]=(m.get("evidence_quote") or m.get("na_site_reasoning") or m.get("disqualifier_reason") or "")[:300]
    # enrich the promoted ones so the record is delivery-complete
    if m["g3"] in ("confirmed","needs_review"):
        if (m.get("has_ngabs_program") or "").strip(): row["Has ngAbs Program"]=m["has_ngabs_program"]
        if (m.get("modality_types") or "").strip(): row["Modality Types"]=m["modality_types"]
        if (m.get("role") or "").strip(): row["Role"]=m["role"]
        if (m.get("evidence_quote") or "").strip(): row["Evidence Quote"]=m["evidence_quote"]
        if (m.get("confidence") or "").strip(): row["Confidence"]=m["confidence"]
        if (m.get("na_sites") or "").strip(): row["NA Site Classification"]=m["na_sites"]

with open(FULL_OUT,"w",newline="",encoding="utf-8") as f:
    w=csv.DictWriter(f,fieldnames=fields); w.writeheader(); w.writerows(rows)
clean=[r for r in rows if (r.get("Site Verdict","") or "").strip()=="confirmed"]
with open(CLEAN_OUT,"w",newline="",encoding="utf-8") as f:
    w=csv.DictWriter(f,fieldnames=fields); w.writeheader(); w.writerows(clean)

print("rows reclassified:", applied)
print("confirmed total now:", len(clean))
nr=[r for r in rows if (r.get("Site Verdict","") or "").strip()=="needs_review"]
print("needs_review total now:", len(nr))
for r in nr:
    print("  needs_review:", r.get("Company Name"), "|", (r.get("Reclassify Evidence","") or "")[:80])
