# ngAbs outreach list — remediation plan (2026-06-19)

## Problem (Ellie, email 2026-06-16 + working session 2026-06-19)
Ellie loaded the ngAbs contact list for outreach and is seeing contacts whose **company is not on the approved company list** — e.g. Jeff Pawar (VP Tech Ops, Rocket Pharmaceuticals) and Rajesh Shenoy (VP Tech Ops, Resilience). She had ~216 contacts but the outreach table showed ~81.

## Diagnosis (live data, Temp ngAbs base app0zKYeY5dVKmuzj)
- **Companies (tbl5yPX4n2AHC6ZJK):** 420 total. Site Verdict = 85 confirmed / 298 pending / 35 excluded / 2 needs-review. **Share=true on only 22.**
- **Contacts (tblKqreZRMCsK7bbc):** 859 total.
  - 91 linked to a Share=true company (the clean ~81 first pass)
  - 579 linked to a company that is NOT approved (pending/excluded/unconfirmed)
  - 189 with NO company link at all
  - **768 contacts are behind companies that were never approved.**
- Rocket Pharmaceuticals: Site Verdict=pending, Share=false, Has ngAbs Program=**no**. Resilience: pending, Share=false, Has ngAbs=unclear. Both present but unapproved — their contacts should never have reached Ellie.
- **Root cause:** the delivered list (raw CSV) was not gated to approved companies, and bypassed the Teknova Outreach base filter that enforces company membership. A second batch of companies was added but left pending/unlinked.

## Approval gate (SETTLED — from Ellie's 6/05 feedback CSV)
Source of truth: `data/ngAbs Companies_Ellies feedback_2026.06.05.csv` (22 companies, all Share=checked / Site Verdict=confirmed / Has ngAbs=yes). This is Ellie's shared set — BUT her own notes disqualify several of the 22, so the gate is "her 22 MINUS her DQ/duplicate notes," not the Share checkbox.
- **Hard DQ (wrong modality — drop):** ImmunityBio (IL-15 fusion/CAR-NK), Polaris Pharmaceuticals (PEGylated enzyme), Kashiv BioSciences (monoclonal only), Adverum (AAV gene therapy).
- **Duplicates (collapse/drop):** LSNE (= PCI Pharma Services), ProBio (= GenScript ProBio), SK pharmteco (parent of KBI — double-count), Kashiv (listed twice).
- **Keep but flag weak-fit:** PCI Pharma + Simtra (fill-finish, thin Teknova basket), FUJIFILM Diosynth (acquired by Fuji — entity note), Lyell (CAR-T but has bispecific IMPT-314).
- **Net approved: ~14-15 companies.**
- NOTE: the live base's `Site Verdict=confirmed` (85) is the SYSTEM's site check, NOT Ellie's approval — do not use it as the gate. Rocket/Resilience are not in her reviewed 22 at all → out.

## To-do
1. **Reconcile the live base to Ellie's notes.** The base still marks the DQ'd companies (ImmunityBio, Polaris, Kashiv, Adverum) and duplicates as Share=true — stale. Un-share / mark DQ on those so the gate is correct. The approved set becomes the ~14-15 above.
2. **Re-scope contacts to the net-approved companies only.** Withhold every contact whose linked company isn't in the gate. (~91 are at Share=true companies today; trims further once the DQ'd companies are removed.)
3. **Resolve the 189 unlinked contacts.** Link to their company if it exists AND is approved; otherwise drop. No link = cannot verify membership = not eligible.
4. **Pending/excluded companies stay OUT.** The 298 pending + 35 excluded are not Ellie-approved; their contacts do not go to outreach. Surface any specific pending company only if Ellie asks to add it (then it goes through her review first).
5. **Migrate the gated set into the RevOps Surface base** (`appYBYH3aOHhTODAw`) — the consolidated source-of-truth home, mirroring how mRNA lives there. Companies → Companies table, contacts → Contacts table, tagged by play (Promote Play), contacts linked to their company, upserted by Domain/Email (some ngAbs data already exists in the Surface — upsert, don't duplicate).
   - Source of truth = Temp ngAbs base `app0zKYeY5dVKmuzj` (the only source with Ellie's review + links). Supabase `staging.contacts_ngabs_2026_06_05` (189, 6/05) and the 6/05 delivery CSVs/JSON are stale snapshots — do not use.
6. **Re-deliver to Ellie via the Teknova Outreach base** (`appFoLY6hjroyA2KW`) — note: that base holds NO native data; it only syncs/displays tables from other bases. So point its synced view at the RevOps Surface ngAbs set. Corrected count + note that off-list-company contacts (Rocket/Resilience etc.) were removed. Route via Hermes (expert-liaison).
7. **Prevent recurrence:** constrain contact sourcing to approved companies only — the contact loader/workflow should run only for gate-passing companies, so off-list-company contacts are never created (same lesson as the mRNA play).

## Source-of-truth note (confirmed 2026-06-19)
Temp ngAbs base = source of truth (859 contacts / 420 companies; 91 contacts at the 22 Share=true companies — 81 w/ email, 81 w/ SF summary). Caveats: Share flags stale vs Ellie's DQ notes; 10/91 lack email; DNC boolean empty (signal in SF summary prose). Teknova Outreach base is a sync/display layer only — no native data.

## Notes
- The clean gated set (~91 / 22 companies) is roughly the "81" Ellie already trusted. The fix is mostly removal + re-delivery through the filter, not re-sourcing.
- Email deliverability / role-exclusion checks still apply on top of the company gate.
