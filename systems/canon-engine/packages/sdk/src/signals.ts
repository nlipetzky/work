/**
 * Layered context assembly — temporal-state signals.
 *
 * Ported from @aos/canon/query/layered-context. Self-contained: no AOS
 * monorepo dependencies. Types are bundled inline below.
 *
 * Callers pass their own Supabase client so this module stays
 * instance-agnostic. Reads from the `assertions` table via the
 * `v_active_signals` view in AOS Operational.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TemporalTier = 'canon' | 'epoch' | 'week' | 'session';

export type SignalProvenance =
  | 'event_extraction'
  | 'agent_reasoning'
  | 'human_declaration';

export type SignalType =
  | 'decision'
  | 'action_item'
  | 'status_change'
  | 'commitment'
  | 'risk'
  | 'blocker';

export type SignalSourceType =
  | 'transcript'
  | 'email'
  | 'manual'
  | 'document'
  | 'agent';

export type ConfidenceBand = 'high' | 'medium' | 'low';

export interface Signal {
  id: string;
  assertion_type: SignalType;
  temporal_tier: TemporalTier;
  valid_from: string;
  valid_to: string | null;
  provenance: SignalProvenance;
  source_type: SignalSourceType;
  source_id: string | null;
  source_quote: string | null;
  structured_data: Record<string, unknown>;
  confidence: number;
  confidence_band: ConfidenceBand;
  state_path: string | null;
  entity_refs: string[];
  supersedes_id: string | null;
  superseded_by_id: string | null;
  promotion_of_id: string | null;
  tier_validated_by: string | null;
  tier_validated_at: string | null;
  created_at: string;
}

export interface LayeredContext {
  scope: string[];
  canon: Signal[];
  epoch: Signal[];
  week: Signal[];
  session: Signal[];
  rendered: string;
  assembled_at: string;
}

export interface AssembleContextOptions {
  scope: string[];
  max_per_tier?: Partial<Record<TemporalTier, number>>;
  exclude_types?: SignalType[];
  /** Override tier TTL at assembly time, as ISO-8601 duration. */
  ttl_override?: Partial<Record<TemporalTier, string>>;
}

export interface RecordSignalInput {
  assertion_type: SignalType;
  temporal_tier?: TemporalTier;
  valid_from?: string;
  valid_to?: string | null;
  provenance?: SignalProvenance;
  source_type: SignalSourceType;
  source_id?: string | null;
  source_quote?: string | null;
  structured_data?: Record<string, unknown>;
  confidence?: number;
  confidence_band?: ConfidenceBand;
  state_path?: string | null;
  entity_refs?: string[];
  supersedes_id?: string | null;
  promotion_of_id?: string | null;
  pipeline_run_id?: string | null;
  engagement_id?: string | null;
}

export const TIER_ORDER: readonly TemporalTier[] = [
  'canon',
  'epoch',
  'week',
  'session',
];

export const DEFAULT_TIER_TTL: Record<TemporalTier, string | null> = {
  canon: null,
  epoch: 'P90D',
  week: 'P14D',
  session: 'PT1H',
};

export const DEFAULT_MAX_PER_TIER: Record<TemporalTier, number> = {
  canon: 50,
  epoch: 30,
  week: 20,
  session: 10,
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = any;

function parseDuration(iso: string): number {
  const days = /P(\d+)D/.exec(iso)?.[1];
  const hours = /PT(\d+)H/.exec(iso)?.[1];
  let ms = 0;
  if (days) ms += Number(days) * 24 * 60 * 60 * 1000;
  if (hours) ms += Number(hours) * 60 * 60 * 1000;
  return ms;
}

function ttlCutoff(tier: TemporalTier, override?: string): Date | null {
  const iso = override ?? DEFAULT_TIER_TTL[tier];
  if (!iso) return null;
  return new Date(Date.now() - parseDuration(iso));
}

function renderTierHeader(tier: TemporalTier): string {
  switch (tier) {
    case 'canon':
      return '## [CANON] Enduring truths — never override from recent context';
    case 'epoch':
      return '## [EPOCH] Current phase — quarterly-ish durability';
    case 'week':
      return '## [WEEK] Rolling state — recent decisions and action items';
    case 'session':
      return '## [SESSION] Now / provisional — in-flight, not yet durable';
  }
}

function renderSignal(s: Signal): string {
  const source = s.source_id
    ? `${s.source_type}:${s.source_id}`
    : s.source_type;
  const when = s.valid_from.slice(0, 10);
  const quote = s.source_quote ? `"${s.source_quote.trim()}"` : '';
  const struct =
    Object.keys(s.structured_data ?? {}).length > 0
      ? ` → ${JSON.stringify(s.structured_data)}`
      : '';
  return `- [${s.assertion_type}] (${source}, ${when}) ${quote}${struct}`;
}

function renderLayered(tiers: Record<TemporalTier, Signal[]>): string {
  const parts: string[] = [];
  for (const tier of TIER_ORDER) {
    const signals = tiers[tier];
    if (signals.length === 0) continue;
    parts.push(renderTierHeader(tier));
    for (const s of signals) parts.push(renderSignal(s));
    parts.push('');
  }
  if (parts.length === 0) return '_No signals available for this scope._';
  return parts.join('\n');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface LayeredContextDeps {
  supabase: AnySupabaseClient;
}

/**
 * Assemble layered context for a scope.
 *
 * scope is a list of entity references matched against the `entity_refs`
 * array column in `v_active_signals`. Examples:
 *   ['account:teknova']
 *   ['account:teknova', 'agent:revops_8']
 *
 * Returns a LayeredContext with per-tier signals and a rendered markdown
 * string ready to inject into an agent prompt.
 */
export async function assembleContext(
  deps: LayeredContextDeps,
  opts: AssembleContextOptions,
): Promise<LayeredContext> {
  const { supabase } = deps;
  const { scope } = opts;
  const maxPerTier = { ...DEFAULT_MAX_PER_TIER, ...(opts.max_per_tier ?? {}) };

  if (scope.length === 0) {
    throw new Error('assembleContext: scope must be non-empty');
  }

  let query = supabase
    .from('v_active_signals')
    .select('*')
    .overlaps('entity_refs', scope)
    .order('valid_from', { ascending: false })
    .order('confidence', { ascending: false });

  if (opts.exclude_types && opts.exclude_types.length > 0) {
    query = query.not(
      'assertion_type',
      'in',
      `(${opts.exclude_types.map((t: string) => `"${t}"`).join(',')})`,
    );
  }

  const { data, error } = await query.limit(500);
  if (error) throw new Error(`assembleContext query failed: ${error.message}`);
  const rows = (data ?? []) as Signal[];

  const byTier: Record<TemporalTier, Signal[]> = {
    canon: [],
    epoch: [],
    week: [],
    session: [],
  };

  for (const tier of TIER_ORDER) {
    const cutoff = ttlCutoff(tier, opts.ttl_override?.[tier]);
    const cap = maxPerTier[tier];
    const filtered: Signal[] = [];
    for (const row of rows) {
      if (row.temporal_tier !== tier) continue;
      if (cutoff && new Date(row.valid_from) < cutoff) continue;
      filtered.push(row);
      if (filtered.length >= cap) break;
    }
    byTier[tier] = filtered;
  }

  return {
    scope,
    canon: byTier.canon,
    epoch: byTier.epoch,
    week: byTier.week,
    session: byTier.session,
    rendered: renderLayered(byTier),
    assembled_at: new Date().toISOString(),
  };
}

/**
 * Canonical write path for signals. Enforces append-only supersession:
 * if supersedes_id is set, the prior row is marked superseded_by_id in
 * the same logical transaction.
 */
export async function recordSignal(
  deps: LayeredContextDeps,
  input: RecordSignalInput,
): Promise<Signal> {
  const { supabase } = deps;

  const payload: Record<string, unknown> = {
    assertion_type: input.assertion_type,
    temporal_tier: input.temporal_tier ?? 'week',
    valid_from: input.valid_from ?? new Date().toISOString(),
    valid_to: input.valid_to ?? null,
    provenance: input.provenance ?? 'event_extraction',
    source_type: input.source_type,
    source_id: input.source_id ?? null,
    source_quote: input.source_quote ?? null,
    structured_data: input.structured_data ?? {},
    confidence: input.confidence ?? 0.75,
    confidence_band: input.confidence_band ?? 'medium',
    state_path: input.state_path ?? null,
    entity_refs: input.entity_refs ?? [],
    supersedes_id: input.supersedes_id ?? null,
    promotion_of_id: input.promotion_of_id ?? null,
    pipeline_run_id: input.pipeline_run_id ?? null,
    engagement_id: input.engagement_id ?? null,
    status: 'draft',
  };

  const { data, error } = await supabase
    .from('assertions')
    .insert(payload)
    .select('*')
    .single();
  if (error) throw new Error(`recordSignal insert failed: ${error.message}`);
  const inserted = data as Signal;

  if (input.supersedes_id) {
    const { error: updateErr } = await supabase
      .from('assertions')
      .update({ superseded_by_id: inserted.id })
      .eq('id', input.supersedes_id);
    if (updateErr) {
      throw new Error(
        `recordSignal supersession link failed: ${updateErr.message}. ` +
          `New row ${inserted.id} inserted but prior row ${input.supersedes_id} not marked superseded.`,
      );
    }
  }

  return inserted;
}
