import { workflow, node, trigger, sticky, newCredential, splitInBatches, nextBatch, expr } from '@n8n/workflow-sdk';

const schedule = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.3,
  config: {
    name: 'Poll Every 5 Min',
    parameters: {
      rule: { interval: [{ field: 'minutes', minutesInterval: 5 }] }
    },
    position: [240, 300]
  },
  output: [{}]
});

const findApproved = node({
  type: 'n8n-nodes-base.airtable',
  version: 2.4,
  config: {
    name: 'Find Approved KAI Artifacts',
    parameters: {
      resource: 'record',
      operation: 'search',
      base: { __rl: true, value: 'app5tsy6zjfA8H3rx', mode: 'id' },
      table: { __rl: true, value: 'tbllBcYKfF1BAIly7', mode: 'id' },
      filterByFormula: "AND({Status}='Approved',OR({Last Synced}=BLANK(),{Last Synced}<{Approval Date}))",
      options: {}
    },
    credentials: { airtableTokenApi: newCredential('Airtable - KAI Base') },
    position: [440, 300]
  },
  output: [
    {
      id: 'recExample',
      fields: {
        Name: 'KAI Pitch Sheet',
        Type: 'Pitch Sheet',
        Status: 'Approved',
        Text: 'Artifact body markdown content...',
        Version: 3,
        'Approval Date': '2026-05-26',
        Approver: 'Will',
        'File Path': '/Users/nplmini/code/work/accounts/ventures/konstellation-ai/artifacts/kai-pitch-sheet-current.md'
      }
    }
  ]
});

const sib = splitInBatches({
  version: 3,
  config: { name: 'One Artifact At A Time', parameters: { batchSize: 1 }, position: [640, 300] }
});

const writeCanon = node({
  type: 'n8n-nodes-base.postgres',
  version: 2.6,
  config: {
    name: 'Atomic Canon Write',
    parameters: {
      operation: 'executeQuery',
      query: expr(
        "WITH prior AS (\n" +
        "  SELECT id FROM public.canon_artifacts\n" +
        "  WHERE engagement_type='venture' AND engagement_id='konstellation-ai'\n" +
        "    AND artifact_type='{{ $json.fields.Type }}'\n" +
        "    AND name='{{ String($json.fields.Name).replace(/'/g, \"''\") }}'\n" +
        "    AND status='approved' AND superseded_by_id IS NULL\n" +
        "  LIMIT 1\n" +
        "),\n" +
        "new_row AS (\n" +
        "  INSERT INTO public.canon_artifacts\n" +
        "    (engagement_type, engagement_id, artifact_type, name, version, path,\n" +
        "     content_md, status, approver, approval_date, approval_channel, approval_ref,\n" +
        "     supersedes_id, metadata)\n" +
        "  VALUES (\n" +
        "    'venture', 'konstellation-ai',\n" +
        "    '{{ $json.fields.Type }}',\n" +
        "    '{{ String($json.fields.Name).replace(/'/g, \"''\") }}',\n" +
        "    {{ $json.fields.Version }},\n" +
        "    '{{ String($json.fields[\"File Path\"] || \"\").replace(/'/g, \"''\") }}',\n" +
        "    $artifactbody${{ $json.fields.Text }}$artifactbody$,\n" +
        "    'approved',\n" +
        "    '{{ String($json.fields.Approver || \"\").replace(/'/g, \"''\") }}',\n" +
        "    '{{ $json.fields[\"Approval Date\"] }}'::timestamptz,\n" +
        "    'airtable',\n" +
        "    '{{ $json.id }}',\n" +
        "    (SELECT id FROM prior),\n" +
        "    '{}'::jsonb\n" +
        "  )\n" +
        "  RETURNING id\n" +
        "),\n" +
        "finalize_prior AS (\n" +
        "  UPDATE public.canon_artifacts\n" +
        "  SET status='superseded',\n" +
        "      superseded_by_id=(SELECT id FROM new_row)\n" +
        "  WHERE id IN (SELECT id FROM prior)\n" +
        "  RETURNING id\n" +
        ")\n" +
        "SELECT\n" +
        "  (SELECT id FROM new_row) AS new_artifact_id,\n" +
        "  (SELECT id FROM prior LIMIT 1) AS superseded_artifact_id;"
      ),
      options: {}
    },
    credentials: { postgres: newCredential('canon_engine_postgres') },
    position: [840, 300]
  },
  output: [{ new_artifact_id: 'uuid-of-new-row', superseded_artifact_id: null }]
});

const updateLastSynced = node({
  type: 'n8n-nodes-base.airtable',
  version: 2.4,
  config: {
    name: 'Update Last Synced',
    parameters: {
      resource: 'record',
      operation: 'update',
      base: { __rl: true, value: 'app5tsy6zjfA8H3rx', mode: 'id' },
      table: { __rl: true, value: 'tbllBcYKfF1BAIly7', mode: 'id' },
      id: expr("{{ $('Find Approved KAI Artifacts').item.json.id }}"),
      columns: {
        mappingMode: 'defineBelow',
        value: {
          'Last Synced': expr('{{ $now.toISODate() }}')
        }
      }
    },
    credentials: { airtableTokenApi: newCredential('Airtable - KAI Base') },
    position: [1040, 300]
  },
  output: [{ id: 'recExample' }]
});

const done = node({
  type: 'n8n-nodes-base.noOp',
  version: 1,
  config: { name: 'Done', position: [840, 500] },
  output: [{}]
});

const noteScope = sticky(
  '## v0 Scope: canon write + Last Synced\n\n' +
  '**In scope:** Atomic CTE write to canon_artifacts (supersede prior + insert new). Update Will Last Synced field on success.\n\n' +
  '**Deferred to v1:**\n' +
  '- Liaison Expert Artifacts upsert (mirror to liaison base appbFsdqrC5vnxuIR)\n' +
  '- canon_artifact_bindings insert (needs System Artifacts populated in liaison base)\n' +
  '- Filesystem mirror to File Path (side effect, continue on error)\n' +
  '- Exchanges row for system-initiated approvals',
  [writeCanon],
  { color: 5 }
);

const noteAtomic = sticky(
  '## Atomic write\n\n' +
  'Single CTE = single Postgres transaction. The partial unique index on ' +
  '(engagement, type, name) WHERE status=approved AND superseded_by_id IS NULL ' +
  'passes because all modifications happen atomically and the post-statement state ' +
  'has only one approved-current row.\n\n' +
  '**Quoting:** content_md uses dollar-quoting ($artifactbody$...$artifactbody$) for ' +
  'safe embedding of markdown with quotes. Other text fields escape single quotes. ' +
  'Internal use only for v0; harden if exposed beyond Will.',
  [writeCanon],
  { color: 3 }
);

const noteCreds = sticky(
  '## Before publishing\n\n' +
  '1. **Airtable - KAI Base**: Personal Access Token with data.records:read + ' +
  'data.records:write scopes on base app5tsy6zjfA8H3rx.\n\n' +
  '2. **canon_engine_postgres**: Postgres connection from Supabase project ' +
  'mzzjvoiwughcnmmqzbxv. Get from Settings -> Database -> Connection Pooling ' +
  '(Session mode). User: postgres. Bypasses RLS via direct DB access.\n\n' +
  '3. After attaching: Save, then Publish/Activate. First test: manually flip an ' +
  'Artifact in Will base to Status=Approved and watch the execution.',
  [schedule],
  { color: 4 }
);

export default workflow('5AR0RkJSO66tlBoe', 'Expert Liaison: KAI Artifact Sync')
  .add(schedule)
  .to(findApproved)
  .to(sib
    .onEachBatch(writeCanon.to(updateLastSynced.to(nextBatch(sib))))
    .onDone(done)
  );
