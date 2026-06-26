import { Hono } from 'hono';

export function makeRouter(): Hono {
  const app = new Hono();
  app.onError((err, c) => {
    console.error('[api] error:', err);
    return c.json({ error: err instanceof Error ? err.message : JSON.stringify(err) }, 500);
  });
  return app;
}

export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') +
    '-' +
    Date.now().toString(36)
  );
}
