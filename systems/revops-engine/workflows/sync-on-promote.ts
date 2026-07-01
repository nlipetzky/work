import "server-only";
import { inngest } from "../../../capabilities/inngest/client";
import { db } from "../../projection-ui/lib/supabase";
import {
  COMPANIES_TABLE_ID,
  CONTACTS_TABLE_ID,
} from "../../projection-ui/lib/airtable/config";
import { buildFields } from "../../projection-ui/lib/airtable/fieldmaps";
import { upsertChunk } from "../../projection-ui/lib/airtable/client";
import {
  promotedRecords,
  companiesByIds,
  contactsByIds,
  companyNamesByIds,
  type PromotionRef,
} from "../../projection-ui/lib/queries/staging";

const CHUNK_SIZE = 10;

function chunks<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

const TRIGGER = { event: "revops/batch.promoted" as const };
const SHARED = {
  triggers: [TRIGGER],
  // scope:"env" serializes BOTH functions against the shared Airtable base (5 req/s/base ceiling),
  // not just each function against itself. Combined with throttle this stays under the limit.
  concurrency: { scope: "env" as const, key: "'airtable-revops-base'", limit: 1 },
  throttle: { limit: 4, period: "1s" as const },
  retries: 4 as const,
  // No idempotency key on purpose: the /api/staging/resync recovery path re-emits the same
  // batchId+entity event, which an idempotency key would silently drop for 24h. Re-runs are
  // already safe because the Airtable upsert merges on "Supabase ID".
};

export const syncCompaniesOnPromote = inngest.createFunction(
  { id: "sync-companies-on-promote", ...SHARED },
  async ({ event, step }) => {
    const data = event.data as {
      batchId: string;
      entity: string;
    };
    if (data.entity !== "companies") return { skipped: true };
    const { batchId } = data;

    const promotions = (await step.run("load-promoted", () =>
      promotedRecords(batchId, "staging_company"),
    )) as PromotionRef[];

    const ids = promotions.map((p) => p.canonical_record_id);
    const rows = (await step.run("load-rows", () =>
      companiesByIds(ids),
    )) as Record<string, unknown>[];

    const verdictMap = new Map<string, PromotionRef>(
      promotions.map((p) => [p.canonical_record_id, p]),
    );

    const records = rows.map((row) => {
      const ref = verdictMap.get(row.id as string);
      return {
        fields: buildFields(
          "companies",
          row,
          ref?.verdict ?? null,
          ref?.play_name ?? null,
        ),
      };
    });

    const cs = chunks(records, CHUNK_SIZE);
    for (let i = 0; i < cs.length; i++) {
      const c = cs[i];
      await step.run(`upsert-chunk-${i}`, () => upsertChunk(COMPANIES_TABLE_ID, c));
    }

    await step.run("stamp-synced", async () => {
      const { error } = await db
        .from("staging_promotions")
        .update({ airtable_synced_at: new Date().toISOString() })
        .eq("batch_id", batchId)
        .eq("source_record_type", "staging_company");
      if (error) throw new Error(error.message);
    });

    return { entity: "companies", batchId, synced: ids.length };
  },
);

export const syncContactsOnPromote = inngest.createFunction(
  { id: "sync-contacts-on-promote", ...SHARED },
  async ({ event, step }) => {
    const data = event.data as {
      batchId: string;
      entity: string;
    };
    if (data.entity !== "contacts") return { skipped: true };
    const { batchId } = data;

    const promotions = (await step.run("load-promoted", () =>
      promotedRecords(batchId, "staging_contact"),
    )) as PromotionRef[];

    const ids = promotions.map((p) => p.canonical_record_id);
    const rows = (await step.run("load-rows", () =>
      contactsByIds(ids),
    )) as Record<string, unknown>[];

    // Resolve company names from company_id so the Airtable Company link populates
    // (public.contacts has company_id but no company_name).
    const companyIds = rows
      .map((r) => r.company_id as string | null)
      .filter((v): v is string => !!v);
    const companyNames = (await step.run("load-company-names", () =>
      companyNamesByIds(companyIds),
    )) as Record<string, string>;

    const verdictMap = new Map<string, PromotionRef>(
      promotions.map((p) => [p.canonical_record_id, p]),
    );

    const records = rows.map((row) => {
      const ref = verdictMap.get(row.id as string);
      const cid = row.company_id as string | null;
      const cname = cid ? companyNames[cid] : undefined;
      if (cname) row.company_name = cname;
      return {
        fields: buildFields(
          "contacts",
          row,
          ref?.verdict ?? null,
          ref?.play_name ?? null,
        ),
      };
    });

    const cs = chunks(records, CHUNK_SIZE);
    for (let i = 0; i < cs.length; i++) {
      const c = cs[i];
      await step.run(`upsert-chunk-${i}`, () => upsertChunk(CONTACTS_TABLE_ID, c));
    }

    await step.run("stamp-synced", async () => {
      const { error } = await db
        .from("staging_promotions")
        .update({ airtable_synced_at: new Date().toISOString() })
        .eq("batch_id", batchId)
        .eq("source_record_type", "staging_contact");
      if (error) throw new Error(error.message);
    });

    return { entity: "contacts", batchId, synced: ids.length };
  },
);
