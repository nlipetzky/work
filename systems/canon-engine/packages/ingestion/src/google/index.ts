/**
 * Canon Engine — Google API barrel export.
 *
 * Cloud-native replacements for gws CLI operations.
 */

export { createImpersonatedAuth, GMAIL_READONLY, DRIVE_READONLY, MEET_READONLY } from './auth.js';
export { listConferenceRecords, listTranscripts, getTranscript, listParticipants } from './meet.js';
export { exportFile, listFolderFiles, downloadFile, EXPORTABLE_MIME_TYPES } from './drive.js';
export {
  listHistory,
  getMessage,
  listRecentMessages,
  listLabels,
  parseGmailMessage,
  extractMessageIdsFromHistory,
} from './gmail.js';
export {
  getTranscriptState, saveTranscriptState,
  getEmailState, saveEmailState,
  getDocumentState, saveDocumentState,
} from './ingestion-state.js';
export { ACCOUNTS, KNOWN_INTERNAL_DOMAINS, classifyMeeting, extractAccount } from './accounts.js';
export { fetchTranscripts } from './fetch-transcripts.js';
export { fetchEmails } from './fetch-emails.js';
export { fetchDocuments } from './fetch-documents.js';
