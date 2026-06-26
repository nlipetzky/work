export { runMeetingToRoadmap } from "./meeting-to-roadmap.js";
export { runDecomposeExtractionToSignals } from "./decompose-extraction-to-signals.js";
export { runDecomposeEmailToSignals } from "./decompose-email-to-signals.js";
export { runVaultAutoDraft, type VaultDraftPayload } from "./vault-auto-draft.js";
export { runProposeEmailReply, type EmailSignalEventData } from "./propose-email-reply.js";
export { runBackfillEmailClassification } from "./backfill-email-classification.js";
export { runAddClusterItem } from "./clusters/add-cluster-item.js";
export { runExtractClusterItem } from "./clusters/extract-cluster-item.js";

// Re-export already-ported pipelines
export { runIngestAll } from "./ingest-all.js";
export { runIngestTranscripts } from "./ingest-transcripts.js";
export { runIngestEmails } from "./ingest-emails.js";
export { runIngestDocuments } from "./ingest-documents.js";
export { runIngestUploadedTranscript } from "./ingest-uploaded-transcript.js";
export { runEmailToDecisionQueue } from "./email-to-decision-queue.js";
export { runProcessMeetingIntelligence } from "./process-meeting-intelligence.js";
