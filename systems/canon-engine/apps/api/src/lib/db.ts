import { createCanonClient } from '@canon-engine/db';
import type { CanonClient } from '@canon-engine/db';

let _client: CanonClient | null = null;

export function getDb(): CanonClient {
  if (!_client) _client = createCanonClient();
  return _client;
}
