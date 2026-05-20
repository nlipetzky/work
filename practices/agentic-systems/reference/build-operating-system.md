# Build Operating System — asset lifecycle for agentic build work

**Status:** proposed operating model. Author: agentic-systems. 2026-05-18.

## The problem (stated plainly)

Agentic build work generates artifacts — n8n workflows, deployed drafts, build files, scratch test copies — faster than ad hoc tracking can keep up. Without an enforced lifecycle, every build leaves debris: orphaned workflows, scratch copies never torn down, no way to tell production from disposable without asking the agent. The operator ends up micromanaging every step to prevent spaghetti. That is a missing-guardrail problem, not an operator-discipline problem.

Concrete instance (2026-05-18): three workflows existed in n8n after one build cycle — prod L2, prod Verify, and an orphaned `[SMOKE]` variant whose teardown was deferred to "later." Deferred teardown is the anti-pattern. The system must forbid it.

We already have observability for two layers and not the third:
- **Run layer:** Enrichment Runs (what executed).
- **Process layer:** Play Steps (where the engagement is).
- **Asset layer:** *nothing* — no record of what workflows exist, which is prod, which is scratch, which is dead. This is the gap.

## These are solved problems — standard methodologies

Nothing below is invented. This is decades-old software practice; agentic work only makes the absence lethal faster.

| Methodology | What it gives us | Applied here |
|---|---|---|
| Environment separation (dev/test/prod) | Scratch never coexists with prod in one flat list | n8n project/tag namespace: `prod` vs `scratch` |
| Infrastructure-as-Code / GitOps | Repo is source of truth; the platform is a deployment target | `.build/*.ts` are canonical; n8n is reconstructable from them, never the store of record |
| Release management / promotion | Prove in scratch, promote to prod, destroy scratch | A build is not done until scratch is torn down |
| Naming conventions / namespacing | Status is legible at a glance | Name prefix `[PROD]` / `[SCRATCH-yyyymmdd]` / `[DEPRECATED]` |
| Service catalog / CMDB (system of record) | One place answers "what is production" | The asset registry below |
| Definition of Done + reconciliation | Drift between intended and actual state is detected | Close-out diffs n8n actual vs registry |

## The minimal operating model for this stack (n8n + Airtable + repo)

### 1. Source of truth = the repo, not the platform
Every workflow is a versioned build file under `practices/revops/workflows/.../`. If a workflow exists in n8n but not as a repo build file, it is by definition scratch or debris. n8n is where workflows *run*, never where they are *defined*.

### 2. Namespacing in n8n (native features, currently unused)
- Prod workflows: name prefixed `[PROD]`, in the `prod` n8n project/tag.
- Scratch/test: name prefixed `[SCRATCH-yyyymmdd]`, in a `scratch` project/tag. A scratch workflow has a stated expiry; past expiry it is debris and gets archived.
- Retired: `[DEPRECATED-yyyymmdd]` before deletion, never silent removal.

### 3. The asset registry (the system of record)
One canonical list — start as a markdown table in `practices/revops/workflows/REGISTRY.md`, promote to an Airtable table if it earns it. One row per workflow:

`name | n8n id | status (prod/scratch/deprecated) | source build file | deployed versionId | last verified (date + by) | owner | expiry (scratch only)`

This is the single place the operator looks to answer "what reached production." If it is not in the registry as `prod`, it is not production. No exceptions.

### 4. Lifecycle — teardown and registry update are GATES, not afterthoughts
A build cycle is **not done** until all of:
1. Deployed to the correct namespace.
2. Verified (real execution or read-back, per the work's gate).
3. **Registry row created/updated** (status, versionId, last-verified).
4. **Every scratch artifact created for this cycle is destroyed or explicitly promoted.** A scratch artifact that "we'll archive later" blocks done.

"Built and verified" is not done. "Built, verified, registered, scratch-torn-down" is done. This mirrors the build-vs-verified rule already in force, extended to assets.

### 5. Reconciliation at session close
At close-out: list n8n's actual workflows, diff against the registry. Anything in n8n not registered as `prod` (and past any scratch expiry) is flagged for archival in the same turn. This is the drift-detection step that makes the registry trustworthy instead of aspirational.

## Why this removes the micromanagement burden

The operator's job becomes reading one registry, not reconstructing state from memory or interrogating the agent. The agent cannot mark a build done while debris exists, because teardown is a gate. Scratch artifacts self-identify and expire. Drift is detected mechanically. The system enforces the discipline so the human does not have to watch every step — which was the actual complaint.

## Immediate remediation (this cycle)

1. Archive scratch `3ba5obhDdKcKc5Hs` (the orphaned `[SMOKE]` L2 variant).
2. Create `practices/revops/workflows/REGISTRY.md` with the three current workflows (`rXKuqfDwqX7TYzxK` prod L2, `2rTMeD7SB3SBNZZE` prod Verify, `3ba5obhDdKcKc5Hs` scratch→archived).
3. Adopt the lifecycle gates above for every subsequent build, starting with the currency-gate work.
