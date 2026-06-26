import type { MiddlewareHandler } from 'hono';

export const CONSUMER_KEY = 'consumer';

export const requireConsumer: MiddlewareHandler = async (c, next) => {
  const consumer = c.req.header('X-Canon-Consumer');
  if (!consumer) {
    return c.json({ error: 'X-Canon-Consumer header is required' }, 400);
  }
  c.set(CONSUMER_KEY, consumer);
  await next();
};
