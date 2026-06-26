import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Load .env from the app root (apps/api/.env) if present
try {
  const envPath = join(dirname(fileURLToPath(import.meta.url)), '..', '.env');
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    if (!process.env[key]) process.env[key] = trimmed.slice(eq + 1);
  }
} catch { /* .env not present — rely on existing env */ }

import { serve } from '@hono/node-server';
import { app } from './app.js';

const PORT = parseInt(process.env.CANON_API_PORT ?? '3334', 10);

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`[canon-engine] API running on http://localhost:${info.port}`);
});
