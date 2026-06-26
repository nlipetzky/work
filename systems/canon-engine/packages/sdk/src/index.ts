export { CanonClient } from './client.js';
export type { CanonClientOptions } from './client.js';
export {
  assembleContext,
  recordSignal,
  TIER_ORDER,
  DEFAULT_TIER_TTL,
  DEFAULT_MAX_PER_TIER,
} from './signals.js';
export type {
  TemporalTier,
  SignalProvenance,
  SignalType,
  SignalSourceType,
  ConfidenceBand,
  Signal,
  LayeredContext,
  AssembleContextOptions,
  RecordSignalInput,
  LayeredContextDeps,
} from './signals.js';
export type {
  SearchParams,
  SearchResponse,
  ChunkResult,
  Cluster,
  ClusterCreateParams,
  ClusterUpdateParams,
  ClusterListParams,
  ClusterItem,
  ClusterItemCreateParams,
  ChatParams,
  ChatEvent,
  ChatSession,
  ChatTurn,
  VoyageUsage,
  IngestResponse,
} from './types.js';
