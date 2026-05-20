# E-D ticket — L2 selective re-run, close currency (FINAL STEP)

**Workflow:** L2 `rXKuqfDwqX7TYzxK`. **Owner:** Explorium-Direct. **agentic-systems surface-verifies, then this session closes.**
This is the last step of the currency plan. Everything is built and verified: L2 Apply Rules v5 (deployed+verified), and Pfizer now has a `program_status` / `Vitality=ended` row in Company Events (`recDUb4YEM3xneRLC`), Adrenas `Vitality=unknown` (`recF7fK0yQqelOsIO`). This run pulls the payoff: prove Pfizer drops off `current`/`surfaced`.

## Do not run blind — Step 1, report first

L2 `Read Candidates` filter is `=OR({Run Selected}=1,{Verification Status}='needs_verification')`. Pfizer (`rec83lbbxLTPi84zv`) and Adrenas (`recA4rY40iqwtNVJP`) are both `needs_verification`, so they are in scope — but so is every other `needs_verification` company.

**Report, before running:** the count of companies in RevOps Surface Companies (`appYBYH3aOHhTODAw` / `tblnj3YlOI3thjrXp`) with `Verification Status = needs_verification`, and the list if it is small. STOP and report. agentic-systems decides the run shape from that count. Do not proceed past this without the go.

## Step 2 — run shape (agentic-systems confirms which)

- **If the `needs_verification` set is just Pfizer/Adrenas (or a small set explicitly approved):** trigger L2 as-is. No node edits. No credential risk.
- **If the set is large:** do NOT reclassify everyone for this verification. Bounded path: set `Run Selected = true` on **only** Pfizer (`rec83lbbxLTPi84zv`) and Adrenas (`recA4rY40iqwtNVJP`) in Companies, and have agentic-systems authorize a temporary static narrowing of `Read Candidates` to `{Run Selected}=1` for this run. Any filter change is a **static Airtable formula only** (never a dynamic n8n expression — that is a known live failure), via the credential-preserving path with a full raw read-back of L2's nodes + credentials after (L2 carries ~12 credential bindings; a PUT/MCP update wipes them). Restore the production filter `=OR({Run Selected}=1,{Verification Status}='needs_verification')` and clear the two `Run Selected` checkboxes after the run. Report both filter states and the post-restore credential bindings as references.

Default to the no-edit path. Only touch L2 nodes if the count forces it and agentic-systems says so.

## Step 3 — run, then STOP

L2 is not a paid run; no spend gate. It mutates classification state on the in-scope Companies rows — that is the intended effect. Trigger once. Then STOP and report references only.

## Definition of done (agentic-systems independently re-pulls Companies and verifies)

After the run, on RevOps Surface Companies (`appYBYH3aOHhTODAw` / `tblnj3YlOI3thjrXp`):

1. **Pfizer (`rec83lbbxLTPi84zv`)**: no longer `surfaced`/`current`. The `program_status = ended` trade-press signal must drive currency = discontinued and route Pfizer to needs-review / discontinued. This is the false-positive actually closing.
2. **Adrenas (`recA4rY40iqwtNVJP`)**: NOT demoted by its `unknown` signal — its disposition stays whatever CT.gov determines, exactly as before. (Uncertainty must not override CT.gov; verifying this proves the precedence logic is correct, not just aggressive.)

## Report (output contract — references only)

Report: the `needs_verification` count (Step 1); the execution ID of the L2 run; if any filter was changed, the before/after filter strings and post-restore per-node credential bindings; and the resulting `Verification Status` / classification field values for `rec83lbbxLTPi84zv` and `recA4rY40iqwtNVJP`. No narrative. No "verified/working/closed." agentic-systems decides pass/fail by re-reading the surface.

On a clean verify, currency is finished and the Explorium-Direct session closes.

---

## AUTHORIZATION (agentic-systems, 2026-05-19) — bounded path APPROVED with hardened safety

`needs_verification` count = 103. Confirmed: do **NOT** run L2 over all 103. Reason: only Pfizer/Adrenas have trade-press `program_status` signals in Company Events; classifying the other 101 now would run them on CT.gov-only currency and re-introduce the exact false-positive at scale, prematurely. Bounded to the 2 is correct.

Editing L2's filter is the highest-risk operation this session (L2 carries ~12 credential bindings; a "credential-preserving" PUT already wiped an entire workflow's creds this session). Execute in this exact order; any deviation = STOP and report, do not run:

1. **Capture** the full L2 (`rXKuqfDwqX7TYzxK`) workflow JSON before any edit. This is the exact-restore artifact.
2. **Pre-flight reset check (the gate the ticket missed):** inspect L2 for any node that clears/blanks/resets `Verification Status` (or equivalent classification state) on rows **independent of `Read Candidates`** (e.g. an "update all" / re-blank step not fed by the Read Candidates output). 
   - If such an ungated reset exists → narrowing only `Read Candidates` does NOT bound L2's writes; a bounded run would still wipe the other 101. **STOP, do not edit, do not run, report.** We need a different approach.
   - If all state changes flow only from the `Read Candidates` set → proceed.
3. Set `Run Selected = true` on exactly Pfizer `rec83lbbxLTPi84zv` and Adrenas `recA4rY40iqwtNVJP` (Companies, `appYBYH3aOHhTODAw`/`tblnj3YlOI3thjrXp`).
4. Change `Read Candidates` filter to the **static** formula `{Run Selected}=1` (static only — never a dynamic n8n expression). Credential-preserving method.
5. **Immediate raw read-back gate:** all ~12 credential bindings present at the same IDs; node count + connections unchanged vs. the captured JSON; filter string is exactly `{Run Selected}=1`. ANY discrepancy → restore from the captured JSON, do not run, report.
6. Run L2 once.
7. Restore `Read Candidates` filter to `=OR({Run Selected}=1,{Verification Status}='needs_verification')`. Clear `Run Selected` on the two rows (leftover checkboxes cause a future unintended selective run).
8. Post-restore raw read-back: 12 creds intact, filter restored, node/conn unchanged.
9. Report references only: pre/post filter strings, the 12 credential bindings post-restore, the L2 execution ID, and the resulting classification fields for `rec83lbbxLTPi84zv` and `recA4rY40iqwtNVJP`. STOP. agentic-systems independently re-pulls Companies and decides pass/fail.
