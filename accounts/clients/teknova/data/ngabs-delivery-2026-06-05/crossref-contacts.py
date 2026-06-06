#!/usr/bin/env python3
"""Cross-reference the 76 clean confirmed companies against the existing contacts file.
Answers: of the companies that looked empty in the companies CSV, how many already
have contacts here? No providers. Read-only.
"""
import csv

CLEAN = "/Users/nplmini/code/work/accounts/clients/teknova/data/ngabs-delivery-2026-06-05/ngabs-confirmed-clean-2026-06-05.csv"
CONTACTS = "/Users/nplmini/code/work/accounts/clients/teknova/data/ngAbs Contacts-all.csv"

def load(path):
    with open(path, newline="", encoding="utf-8-sig") as f:
        r = csv.DictReader(f)
        return [{k.lstrip("﻿"): v for k, v in row.items()} for row in r]

clean = load(CLEAN)
contacts = load(CONTACTS)

def norm(s): return (s or "").strip().lower()
def normdom(s):
    s = norm(s).replace("https://","").replace("http://","").replace("www.","")
    return s.split("/")[0]

# index contacts by company name and by domain
from collections import defaultdict
by_name = defaultdict(list)
by_dom = defaultdict(list)
for c in contacts:
    by_name[norm(c.get("Company Table Data"))].append(c)
    by_dom[normdom(c.get("Company Domain"))].append(c)

def has_email(c): return bool((c.get("Work Email") or c.get("Validate Email") or "").strip())

empty_in_companies = []  # blank Contacts col in companies CSV
for r in clean:
    if not (r.get("Contacts","") or "").strip():
        empty_in_companies.append(r)

print(f"clean confirmed: {len(clean)}")
print(f"  blank 'Contacts' in companies CSV: {len(empty_in_companies)}")

really_empty = []
covered = []
for r in empty_in_companies:
    nm = norm(r.get("Company Name"))
    dm = normdom(r.get("Domain"))
    matches = by_name.get(nm, []) or by_dom.get(dm, [])
    if matches:
        n_email = sum(1 for m in matches if has_email(m))
        covered.append((r.get("Company Name"), len(matches), n_email))
    else:
        really_empty.append(r.get("Company Name"))

print(f"\n  of those, ALREADY have contacts in contacts file: {len(covered)}")
print(f"  genuinely have ZERO contacts anywhere: {len(really_empty)}")

print("\n--- already covered (company | #contacts | #with email) ---")
for nm, n, e in sorted(covered, key=lambda x:-x[1]):
    print(f"  {nm} | {n} | {e}")

print("\n--- genuinely empty (need sourcing) ---")
for nm in really_empty:
    print(f"  {nm}")
