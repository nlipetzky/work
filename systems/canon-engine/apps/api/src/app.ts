import { Hono } from 'hono';
import { bearerAuth } from './middleware/auth.js';
import { requireConsumer } from './middleware/consumer.js';
import searchRoute from './routes/search.js';
import clustersRoute from './routes/clusters.js';
import clusterItemsRoute from './routes/cluster-items.js';
import clusterChatRoute from './routes/cluster-chat.js';
import voyageRoute from './routes/voyage.js';
import ingestRoute from './routes/ingest.js';
import webhookRoute from './routes/webhook.js';
import agentsRoute from './routes/agents.js';

export function buildApp() {
  const app = new Hono();

  app.get('/health', (c) => c.json({ ok: true, service: 'canon-engine-api' }));

  app.route('/webhook', webhookRoute);

  const api = new Hono();
  api.use('*', bearerAuth);
  api.use('*', requireConsumer);

  api.route('/search', searchRoute);
  api.route('/clusters/:id/items', clusterItemsRoute);
  api.route('/clusters/:id/chat', clusterChatRoute);
  api.route('/clusters', clustersRoute);
  api.route('/voyage/usage', voyageRoute);
  api.route('/ingest', ingestRoute);
  api.route('/agents', agentsRoute);

  app.route('/api/canon', api);

  return app;
}

export const app = buildApp();
