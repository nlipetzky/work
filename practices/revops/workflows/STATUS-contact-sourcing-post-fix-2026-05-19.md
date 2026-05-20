# Contact Sourcing + ICP Gate — Post-Fix Status (2026-05-19)

Workflow: `bYZ0sAzyUvU60wMZ` | versionId after deploy: `d15379e9-d659-4f10-8dc1-f557952b7552`

## Deploy method
Credential-preserving REST API PUT. Fetched full JSON (GET `/api/v1/workflows/bYZ0sAzyUvU60wMZ`), applied patches, PUT back. Read-back immediately after: 23 nodes, 22 connections, 10/10 credential bindings preserved. Workflow inactive — not triggered.

---

## Fix 1 — Employer normalization: DEPLOYED

Both nodes patched with recursive suffix stripping:

- `Email + Employer Verify` (f31e4503)
- `Apply LinkedIn Result` (36773da5)

New `norm()`:
```javascript
function norm(s){let r=(s||'').toString().toLowerCase().replace(/[^a-z0-9]/g,'');const sfx=/(inc|llc|ltd|corp|co|company|holdings|holding|plc|group|limited|international|therapeutics|bio|biosciences|pharma|pharmaceuticals)$/;let prev;do{prev=r;r=r.replace(sfx,'');}while(r!==prev);return r;}
```

Unit trace verified pre-deploy:
- `"MeiraGTx Holdings plc"` → `"meiragtx"` ✓ (was `"meiragtxholdingsplc"`)
- `"MeiraGTx, LLC"` → `"meiragtx"` ✓
- `"MeiraGTx"` → `"meiragtx"` ✓

---

## Fix 2 — Anthropic scoring all-zero: UPDATED DIAGNOSIS, OPERATOR ACTION REQUIRED

**The credential IS attached** (`anthropicApi:k6pMUap0` bound on Residual ICP Score). This is confirmed via REST GET.

**Root cause:** Anthropic API returned `invalid_request_error — "Your credit balance is too low to access the Anthropic API"` in exec 80786. This is a billing issue, not a credential issue.

**Required action:** Nick adds Anthropic billing credits at console.anthropic.com. No n8n UI action needed — the credential binding is correct.

Note: model in the node is `claude-sonnet-4-5`. If billing is added and scores remain 0, this model name may need updating to `claude-sonnet-4-6`.

---

## Fix 3 — 10 items lost (Apify concurrent runs): DEPLOYED

**Root cause confirmed:** `concurrent-runs-limit-exceeded` error in Apify contextData for exec 80786. The `run-sync-get-dataset-items` endpoint launches one actor run per item. 50 items sent in parallel exceeded Apify's concurrent run limit (25). 10 items hit the limit → 0 output → silently dropped from `Apply LinkedIn Result`.

**Drop node:** `Apify LinkedIn Verify` (stored in contextData, not runData). All 50 items had valid linkedin URLs — this was not an empty-query issue.

**Fix applied:** `batchSize: 1, batchInterval: 200` added to Apify LinkedIn Verify options. Serializes actor launches — max 1 concurrent run. At ~10s/profile, 50 profiles ≈ 8-9 min total. Acceptable for manual-trigger workflow.

---

## Fix 4 — Upsert blank-email collision: DEPLOYED

`Prepare Contacts Upsert` (ab2306af): skip condition changed from:
```javascript
if (!d.fullName && !d.email) continue;
```
to:
```javascript
if (!d.email) continue;
```

---

## Additional finding — Apollo exhausted

Apollo People Match returned empty body for all 50 MeiraGTx prospects in exec 80786 (confirmed via contextData). Apollo credits are exhausted (per project_provider_status.md). With Apollo returning nothing, `apolloEmployer = ''` for all → `apMatch = false` for all → all 50 needed LinkedIn tiebreak. After Fix 1, employer confirmation will come from LinkedIn match alone (sourceCount=1 when LI confirms).

---

## STOP GATE — Authorization required before re-run

All code fixes are deployed and verified. The next live run is a paid Explorium fetch. Do NOT trigger until:

1. **Fix 2:** Nick adds Anthropic billing credits (console.anthropic.com → Plans & Billing).
2. **Nick explicitly authorizes** the MeiraGTx-only re-run in this session.

Scope constraint: MeiraGTx only (~50 prospects, 1 company). Workflow stays inactive/manual-trigger-only until Nick confirms.

---

## What to verify post-run

- `tblWJksRL1yKSUgrm` has MeiraGTx contacts written
- `Employer Match Confirmed` > 0 (Fix 1 effect)
- `ICP Score` non-zero for VP/Director/SVP R&D (Fix 2 effect — requires billing credits)
- Upsert Contacts to Airtable appears in runData with > 0 items written (Fix 4 effect)
- Apply LinkedIn Result item count = Apply Score + Map item count (Fix 3 effect — no more 50→40 drop)
- Total chain: 50 Explorium prospects → 50 through Apply Score + Map (no silent drop)

---

## Surface verification pending

Report filed for independent surface verification via agentic-systems. Do not self-certify.
