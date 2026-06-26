# Pfizer Contact Audit — 2026-05-22

**Workflow**: `/Users/nplmini/code/work/practices/agentic-systems/...` → n8n [`0gWOTnVnVs8y1S7L`](https://instig8.app.n8n.cloud/workflow/0gWOTnVnVs8y1S7L), execution 92132
**Source**: Apollo `/mixed_people/api_search` + `/people/bulk_match`, 52 contacts upserted to Airtable `tblWJksRL1yKSUgrm`.
**Criteria source**: `/Users/nplmini/code/work/accounts/clients/teknova/artifacts/revops-segment-aav-gene-therapy-ellie-outreach.md`

## Headline

**45 of 52 contacts (87%) fail Ellie's hard filters** but were upserted to Airtable. The workflow's current title-keyword filter doesn't catch the failure modes that matter on big-pharma data.

What surprised me: **zero VPs in the 52**. Apollo categorizes "Senior Director" and "Executive Director" as `director`, not `vp`. The "VP cap at >500-employee non-CDMOs" rule isn't biting here because Apollo isn't classifying anyone as VP. That doesn't mean the rule is wrong — it means the *seniority filter from Apollo is unreliable for biopharma title patterns*. The real noise is below the seniority floor, not above.

## Failure pattern breakdown

| Reason | Count | What it is |
|---|---|---|
| `senior_associate_below_floor` | 14 | Senior Associate Scientist / Senior CMC Associate — Apollo marks "senior" but these are mid-IC, not Director. |
| `senior_pd_ic_only` | 9 | Senior Process Development Engineer/Scientist with no leadership modifier — IC. |
| `senior_scientist_ic_only` | 9 | Senior Scientist without Lead/Principal/Manager modifier — bench IC, not operator owner. |
| `regulatory_cmc_banned` | 7 | "Reg CMC" / "Global Reg Affairs — CMC" / "Reg CMC Strategy" — regulatory function with CMC keyword. Banned per criteria. |
| `tenure_implausibly_old` | 5 | Tenure > 120 months in same role — likely Apollo data is stale; verify before send. |
| `cmc_admin_not_process` | 4 | CMC Submissions, Project Management, Statistics — supports CMC but isn't process ownership. |
| `principal_scientist_ic_only` | 3 | Principal Scientist — Ellie's criteria explicitly says "not a senior-scientist hands-on-the-bench contributor." |
| `geography_out_of_scope` | 2 | Title mentions Japan / Europe — outside US/Canada scope. |
| `technician_too_junior` | 2 | Process Technicians — below the operator-buyer floor. |
| `statistics_banned` | 1 | Biostatistics / CMC Statistics — Ellie explicitly excludes statistics. |

## Pass list (7) — contacts Ellie should actually see

| Name | Title | Seniority | Tenure (mo) |
|---|---|---|---|
| Carol Schaffer | Director of Process and Development | director | 10 |
| Jay Fink | Sr Process Development Tech | senior |  |
| Joann Parker | Executive Director and Lead of CMC Oncology & Rare Disease | director | 83 |
| Joshua Hunter | Director, Conjugation Process Development | director | 29 |
| Manisha Patel | Director-CMC | director | 10 |
| Paloma De La Torre | Director Global CMC | director | 48 |
| Sharon Page | Director CMC Strategy | director | 48 |

## Fail list (45) — should not have been upserted

| Name | Title | Seniority | Tenure (mo) | Reasons |
|---|---|---|---|---|
| Amber Littesy | Director, CMC Project Management | director | 6 | cmc_admin_not_process |
| Deron Becker | Director, CMC Submission Operations | director | 192 | cmc_admin_not_process, tenure_implausibly_old |
| Jeff Ollis | Senior Scientist, CMC Statistics | senior | 29 | cmc_admin_not_process, statistics_banned, senior_scientist_ic_only |
| Jon Miller | Senior Associate Scientist - CMC Submissions | senior | 217 | cmc_admin_not_process, senior_associate_below_floor, tenure_implausibly_old |
| Naoki Yorimoto | CMC Japan, Senior Director | director | 57 | geography_out_of_scope |
| Satoru Kamoda | Director, CMC Japan | director | 17 | geography_out_of_scope |
| Allison Bock | Principal Scientist Downstream Process Development | senior | 11 | principal_scientist_ic_only |
| Paul Dinkel | Principal Scientist, Purification Process Development | senior | 57 | principal_scientist_ic_only |
| Prashant Ganji | Principal Scientist - Downstream Process Development | senior | 36 | principal_scientist_ic_only |
| Alex Opio | Director Reg CMC Strategy | director | 35 | regulatory_cmc_banned |
| Catherine Buckley | Senior Associate Reg CMC | senior | 53 | regulatory_cmc_banned, senior_associate_below_floor |
| Irena Vishnevskaya | Director, Reg CMC Strategy | director | 61 | regulatory_cmc_banned |
| James Murphy | Senior Director - Global Reg Affairs - CMC | director | 280 | regulatory_cmc_banned, tenure_implausibly_old |
| Maria Vassallo | Sr Associate Reg CMC Strategy | senior | 32 | regulatory_cmc_banned, senior_associate_below_floor |
| Stephanie Howard | Sr Associate Reg CMC Strategy | senior | 23 | regulatory_cmc_banned, senior_associate_below_floor |
| William Dodge | Director, Global CMC RA | director | 114 | regulatory_cmc_banned |
| Allyson Craven | Senior Associate Scientist-Downstream Process Development | senior | 36 | senior_associate_below_floor |
| Chloe Simchick | Senior Associate Scientist, Upstream Process Development | senior | 8 | senior_associate_below_floor |
| Jennifer Horton | Senior CMC Associate | senior | 34 | senior_associate_below_floor |
| Jennifer Schaefer | Senior CMC Associate | senior | 45 | senior_associate_below_floor |
| Jillian Yeager | Senior Associate Scientist, Purification Process Development | senior | 36 | senior_associate_below_floor |
| Jocelyn Baer | Senior CMC Associate | senior | 47 | senior_associate_below_floor |
| Jocelyn Rodriguez | Senior Associate Scientist, Upstream Process Development | senior | 16 | senior_associate_below_floor |
| Robert Hunt | Senior Associate Scientist - Conjugation Process Development | senior | 6 | senior_associate_below_floor |
| Steven Avery | Senior Associate Scientist - API Manufacturing Process Development | senior | 56 | senior_associate_below_floor |
| Tracy Chavez | Senior Associate Scientist Process Development | senior | 12 | senior_associate_below_floor |
| Brendha Truccollo | Senior Process Development Scientist | senior | 16 | senior_pd_ic_only |
| Christina Meyer | Senior Process Development Engineer | senior | 24 | senior_pd_ic_only |
| Daniel Kehoe | Senior Process Development Scientist | senior | 32 | senior_pd_ic_only |
| David Egan | Senior Process Development Scientist | senior | 34 | senior_pd_ic_only |
| Gemma Black | Senior Process Development Scientist | senior | 12 | senior_pd_ic_only |
| Jill Browning | Senior Process Development Scientist | senior | 39 | senior_pd_ic_only |
| Joshua Zagrzebski | Senior Process Development Engineer | senior | 59 | senior_pd_ic_only |
| Stefania Magnano | Senior Process Development Scientist | senior | 16 | senior_pd_ic_only |
| Wei Leng | Senior Process Development Scientist | senior | 9 | senior_pd_ic_only |
| Ciaran McGinn | Senior Scientist - MSAT Process Development | senior | 53 | senior_scientist_ic_only |
| Dunie Navarro | Senior Scientist (Upstream Process Development) | senior | 31 | senior_scientist_ic_only |
| Elisabeth Sitte | Senior Scientist Process Development | senior | 12 | senior_scientist_ic_only |
| Laura Greenfield | Sr Scientist, Upstream Process Development | senior | 43 | senior_scientist_ic_only |
| Lily Klapper | Senior Scientist-Conjugation Process Development | senior | 16 | senior_scientist_ic_only |
| Patrick Hickey | Senior Cell Culture Scientist Process Development | senior | 166 | senior_scientist_ic_only, tenure_implausibly_old |
| Sarah Herrick-Wagman | Sr Scientist Transient Protein Purification | senior | 13 | senior_scientist_ic_only |
| Yuhao Wang | Senior Scientist Process Development | senior | 65 | senior_scientist_ic_only |
| Eoghan McGrath | Senior Manufacturing Purification Technician | senior | 273 | technician_too_junior, tenure_implausibly_old |
| Pedro Villar | Purification - Senior Process Technician | senior | 9 | technician_too_junior |

## Recommended workflow changes

These would be applied in `Normalize + Filter` (client-side, after Apollo bulk_match) so they work for any client, not just Teknova:

1. **Match the seniority signal against title, not just Apollo's `seniority` field.** Apollo's `senior` bucket fires on "Senior Scientist," "Senior Associate," "Sr Technician." These are not directors. Require title to ALSO match one of: `director|head|manager|principal|lead|chief|vp|svp|executive` when Apollo seniority is `senior`. Pass-through if seniority is `director` or higher.
2. **Add explicit regulatory-CMC pattern to `persona_title_exclude`**: `Reg CMC`, `Regulatory Affairs CMC`, `Global Reg`, `Reg Affairs`, `RA CMC`. The current `regulatory` token doesn't match the "Reg" abbreviation.
3. **Add to `persona_title_exclude`**: `CMC Submissions`, `CMC Project Management`, `CMC Statistics`, `Technician`. Each is a real Pfizer-leakage pattern.
4. **Add Apollo geography filter at search time**: `person_locations: ["United States", "Canada"]`. Free at the API level, eliminates "CMC Japan" before enrichment.
5. **Flag tenure > 120 months for human review**, don't auto-drop. Real long tenures exist; data-staleness is the more common cause.

## Open questions for Nick

- **Principal Scientists**: my filter drops them. Ellie's doc says "not a senior-scientist hands-on-the-bench contributor and not the C-suite at a large biopharma." But Principal Scientists at Pfizer Process Development are often the actual technical decision-influencer on reagent selection. Want to keep them as secondary contacts, or hard-drop?
- **Senior Scientists** (no leadership modifier): same question. Ellie's doc treats them as secondary, not primary. Are secondary OK to upsert (just tagged differently), or hard-drop?
- **Apollo "Senior Associate Scientist"**: definitely below director floor, but they're often the future buyer. Tag as "watch list" or hard-drop?
