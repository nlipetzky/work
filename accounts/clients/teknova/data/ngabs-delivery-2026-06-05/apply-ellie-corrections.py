#!/usr/bin/env python3
"""Apply Ellie Oleson's 2026-06-05 row-level corrections to the ngAbs confirmed set.
Reads the immutable source CSV, writes two outputs to the delivery folder.
No provider calls. Deterministic, index-keyed corrections.
"""
import csv

SRC = "/Users/nplmini/code/work/accounts/clients/teknova/data/ngAbs Companies-all.csv"
OUT_FULL = "/Users/nplmini/code/work/accounts/clients/teknova/data/ngabs-delivery-2026-06-05/ngabs-companies-corrected-2026-06-05.csv"
OUT_CLEAN = "/Users/nplmini/code/work/accounts/clients/teknova/data/ngabs-delivery-2026-06-05/ngabs-confirmed-clean-2026-06-05.csv"

# index -> (disposition, note, new_site_verdict_or_None)
CORR = {
    34:  ("DQ", "IL-15 fusion + CAR-NK + vaccines. No bispecific/multispecific/ADC. Fusion-protein-only out of scope.", "excluded"),
    134: ("DQ", "PEGylated microbial enzyme. Not an antibody at all.", "excluded"),
    177: ("DQ", "CAR T-cell. 'bispecific' string matched a CAR construct, not antibody.", "excluded"),
    226: ("DQ", "AAV gene therapy. Fc-fusion vocabulary tripped matcher.", "excluded"),
    168: ("DQ", "Monoclonal antibody work only, no bispecific/multispecific/ADC.", "excluded"),
    212: ("DQ + duplicate", "Literal duplicate row of Kashiv (also mAb-only DQ).", "excluded"),
    3:   ("consolidated into FUJIFILM Biotechnologies", "Acquired by FUJIFILM; already in list as FUJIFILM Biotechnologies.", "excluded"),
    138: ("consolidated into PCI Pharma Services", "No longer independent; is PCI Pharma Services.", "excluded"),
    157: ("consolidated into GenScript ProBio", "Duplicate of GenScript ProBio. NOTE: this row holds the contacts roster -- carry forward to survivor.", "excluded"),
    8:   ("tier-down", "Edge: primarily fill-finish/packaging CDMO; Simtra-type narrow/late-stage fit, only if it touches ADC drug product.", None),
    44:  ("tier-down", "Edge: sterile fill-finish, thinner Teknova basket (formulation buffers/water).", None),
    185: ("keep", "Parent of KBI Biopharma but different site (Rancho Cordova) and different work. Not a duplicate. Keep.", None),
    18:  ("keep", "Sub of SK pharmteco but different site (Durham) and different work. Not a duplicate. Keep.", None),
    220: ("keep", "Canonical for the ProBio dedupe; absorbs ProBio (row 157). Carry that row's contacts roster here.", None),
    1:   ("keep", "Ellie reviewed clean.", None),
    13:  ("keep", "Ellie reviewed clean.", None),
    29:  ("keep", "Ellie reviewed clean. Canonical AOC example (Avidity).", None),
    46:  ("keep", "Ellie reviewed clean.", None),
    64:  ("keep", "Ellie reviewed clean.", None),
    117: ("keep", "Ellie reviewed clean.", None),
    151: ("keep", "Ellie reviewed clean.", None),
    249: ("keep", "Ellie reviewed clean.", None),
}

with open(SRC, newline="", encoding="utf-8-sig") as f:
    reader = csv.DictReader(f)
    fields = [c.lstrip("﻿") for c in reader.fieldnames]
    rows = [{k.lstrip("﻿"): v for k, v in r.items()} for r in reader]

NEWCOLS = ["Review Disposition", "Review Note"]
out_fields = fields + NEWCOLS

dq = cons = tier = amb = keep = 0
for i, r in enumerate(rows):
    r["Review Disposition"] = ""
    r["Review Note"] = ""
    if i in CORR:
        disp, note, newsv = CORR[i]
        r["Review Disposition"] = disp
        r["Review Note"] = note
        if newsv is not None:
            r["Site Verdict"] = newsv
        if disp.startswith("DQ"): dq += 1
        elif disp.startswith("consolidated"): cons += 1
        elif disp == "tier-down": tier += 1
        elif disp.startswith("ambiguous"): amb += 1
        elif disp == "keep": keep += 1

with open(OUT_FULL, "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=out_fields)
    w.writeheader()
    w.writerows(rows)

clean = [r for r in rows if r.get("Site Verdict", "").strip() == "confirmed"]
with open(OUT_CLEAN, "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=out_fields)
    w.writeheader()
    w.writerows(clean)

# missing-contacts count on the clean survivors
no_contacts = sum(1 for r in clean if not (r.get("Contacts", "") or "").strip())
print(f"source rows: {len(rows)}")
print(f"applied: DQ={dq} consolidated={cons} tier-down={tier} ambiguous-flag={amb} keep-marked={keep}")
print(f"clean confirmed survivors: {len(clean)}")
print(f"  of those, missing contacts: {no_contacts}")
print(f"FULL audit -> {OUT_FULL}")
print(f"CLEAN list -> {OUT_CLEAN}")
