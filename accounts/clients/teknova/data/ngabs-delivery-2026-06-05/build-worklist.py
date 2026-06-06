#!/usr/bin/env python3
import json, glob, os
D="/Users/nplmini/code/work/accounts/clients/teknova/data/ngabs-delivery-2026-06-05"
recs=[]
for f in sorted(glob.glob(os.path.join(D,"contacts-discovery-*.json"))):
    recs.extend(json.load(open(f)))

def rank(title):
    t=(title or "").lower()
    if any(k in t for k in ["chief","cso","cto","vp","vice president","head","president"]): return 0
    if any(k in t for k in ["senior director","sr director","sr. director","executive director"]): return 1
    if "director" in t: return 2
    if any(k in t for k in ["associate director","principal","senior manager","senior scientist","sr scientist"]): return 3
    if any(k in t for k in ["manager","scientist","lead"]): return 4
    return 5

from collections import defaultdict
bycomp=defaultdict(list)
for r in recs:
    if r.get("in_scope"):
        bycomp[r["company"]].append(r)

CAP=8
worklist=[]
for c,rows in bycomp.items():
    rows.sort(key=lambda r: rank(r.get("title","")))
    for r in rows[:CAP]:
        worklist.append({k:r.get(k) for k in ["company","domain","apollo_id","first_name","last_name_masked","title","bucket"]})

json.dump(worklist, open(os.path.join(D,"enrich-worklist.json"),"w"), indent=2)
print("companies:", len(bycomp))
print("worklist size (<=8/company):", len(worklist))
# print per-company kept count
for c,rows in sorted(bycomp.items(), key=lambda x:-len(x[1])):
    print(f"  {c[:38]:40} kept {min(CAP,len(rows))} of {len(rows)}")
