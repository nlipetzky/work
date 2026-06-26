import { canonClusters } from '@canon-engine/db';
import type { CanonClusterInsert, CanonClusterUpdate } from '@canon-engine/db';
import { getDb } from '../lib/db.js';
import { makeRouter, slugify } from '../lib/router.js';

const app = makeRouter();

// GET /api/canon/clusters
app.get('/', async (c) => {
  const accountId = c.req.query('accountId') ?? undefined;
  const tagsParam = c.req.query('tags');
  const tags = tagsParam ? tagsParam.split(',').filter(Boolean) : undefined;
  const clusters = await canonClusters.list(getDb(), { accountId, tags });
  return c.json({ clusters });
});

// POST /api/canon/clusters
app.post('/', async (c) => {
  const body = await c.req.json<CanonClusterInsert>();
  if (!body.slug) body.slug = slugify(body.name);
  const cluster = await canonClusters.create(getDb(), body);
  return c.json({ cluster }, 201);
});

// GET /api/canon/clusters/:id
app.get('/:id', async (c) => {
  const cluster = await canonClusters.get(getDb(), c.req.param('id')!);
  if (!cluster) return c.json({ error: 'Not found' }, 404);
  return c.json({ cluster });
});

// PATCH /api/canon/clusters/:id
app.patch('/:id', async (c) => {
  const body = await c.req.json<CanonClusterUpdate>();
  const cluster = await canonClusters.update(getDb(), c.req.param('id')!, body);
  return c.json({ cluster });
});

// DELETE /api/canon/clusters/:id  (soft delete — sets archived_at)
app.delete('/:id', async (c) => {
  await canonClusters.archive(getDb(), c.req.param('id')!);
  return c.json({ ok: true });
});

// POST /api/canon/clusters/:id/restore
app.post('/:id/restore', async (c) => {
  await canonClusters.restore(getDb(), c.req.param('id')!);
  return c.json({ ok: true });
});

// POST /api/canon/clusters/:id/resolve  (ambient context for agents — full impl in 1.7)
app.post('/:id/resolve', async (c) => {
  return c.json({ error: 'Resolve endpoint implemented in section 1.7' }, 501);
});

export default app;
