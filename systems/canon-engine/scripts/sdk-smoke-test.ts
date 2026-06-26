#!/usr/bin/env npx tsx
/**
 * SDK smoke test — covers all CanonClient surface area for section 1.8 verification.
 * Run with: npx tsx scripts/sdk-smoke-test.ts
 */
import { CanonClient } from '../packages/sdk/src/index.js';

const API_KEY = process.env.CANON_API_KEY ?? 'dev-secret';
const client = new CanonClient({ apiKey: API_KEY, consumer: 'sdk-smoke-test' });

let testClusterId: string;
let testItemId: string;
let testSessionId: string | undefined;

function pass(label: string, detail?: string) {
  console.log(`  ✓ ${label}${detail ? ': ' + detail : ''}`);
}

function fail(label: string, err: unknown) {
  const msg = err instanceof Error ? err.message : JSON.stringify(err);
  console.error(`  ✗ ${label}: ${msg}`);
  process.exitCode = 1;
}

async function testSearch() {
  console.log('\n── search ──');
  try {
    const r = await client.search({ query: 'canon governance', limit: 3 });
    pass('search', `${r.results.length} results, reranked=${r.reranked}, consumer=${r.consumer}`);
  } catch (e) { fail('search', e); }

  try {
    const r = await client.search({ query: 'strategy', limit: 3, rerank: true });
    pass('search+rerank', `${r.results.length} results, reranked=${r.reranked}`);
  } catch (e) { fail('search+rerank', e); }
}

async function testClusters() {
  console.log('\n── clusters ──');
  try {
    const { clusters } = await client.clusters.list();
    pass('list', `${clusters.length} clusters`);
  } catch (e) { fail('list', e); }

  try {
    const { cluster } = await client.clusters.create({
      name: `Smoke Test ${Date.now()}`,
      description: 'Created by sdk-smoke-test',
      visibility: 'private',
    });
    testClusterId = cluster.id;
    pass('create', `id=${cluster.id.slice(0, 8)} slug=${cluster.slug}`);
  } catch (e) { fail('create', e); throw e; }

  try {
    const { cluster } = await client.clusters.get(testClusterId);
    pass('get', `name=${cluster.name}`);
  } catch (e) { fail('get', e); }

  try {
    const { cluster } = await client.clusters.update(testClusterId, {
      description: 'Updated by smoke test',
    });
    pass('update', `desc=${cluster.description?.slice(0, 30)}`);
  } catch (e) { fail('update', e); }
}

async function testItems() {
  console.log('\n── cluster items ──');
  try {
    const { item } = await client.clusters.items.add(testClusterId, {
      source_type: 'email',
      source_id: null,
      note: 'smoke test item',
    });
    testItemId = item.id;
    pass('add', `id=${item.id.slice(0, 8)} source_type=${item.source_type}`);
  } catch (e) { fail('add', e); throw e; }

  try {
    const { items } = await client.clusters.items.list(testClusterId);
    pass('list', `${items.length} items`);
    if (items.length > 0 && 'added_at' in items[0]) pass('added_at field present');
  } catch (e) { fail('list', e); }

  try {
    const { items } = await client.clusters.items.addBulk(testClusterId, [
      { source_type: 'document', note: 'bulk-1' },
      { source_type: 'transcript', note: 'bulk-2' },
    ]);
    pass('addBulk', `${items.length} items created`);
  } catch (e) { fail('addBulk', e); }

  try {
    await client.clusters.items.remove(testClusterId, testItemId);
    pass('remove');
  } catch (e) { fail('remove', e); }
}

async function testChat() {
  console.log('\n── cluster chat (stream) ──');
  try {
    const events: string[] = [];
    let tokenCount = 0;
    let gotDone = false;

    for await (const ev of client.clusters.chat(testClusterId, {
      query: 'What is this cluster about?',
      top_k: 5,
    })) {
      events.push(ev.type);
      if (ev.type === 'token') tokenCount++;
      if (ev.type === 'done') {
        testSessionId = ev.session_id;
        gotDone = true;
      }
      if (ev.type === 'error') throw new Error(ev.message);
    }

    pass('stream', `events=[${[...new Set(events)].join(',')}] tokens=${tokenCount} done=${gotDone}`);
    if (testSessionId) pass('session_id', testSessionId.slice(0, 8));
  } catch (e) { fail('chat stream', e); }
}

async function testSessions() {
  console.log('\n── cluster sessions ──');
  try {
    const { sessions } = await client.clusters.sessions.list(testClusterId);
    pass('list sessions', `${sessions.length} sessions`);
  } catch (e) { fail('list sessions', e); }

  if (testSessionId) {
    try {
      const { turns } = await client.clusters.sessions.get(testClusterId, testSessionId);
      pass('get session', `${turns.length} turns`);
    } catch (e) { fail('get session', e); }

    try {
      await client.clusters.sessions.delete(testClusterId, testSessionId);
      pass('delete session');
    } catch (e) { fail('delete session', e); }
  }
}

async function testVoyage() {
  console.log('\n── voyage usage ──');
  try {
    const usage = await client.voyage.usage();
    pass('usage', `today=$${usage.today_spend_usd.toFixed(4)} budget=$${usage.daily_budget_usd} exhausted=${usage.budget_exhausted}`);
  } catch (e) { fail('usage', e); }
}

async function testCleanup() {
  console.log('\n── cleanup ──');
  try {
    await client.clusters.delete(testClusterId);
    pass('delete cluster (archive)');
  } catch (e) { fail('delete cluster', e); }

  try {
    await client.clusters.restore(testClusterId);
    pass('restore cluster');
  } catch (e) { fail('restore cluster', e); }
}

(async () => {
  console.log('Canon SDK smoke test');
  console.log(`API: ${(client as any).base}`);

  await testSearch();
  await testClusters();
  await testItems();
  await testChat();
  await testSessions();
  await testVoyage();
  await testCleanup();

  console.log('\n── done ──');
  if (process.exitCode === 1) {
    console.log('One or more tests FAILED.');
  } else {
    console.log('All tests PASSED.');
  }
})();
