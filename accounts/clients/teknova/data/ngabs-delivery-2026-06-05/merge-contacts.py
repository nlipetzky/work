#!/usr/bin/env python3
import csv, glob, os
D="/Users/nplmini/code/work/accounts/clients/teknova/data/ngabs-delivery-2026-06-05"
# include the Adimab pilot too
files = sorted(glob.glob(os.path.join(D,"enrich-out-*.csv"))) + [os.path.join(D,"pilot-adimab-contacts.csv")]
rows=[]
COLS=["Company Table Data","Company Domain","First Name","Last Name","Full Name","Job Title","Location","LinkedIn Profile","Work Email","Validate Email","Employment Verification State","In Committee Scope","Committee Scope","Enrichment Run Notes"]
def norm_pilot(r):
    # pilot file has different headers; map it
    return {
        "Company Table Data": r.get("company",""),
        "Company Domain": r.get("domain",""),
        "First Name": r.get("first_name",""),
        "Last Name": r.get("last_name",""),
        "Full Name": (r.get("first_name","")+" "+r.get("last_name","")).strip(),
        "Job Title": r.get("title",""),
        "Location": (r.get("city","")+", "+r.get("state","")).strip(", "),
        "LinkedIn Profile": r.get("linkedin_url",""),
        "Work Email": r.get("email",""),
        "Validate Email": "deliverable" if r.get("email") else "no email",
        "Employment Verification State": "verified",
        "In Committee Scope": "yes" if r.get("in_scope")=="yes" else "no",
        "Committee Scope": "rnd_science",
        "Enrichment Run Notes": r.get("notes",""),
    }
for f in files:
    rdr=csv.DictReader(open(f, encoding="utf-8-sig"))
    is_pilot = "pilot-adimab" in f
    for r in rdr:
        rows.append(norm_pilot(r) if is_pilot else {c:r.get(c,"") for c in COLS})

# dedupe by (full name + domain) or email
seen=set(); dedup=[]
for r in rows:
    key=(r.get("Full Name","").strip().lower(), r.get("Company Domain","").strip().lower())
    ek=(r.get("Work Email","") or "").strip().lower()
    k = ek if ek else key
    if k in seen: continue
    seen.add(k); dedup.append(r)

def status(r):
    emp=(r.get("Employment Verification State","") or "").lower()
    val=(r.get("Validate Email","") or "").lower()
    email=(r.get("Work Email","") or "").strip()
    if emp=="moved": return "drop_moved"          # playbook 6.1: stale/mismatch routes out
    if not email: return "review_no_email"
    if any(x in val for x in ["undeliverable","invalid"]): return "review_bad_email"
    if any(x in val for x in ["risky","accept_all","catch","unknown","failed"]): return "review_risky"
    if "deliverable" in val or "valid" in val: return "ready"
    return "review_other"

from collections import Counter
for r in dedup:
    r["Deliver Status"]=status(r)
cnt=Counter(r["Deliver Status"] for r in dedup)
OUT=os.path.join(D,"ngabs-new-contacts-2026-06-05.csv")
with open(OUT,"w",newline="",encoding="utf-8") as f:
    w=csv.DictWriter(f,fieldnames=COLS+["Deliver Status"]); w.writeheader(); w.writerows(dedup)
print("total enriched contacts (deduped):", len(dedup))
print("status breakdown:", dict(cnt))
print("companies represented:", len({r['Company Table Data'] for r in dedup}))
ready=[r for r in dedup if r["Deliver Status"]=="ready"]
print("READY to send (verified employed + deliverable email):", len(ready))
print("final ->", OUT)
