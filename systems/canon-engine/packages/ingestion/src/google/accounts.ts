/**
 * Canon Engine — Account configuration for Google Workspace ingestion.
 *
 * Ported from gws-shared.ts — same accounts, minus the gwsProfile field.
 * Auth is now handled per-account via createImpersonatedAuth() using
 * a single service account with domain-wide delegation for both orgs.
 */

export interface AccountConfig {
  email: string;
  org: string;
  pipelines: ('transcripts' | 'emails' | 'calendar')[];
  /**
   * When true, ingest the entire mailbox instead of only INBOX +
   * AOS/Ingest-labeled mail. For dedicated addresses (e.g. a partner's
   * prospect-only mailbox) where every message is relevant.
   */
  ingestAll?: boolean;
}

export const ACCOUNTS: AccountConfig[] = [
  { email: 'nick@konstellationai.com', org: 'konstellationai', pipelines: ['transcripts', 'emails', 'calendar'] },
  { email: 'agent_8@konstellationai.com', org: 'konstellationai', pipelines: ['transcripts', 'emails'] },
  { email: 'nick@instig8.ai', org: 'instig8', pipelines: ['transcripts', 'emails', 'calendar'] },
  { email: 'agent_8@instig8.ai', org: 'instig8', pipelines: ['transcripts', 'emails'] },
  // Will's dedicated Konstellation mailbox — partner + prospect comms only,
  // so every message is relevant: ingestAll bypasses the AOS/Ingest gate.
  { email: 'will@konstellationai.com', org: 'konstellationai', pipelines: ['emails', 'calendar', 'transcripts'], ingestAll: true },
];

export const KNOWN_INTERNAL_DOMAINS = ['instig8.ai', 'konstellationai.com'];

/**
 * Classify meeting type from participants and transcript text.
 * Ported from gws-shared.ts.
 */
export function classifyMeeting(participants: string[], text: string): string {
  const textLower = text.toLowerCase().slice(0, 2000);

  if (textLower.includes('standup') || textLower.includes('stand-up')) return 'standup';
  if (textLower.includes('sprint') || textLower.includes('retrospective')) return 'sprint-ceremony';
  if (textLower.includes('interview') || textLower.includes('candidate')) return 'interview';

  return 'client-call';
}

/**
 * Extract the account/client name from meeting participants.
 * Ported from gws-shared.ts.
 */
export function extractAccount(
  participants: string[],
  text: string,
  defaultOrg: string,
): string {
  for (const participant of participants) {
    const emailMatch = participant.match(/@([a-zA-Z0-9.-]+)/);
    if (emailMatch) {
      const domain = emailMatch[1].toLowerCase();
      if (!KNOWN_INTERNAL_DOMAINS.includes(domain)) {
        return domain.split('.')[0];
      }
    }
  }
  return defaultOrg;
}
