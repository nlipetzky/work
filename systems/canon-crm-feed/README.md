# canon-crm-feed

Inngest projection that keeps Nick's CRM (Airtable `app5tsy6zjfA8H3rx`) true by deriving
state from Canon Engine ground truth ... instead of hand-asserting it. First system under
`work/systems/`.

## Model

Canon is the event log (truth). The CRM is a derived surface. `Stage` and `Waiting On` are a
*reduction over the event log*, not typed by hand. This function keeps the projection true.

## Architecture

- `src/lib/derive.ts` ... pure, deterministic projection (events -> Stage + Waiting On + basis).
  The trust-critical core. No I/O, unit-testable. Honors manual locks (human override wins).
- `src/lib/canon.ts` ... reads transcripts + email_threads from Canon (Supabase).
- `src/lib/airtable.ts` ... reads tracked prospects, writes derived state to the CRM.
- `src/functions/canon-events-to-crm.ts` ... the Inngest function. Dual trigger (event + cron
  catch-up), step shape fetch -> derive -> write, idempotent, basis stamped.
- `src/server.ts` ... express serve handler for the dev server to discover.

Pattern distilled from the archived `@aos` monorepo:
`work/practices/agentic-systems/reference/inngest-projection-pattern.md`.

## Build order (validation-first)

1. **Validate `derive()` against the two live deals BEFORE trusting the loop.** Rahr should land
   `Diagnostic` + `Waiting On = Partner` (Will owns it; Jari's 2026-06-04 inbound is unanswered).
   If it doesn't, fix rules, not plumbing.
2. Replace the v1 in-code identity map (`ACCOUNT_KEYS` in `airtable.ts`) with a real key on the
   Airtable Prospect (a "Canon Account" / domain field) and/or Canon `domain_lookup`.
3. Wire `proposalSent` to the Artifacts table (type = Proposal, status = sent).
4. Re-point the (now-disabled) `canon_events_wake_bridge` trigger to forward an Inngest event
   (`canon/event.received`) instead of firing Paperclip ... gives real-time triggering.
5. Add the `daily-partner-digest` cron function once state is trusted.

## Run (local)

```bash
cp .env.example .env   # fill keys
npm install
npm run start          # serves /api/inngest on :3939
npx inngest-cli@latest dev -u http://localhost:3939/api/inngest
```

## Validated finding (2026-06-04)

`account_name` in Canon is **workspace-level, not deal-level** (all 48 transcripts =
"konstellationai"; emails mostly null/workspace). Matching on it over-attributes everything to
one deal. **Identity is therefore by email DOMAIN**, stored on the Prospect ("Canon Domain" field,
`fldES4P7yPeZ7A6CU`). Rahr = `rahrbsg.com`. Absolute has no Canon comms (relationship is via Larry),
so it has no domain and is skipped until comms are captured.

Hand-validated against Rahr: latest email = 2026-06-04 inbound (Jari), owner = Will →
`Waiting On = Partner` (correct). `Stage = In Conversation` (under-reported; see below).

## Known v1 limitations (Waiting On trustworthy; Stage not yet)

- **Transcripts can't be domain-matched** (participants are names, not emails), so meetings are
  invisible to derive → meeting-based Stage under-reports. Solve transcript→deal resolution next.
- `Waiting On` is sound now (email-direction + owner, fully domain-resolvable).
- `proposalSent` always false until wired to Artifacts.
- Real-time trigger not wired ... cron catch-up only until the canon_events forward is built.
