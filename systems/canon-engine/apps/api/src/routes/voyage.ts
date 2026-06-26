import { voyageUsageLog } from '@canon-engine/db';
import { getDb } from '../lib/db.js';
import { makeRouter } from '../lib/router.js';

const app = makeRouter();

// GET /api/canon/voyage/usage
app.get('/', async (c) => {
  const todaySpend = await voyageUsageLog.todaySpend(getDb());
  const budget = parseFloat(process.env.VOYAGE_DAILY_BUDGET_USD ?? '5');
  return c.json({
    today_spend_usd: todaySpend,
    daily_budget_usd: budget,
    remaining_usd: Math.max(0, budget - todaySpend),
    budget_exhausted: todaySpend >= budget,
  });
});

export default app;
