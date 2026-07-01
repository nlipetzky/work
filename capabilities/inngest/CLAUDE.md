# Capability: Inngest

Shared Inngest client for the studio runtime. One client per serving endpoint; projection-ui owns the endpoint. Every system that defines Inngest functions or sends events imports the client from here.

## Why this lives in capabilities/

The Inngest client passes the four-question promotion rubric:

1. Used by more than one system. ✓ (projection-ui serves; revops-engine and future systems define functions; staging API routes send events.)
2. Does not encode one system's business policy. ✓ (it is the transport / runtime contract.)
3. Versions independently. ✓ (Inngest SDK version applies to the whole studio runtime.)
4. Safe as infrastructure. ✓ (no business logic.)

## Contract

Import the client from anywhere with:

```ts
import { inngest } from "@/../../capabilities/inngest/client";
// or from projection-ui's tsconfig path (preferred inside projection-ui):
// import { inngest } from "@/lib/inngest/client";   // legacy alias if reintroduced
```

When you define a function in a system's `workflows/` folder, use this client:

```ts
import { inngest } from "../../../capabilities/inngest/client";
export const myFunction = inngest.createFunction({ id: "my-function", ... }, async (ctx) => { ... });
```

When you send an event from an API route, use this client:

```ts
import { inngest } from "@/../../capabilities/inngest/client";
await inngest.send({ name: "domain.event.name", data: { ... } });
```

## Where the endpoint lives

Inngest functions are served from `systems/projection-ui/app/api/inngest/route.ts`. That route imports the union of every system's `workflows/index.ts` and registers them via Inngest's `serve()` handler.

To register a new system's workflows, add its `workflows/index.ts` to the union in projection-ui's route.

## Dev loop

Local dev runs the Inngest dev server pointed at projection-ui:

```bash
inngest dev -u http://localhost:4180/api/inngest
```

The Inngest dev UI is on the standard port (8288 by default).

## Do not

- Do not create a second Inngest client elsewhere. One client = one app from Inngest's POV; duplicating it splits the run history.
- Do not put function definitions here. Functions belong in the owning system's `workflows/` folder. This folder is the client only.
