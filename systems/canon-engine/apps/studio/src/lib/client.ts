import { CanonClient } from '@canon-engine/sdk';

export function getClient() {
  return new CanonClient({
    baseUrl: process.env.CANON_API_URL ?? 'http://localhost:3334',
    apiKey: process.env.CANON_API_KEY ?? '',
    consumer: 'studio',
  });
}
