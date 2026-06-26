/**
 * @aos/pipelines — Canon ingestion pipeline.
 *
 * Steps:
 * 1. Detect change in Canon vault (file watcher / git hook)
 * 2. Parse YAML frontmatter + markdown body
 * 3. Extract [[wiki-links]] from body
 * 4. Chunk content
 * 5. Generate embeddings
 * 6. Upsert chunks to Supabase pgvector (source_type = "canon")
 *
 * Canon docs use source_path (file path) not source_id (UUID).
 * Old chunks are deleted by source_type + source_path before re-inserting.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { CanonFrontmatter, CanonStatus, CanonDocumentType, Volatility } from '../types/canon-types/index.js';
import type { EmbeddingClient } from './embeddings.js';
import { formatVector } from './embeddings.js';
import { chunkText } from './chunker.js';
import { validateFrontmatter } from '../validation/index.js';
import type { ValidationError } from '../validation/index.js';
import type { CanonEventEmitter } from '../events/event-emitter.js';

// TODO: Replace `any` with generated Database type after running `supabase gen types`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UKBClient = SupabaseClient<any>;

// ---------------------------------------------------------------------------
// Types (pipeline-specific — shared types live in @instig8/canon-types)
// ---------------------------------------------------------------------------

export interface ParsedCanonDocument {
  frontmatter: CanonFrontmatter;
  body: string;
  wikiLinks: string[];
  filePath: string;
}

export interface CanonSyncResult {
  filePath: string;
  chunksInserted: number;
  documentPath: string;
  /** Present when frontmatter validation failed — no chunks were inserted */
  validationErrors?: ValidationError[];
}

// ---------------------------------------------------------------------------
// Frontmatter parsing
// ---------------------------------------------------------------------------

/**
 * Parse YAML frontmatter from a markdown file.
 * Expects --- delimiters.
 */
export function parseFrontmatter(content: string): {
  frontmatter: Record<string, unknown>;
  body: string;
} {
  const fmRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;
  const match = content.match(fmRegex);

  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const rawYaml = match[1];
  const body = match[2];

  // Simple YAML parser — handles flat key: value and lists
  const frontmatter: Record<string, unknown> = {};
  const lines = rawYaml.split('\n');
  let currentKey = '';

  for (const line of lines) {
    const kvMatch = line.match(/^(\w[\w_]*)\s*:\s*(.*)$/);
    if (kvMatch) {
      currentKey = kvMatch[1];
      const value = kvMatch[2].trim();

      if (value.startsWith('[') && value.endsWith(']')) {
        // Inline list: [item1, item2]
        frontmatter[currentKey] = value
          .slice(1, -1)
          .split(',')
          .map((s) => s.trim().replace(/^["']|["']$/g, ''));
      } else if (value === '') {
        // Could be a block list — check next lines
        frontmatter[currentKey] = [];
      } else {
        frontmatter[currentKey] = parseYamlValue(value);
      }
    } else if (line.match(/^\s+-\s+(.*)/) && currentKey) {
      // List item under current key
      const itemMatch = line.match(/^\s+-\s+(.*)/)!;
      const arr = frontmatter[currentKey];
      if (Array.isArray(arr)) {
        arr.push(itemMatch[1].trim().replace(/^["']|["']$/g, ''));
      }
    }
  }

  return { frontmatter, body };
}

function parseYamlValue(value: string): string | number | boolean {
  if (value === 'true') return true;
  if (value === 'false') return false;
  const num = Number(value);
  if (!isNaN(num) && value.length > 0) return num;
  return value.replace(/^["']|["']$/g, '');
}

// ---------------------------------------------------------------------------
// Wiki-link extraction
// ---------------------------------------------------------------------------

/**
 * Extract all [[wiki-links]] from markdown body.
 * Returns unique document names (without [[ ]]).
 */
export function extractWikiLinks(body: string): string[] {
  const linkRegex = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
  const links = new Set<string>();
  for (const m of body.matchAll(linkRegex)) {
    links.add(m[1].trim());
  }
  return Array.from(links);
}

// ---------------------------------------------------------------------------
// Document parsing
// ---------------------------------------------------------------------------

/**
 * Parse a Canon markdown file into structured form.
 */
export function parseCanonDocument(
  content: string,
  filePath: string,
): ParsedCanonDocument {
  const { frontmatter: raw, body } = parseFrontmatter(content);
  const wikiLinks = extractWikiLinks(body);

  const frontmatter: CanonFrontmatter = {
    title: (raw.title as string) || filePath.split('/').pop()?.replace('.md', '') || 'Untitled',
    type: (raw.type as CanonDocumentType) || ('unknown' as CanonDocumentType),
    workspace_account: (raw.org as string) || 'instig8',
    client: raw.client as string | undefined,
    project: raw.project as string | undefined,
    owner: raw.owner as string | undefined,
    status: (raw.status as CanonStatus) || 'draft',
    volatility: (raw.volatility as Volatility) || 'moderate',
    confidence: raw.confidence as number | undefined,
    source_events: raw.source_events as string[] | undefined,
    source_context: raw.source_context as string | undefined,
    created: raw.created as string | undefined,
    updated: raw.updated as string | undefined,
    superseded_by: raw.superseded_by as string | undefined,
    tags: (raw.tags as string[]) || [],
  };

  return { frontmatter, body, wikiLinks, filePath };
}

// ---------------------------------------------------------------------------
// Pipeline entry point
// ---------------------------------------------------------------------------

/**
 * Ingest a Canon document: validate → parse → chunk → embed → Supabase pgvector.
 *
 * Validates raw frontmatter BEFORE proceeding. If validation fails, returns
 * early with validationErrors and 0 chunks inserted. This catches missing
 * required fields that parseCanonDocument() would silently default.
 *
 * Optionally emits audit events (validate, sync, error) when an emitter is provided.
 */
export async function ingestCanonDocument(
  content: string,
  filePath: string,
  deps: {
    supabase: UKBClient;
    embeddings: EmbeddingClient;
    emitter?: CanonEventEmitter;
  },
): Promise<CanonSyncResult> {
  const { supabase, embeddings, emitter } = deps;
  const documentPath = filePath.replace(/^.*\/canon\//, '/');

  // Step 1: Validate raw frontmatter before parsing defaults it
  const { frontmatter: raw } = parseFrontmatter(content);
  const validation = validateFrontmatter(raw, filePath);

  if (emitter) {
    await emitter.emit({
      eventType: 'validate',
      sourceType: 'canon',
      sourceRef: documentPath,
      payload: { valid: validation.valid, errors: validation.errors },
    });
  }

  if (!validation.valid) {
    return {
      filePath,
      chunksInserted: 0,
      documentPath,
      validationErrors: validation.errors,
    };
  }

  // Step 2: Parse full document (frontmatter + body + wiki-links)
  const doc = parseCanonDocument(content, filePath);
  const chunks = chunkText(doc.body);

  if (chunks.length === 0) {
    return { filePath, chunksInserted: 0, documentPath };
  }

  // Step 3: Generate embeddings for all chunks
  const chunkTexts = chunks.map((c) => c.text);
  const embeddingVectors = await embeddings.embed(chunkTexts);

  // Step 4: Delete old chunks for this Canon document (by source_path)
  await supabase
    .from('chunks')
    .delete()
    .eq('source_type', 'canon')
    .eq('source_path', documentPath);

  // Step 5: Insert new chunks
  const chunkRows = chunks.map((chunk, i) => ({
    source_type: 'canon' as const,
    source_path: documentPath,
    account_name: doc.frontmatter.client || doc.frontmatter.workspace_account,
    chunk_index: chunk.index,
    chunk_text: chunk.text,
    embedding: formatVector(embeddingVectors[i]),
    title: doc.frontmatter.title,
    document_path: documentPath,
    document_type: doc.frontmatter.type,
    tags: (doc.frontmatter.tags || []).join(', '),
    topics: null,
  }));

  const { error: chunksError } = await supabase.from('chunks').insert(chunkRows);

  if (chunksError) {
    if (emitter) {
      await emitter.emit({
        eventType: 'error',
        sourceType: 'canon',
        sourceRef: documentPath,
        payload: { error: chunksError.message },
      });
    }
    throw new Error(`Failed to insert Canon chunks: ${chunksError.message}`);
  }

  if (emitter) {
    await emitter.emit({
      eventType: 'sync',
      sourceType: 'canon',
      sourceRef: documentPath,
      payload: { chunksInserted: chunks.length },
    });
  }

  return {
    filePath,
    chunksInserted: chunks.length,
    documentPath,
  };
}
