# Job Postings Column -- Real Debug Plan

**Revised understanding:** The current `Lab & Process Job Openings` column uses Clay's native Find Active Job Openings action with LinkedIn URL input, broad keyword set, NA-only location filter, 180-day window. That setup is correct for the playbook. The zero-results problem is not architectural. It's data quality + auto-run.

Five things to check, in order, before changing the column itself.

---

## 1. Confirm the column is actually firing on the affected rows

The five rows missing job data (Recursion, BlueRock, Allogene, Exelixis, Summit) were classified after the last manual trigger of the job column. Since the column does NOT auto-run, those rows have no job data because the column was never run on them, not because it returned zero.

**Action:** Manually trigger the job column on those five rows. If they return data, the "zero returns on real companies" problem shrinks to just the originally-flagged ones (Seagen, Curia, Hovione, Piramal).

---

## 2. Audit LinkedIn URL quality on the zero-return rows

Clay's Find Active Job Openings is scoped entirely by LinkedIn URL. If the URL is wrong, dead, or points to the wrong entity, you get zero. There is no fallback.

**For each zero-return company, open the LinkedIn URL in the table and check:**

| Company | Stored URL likely status | What to verify |
|---|---|---|
| Seagen | `linkedin.com/company/seagen-inc/` -- acquired by Pfizer Dec 2023 | Page may redirect to Pfizer or be inactive. If so, Seagen-specific jobs don't exist anymore; they're posted under Pfizer Oncology. The right answer may be "Seagen is no longer a standalone target." |
| Curia | `linkedin.com/company/curiaglobal/` (rebranded from AMRI) | Check the URL resolves. Curia is multi-site; postings exist. |
| Hovione | `linkedin.com/company/hovione/` | Hovione is HQ'd in Portugal. NA hiring may be lower volume but should be non-zero (East Windsor NJ site). |
| Piramal Pharma Solutions | `linkedin.com/company/piramal-pharma-solutions/` | Should resolve cleanly. If zero, see step 4. |

**Action:** Open each URL. If it 404s, redirects, or shows a different company, fix the URL in the table (manually or via a Clay LinkedIn company finder enrichment). If it resolves cleanly, move to step 3.

---

## 3. Test the keyword filter logic

Clay applies both Title Keywords AND Description Keywords. If the operator is AND (a posting must match at least one title keyword AND at least one description keyword), the filter is much stricter than it looks. A posting titled "Scientist II" with body text mentioning "bioprocessing" matches description but fails title -- it gets dropped.

**Action:** On Piramal specifically (LinkedIn URL is good, the company is real, they hire), duplicate the column and test two variants:

- **Variant A:** Title keywords only, no description keywords.
- **Variant B:** Description keywords only, no title keywords.

If Variant A returns >0 and the original returns 0, the description filter is the problem. If Variant B returns >0 and the original returns 0, the title filter is the problem. If both variants also return 0, the LinkedIn URL or the location filter is the problem.

---

## 4. Test the location filter

Some companies post NA-based jobs but tag the location as "Remote" or "United States and Canada" or a state-without-country. Clay's location filter may not match these.

**Action:** Duplicate the column with the location filter removed. If results jump from 0 to many, the location matcher is the issue. Fix by adding "Remote" as an accepted location OR by removing the location filter at search time and applying it in a downstream formula column (parse the location string per-posting).

---

## 5. Run the control test

Once steps 1-4 are clean, run the column on a known-active control set:

| Company | LinkedIn URL | Expected |
|---|---|---|
| Genentech | linkedin.com/company/genentech | 10 (capped) |
| Regeneron | linkedin.com/company/regeneron-pharmaceuticals | 10 (capped) |
| Eli Lilly | linkedin.com/company/eli-lilly-and-company | 10 (capped) |
| Bristol-Myers Squibb | linkedin.com/company/bristol-myers-squibb | 10 (capped) |
| Pfizer | linkedin.com/company/pfizer | 10 (capped) |

All five should return 10. If they do, the column works as designed and the zero-returns on smaller CDMOs are accurate reflections of those companies' current NA hiring activity (not a system bug). If any of the control set returns <10, fix the underlying issue before running on all 420.

---

## What to actually change in the column

If steps 1-5 show the column is healthy and the zero-returns are real:

**Turn on auto-run.** The reason the 5 newly-classified rows are blank is the column doesn't auto-run. At 1 credit per row and 420 rows = 420 credits per full re-run. If credits are tight, leave auto-run off and instead add a Send Table Data step that triggers the job column only when `Has ngAbs Program = yes`. That caps job-column runs at ~10-30% of rows.

If steps 1-5 show the keyword filter is too strict:

**Drop Description Keywords entirely.** Title Keywords are sufficient; the playbook's role families (PD, upstream, downstream, formulation, MSAT, etc.) all appear in titles when a posting is genuinely a bench/PD/mfg role. Description filters add false negatives more than they add precision.

If steps 1-5 show the location filter is dropping NA-tagged-as-Remote postings:

**Move location filtering to a downstream formula.** Let the column pull all postings regardless of location; add a formula column that counts only postings where location string contains a US/Canada/Mexico state, city, or "Remote -- US/Canada".

---

## What to drop from my earlier overhaul plan

The five-column stack (Apollo + LinkedIn Apify + merge + AI classify + count) was overengineered. Don't build it. The native Clay action is the right tool. Fix the inputs and the trigger, not the architecture.

The AI classification of role-family from posting text is still useful as a downstream column for reporting and segmentation, but it's not required to make the gate work. The keyword filter already does role-family selection at search time.
