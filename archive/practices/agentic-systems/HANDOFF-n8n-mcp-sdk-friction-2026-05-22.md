# HANDOFF: n8n-mcp SDK friction — investigate and fix

**Created:** 2026-05-22
**For:** Future Boris session
**Status:** Open — Nick paused work to flag this

## The problem

`update_workflow` in the n8n-mcp tool now requires SDK code (`@n8n/workflow-sdk` import, `workflow(...).add(...).to(...)` chain). It used to accept direct workflow JSON. Nick does not recall ever using an SDK to build n8n workflows. Something changed in the last day or two and multiple Boris sessions (this one plus prior ones) have wasted significant time wrestling with the SDK shape instead of just building the workflow.

## Concrete failure mode this session hit

Calling `update_workflow` regenerates the webhook node's internal `webhookId` on every call, even when the `path` parameter is preserved verbatim in the SDK code.

- Original node: `webhookId = "2164bb7d-bc23-48e8-b7f3-9a13a3378d4f"`, `path = "2164bb7d-bc23-48e8-b7f3-9a13a3378d4f"` (same UUID, used as the public URL segment)
- After first `update_workflow` (with path changed): `webhookId = "33c50f75-bd0a-4df9-af04-5de690358c58"`, `path = "linkedin-verify"`
- After second `update_workflow` (with path restored to original): `webhookId = "e9a67625-ccf9-4c9e-86a1-eec4186d3aba"`, `path = "2164bb7d-bc23-48e8-b7f3-9a13a3378d4f"`

The reported "Production path" still showed the right value, but Nick's downstream Airtable automation broke each time. So either:
- the public URL actually uses `webhookId` under the hood, not `path`, and the SDK reports `path` misleadingly, or
- something else in the node identity (UUID, version, internal binding) rotates and invalidates the existing automation listener

Either way: **calling `update_workflow` is destructive to webhook URLs**, even when the SDK code preserves the path string. Nick has to go into Airtable and re-fix the automation URL after every update. He has flagged this repeatedly across sessions.

## What to investigate

1. **When did n8n-mcp move to SDK-only?** Check the MCP tool changelog or recent updates. There may have been a regression or a new tool version that introduced this. Look at `mcp__463c02ef-7524-4dbd-a192-4d7e09f79119__*` (n8n-mcp server) — is there a non-SDK update endpoint that was removed or hidden?
2. **Is there a way to update just downstream nodes without retransmitting the webhook?** Partial-update semantics, or a "preserve nodes by id" flag?
3. **Why does `webhookId` rotate on update?** The SDK has no surface to set it. Does the n8n API accept a `webhookId` parameter we can pass through?
4. **Is the right answer to stop using `update_workflow` entirely?** Build new nodes in the n8n UI, or use a different MCP tool path (`create_workflow_from_code` once + UI edits after, or direct n8n API calls).

## Files to read for context

- `~/.claude/projects/-Users-nplmini-code-work/memory/n8n_mcp_credentials_preserved.md` — existing memory says credentials persist across updates. Webhook URL persistence is a separate issue not covered there.
- The `n8n-safe-update` skill (in installed skills) — its warnings cover credentials but not webhook URL rotation. Skill needs updating once the root cause is known.

## What I did in this session that wasted time

- Built workflow as SDK code (long file, validation loop, etc.) when Nick's prior workflow building never required SDK.
- Called `update_workflow` twice on a workflow with a live webhook, breaking the URL both times.

## Tone note for future Boris

Nick is annoyed at the repeated webhook breakage. Lead with the diagnosis here before recommending action. Do not call `update_workflow` on a workflow with a live webhook until this is resolved.
