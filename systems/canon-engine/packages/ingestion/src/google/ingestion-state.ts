/**
 * Canon Engine — Ingestion state management via Supabase.
 *
 * Replaces local JSON files (loadState/saveState from gws-shared.ts)
 * with Supabase tables that persist across serverless invocations.
 *
 * Tables: canon_transcript_state, canon_email_state, canon_document_state
 * Target: Canon/UKB Supabase (mzzjvoiwughcnmmqzbxv)
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TranscriptState {
  lastPolledAt: Record<string, string>;
  processedTranscripts: string[];
}

export interface EmailState {
  lastHistoryId: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Transcript state
// ---------------------------------------------------------------------------

/**
 * Load transcript state for a specific account from Supabase.
 */
export async function getTranscriptState(
  supabase: SupabaseClient,
  accountEmail: string,
): Promise<{ lastPolledAt: string | null; processedTranscripts: string[] }> {
  const { data } = await supabase
    .from('canon_transcript_state')
    .select('last_polled_at, processed_transcripts')
    .eq('account_email', accountEmail)
    .single();

  return {
    lastPolledAt: data?.last_polled_at ?? null,
    processedTranscripts: data?.processed_transcripts ?? [],
  };
}

/**
 * Save transcript state for a specific account to Supabase.
 */
export async function saveTranscriptState(
  supabase: SupabaseClient,
  accountEmail: string,
  lastPolledAt: string,
  processedTranscripts: string[],
): Promise<void> {
  await supabase
    .from('canon_transcript_state')
    .upsert(
      {
        account_email: accountEmail,
        last_polled_at: lastPolledAt,
        processed_transcripts: processedTranscripts,
      },
      { onConflict: 'account_email' },
    );
}

// ---------------------------------------------------------------------------
// Email state
// ---------------------------------------------------------------------------

/**
 * Load email state for a specific account from Supabase.
 */
export async function getEmailState(
  supabase: SupabaseClient,
  accountEmail: string,
): Promise<{ lastHistoryId: string | null }> {
  const { data } = await supabase
    .from('canon_email_state')
    .select('last_history_id')
    .eq('account_email', accountEmail)
    .single();

  return {
    lastHistoryId: data?.last_history_id ?? null,
  };
}

/**
 * Save email state for a specific account to Supabase.
 */
export async function saveEmailState(
  supabase: SupabaseClient,
  accountEmail: string,
  lastHistoryId: string,
): Promise<void> {
  await supabase
    .from('canon_email_state')
    .upsert(
      {
        account_email: accountEmail,
        last_history_id: lastHistoryId,
      },
      { onConflict: 'account_email' },
    );
}

// ---------------------------------------------------------------------------
// Document state
// ---------------------------------------------------------------------------

/**
 * Load document state for a specific Drive folder from Supabase.
 */
export async function getDocumentState(
  supabase: SupabaseClient,
  folderId: string,
): Promise<{ processedFileIds: string[] }> {
  const { data } = await supabase
    .from('canon_document_state')
    .select('processed_file_ids')
    .eq('folder_id', folderId)
    .single();

  return {
    processedFileIds: data?.processed_file_ids ?? [],
  };
}

/**
 * Save document state for a specific Drive folder to Supabase.
 */
export async function saveDocumentState(
  supabase: SupabaseClient,
  folderId: string,
  processedFileIds: string[],
): Promise<void> {
  await supabase
    .from('canon_document_state')
    .upsert(
      {
        folder_id: folderId,
        processed_file_ids: processedFileIds,
      },
      { onConflict: 'folder_id' },
    );
}
