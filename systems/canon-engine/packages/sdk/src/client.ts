import type {
  SearchParams,
  SearchResponse,
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

export interface CanonClientOptions {
  /** Base URL of the Canon Engine API. Defaults to http://localhost:3334 */
  baseUrl?: string;
  /** Bearer API key */
  apiKey: string;
  /** Consumer identifier sent in X-Canon-Consumer header */
  consumer: string;
}

export class CanonClient {
  private readonly base: string;
  private readonly headers: Record<string, string>;

  constructor(opts: CanonClientOptions) {
    this.base = (opts.baseUrl ?? 'http://localhost:3334').replace(/\/$/, '') + '/api/canon';
    this.headers = {
      Authorization: `Bearer ${opts.apiKey}`,
      'X-Canon-Consumer': opts.consumer,
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const resp = await fetch(`${this.base}${path}`, {
      method,
      headers: this.headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`Canon API ${method} ${path} → ${resp.status}: ${text}`);
    }
    return resp.json() as Promise<T>;
  }

  // -------------------------------------------------------------------------
  // Search
  // -------------------------------------------------------------------------

  async search(params: SearchParams): Promise<SearchResponse> {
    return this.request('POST', '/search', params);
  }

  // -------------------------------------------------------------------------
  // Clusters
  // -------------------------------------------------------------------------

  readonly clusters = {
    list: (opts?: ClusterListParams): Promise<{ clusters: Cluster[] }> => {
      const qs = new URLSearchParams();
      if (opts?.accountId) qs.set('accountId', opts.accountId);
      if (opts?.tags?.length) qs.set('tags', opts.tags.join(','));
      const query = qs.toString() ? `?${qs}` : '';
      return this.request('GET', `/clusters${query}`);
    },

    get: (id: string): Promise<{ cluster: Cluster }> =>
      this.request('GET', `/clusters/${id}`),

    create: (data: ClusterCreateParams): Promise<{ cluster: Cluster }> =>
      this.request('POST', '/clusters', data),

    update: (id: string, patch: ClusterUpdateParams): Promise<{ cluster: Cluster }> =>
      this.request('PATCH', `/clusters/${id}`, patch),

    delete: (id: string): Promise<{ ok: boolean }> =>
      this.request('DELETE', `/clusters/${id}`),

    restore: (id: string): Promise<{ ok: boolean }> =>
      this.request('POST', `/clusters/${id}/restore`),

    // -----------------------------------------------------------------------
    // Cluster items
    // -----------------------------------------------------------------------

    items: {
      list: (clusterId: string): Promise<{ items: ClusterItem[] }> =>
        this.request('GET', `/clusters/${clusterId}/items`),

      add: (
        clusterId: string,
        item: ClusterItemCreateParams,
      ): Promise<{ item: ClusterItem }> =>
        this.request('POST', `/clusters/${clusterId}/items`, item),

      addBulk: (
        clusterId: string,
        items: ClusterItemCreateParams[],
      ): Promise<{ items: ClusterItem[] }> =>
        this.request('POST', `/clusters/${clusterId}/items/bulk`, { items }),

      remove: (clusterId: string, itemId: string): Promise<{ ok: boolean }> =>
        this.request('DELETE', `/clusters/${clusterId}/items/${itemId}`),
    },

    // -----------------------------------------------------------------------
    // Cluster chat
    // -----------------------------------------------------------------------

    chat: async function* (
      this: CanonClient,
      clusterId: string,
      params: ChatParams,
    ): AsyncGenerator<ChatEvent> {
      const resp = await fetch(`${this.base}/clusters/${clusterId}/chat`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(params),
      });

      if (!resp.ok || !resp.body) {
        const text = await resp.text().catch(() => '');
        throw new Error(`Canon chat ${resp.status}: ${text}`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            yield JSON.parse(trimmed) as ChatEvent;
          } catch {
            // malformed line — skip
          }
        }
      }
      // flush remaining
      if (buf.trim()) {
        try {
          yield JSON.parse(buf.trim()) as ChatEvent;
        } catch {
          // ignore
        }
      }
    }.bind(this),

    sessions: {
      list: (clusterId: string): Promise<{ sessions: ChatSession[] }> =>
        this.request('GET', `/clusters/${clusterId}/chat/sessions`),

      get: (clusterId: string, sessionId: string): Promise<{ turns: ChatTurn[] }> =>
        this.request('GET', `/clusters/${clusterId}/chat/sessions/${sessionId}`),

      delete: (clusterId: string, sessionId: string): Promise<{ ok: boolean }> =>
        this.request('DELETE', `/clusters/${clusterId}/chat/sessions/${sessionId}`),
    },
  };

  // -------------------------------------------------------------------------
  // Voyage usage
  // -------------------------------------------------------------------------

  readonly voyage = {
    usage: (): Promise<VoyageUsage> => this.request('GET', '/voyage/usage'),
  };

  // -------------------------------------------------------------------------
  // Ingest triggers
  // -------------------------------------------------------------------------

  readonly ingest = {
    emails: (): Promise<IngestResponse> => this.request('POST', '/ingest/emails'),
    transcripts: (): Promise<IngestResponse> => this.request('POST', '/ingest/transcripts'),
    documents: (): Promise<IngestResponse> => this.request('POST', '/ingest/documents'),
    all: (): Promise<IngestResponse> => this.request('POST', '/ingest/all'),
  };
}
