# Contacts Discovery Brief — FREE Apollo search only

Goal: for each assigned company, find the in-scope contacts using Apollo's FREE people search.
HARD RULE: free search ONLY. Do NOT call apollo_people_match, apollo_people_bulk_match, or any
enrichment/reveal endpoint. Those cost credits and the main agent runs them after approval.
Spend $0. No emails, no LinkedIn-URL reveal, no enrichment.

## Tool
Load via ToolSearch: `select:mcp__36fa7dcb-8cad-4296-9d0b-127dea39801c__apollo_mixed_people_api_search`
Use a stable _conversation_ref token (e.g. "ngabsdisc1") on every call. Keep _rationale generic.

## Method per company (name + domain)
1. Call apollo_mixed_people_api_search with:
   - q_organization_domains_list: [the domain]
   - person_seniorities: ["c_suite","vp","director","head","senior","manager"]
   - per_page: 50
2. If the domain is a giant PARENT domain (eurofins.com, wuxiapptec.com, patheon.com,
   altasciences.com, emergentcontractmanufacturing.com, lannett.com), the results will be the
   whole parent org. Add q_keywords with the specific division/company name to narrow, and mark
   any kept contact with "parent_domain_caveat": true (low confidence on division match).
3. Triage every returned person against the playbook title rules below.

## In-scope title buckets (playbook Section 4.2) -> set bucket + in_scope=true
- process_mfg: VP/Head/Director Process Development; VP/Director Bioprocessing; Head Manufacturing/MSAT;
  Director Downstream/Upstream Processing; Manager Manufacturing Sciences (MSAT)/Tech Transfer;
  Principal/Senior Scientist (Process Dev, Downstream, Upstream, Formulation); Lab/Operations Manager at a PD/GMP site.
- rnd_science: CSO; VP R&D; VP/Director Antibody Engineering; Head Biologics/Protein Sciences;
  Director ADC/Conjugation; Director Cell Line Development; CMC Lead/Director; CMC Scientist;
  Scientist/Associate Scientist (Bioprocessing, Cell Culture, Analytical Development); Protein Analytics; Expression/Purification.
- procurement: Director Procurement (R&D/GMP materials); Strategic Sourcing Manager Raw Materials; Supply Chain Lead Bioprocess.

## Title EXCLUSIONS (drop, in_scope=false) — case-insensitive substring, unless paired with a procurement-of-lab/GMP-materials term
Sales, Commercial, Business, Strategy/Strategic, Alliances, Marketing/Market, CX/UX/User, Customer/Consumer,
Medical Affairs, Clinical (clinical-only), Regulatory, QA/Quality Assurance, Legal/Counsel, Finance/Accounting/Payroll,
HR/Human Resources/Talent/Recruit, IT/Information Technology, Data/Data Science/Informatics/Analytics(software)/Digital,
Computational Biology, Product Engineering/Software, Project/Program Manager, Portfolio, Communications, Patent,
Board/Investor, CEO/CFO/COO/CBO/Chief Strategy. When a "Director" has NO function named, mark in_scope=false
AND ambiguous=true (these get a LinkedIn check later, not an enrich).

## Output
Write a JSON array to your assigned output file. One object per in-scope OR ambiguous candidate:
{ "company": "...", "domain": "...", "apollo_id": "...", "first_name": "...",
  "last_name_masked": "...", "title": "...", "bucket": "process_mfg|rnd_science|procurement|none",
  "in_scope": true|false, "ambiguous": true|false, "parent_domain_caveat": true|false }
Do NOT include clearly out-of-scope people (sales/HR/finance/etc.).
Print only a one-line summary to chat per company: "Company: X in-scope, Y ambiguous". No full records.
