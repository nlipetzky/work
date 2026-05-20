# Contact Sourcing — Downstream Fixes Plan (post-80786)

> For the Workflows lane. The enum-filter fix is PROVEN (exec 80786: MeiraGTx 0→50 prospects, persona fields flowing). This plan clears the four downstream blockers found on the first full chain run. None are regressions. Self-contained; surface-verify, do not self-certify.

**Workflow:** `bYZ0sAzyUvU60wMZ`. Base `appYBYH3aOHhTODAw`, Contacts `tblWJksRL1yKSUgrm`.

## Hard constraints
- **Deploy path:** use the credential-preserving REST API PUT (capture full workflow JSON first, verify node count + connections immediately after — a malformed PUT replaces the whole workflow). Do NOT use n8n-mcp `update_workflow` (wipes creds). Code-only edits via REST PUT must NOT disturb credentials.
- **Re-running is a paid Explorium fetch. STOP gate.** Apply all fixes, then surface to Nick (via agentic-systems) for explicit authorization before the next live run. Scope stays MeiraGTx only.
- Patient-facing disqualifier: unchanged — accept the gap, do not edit any persona row.
- Raw read-back after deploy. Verify on the surface.

## Fix 1 — Employer normalization (Findings 1; also unblocks Apollo/LinkedIn match)
`norm()` does not strip `holdings|plc|group|limited|international`, so `"meiragtx holdings plc"` ≠ `"meiragtx"` and every employer check fails. `norm()` is defined in TWO nodes — fix BOTH or the LinkedIn tiebreak still fails:
- `Email + Employer Verify` (id `f31e4503`)
- `Apply LinkedIn Result` (id `36773da5`)
- [ ] In both, replace the strip regex line so the function reads exactly:
  `function norm(s){return (s||'').toString().toLowerCase().replace(/[^a-z0-9]/g,'').replace(/(inc|llc|ltd|corp|co|company|holdings|holding|plc|group|limited|international|therapeutics|bio|biosciences|pharma|pharmaceuticals)$/,'');}`
- [ ] Note the regex strips one suffix; `meiragtxholdingsplc` needs two stripped (`holdings`+`plc`). Make the strip global/repeated: apply the suffix replace in a loop until no further change, OR change `$/` handling to strip repeatedly. Implement so `"MeiraGTx Holdings plc"` → `"meiragtx"`. Confirm with a unit trace on that exact string before deploy.

## Fix 2 — Anthropic scoring all-zero (Finding 2) — CREDENTIAL, operator action
All 40 ICP scores = 0; root cause is almost certainly the Anthropic credential not attached on `Residual ICP Score` (id `f731908a`) — `neverError:true` passes the auth-error body through, `resp.content` is undefined, score defaults 0.
- [ ] Nick attaches the Anthropic credential to `Residual ICP Score` in the n8n UI (the prior credential reattach may have missed it; credentials are UI-managed, the REST PUT will not set them).
- [ ] Confirm the node shows a bound credential before the next run. Acceptance: post-run, VP/Director/SVP R&D contacts score >0 (a uniform 0 across all means it is still broken — do not accept).

## Fix 3 — 10 items lost, Collect(50) → Apply Score+Map(40) (Finding 3) — INVESTIGATE BEFORE FIXING
The Apify-empty-queries hypothesis is unconfirmed. Do NOT apply a fix on a hypothesis.
- [ ] From execution `80786` node data (no `truncateData`), record the item count OUT of every node from `Collect All Prospects` through `Apply Score + Map`. Identify the exact node where 50 becomes <50.
- [ ] Report that node + its drop behavior to agentic-systems. Only then apply the minimal fix at that node (likely: ensure `onError: continueRegularOutput` items still pass through with original data rather than being dropped). One node, evidence-led.

## Fix 4 — Airtable upsert blank-email collision (Finding 4)
`Prepare Contacts Upsert` includes records with blank Email; upserting many blank emails on `fieldsToMergeOn:['Email']` collides → 0 written.
- [ ] Change the skip condition so rows with no email are excluded from the upsert batch: replace `if (!d.fullName && !d.email) continue;` with `if (!d.email) continue;`. Rationale: a contact with no email is not actionable for the email cadence and is the source of the merge-key collision. No-email prospects are simply not written this round (acceptable; separate enrichment concern, not this fix).

## Sequence & verification
1. Nick attaches Anthropic credential (Fix 2). 2. Apply Fix 1 + Fix 4 via credential-preserving REST PUT; raw read-back. 3. Investigate Fix 3, report, apply evidence-led. 4. **STOP — Nick authorizes the paid re-run.** 5. Re-run MeiraGTx. 6. Verify on the surface: `tblWJksRL1yKSUgrm` has MeiraGTx contacts written; `employer_confirmed` > 0; ICP scores non-zero and plausible; no upsert errors; chain count from 50 does not silently collapse. 7. Report to agentic-systems for independent verification — do not self-certify.

## What proves success
MeiraGTx contacts land in the Contacts table with non-zero ICP scores, employer-confirmed where the employer truly matches, and no upsert errors. That is the end-to-end chain working for one company; widening to more companies is a later step.
