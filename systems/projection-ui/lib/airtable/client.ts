import "server-only";
import { getAirtableKey, REVOPS_BASE_ID } from "./config";

const AIRTABLE_BASE = "https://api.airtable.com/v0";

// Sends one PATCH (up to 10 records) to Airtable. Callers must chunk before calling.
// Merges on "Supabase ID" so re-emitting the same event overwrites rather than duplicating.
export async function upsertChunk(
  tableId: string,
  chunk: Array<{ fields: Record<string, unknown> }>,
): Promise<void> {
  if (chunk.length === 0) return;
  const resp = await fetch(`${AIRTABLE_BASE}/${REVOPS_BASE_ID}/${tableId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${getAirtableKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      performUpsert: { fieldsToMergeOn: ["Supabase ID"] },
      records: chunk,
      typecast: true,
    }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Airtable PATCH ${tableId} failed (${resp.status}): ${text}`);
  }
}
