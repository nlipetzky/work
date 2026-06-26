import type { MiddlewareHandler } from 'hono';

export const bearerAuth: MiddlewareHandler = async (c, next) => {
  const apiKey = process.env.CANON_API_KEY;
  if (!apiKey) {
    return c.json({ error: 'Server misconfiguration: CANON_API_KEY not set' }, 500);
  }
  const header = c.req.header('Authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (token !== apiKey) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  await next();
};
