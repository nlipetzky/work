# Contact Enrichment Brief (APPROVED paid run, Nick's keys only)

The user has APPROVED enriching the contacts in the worklist (up to 8 per company, 117 total).
Proceed without asking for further confirmation. All spend is on Nick's own API keys
(Apollo, Apify, Hunter) — zero Deepline credits. Do NOT call any Deepline-billed provider
(no exa, deeplineagent, crustdata, deepline_native).

Worklist file: /Users/nplmini/code/work/accounts/clients/teknova/data/ngabs-delivery-2026-06-05/enrich-worklist.json
Process ONLY the companies assigned to you in your task. Read the worklist, filter to your companies.

## Tools (load via ToolSearch as needed)
- Apollo enrich: select:mcp__36fa7dcb-8cad-4296-9d0b-127dea39801c__apollo_people_match
- Apify LinkedIn: select:mcp__Apify__call-actor
- Hunter verify: Bash -> `deepline tools execute hunter_email_verifier --payload '{"email":"EMAIL"}'`

## Per contact (each row in your assigned worklist slice)
1. APOLLO ENRICH: apollo_people_match with id=<apollo_id>. Use a stable _conversation_ref
   (e.g. "ngabsenrich"), generic _rationale. From the result capture:
   first_name, last_name, name, title, linkedin_url, email, email_status,
   and the CURRENT employer from employment_history (the entry with current=true).
2. EMPLOYMENT VERIFY (Apify): call-actor apimaestro/linkedin-profile-detail with
   input {"username": <linkedin_url>}. From the result read basic_info.current_company and the
   experience entry with is_current=true. Set:
   - employment_verification_state = "verified" if current company matches the target company
     (fuzzy/substring match, allow rebrands), "moved" if clearly a different employer,
     "unconfirmed" if no usable data. Also grab the true full name (last name) if Apollo's was masked.
   - If no linkedin_url from Apollo, set "unconfirmed" and skip Apify for that row.
3. EMAIL VERIFY (Hunter): if Apollo returned an email, run hunter_email_verifier on it.
   Capture the status/result field (e.g. deliverable, risky, undeliverable). If no email, "no email".

## Output — write a CSV to your assigned output path with EXACTLY these columns:
Company Table Data,Company Domain,First Name,Last Name,Full Name,Job Title,Location,LinkedIn Profile,Work Email,Validate Email,Employment Verification State,In Committee Scope,Committee Scope,Enrichment Run Notes
- Company Table Data = company name; Company Domain = domain
- In Committee Scope = "yes" (all are title-matched in-scope)
- Committee Scope = the worklist "bucket" value
- Validate Email = Hunter status; Employment Verification State = step 2 result
- Enrichment Run Notes = any flag (e.g. "moved to X", "no email", "parent-domain caveat", "org rebrand: Apollo shows <name>")
Use python's csv writer for correct quoting. One row per contact you processed.

## Return to chat (short): counts only — enriched, emails found, deliverable, still-employed, moved. No full records.
