# Handoff to Boris: fix Sent (outbound) email ingestion into Canon

From: Atlas (operator-os) · 2026-06-25 · For: agentic-systems (Boris, canon-engine owner)
Atlas inbox: `capture_items` row `c5862f40-4054-4211-8c65-e4bf6267fc7e` (status open, owner agentic-systems)

## Symptom
Nick's **sent** emails aren't reaching Canon. In `canon_engine.public.email_messages`:
- Inbound: 2,467 rows, latest today (`2026-06-25 14:02`). Healthy.
- **Outbound: 80 rows, latest `2026-06-23 14:17` and frozen.**

Concretely: Nick sent Christa Plon two emails on 2026-06-24 (a credentials request + a list of
accounts to open: n8n, Hunter). Neither is in Canon. This surfaced while dogfooding the
Daily-Protocol Runner — the runner asserted a stale next action ("nudge Christa") because it can't
see that Nick already acted.

## Root cause (verified in code)
`systems/canon-engine/packages/ingestion/scripts/gws-fetch-emails.ts` only ever lists the INBOX:
- line ~203: `users.messages.list({ userId: 'me', labelIds: 'INBOX', maxResults: 10 })`
- line ~242: `users.messages.list({ userId: 'me', labelIds: 'INBOX', maxResults: 5 })`

The SENT label is never fetched. The 80 outbound rows that do exist are sent messages that *also*
carried the INBOX label (self-addressed or thread replies that landed in inbox). Genuine Sent-only
mail is structurally invisible. The direction classifier itself is fine
(`isOutbound = from.includes(currentUserEmail)`, line ~64) — it just never sees the messages.

The incremental/history sync path (the `history.list` label-added branch, ~line 130+) has the same
blind spot: it reacts to INBOX label-add events, and sending mail doesn't add an INBOX label.

## Fix (your call on shape; suggested)
1. Fetch SENT alongside INBOX — either a second `messages.list({ labelIds: 'SENT' })` pass, or switch
   to a `q:` query spanning both (e.g. `q: 'newer_than:30d (in:inbox OR in:sent)'`). Dedup is already
   handled by `message_id` upsert.
2. Extend the incremental history sync to process SENT-labeled additions too (or fall back to a
   periodic `newer_than:Nd` sweep that covers both labels), so the leg stays current, not just
   backfilled once.
3. Backfill recent Sent history once after the fix so the last ~30 days of Nick's sent mail lands.

## Watch out (will bite the consumers)
**Direction value casing is inconsistent.** The script writes lowercase
(`direction: isOutbound ? 'outbound' : 'inbound'`, line ~82) but every row currently in the table is
capitalized `Outbound` / `Inbound`. Reconcile on the write side (normalize to one casing) — there are
now consumers that filter on it:
- `projection-ui/lib/protocol/orient.ts` (freshness check, per-direction)
- the runner's next-action email-awareness (being built now) reads recent `Outbound`.

These were written case-insensitively where practical, but the table should settle on one casing.

## Why it matters now
The Daily-Protocol Runner's next-action is being upgraded to cross-reference Nick's recent sent email
("you already emailed Christa — next is to stage the import, not nudge again"). That upgrade is dead
weight until this leg is healthy. This is the unblock.

## Verify when done
`select direction, count(*), max(date) from email_messages group by direction;` — outbound count
climbs and `max(date)` tracks today. Then a fresh protocol run's orient shows `email (sent)` current.
