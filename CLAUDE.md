# Work OS

Nick is building an owned-asset studio with a JV venture arm. Service work funds the building. This directory is his operator OS: roles, workflows, skills, and all three engagement types.

## Structure

- `practices/` -- operator roles and pipelines. Each practice defines a persona, workflow, and artifact conventions. Shared across all engagement types. Active personas: Boris (agentic-systems), Kepler (sales-and-gtm), Hermes (expert-liaison), Polaris (engagement-governance), plus revops, automation, content, n8n-practice, management.
- `capabilities/` -- shared building blocks: skills, schemas, and agents that any practice or engagement can use.
- `assets/` -- owned properties Nick builds and operates. Audience, lead gen, monetization. Living proof of capability.
- `accounts/` -- all engagement-bound folders, grouped by relationship type:
  - `accounts/ventures/` -- partnership businesses (e.g. Konstellation AI). LLC + bank account, equity-based, co-owned with a domain expert.
  - `accounts/clients/` -- service engagements that fund the building. Expected to shrink over time.
  - `accounts/prospects/` -- pre-engagement context for prospects in active conversation.
- `reference/` -- studio-level reference docs (studio thesis, etc.).

Practices hold the *how*. Everything under `accounts/` holds the *what*. They compose: launch Claude Code from a folder under `accounts/` or from `assets/<name>/`, and the right operator + skills load via the practice's engagement-loading pattern.

## Studio thesis

Read `reference/studio-thesis.md` before any work that touches the relationship between practices, assets, ventures, or clients. It defines the studio's strategic frame: owned-asset studio with a JV venture arm, the paradigm shift to context-driven agentic systems, and the locked vocabulary (practice, capability, play, asset, venture, client). All structural decisions in this workspace derive from it.

## What this is not

Application code lives in `~/code/aos/`. That repo is a separate product. Do not mix operator system files with application code.

## Rules

- Never bake engagement-specific assumptions into a practice skill or capability.
- Artifacts are the product. Skills are how artifacts get made.
- Lock artifact schemas before writing skills.
- Automate only what has proven itself manually.

# Operator workspace

This directory (`~/code/work/`) is Nick's active operating system for client work. Everything inside is current and authoritative. Everything outside is historical.

## Trust boundary

**Authoritative sources** (read freely, treat as truth):
- Anything inside `~/code/work/`
- The engagement's NotebookLM notebook (Nick queries it; paste-only into `accounts/<type>/<name>/context/` where `<type>` is `clients`, `ventures`, or `prospects`)

**Historical sources** (do NOT read by default):
- `~/code/aos/`
- `~/code/<client-name>/` folders that exist outside `~/code/work/accounts/clients/`
- `~/Archive/`
- Any other folder under `~/code/` not inside `~/code/work/`

These older folders contain a mix of current and stale material from prior architectural attempts. You cannot tell which is which. Do not crawl them, do not cite them, do not derive context from them. If something seems missing, ask Nick. He will either confirm a gap, paste in what's needed, or point to an authoritative source.

If Nick explicitly asks you to read something outside this boundary ("look at the old aos/teknova folder for X"), do that one read, use it for the immediate task, and do not let it become a source for future decisions.

## How work is shaped here

Practices define roles and workflows. Clients hold engagement-specific context and artifacts. Skills produce artifacts. Artifacts are the deliverables.

When you launch in this directory, orient yourself by reading:
1. The relevant practice CLAUDE.md (revops, automation, content, agentic-systems, sales-and-gtm, expert-liaison, engagement-governance, etc.)
2. The relevant engagement CLAUDE.md (under `accounts/ventures/`, `accounts/clients/`, `accounts/prospects/`, or `assets/<name>/`)
3. The architecture notes at `practices/agentic-systems/reference/architecture-notes.md` if you need broader context

## Working principles

- Do not crawl the filesystem looking for context. Use trusted sources only.
- If a CLAUDE.md or context file is missing information, ask Nick. Do not infer it from old folders.
- Propose before executing destructive operations.
- Artifacts are the product. Skills are the function. Conversations are not the deliverable.