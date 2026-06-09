#!/usr/bin/env python3
"""Import-ready CSV for the AUTHORITATIVE RevOps Surface 'Contacts' table
(appYBYH3aOHhTODAw/tblWJksRL1yKSUgrm). Headers = that table's exact field names.
Labels every new contact Discovery Sources = Apollo. Drops the 4 departed."""
import csv
D="/Users/nplmini/code/work/accounts/clients/teknova/data/ngabs-delivery-2026-06-05"
SRC=f"{D}/ngabs-new-contacts-2026-06-05.csv"
OUT=f"{D}/ngabs-contacts-revops-surface-import-2026-06-05.csv"

def email_status(v):
    v=(v or "").strip().lower()
    if "deliverable" in v or v=="valid": return "valid"
    if "undeliverable" in v or "invalid" in v: return "invalid"
    if any(x in v for x in ("risky","accept_all","catch","accept-all")): return "catchall"
    return ""  # no email / unknown

def emp_status(v):
    v=(v or "").strip().lower()
    if v=="verified": return "verified"
    if v=="unconfirmed": return "pending"
    return "pending"

FUNC={"process_mfg":"Process/Manufacturing","rnd_science":"R&D/Science","procurement":"Procurement"}

def split_loc(loc):
    parts=[p.strip() for p in (loc or "").split(",") if p.strip()]
    city=parts[0] if parts else ""
    region=parts[1] if len(parts)>1 else ""
    return city, region

HEADERS=["Full Name","First Name","Last Name","Title","Company Name","Company Domain",
         "LinkedIn URL","Email","Email Verified Status","Employment Verification Status",
         "Function","City","State/Region","Discovery Sources"]

rows=list(csv.DictReader(open(SRC, encoding="utf-8-sig")))
out=[]; dropped=0
from collections import Counter
es=Counter()
for r in rows:
    if (r.get("Deliver Status","") or "").strip()=="drop_moved" or (r.get("Employment Verification State","") or "").strip().lower()=="moved":
        dropped+=1; continue
    city,region=split_loc(r.get("Location",""))
    ev=email_status(r.get("Validate Email","")); es[ev or "(blank)"]+=1
    out.append({
        "Full Name": r.get("Full Name","") or (r.get("First Name","")+" "+r.get("Last Name","")).strip(),
        "First Name": r.get("First Name",""),
        "Last Name": r.get("Last Name",""),
        "Title": r.get("Job Title",""),
        "Company Name": r.get("Company Table Data",""),
        "Company Domain": r.get("Company Domain",""),
        "LinkedIn URL": r.get("LinkedIn Profile",""),
        "Email": r.get("Work Email",""),
        "Email Verified Status": ev,
        "Employment Verification Status": emp_status(r.get("Employment Verification State","")),
        "Function": FUNC.get((r.get("Committee Scope","") or "").strip(), ""),
        "City": city,
        "State/Region": region,
        "Discovery Sources": "apollo_ngabs",
    })

with open(OUT,"w",newline="",encoding="utf-8") as f:
    w=csv.DictWriter(f, fieldnames=HEADERS); w.writeheader(); w.writerows(out)

print("source:", len(rows), "| dropped departed:", dropped, "| import rows:", len(out))
print("Email Verified Status:", dict(es))
print("Discovery Sources: Apollo on all", len(out))
print("output ->", OUT)
