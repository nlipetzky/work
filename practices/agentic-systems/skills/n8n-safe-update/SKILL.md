---
name: n8n-safe-update
description: Use this skill whenever updating an existing n8n workflow via the n8n-mcp `update_workflow` tool. Trigger on phrases like "update the workflow," "modify the n8n workflow," "patch the workflow," "change the node config," "rewire the workflow," or any operation that calls `update_workflow` on a workflow that already has credentials attached. Sets correct expectations around the three known gotchas: credentials get wiped on every update via this MCP, the API returns 500 on successful updates, and the update creates a new draft that must be published. Do NOT use for: creating new workflows (`create_workflow_from_code`); read-only operations (`get_workflow_details`, `validate_workflow`); activation/deactivation (`publish_workflow`, `archive_workflow`); workflow deletion.
---

# n8n Safe Update

Operating reality of updating n8n workflows through the n8n-mcp MCP server. This skill replaces a theoretical "prefetch-and-merge credentials" protocol that doesn't work because the MCP redacts credentials. The actual safe-update procedure is expectation management plus a publish-and-verify step.

## Three gotchas, all real

### 1. Credentials get wiped on every update

The MCP's `get_workflow_details` redacts the `credentials` field from every node. There is no way to read what credentials are attached, which means there is no way to merge them back into the update payload. Every `update_workflow` call therefore replaces the workflow with a payload that has no credentials → n8n clears them.

**Mitigation:** Tell the user before the update: "All Airtable / Gmail / etc. credentials will need to be reattached manually after this update." Do not promise otherwise. Use `newCredential('<credential name>')` in the SDK code so the placeholders are at least named usefully.

### 2. The `update_workflow` tool returns 500 on successful updates

This is a known bug in the MCP. The update succeeds at the n8n side but the MCP returns HTTP 500. **Do not retry on 500.** Verify success by calling `get_workflow_details` after — the new node graph will be present.

### 3. The update creates a new DRAFT, not the active version

`update_workflow` modifies the latest draft. The workflow's `activeVersionId` does not change. The user must publish the draft in the n8n UI (or call `publish_workflow` via MCP) for the changes to take effect.

After a successful update, `get_workflow_details` shows:

- `versionId` — the new draft (updated)
- `activeVersionId` — still the old version (unchanged)
- `nodes` — the new draft graph
- `activeVersion.nodes` — the old graph still running

The user sees the old behavior until they publish.

## Update protocol

1. **Set expectations.** Tell the user: credentials will need manual reattach, the MCP may return 500 falsely, and they'll need to publish the new draft.
2. **Build the SDK code with `newCredential()` placeholders** for every node that needs credentials. Name the placeholders descriptively.
3. **Validate** with `validate_workflow` first. Fix any errors.
4. **Call `update_workflow`.** If it returns 500, do not retry — call `get_workflow_details` to verify.
5. **Verify the update landed.** Check `get_workflow_details`: the new draft's `nodes` should reflect your changes. The `activeVersionId` will still point at the old version.
6. **Tell the user to publish.** In the n8n UI: open the workflow, reattach credentials on the affected nodes, click Save, then Activate or Publish. If using MCP, call `publish_workflow` after credentials are attached.

## What this does NOT cover

- **`create_workflow_from_code`** — new workflows have no prior credentials. Skip this skill.
- **Activating an existing workflow without code change** — use `publish_workflow` directly.
- **Credential management itself** — credentials are managed in the n8n UI. There is no MCP path to attach credentials to nodes.

## If a future MCP version exposes credentials

If `get_workflow_details` is ever updated to return the `credentials` field on nodes, the original prefetch-and-merge protocol becomes viable. Until then, treat credential reattach as mandatory after every update.

## Resume pointer

This skill was rewritten on 2026-05-13 after the first real test of the prefetch-and-merge protocol failed: the MCP redacts credentials, so the protocol could not run. The current skill reflects the actual behavior of the n8n-mcp MCP server.
