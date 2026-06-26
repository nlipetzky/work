import { randomUUID } from "node:crypto";
import { getCanonSupabase } from "../deps.js";
import {
  createEmbeddingClient,
  formatVector,
} from "@canon-engine/ingestion/pipelines/embeddings.js";

const CHUNK_SIZE_CHARS = 3000;
const CHUNK_OVERLAP_CHARS = 400;
const EMBEDDING_BATCH_SIZE = 100;

interface ExtractedContent {
  title: string | null;
  text: string;
}

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE_CHARS, text.length);
    chunks.push(text.slice(start, end));
    if (end === text.length) break;
    start = end - CHUNK_OVERLAP_CHARS;
  }
  return chunks;
}

async function extractFromUrl(url: string): Promise<ExtractedContent> {
  const res = await fetch(url, {
    headers: { "User-Agent": "canon-engine/1.0 (content-ingestion)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  const html = await res.text();
  // Strip HTML tags — good enough for most pages
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return { title: null, text };
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

async function extractFromYoutube(
  url: string,
  item_title: string | null,
): Promise<ExtractedContent> {
  // youtube-transcript is CJS/ESM dual-published; dynamic import so the module
  // is optional at build time and only required at runtime.
  let YoutubeTranscript: {
    YoutubeTranscript: { fetchTranscript: (url: string) => Promise<Array<{ text: string }>> };
  };
  try {
    YoutubeTranscript = await import("youtube-transcript");
  } catch {
    throw new Error("youtube-transcript package not installed");
  }
  const segments = await YoutubeTranscript.YoutubeTranscript.fetchTranscript(url);
  const text = decodeEntities(segments.map((s) => s.text).join(" ").replace(/\s+/g, " ").trim());
  return { title: item_title, text };
}

async function extractText(args: {
  source_type: string;
  upload_kind: string | null;
  external_uri: string | null;
  item_title: string | null;
}): Promise<ExtractedContent> {
  const { source_type, upload_kind, external_uri, item_title } = args;
  const kind = (upload_kind ?? source_type ?? "").toLowerCase();

  switch (kind) {
    case "url":
      if (!external_uri) throw new Error("url source has no external_uri");
      return extractFromUrl(external_uri);

    case "youtube":
      if (!external_uri) throw new Error("youtube source has no external_uri");
      return extractFromYoutube(external_uri, item_title);

    case "paste":
      if (!external_uri || external_uri.trim().length === 0) {
        throw new Error("paste source has no content in external_uri");
      }
      return { title: item_title, text: external_uri };

    case "pdf":
    case "md":
    case "txt":
    case "upload":
      throw new Error("File upload extraction not yet implemented");

    case "audio":
      throw new Error("Audio transcription extraction not yet implemented");

    default:
      throw new Error(`Unknown source kind: ${kind}`);
  }
}

export async function runExtractClusterItem(args: {
  cluster_id: string;
  item_id: string;
  source_type: string;
  external_uri: string | null;
  upload_kind: string | null;
}): Promise<
  | { status: "already_ready"; item_id: string }
  | { status: "ready"; item_id: string; source_id: string; chunk_count: number }
  | { status: "error"; item_id: string; error: string }
> {
  const { cluster_id, item_id, source_type, external_uri, upload_kind } = args;
  const supabase = getCanonSupabase();

  const { data: item, error: itemError } = await supabase
    .from("cluster_items")
    .select("id, cluster_id, source_type, source_id, title, external_uri, upload_kind, status")
    .eq("id", item_id)
    .eq("cluster_id", cluster_id)
    .single();

  if (itemError || !item) {
    throw new Error(`cluster_item not found: ${item_id} (${itemError?.message ?? "no data"})`);
  }

  if (item.status === "ready") {
    return { status: "already_ready", item_id };
  }

  try {
    const extracted = await extractText({
      source_type,
      upload_kind,
      external_uri: external_uri ?? item.external_uri,
      item_title: item.title,
    });

    if (!extracted.text || extracted.text.trim().length === 0) {
      throw new Error("Extraction produced no text");
    }

    const chunks = chunkText(extracted.text);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY env var not set");

    const embeddingClient = createEmbeddingClient(apiKey);
    const embeddings: number[][] = [];
    for (let i = 0; i < chunks.length; i += EMBEDDING_BATCH_SIZE) {
      const batch = chunks.slice(i, i + EMBEDDING_BATCH_SIZE);
      const vectors = await embeddingClient.embed(batch);
      embeddings.push(...vectors);
    }

    if (embeddings.length !== chunks.length) {
      throw new Error(
        `Embedding count mismatch: ${embeddings.length} vectors for ${chunks.length} chunks`,
      );
    }

    const sourceId = randomUUID();
    const resolvedTitle = extracted.title ?? item.title ?? external_uri ?? "Untitled";

    const rows = chunks.map((chunk_text, idx) => ({
      source_type,
      source_id: sourceId,
      title: resolvedTitle,
      chunk_text,
      chunk_index: idx,
      embedding: formatVector(embeddings[idx]),
      meeting_date: null,
      participants: null,
      speaker: null,
      from_address: null,
      subject: null,
      document_type: null,
    }));

    const { error: insertError } = await supabase.from("chunks").insert(rows);
    if (insertError) throw new Error(`chunks insert failed: ${insertError.message}`);

    const { error: readyError } = await supabase
      .from("cluster_items")
      .update({
        status: "ready",
        source_id: sourceId,
        title: resolvedTitle,
        error_message: null,
      })
      .eq("id", item_id);
    if (readyError) throw new Error(`Failed to mark item ready: ${readyError.message}`);

    return { status: "ready", item_id, source_id: sourceId, chunk_count: chunks.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await supabase
      .from("cluster_items")
      .update({ status: "error", error_message: message })
      .eq("id", item_id);
    return { status: "error", item_id, error: message };
  }
}
