import { Hono } from 'hono';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const INGESTION_SCRIPTS = join(__dirname, '..', '..', '..', '..', 'packages', 'ingestion', 'scripts');

function triggerScript(scriptName: string): Promise<{ pid: number }> {
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['tsx', join(INGESTION_SCRIPTS, scriptName)], {
      detached: true,
      stdio: 'ignore',
      cwd: join(INGESTION_SCRIPTS, '..'),
    });
    child.on('error', reject);
    child.unref();
    resolve({ pid: child.pid ?? 0 });
  });
}

const app = new Hono();

app.post('/emails', async (c) => {
  const { pid } = await triggerScript('gws-fetch-emails.ts');
  return c.json({ triggered: true, script: 'gws-fetch-emails.ts', pid });
});

app.post('/transcripts', async (c) => {
  const { pid } = await triggerScript('gws-fetch-transcripts.ts');
  return c.json({ triggered: true, script: 'gws-fetch-transcripts.ts', pid });
});

app.post('/documents', async (c) => {
  return c.json({ error: 'Document ingest not yet wired (no standalone script)' }, 501);
});

app.post('/all', async (c) => {
  const { pid } = await triggerScript('gws-fetch-all.ts');
  return c.json({ triggered: true, script: 'gws-fetch-all.ts', pid });
});

export default app;
