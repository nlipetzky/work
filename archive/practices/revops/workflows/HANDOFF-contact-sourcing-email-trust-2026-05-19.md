# Handoff — Contact Sourcing Email Trust (2026-05-19)

Workflow: `bYZ0sAzyUvU60wMZ` | versionId after last deploy: `b30089a2-82ae-4525-9c1a-dd45ee028a4f`

---

## What was deployed this session

Three code changes from `PROMPT-contact-sourcing-email-trust-2026-05-19.md` are deployed.

**Change 1 — Hunter-first email selection:** Email selection removed from `Email + Employer Verify` (f31e4503); moved to `Apply Email Verify` (f89be51b). Hunter runs for all contacts; explorium/apollo are fallbacks only. `emailSource` field is set truthfully per-contact.

**Change 2 — Apollo People Match fixed:** `linkedin_url` added to match body when available. Apollo returned 5/5 matches in exec 80824 (previously 0/50 in exec 80786).

**Change 3 — Four-state Email Verified Status:** `Apply Email Verify` now writes one of: `Verified` / `Catch-all (unconfirmed)` / `Unverifiable` / `Not found`. `emailIdentityConfirmed` is only true when status = `Verified`.

**Hunter param case fix (prerequisite):** Hunter node (89c28f21) `firstName`/`lastName` corrected to `firstname`/`lastname`. This was blocking workflow execution entirely.

---

## Execution 80824 — what happened

Triggered manually, completed in 44s. All 5 MeiraGTx contacts were written to Airtable across two sequential chain runs (n8n re-fires downstream nodes when both IF branches deliver to the same merge point).

**Per-node item counts (from runData):**
- Collect All Prospects: 5
- Apollo People Match: 5
- Email + Employer Verify: 5
- Needs LinkedIn Tiebreak?: branch0=1, branch1=4
- Apify LinkedIn Verify: 1 | Apply LinkedIn Result: 1 | LI Resolved: 2 runs (1 then 4)
- Hunter: 2 runs (1 then 4) — all returned error
- Apply Email Verify: 2 runs (1 then 4) — all fell back to explorium
- Upsert Contacts to Airtable: 2 runs — 1 record updated (`recWERHGXgIRbzPAT`), 4 records updated (`recV2Iw7UUx5euUHn`, `reck5Bpd9wdFf1tpX`, `recHC8u2mAhl3bU1s`, `rec3aJipKk2uNGfHg`)

**Credential bindings (10/10 preserved):**
- Read Persona Rules: airtableTokenApi `gppZOg4RmjcuPf9T` (All KAI Bases)
- Read Target Companies: airtableTokenApi `gppZOg4RmjcuPf9T`
- Apollo People Match: httpHeaderAuth `NFi41JJcpIkFi7C8` (USPTO API)
- Apify LinkedIn Verify: apifyApi `ZdPamPRhU0gYvDyJ`
- Explorium Fetch Prospects: httpHeaderAuth `XsOoCxox8pd2BLDt`
- Explorium Profiles Enrich: httpHeaderAuth `XsOoCxox8pd2BLDt`
- Explorium Contacts Enrich: httpHeaderAuth `XsOoCxox8pd2BLDt`
- Residual ICP Score: anthropicApi `k6pMUap0iM92iLvi`
- Upsert Contacts to Airtable: airtableTokenApi `FYqJQqdXIQkmT715`
- Hunter: hunterApi `iEgOsW2aGzoputb2`

---

## Two open issues — Agentic Systems to direct

### Issue A: Hunter failing — `targetDomain: null`

Hunter returned `{"error": "Bad request — please check your parameters"}` for all 5 contacts in exec 80824. Root cause: `targetDomain: null` for MeiraGTx. The `Build Sourcing Plan` code sets `targetDomain: bareDomain(c['Domain'] || c['Website'])` — the MeiraGTx Airtable record (`rec7qaGedk0dmOON3`, table `tblnj3YlOI3thjrXp`, base `appYBYH3aOHhTODAw`) has neither field populated.

Because Hunter can't run, all 5 contacts used explorium email as fallback. DoD 1 (Hunter-first verified in practice) cannot be confirmed until Hunter can execute.

Two paths:
- **Data fix**: Update MeiraGTx Airtable record with `Domain = meiragtx.com` (confirmed from Apollo results: `zandy@meiragtx.com`, `robert.wollin@meiragtx.com`, etc.)
- **Code fix**: Derive domain from prospect email in workflow (e.g., from Apollo email or Explorium email, strip username prefix). More robust for future companies.

### Issue B: Dual-run chain (LI Resolved merge topology)

`LI Resolved` is a Set node receiving connections on input[0] from both `Apply LinkedIn Result` (Apify path) and `Needs LinkedIn Tiebreak?` false branch (direct path). n8n re-fires LI Resolved and all downstream nodes separately for each batch. In exec 80824: run0=1 item (Girish via Apify), run1=4 items (others direct). Both runs wrote to Airtable correctly.

This is functional but produces two separate upsert calls per execution. It is NOT a silent drop. Whether to fix the merge topology (replace LI Resolved Set node with a proper n8n Merge node) is Agentic Systems' call — it's out of scope for the three-change PROMPT but worth noting.

---

## DoD status against PROMPT

1. **Hunter-first email selection code**: deployed and correct. Unverifiable in practice until Issue A (domain) is resolved.
2. **Apollo People Match returns non-empty**: ✓ confirmed in exec 80824 (5/5 matches).
3. **Four-state Email Verified Status, no false identityConfirmed**: ✓ all 5 written contacts have `Unverifiable` / `identityConfirmed: false`. Code logic correct for all four states.

---

## What the next session needs to do

1. Receive direction from Agentic Systems on Issue A (data fix vs. code fix).
2. Apply the fix (either update Airtable record or patch `Build Sourcing Plan` node).
3. Optionally: address Issue B (merge topology) if Agentic Systems directs.
4. Trigger a fresh bounded MeiraGTx size:5 real execution after fix.
5. Report per PROMPT output contract: workflow ID + versionId, execution ID, record IDs written, per-node item counts. No narrative. Agentic Systems verifies pass/fail.
