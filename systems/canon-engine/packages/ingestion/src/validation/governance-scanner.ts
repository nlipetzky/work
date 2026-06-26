/**
 * Canon Engine — Proactive governance scanner.
 * Roadmap item X4. The "Tap on the Shoulder" pattern.
 *
 * Scheduled checks that actively surface governance issues instead of
 * waiting for someone to discover them:
 * - Stale drafts (draft status older than N days)
 * - Broken supersession chains
 * - Missing obligation registers for known accounts
 * - Overdue obligations (past target date, not complete)
 */

import type { CanonFrontmatter, ObligationRegister } from '../types/canon-types/index.js';
import type { CanonEventEmitter } from '../events/event-emitter.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GovernanceFinding {
  category: 'stale-draft' | 'broken-chain' | 'missing-register' | 'overdue-obligation' | 'orphan-superseded';
  severity: 'error' | 'warning' | 'info';
  message: string;
  filePath?: string;
  account?: string;
  details?: Record<string, unknown>;
}

export interface ScanResult {
  findings: GovernanceFinding[];
  scannedAt: string;
  stats: {
    documentsScanned: number;
    accountsChecked: number;
    findingsCount: number;
  };
}

export interface ScanConfig {
  /** Days after which a draft is considered stale (default: 30) */
  staleDraftDays: number;
  /** Known accounts that should have obligation registers */
  knownAccounts: string[];
}

const DEFAULT_CONFIG: ScanConfig = {
  staleDraftDays: 30,
  knownAccounts: [],
};

// ---------------------------------------------------------------------------
// Individual scanners
// ---------------------------------------------------------------------------

/**
 * Find Canon documents stuck in 'draft' status for too long.
 */
export function findStaleDrafts(
  documents: Array<{ filePath: string; frontmatter: CanonFrontmatter }>,
  staleDraftDays: number,
): GovernanceFinding[] {
  const findings: GovernanceFinding[] = [];
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - staleDraftDays);

  for (const doc of documents) {
    if (doc.frontmatter.status !== 'draft') continue;

    const created = doc.frontmatter.created || doc.frontmatter.updated;
    if (!created) {
      findings.push({
        category: 'stale-draft',
        severity: 'info',
        message: `Draft document has no created/updated date — cannot determine staleness`,
        filePath: doc.filePath,
      });
      continue;
    }

    const createdDate = new Date(created);
    if (createdDate < cutoff) {
      const daysOld = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      findings.push({
        category: 'stale-draft',
        severity: 'warning',
        message: `Draft document is ${daysOld} days old (threshold: ${staleDraftDays} days)`,
        filePath: doc.filePath,
        details: { created, daysOld },
      });
    }
  }

  return findings;
}

/**
 * Find broken supersession chains:
 * - superseded_by points to non-existent file
 * - status is 'superseded' but no superseded_by field
 * - superseded_by is set but status is not 'superseded'
 */
export function findBrokenSupersessionChains(
  documents: Array<{ filePath: string; frontmatter: CanonFrontmatter }>,
): GovernanceFinding[] {
  const findings: GovernanceFinding[] = [];
  const allPaths = new Set(documents.map((d) => d.filePath));

  for (const doc of documents) {
    const { frontmatter, filePath } = doc;

    if (frontmatter.superseded_by && !allPaths.has(frontmatter.superseded_by)) {
      findings.push({
        category: 'broken-chain',
        severity: 'error',
        message: `superseded_by references '${frontmatter.superseded_by}' which does not exist`,
        filePath,
      });
    }

    if (frontmatter.status === 'superseded' && !frontmatter.superseded_by) {
      findings.push({
        category: 'orphan-superseded',
        severity: 'warning',
        message: `Status is 'superseded' but no superseded_by field — chain is broken`,
        filePath,
      });
    }
  }

  return findings;
}

/**
 * Find accounts that should have obligation registers but don't.
 */
export function findMissingRegisters(
  knownAccounts: string[],
  accountsWithRegisters: string[],
): GovernanceFinding[] {
  const findings: GovernanceFinding[] = [];
  const hasRegister = new Set(accountsWithRegisters);

  for (const account of knownAccounts) {
    if (!hasRegister.has(account)) {
      findings.push({
        category: 'missing-register',
        severity: 'warning',
        message: `Account '${account}' has no obligation register`,
        account,
      });
    }
  }

  return findings;
}

/**
 * Find overdue obligations (past target date, not complete).
 */
export function findOverdueObligations(
  registers: ObligationRegister[],
): GovernanceFinding[] {
  const findings: GovernanceFinding[] = [];
  const now = new Date();

  for (const register of registers) {
    for (const obligation of register.obligations) {
      if (obligation.status === 'complete') continue;

      // Try to parse the target as a date or "Week N" format
      const targetDate = parseTargetDate(obligation.target);
      if (targetDate && targetDate < now) {
        const daysOverdue = Math.floor((now.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));
        findings.push({
          category: 'overdue-obligation',
          severity: obligation.priority === 'P1' ? 'error' : 'warning',
          message: `Obligation "${obligation.name}" for ${register.account} is ${daysOverdue} days overdue (target: ${obligation.target}, status: ${obligation.status})`,
          account: register.account,
          details: {
            obligationNumber: obligation.number,
            priority: obligation.priority,
            target: obligation.target,
            status: obligation.status,
            daysOverdue,
          },
        });
      }
    }
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Full scan
// ---------------------------------------------------------------------------

/**
 * Run the complete governance scan.
 */
export function runGovernanceScan(
  documents: Array<{ filePath: string; frontmatter: CanonFrontmatter }>,
  registers: ObligationRegister[],
  accountsWithRegisters: string[],
  config: Partial<ScanConfig> = {},
): ScanResult {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const findings: GovernanceFinding[] = [];

  findings.push(...findStaleDrafts(documents, cfg.staleDraftDays));
  findings.push(...findBrokenSupersessionChains(documents));
  findings.push(...findMissingRegisters(cfg.knownAccounts, accountsWithRegisters));
  findings.push(...findOverdueObligations(registers));

  return {
    findings,
    scannedAt: new Date().toISOString(),
    stats: {
      documentsScanned: documents.length,
      accountsChecked: cfg.knownAccounts.length,
      findingsCount: findings.length,
    },
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Try to parse a target string into a Date.
 * Handles ISO dates and "Week N" / "W12" formats (relative to current year).
 */
function parseTargetDate(target: string): Date | null {
  if (!target) return null;

  // Try ISO date
  const isoDate = new Date(target);
  if (!isNaN(isoDate.getTime()) && target.includes('-')) return isoDate;

  // Try "Week N" or "W12" format
  const weekMatch = target.match(/(?:week|w)\s*(\d+)/i);
  if (weekMatch) {
    const weekNum = parseInt(weekMatch[1], 10);
    const year = new Date().getFullYear();
    // Approximate: week 1 starts Jan 1
    const date = new Date(year, 0, 1 + (weekNum - 1) * 7);
    return date;
  }

  return null;
}
