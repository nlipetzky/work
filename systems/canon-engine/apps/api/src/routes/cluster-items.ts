import { clusterItems } from '@canon-engine/db';
import type { ClusterItemInsert } from '@canon-engine/db';
import { getDb } from '../lib/db.js';
import { makeRouter } from '../lib/router.js';

const app = makeRouter();

function handleErr(err: unknown): { error: string } {
  const msg = err instanceof Error ? err.message : JSON.stringify(err);
  console.error('[cluster-items] error:', msg);
  return { error: msg };
}

// GET /api/canon/clusters/:id/items
app.get('/', async (c) => {
  const clusterId = c.req.param('id')!;
  const items = await clusterItems.list(getDb(), clusterId);
  return c.json({ items });
});

// POST /api/canon/clusters/:id/items
app.post('/', async (c) => {
  const clusterId = c.req.param('id')!;
  const body = await c.req.json<Omit<ClusterItemInsert, 'cluster_id'>>();
  try {
    const item = await clusterItems.add(getDb(), { ...body, cluster_id: clusterId });
    return c.json({ item }, 201);
  } catch (err) {
    return c.json(handleErr(err), 500);
  }
});

// POST /api/canon/clusters/:id/items/bulk
app.post('/bulk', async (c) => {
  const clusterId = c.req.param('id')!;
  const body = await c.req.json<{ items: Omit<ClusterItemInsert, 'cluster_id'>[] }>();
  try {
    const created = await clusterItems.addBulk(
      getDb(),
      body.items.map((i) => ({ ...i, cluster_id: clusterId })),
    );
    return c.json({ items: created }, 201);
  } catch (err) {
    return c.json(handleErr(err), 500);
  }
});

// DELETE /api/canon/clusters/:id/items/:itemId
app.delete('/:itemId', async (c) => {
  try {
    await clusterItems.remove(getDb(), c.req.param('itemId')!);
    return c.json({ ok: true });
  } catch (err) {
    return c.json(handleErr(err), 500);
  }
});

export default app;
