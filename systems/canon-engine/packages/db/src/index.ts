export { createCanonClient } from './client.js';
export type { CanonClient } from './client.js';

export type { Database } from './database.types.js';

export {
  fnCanonChunksHybridSearch,
  fnClusterHybridSearch,
  searchCanonDocs,
  saveCanonDoc,
} from './rpcs.js';

export type {
  ChunkSearchRow,
  ClusterSearchRow,
  CanonDocSearchRow,
  HybridSearchArgs,
  ClusterHybridSearchArgs,
  SearchCanonDocsArgs,
  SaveCanonDocArgs,
} from './rpcs.js';

export {
  canonDocs,
  canonClusters,
  clusterItems,
  clusterChatTurns,
  voyageUsageLog,
  documents,
  transcripts,
} from './crud.js';

export type {
  CanonDoc,
  CanonDocInsert,
  CanonDocUpdate,
  CanonCluster,
  CanonClusterInsert,
  CanonClusterUpdate,
  ClusterItem,
  ClusterItemInsert,
  ClusterItemUpdate,
  ClusterChatTurn,
  ClusterChatTurnInsert,
  ClusterChatTurnUpdate,
  VoyageUsageLog,
  VoyageUsageLogInsert,
  CanonDocument,
  CanonDocumentInsert,
  CanonDocumentUpdate,
  Transcript,
  TranscriptInsert,
  TranscriptUpdate,
} from './crud.js';
