# @canon-engine/sdk

TypeScript client for the [Canon Engine](https://github.com/INSTIG8AI/canon-engine) HTTP API.

## Install

```bash
npm install @canon-engine/sdk
```

## Usage

```ts
import { CanonClient } from '@canon-engine/sdk';

const canon = new CanonClient({
  baseUrl: 'https://canon.example.com',
  apiKey: process.env.CANON_API_KEY!,
  consumer: 'my-app',
});

const result = await canon.search({
  query: 'gate graduation rules',
  sourceTypes: ['canon_doc'],
  limit: 10,
});
```

## Capabilities

- `search` — hybrid vector + FTS across canon corpus
- `clusters` — create, list, update, item attach/extract
- `chat` — streaming chat sessions over canon context
- `ingest` — upload transcripts and documents

See `src/types.ts` for parameter shapes.

## License

UNLICENSED — internal use only until released publicly.
