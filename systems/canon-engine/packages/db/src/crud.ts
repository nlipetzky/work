import type { CanonClient } from './client.js';
import type { Database } from './database.types.js';

type Tables = Database['public']['Tables'];

// ---------------------------------------------------------------------------
// Type aliases
// ---------------------------------------------------------------------------

export type CanonDoc = Tables['canon_docs']['Row'];
export type CanonDocInsert = Tables['canon_docs']['Insert'];
export type CanonDocUpdate = Tables['canon_docs']['Update'];

export type CanonCluster = Tables['canon_clusters']['Row'];
export type CanonClusterInsert = Tables['canon_clusters']['Insert'];
export type CanonClusterUpdate = Tables['canon_clusters']['Update'];

export type ClusterItem = Tables['cluster_items']['Row'];
export type ClusterItemInsert = Tables['cluster_items']['Insert'];
export type ClusterItemUpdate = Tables['cluster_items']['Update'];

export type ClusterChatTurn = Tables['cluster_chat_turns']['Row'];
export type ClusterChatTurnInsert = Tables['cluster_chat_turns']['Insert'];
export type ClusterChatTurnUpdate = Tables['cluster_chat_turns']['Update'];

export type VoyageUsageLog = Tables['voyage_usage_log']['Row'];
export type VoyageUsageLogInsert = Tables['voyage_usage_log']['Insert'];

export type CanonDocument = Tables['documents']['Row'];
export type CanonDocumentInsert = Tables['documents']['Insert'];
export type CanonDocumentUpdate = Tables['documents']['Update'];

export type Transcript = Tables['transcripts']['Row'];
export type TranscriptInsert = Tables['transcripts']['Insert'];
export type TranscriptUpdate = Tables['transcripts']['Update'];

// ---------------------------------------------------------------------------
// canon_docs
// ---------------------------------------------------------------------------

export const canonDocs = {
  async list(client: CanonClient, tenantId?: string): Promise<CanonDoc[]> {
    let q = client.from('canon_docs').select('*').order('path');
    if (tenantId) q = q.eq('tenant_id', tenantId);
    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
  },

  async get(client: CanonClient, id: string): Promise<CanonDoc | null> {
    const { data, error } = await client.from('canon_docs').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data;
  },

  async getByPath(client: CanonClient, path: string): Promise<CanonDoc | null> {
    const { data, error } = await client
      .from('canon_docs')
      .select('*')
      .eq('path', path)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
};

// ---------------------------------------------------------------------------
// canon_clusters
// ---------------------------------------------------------------------------

export const canonClusters = {
  async list(
    client: CanonClient,
    opts?: { accountId?: string; tags?: string[] },
  ): Promise<CanonCluster[]> {
    let q = client
      .from('canon_clusters')
      .select('*')
      .is('archived_at', null)
      .order('created_at', { ascending: false });
    if (opts?.accountId) q = q.eq('account_id', opts.accountId);
    if (opts?.tags?.length) q = q.overlaps('tags', opts.tags);
    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
  },

  async get(client: CanonClient, id: string): Promise<CanonCluster | null> {
    const { data, error } = await client
      .from('canon_clusters')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(client: CanonClient, row: CanonClusterInsert): Promise<CanonCluster> {
    const { data, error } = await client.from('canon_clusters').insert(row).select().single();
    if (error) throw error;
    return data;
  },

  async update(client: CanonClient, id: string, patch: CanonClusterUpdate): Promise<CanonCluster> {
    const { data, error } = await client
      .from('canon_clusters')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async archive(client: CanonClient, id: string): Promise<void> {
    const { error } = await client
      .from('canon_clusters')
      .update({ archived_at: new Date().toISOString() } as CanonClusterUpdate)
      .eq('id', id);
    if (error) throw error;
  },

  async restore(client: CanonClient, id: string): Promise<void> {
    const { error } = await client
      .from('canon_clusters')
      .update({ archived_at: null } as CanonClusterUpdate)
      .eq('id', id);
    if (error) throw error;
  },
};

// ---------------------------------------------------------------------------
// cluster_items
// ---------------------------------------------------------------------------

export const clusterItems = {
  async list(client: CanonClient, clusterId: string): Promise<ClusterItem[]> {
    const { data, error } = await client
      .from('cluster_items')
      .select('*')
      .eq('cluster_id', clusterId)
      .order('added_at');
    if (error) throw error;
    return data ?? [];
  },

  async add(client: CanonClient, row: ClusterItemInsert): Promise<ClusterItem> {
    const { data, error } = await client.from('cluster_items').insert(row).select().single();
    if (error) throw error;
    return data;
  },

  async addBulk(client: CanonClient, rows: ClusterItemInsert[]): Promise<ClusterItem[]> {
    const { data, error } = await client.from('cluster_items').insert(rows).select();
    if (error) throw error;
    return data ?? [];
  },

  async update(client: CanonClient, id: string, patch: ClusterItemUpdate): Promise<ClusterItem> {
    const { data, error } = await client
      .from('cluster_items')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async remove(client: CanonClient, id: string): Promise<void> {
    const { error } = await client.from('cluster_items').delete().eq('id', id);
    if (error) throw error;
  },
};

// ---------------------------------------------------------------------------
// cluster_chat_turns
// ---------------------------------------------------------------------------

export const clusterChatTurns = {
  async listBySession(
    client: CanonClient,
    clusterId: string,
    sessionId: string,
  ): Promise<ClusterChatTurn[]> {
    const { data, error } = await client
      .from('cluster_chat_turns')
      .select('*')
      .eq('cluster_id', clusterId)
      .eq('session_id', sessionId)
      .order('created_at');
    if (error) throw error;
    return data ?? [];
  },

  async listSessions(
    client: CanonClient,
    clusterId: string,
  ): Promise<{ session_id: string; last_turn: string }[]> {
    const { data, error } = await client
      .from('cluster_chat_turns')
      .select('session_id, created_at')
      .eq('cluster_id', clusterId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    const seen = new Map<string, string>();
    for (const row of data ?? []) {
      if (!seen.has(row.session_id)) seen.set(row.session_id, row.created_at ?? '');
    }
    return Array.from(seen.entries()).map(([session_id, last_turn]) => ({ session_id, last_turn }));
  },

  async insert(client: CanonClient, row: ClusterChatTurnInsert): Promise<ClusterChatTurn> {
    const { data, error } = await client
      .from('cluster_chat_turns')
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteSession(client: CanonClient, clusterId: string, sessionId: string): Promise<void> {
    const { error } = await client
      .from('cluster_chat_turns')
      .delete()
      .eq('cluster_id', clusterId)
      .eq('session_id', sessionId);
    if (error) throw error;
  },
};

// ---------------------------------------------------------------------------
// voyage_usage_log
// ---------------------------------------------------------------------------

export const voyageUsageLog = {
  async insert(client: CanonClient, row: VoyageUsageLogInsert): Promise<VoyageUsageLog> {
    const { data, error } = await client.from('voyage_usage_log').insert(row).select().single();
    if (error) throw error;
    return data;
  },

  async todaySpend(client: CanonClient): Promise<number> {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await client
      .from('voyage_usage_log')
      .select('cost_usd')
      .gte('created_at', `${today}T00:00:00Z`)
      .lte('created_at', `${today}T23:59:59Z`);
    if (error) throw error;
    return (data ?? []).reduce((sum, r) => sum + (r.cost_usd ?? 0), 0);
  },
};

// ---------------------------------------------------------------------------
// documents
// ---------------------------------------------------------------------------

export const documents = {
  async list(client: CanonClient, limit = 50): Promise<CanonDocument[]> {
    const { data, error } = await client
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  },

  async get(client: CanonClient, id: string): Promise<CanonDocument | null> {
    const { data, error } = await client
      .from('documents')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
};

// ---------------------------------------------------------------------------
// transcripts
// ---------------------------------------------------------------------------

export const transcripts = {
  async list(client: CanonClient, limit = 50): Promise<Transcript[]> {
    const { data, error } = await client
      .from('transcripts')
      .select('*')
      .order('meeting_date', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  },

  async get(client: CanonClient, id: string): Promise<Transcript | null> {
    const { data, error } = await client
      .from('transcripts')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
};
