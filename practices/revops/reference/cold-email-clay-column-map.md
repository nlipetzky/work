# Lead Gen Jay Clay Template → Engine Stage Map

Source: `LGJ-Insiders-Clay-Template-Standard-Workflow-Default-View` export (2026-06-23). This is one **reference implementation** of cold-email-doctrine pillars 2-3 in Clay. We don't run Clay as our system of record — we own `revops-engine` (Supabase staging → promote, Inngest/n8n). This map tells us which engine stage each Clay column corresponds to, so we know what's already built vs. portable.

## Columns grouped by function

**Identity / source (Apollo raw passthrough)**
`First Name, Last Name, Title, Company Name for Emails, Person Linkedin Url, Website, Company Linkedin Url, first_name, last_name, email, title, organization/phone, city, state, # Employees, Industry, Keywords, City, State, SEO Description, Technologies`
→ Engine: discovery/import. We already have richer company+contact tables.

**Email find + verify (doctrine pillar 2)**
`Email, Find Work Email, Million Verifier, Result, Validate Email, Email (2), Valid Emails, Status, Merged Validated Emails`
→ Engine: `verify-runner.mjs`. This is the 70-80%-valid + catch-all-recovery loop. Clay does it with Million Verifier + a fallback finder; we do it in-engine.

**AI research + qualification (doctrine pillar 2, the 30-50% shrink)**
`Company Data Scraping, AI Text, Info about business / Web extract, Cold Outreach Appropriateness, Qualify / Personalize, Qualified? Next 💪🏻`
→ Engine: `gate-ai-research.mjs` + `classify-runner.mjs`. Same intent: scrape company context, AI-judge fit, drop non-fits before send.

**Personalization angles (doctrine pillar 3 — Kepler's layer)**
`Email Opener, Email Opener Response, Ideal customers, Ideal Customers Response, Past Clients, Past Clients Response, Normalize Company Name, Normalized Past Client Name`
→ NOT in engine. This is the 2-8-word AI snippet generation + relevance/social-proof angle extraction. Hands across to copy.

**Routing into the sequence (doctrine pillar 5)**
`Which Campaign?, Add Lead to Campaign, Add Lead to Campaign (2), Add to Sheet`
→ Engine: `route-runner.mjs` + `export-airtable-payload.mjs`. The handoff into cadence. Doctrine's sending/sequence orchestration is the part we haven't built.

## Read
The Clay table = pillars 2 + 3 stitched into one sheet. Our engine already owns pillar 2 more durably. The genuinely new material Jay's template surfaces is the **personalization-snippet column pattern** (Email Opener / Ideal Customers / Past Clients as discrete, separately-generated fields) — a clean spec for what the copy layer needs as input. The sending side (pillars 1, 5, 6) is in neither Clay export nor our engine; it's the build gap.
