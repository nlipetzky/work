#!/usr/bin/env python3
"""Transform the new-contacts CSV into an import-ready file for the Teknova Outreach
base 'ngAbs Contacts' table (appFoLY6hjroyA2KW/tblJrUoGbmbXDwfY3). Headers match the
table field names exactly; select values mapped to existing options; departed dropped."""
import csv
D="/Users/nplmini/code/work/accounts/clients/teknova/data/ngabs-delivery-2026-06-05"
SRC=f"{D}/ngabs-new-contacts-2026-06-05.csv"
OUT=f"{D}/ngabs-contacts-import-ready-2026-06-05.csv"

def map_validate(v):
    v=(v or "").strip().lower()
    if "deliverable" in v or "valid" in v: return "✅ Valid email"
    if "undeliverable" in v or "invalid" in v: return "❌ Invalid email"
    return ""  # risky / accept_all / catch-all / unknown / no email -> blank (unconfirmed)

def map_empstate(v, has_li):
    v=(v or "").strip().lower()
    if v=="verified": return "verified"
    if v=="unconfirmed": return "pending"
    if v in ("no_profile","") : return "no_profile" if not has_li else "pending"
    return "pending"

HEADERS=["Full Name","First Name","Last Name","Job Title","Location","Company Domain",
         "LinkedIn Profile","Work Email","Validate Email","Employment Verification State",
         "In Committee Scope","Company Table Data"]

rows=list(csv.DictReader(open(SRC, encoding="utf-8-sig")))
out=[]
dropped=0
from collections import Counter
vstats=Counter()
for r in rows:
    if (r.get("Deliver Status","") or "").strip()=="drop_moved" or (r.get("Employment Verification State","") or "").strip().lower()=="moved":
        dropped+=1; continue
    li=(r.get("LinkedIn Profile","") or "").strip()
    ve=map_validate(r.get("Validate Email",""))
    vstats[ve or "(blank)"]+=1
    out.append({
        "Full Name": (r.get("Full Name","") or (r.get("First Name","")+" "+r.get("Last Name","")).strip()),
        "First Name": r.get("First Name",""),
        "Last Name": r.get("Last Name",""),
        "Job Title": r.get("Job Title",""),
        "Location": r.get("Location",""),
        "Company Domain": r.get("Company Domain",""),
        "LinkedIn Profile": li,
        "Work Email": r.get("Work Email",""),
        "Validate Email": ve,
        "Employment Verification State": map_empstate(r.get("Employment Verification State",""), bool(li)),
        "In Committee Scope": "checked" if (r.get("In Committee Scope","") or "").strip().lower()=="yes" else "",
        "Company Table Data": r.get("Company Table Data",""),
    })

with open(OUT,"w",newline="",encoding="utf-8") as f:
    w=csv.DictWriter(f, fieldnames=HEADERS); w.writeheader(); w.writerows(out)

print("source rows:", len(rows))
print("dropped (departed):", dropped)
print("import-ready rows:", len(out))
print("Validate Email mapping:", dict(vstats))
print("distinct companies:", len({r['Company Table Data'] for r in out}))
print("output ->", OUT)
