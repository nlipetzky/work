# Teknova — Accounts & Tools to Set Up

These are the accounts Teknova needs to own so the workflows run on your own
infrastructure after transfer. Grouped by required, already-have, and retiring.
Once these are set up and the API keys are shared, the workflows can be wired up
and run themselves — no ongoing build work.

## Required — subscribe / set up and share an API key

1. **n8n (cloud)** — the automation platform. Every workflow runs here.
   - Action: add/invite `nick@konstellationai.com` as an **admin** user so the
     workflows can be imported and connected. This is the one that unblocks
     everything else.

2. **Anthropic (Claude API)** — powers the AI steps (company classification and
   enrichment summaries).
   - Action: create an account at console.anthropic.com, add billing, generate
     an API key.

3. **Apollo.io** — contact and company sourcing (finding the right people at
   target companies).
   - Action: paid plan that includes API access, then generate an API key.

4. **Email verification — Hunter.io _or_ ZeroBounce** — finds and verifies
   contact email addresses so you're not sending to bad data. Either one works;
   pick one.
   - Action: create the account, choose a credit/volume tier, generate an API key.

5. **Apify** — pulls live LinkedIn profile data (role/employer verification and
   enrichment).
   - Action: create an account, add billing for the LinkedIn actor usage,
     generate an API token.

## Already have — confirm access, no new subscription

- **Salesforce** — your CRM and the source of account/contact history. The sync
  workflows read from and write to it; no new account, just confirm API access.
- **Airtable** — your data delivery and operating surface (the cleaned,
  role-specific views). Confirm the Teknova workspace and team seats.

## Retiring — no go-forward subscription

- **Clay** — tables are being exported to CSV for archival; not needed going
  forward.
- _(Internal build tooling used during the project is being removed from your
  system, not transferred — nothing for you to set up.)_

## Optional — only if you keep these signals

- **Perplexity API** — only needed if you keep the trade-press signal workflow.
- **Public data APIs** (PubMed, USPTO / PatentsView, ClinicalTrials.gov) — free;
  some need a free API key registered.

---
*Step-by-step setup instructions for each will follow once accounts are created.
The fastest unblock is the n8n admin invite — that's what kicks off the transfer.*
