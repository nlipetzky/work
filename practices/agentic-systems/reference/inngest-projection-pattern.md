# Inngest Projection Pattern (distilled from archived @aos monorepo)

Source: `~/code/ARCHIVE/aos` (one-time authorized read, 2026-06-04). This is the *pattern*,
not a live source. The archive has 141 Inngest functions on client id `aos`; several are
exactly the "Canon event → derived surface" shape we want for the CRM feed.

Closest analogs read: `workflows/canon/email-to-decision-queue.ts`,
`workflows/canon/meeting-to-roadmap.ts`. Identity-resolution analog: `sync/pearl-link-companies.ts`.

## Client

```ts
export const inngest = new Inngest({
  id: "aos",
  middleware: [workflowEngineMiddleware],   // instrumentation + governance
});
```

## The projection template (house style)

```ts
export const canonXToSurface = inngest.createFunction(
  { id: "canon-...-to-...", name: "...", retries: 2, concurrency: { limit: 1 } },
  [
    { event: "canon/..." },   // PRIMARY: event-driven, fires per Canon event
    { cron: "30 */4 * * *" }, // FALLBACK: scheduled catch-up / reconcile
  ],
  async ({ event, step }) => {
    const items   = await step.run("fetch-...",          async () => { /* read Canon (supabase) */ });
    const fresh   = await step.run("filter-already-...", async () => { /* dedup vs target = idempotency */ });
    await step.run("write-...", async () => { /* upsert into surface */ });
  }
);
```

## Patterns worth copying (they match the design we already agreed)

- **Dual trigger (event + cron).** Every projection fires on the Canon event *and* has a cron
  catch-up. This is the "event-driven primary, scheduled reconcile" model we chose. Already standard.
- **Step shape: fetch → filter-already-done → write.** The middle "filter-already-queued" step
  IS the idempotency guard. For us: fetch events for prospect → derive desired state → upsert if changed.
- **Lineage / back-reference.** `meeting-to-roadmap` writes roadmap rows, then stamps the source
  extraction with `aos_roadmap_item_ids` so it never reproduces. That's our "record the basis +
  idempotent" requirement, already solved.
- **Read Canon, write operational store.** Reads come from Canon tables; writes go through a
  separate operational Supabase (`getAosOperationalSupabase()`). For us the write target is
  Airtable instead ... same shape, swap the writer.
- **approval_queue primitive.** Some functions write to an `approval_queue` for human sign-off
  before committing. We chose auto-derive, so we skip it ... but the override/approval primitive
  exists if we want a manual lock later.
- **Semantic vs deterministic.** `meeting-to-roadmap` uses `generateObject` + zod + Anthropic for
  LLM extraction. We chose auto-derived (deterministic) for Stage/Waiting On, so prefer plain
  logic / SQL for state; reserve the LLM path for genuinely semantic fields.

## Our CRM-feed function, in this idiom

A new `canon-events-to-crm` projection: trigger on the relevant `canon/*` event (+ cron catch-up)
→ resolve account/prospect (reuse `domain_lookup` + `account_name`, like the wake bridge) →
derive `Stage` + `Waiting On` deterministically from the prospect's event cluster → upsert Airtable
Prospects + Events, idempotent on the Canon source id, stamping the basis event back.

## Open architecture question (unresolved)

The archive is a *predecessor*. The live dev server currently serves **0 functions**, and the live
Canon reactive path uses the `paperclip-wake-bridge` edge function firing Paperclip agent routines
(`paperclip_routing` + `wake_log`), NOT these Inngest functions. So there are two generations:
(1) this Inngest projection layer, (2) the live Paperclip-wake + agent model. Decide which the CRM
feed builds on before writing code. Boris's lean: deterministic projection wants the Inngest/code
path, not the non-deterministic agent wake.

## See also

This doc covers the orchestration side of the projection (when the function runs, what shape it
takes, how it stays idempotent). The data side ... how the records, runs, and provenance get linked
so the work is visible ... lives in [observability-projection-pattern.md](./observability-projection-pattern.md).
Together they describe the full projection: orchestration runs the work, the data layer makes it legible.
