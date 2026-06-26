/**
 * Canon — Drive document ingestion pipeline.
 * Ported from workflows/canon/ingest-documents.ts (Inngest wrapper removed).
 * Polls Google Drive folders for new documents, enriches, chunks, embeds.
 *
 * Folders configured via CANON_DRIVE_FOLDER_IDS (comma-separated).
 * Falls back to CANON_DRIVE_FOLDER_ID for backward compatibility.
 */
import { fetchDocuments } from "@canon-engine/ingestion/google";
import { createDocumentEnricher } from "@canon-engine/ingestion/pipelines/adapters/index.js";
import { createCanonDeps } from "./deps.js";

function resolveFolderIds(): string[] {
  const multi = (process.env.CANON_DRIVE_FOLDER_IDS ?? "").trim();
  if (multi) return multi.split(",").map((id) => id.trim()).filter(Boolean);
  const single = (process.env.CANON_DRIVE_FOLDER_ID ?? "").trim();
  if (single) return [single];
  return [];
}

export async function runIngestDocuments(): Promise<{
  ingested: number;
  skipped: number;
  errors: string[];
}> {
  const folderIds = resolveFolderIds();
  if (folderIds.length === 0) {
    throw new Error(
      "No Drive folders configured. Set CANON_DRIVE_FOLDER_IDS (comma-separated) or CANON_DRIVE_FOLDER_ID.",
    );
  }

  let totalIngested = 0;
  let totalSkipped = 0;
  const allErrors: string[] = [];

  for (const folderId of folderIds) {
    const deps = createCanonDeps(createDocumentEnricher);
    const result = await fetchDocuments(deps, deps.supabase, folderId);
    totalIngested += result.ingested;
    totalSkipped += result.skipped;
    allErrors.push(...result.errors);
  }

  if (totalIngested > 0) {
    console.log(
      `[ingest-documents] ${folderIds.length} folder(s): ` +
        `Ingested ${totalIngested} doc(s), ${totalSkipped} skipped, ${allErrors.length} error(s)`,
    );
  }

  return { ingested: totalIngested, skipped: totalSkipped, errors: allErrors };
}
