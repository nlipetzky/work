# Architecture notes

Decisions made with Boris (Claude.ai chat session, 2026-05-06). This file is the source of truth for the architectural shape of Nick's operating system. Read this before recommending changes to structure.

## Core insight

Nick is building two things and was conflating them:

1. An **operating system** for his consulting work (skills, client folders, CLAUDE.md, artifacts).
2. An **agentic application** he eventually wants to ship (api, functions, supabase, dispatch-signals, command-surface).

These are not the same thing. They live in different repos. Mixing them is what produced the mess in `~/code/aos/` and the parallel `revops-engine` / `revops-engine-ARCHIVED` folders.

**OS first, automation second.** Validate the workflow with Nick in the loop. Once a workflow consistently produces the right artifacts, then automate the parts that have proven themselves. Building the plane while flying it does not work.

## Repo structure

```
~/code/work/
├── CLAUDE.md
│
├── practices/                    ← renamed from domains/
│   ├── revops/
│   ├── automation/
│   ├── content/
│   └── agentic-systems/          ← renamed from coach-boris/
│       ├── CLAUDE.md             ← Boris persona, agentic systems practice
│       └── reference/
│           └── architecture-notes.md
│
├── capabilities/                 ← renamed from primitives/
│   ├── skills/
│   ├── schemas/
│   └── agents/
│
├── assets/
│   └── _template/
│
├── ventures/
│   └── _template/
│
└── clients/
    ├── _template/
    └── teknova/
        ├── CLAUDE.md
        ├── revops/
        └── automation/
```

## Key principles

**Practices hold the *how*. Clients hold the *what*.** A practice (revops, automation, agentic-systems) defines a role and a workflow. A client folder holds context and artifacts specific to one engagement. They compose: launch Claude Code in a client folder, declare the practice in the client's CLAUDE.md, and the right operator + skills load.

**Skills are domain-agnostic of clients.** Same `segment-spec` skill works for every RevOps client. When you improve it, every client benefits. Do not bake client-specific assumptions into a skill.

**Artifacts are the product. Skills are the function.** Each pipeline stage takes prior artifacts as input and produces one markdown artifact as output. The next stage reads that file. Skills are how the artifacts get made; the artifacts are what's actually delivered.

**Lock artifact schemas before writing skills.** Most people write skills first and end up with inconsistent output. Define the markdown shape of every artifact in the chain (offer, segment, brief, copy) before writing the skills that produce them.

**Skills follow a uniform meta-template.** Every pipeline skill has the same shape: declared input artifacts, declared NotebookLM queries to run, declared output artifact format. This keeps the chain composable.

**A skill is not shipped until it is registered.** Authoring a skill creates files. Registering it makes Claude Code able to load it. Both steps are required; skipping the second produces an invisible skill.

## Skill registration

Skills are authored in `practices/<practice>/skills/<skill-name>/`. That folder is the architectural home and source of truth for the skill (SKILL.md, supporting reference files, examples).

Claude Code discovers skills only from `~/.claude/skills/` (plus plugin-bundled paths declared in `~/.claude/settings.json` under `enabledPlugins`). It does not walk the practices tree. It does not read CLAUDE.md to find skills. There is no `skillPaths` config setting.

Registration is a symlink from `~/.claude/skills/<skill-name>` pointing to the authored location:

```bash
ln -s ~/code/work/practices/<practice>/skills/<skill-name> \
      ~/.claude/skills/<skill-name>
```

Symlinks are honored by the loader. The pattern is already in use for non-practice skills (`design-md`, `supabase`, etc. all symlink out of `~/.claude/skills/` to other source repos).

**Authoring workflow ends at the symlink, not at the file write.** When a new skill is created:
1. Author SKILL.md and supporting files in `practices/<practice>/skills/<skill-name>/`.
2. Symlink it into `~/.claude/skills/<skill-name>`.
3. Verify it appears in a fresh Claude Code session before declaring the skill complete.

If the symlink step is skipped, the skill exists but cannot be invoked. Treat unregistered skills as a build failure, not as a "later" task.

## RevOps pipeline

Each stage produces one markdown artifact in the client's `artifacts/` folder. Filenames follow the `<practice>-<capability>-<play>.md` convention. The unit of work is a **play** (see vocabulary lock entry in the decisions log).

1. **Offer** ... what's being pitched, to whom, why now. Skill: `offer-extract`. Output: `revops-offer-<play-slug>.md`.
2. **Segment criteria** ... who in the database meets the criteria for this offer. Skill: `segment-criteria`. Reads offer. Output: `revops-segment-<play-slug>.md`. Source-agnostic of database schema and enrichment provider.
3. **Creative brief** ... how the message should sound, what proof to use, what to avoid. Skill: `creative-brief`. Reads offer + segment. Output: `revops-brief-<play-slug>.md`.
4. **Copy** ... actual sequence drafts. Skill: `copy-draft`. Reads brief. Output: `revops-copy-<play-slug>.md`.

Pipeline is composable. A play can stop at any stage if that's all Nick needs.

## Client folder structure

```
clients/<client>/
  CLAUDE.md          ← client-level context (practice-agnostic)
  sources/           ← ingested context (provenance: external)
  artifacts/         ← produced context (provenance: capability output)
  <practice>/        ← per-practice subfolder, added when a practice activates
    CLAUDE.md        ← practice-specific context for this client
```

`sources/` and `artifacts/` are **client-scoped** and top-level. They are not practice-private. A play often spans practices (RevOps offer + content draft + automation pipeline); putting artifacts under a practice folder fragments them and forces cross-practice references to walk through the wrong namespace.

Practices live as sub-namespaces under the client. They hold practice-specific CLAUDE.md and any practice-internal working folders that are not artifacts (e.g. `automation/builds/` for n8n workflow exports).

## Vocabulary: sources vs artifacts

Both are context. The distinction is provenance.

- **`sources/`** — ingested context. Material that came from outside the agent: NotebookLM exports, customer transcripts, prospect docs, intake forms, vendor docs. The agent reads these but did not produce them.
- **`artifacts/`** — produced context. Material a capability wrote: offer documents, segment criteria, creative briefs, copy drafts. The agent produced these and downstream capabilities consume them.

The old `context/` folder name was trying to capture "ingested." `sources/` is sharper and pairs cleanly with `artifacts/` along the produced/ingested axis.

## Filename conventions

**Artifacts:** `<practice>-<capability>-<play>.<ext>`

Example: `revops-offer-aav-gene-therapy-ellie-outreach.md`, `revops-segment-mcb-launch.md`, `revops-company-scope-aav-gene-therapy-ellie-outreach.csv`, `content-brief-cdmo-positioning.md`.

`<practice>` namespaces the file (so two practices can produce artifacts for the same play without collision). `<capability>` names the skill or capability that produced it. `<play>` is the linker — the same play slug appears in every artifact across practices working on the same outbound effort. `<ext>` is whatever extension matches the artifact (`.md` for documents, `.csv` for evaluated lists, `.json` for structured exports). The convention is not markdown-only.

**Play slug rules (apply to artifact filenames AND folder names):**
- Name the substance: `aav-gene-therapy-ellie-outreach`, `mcb-launch`, `cdmo-cell-therapy-process-dev`.
- Forbidden: indexed slugs (`play-006`, `play-12`), date-based slugs (`may-play`, `q1-outreach`), or anything else where the timing or order is in the slug instead of the substance. Index and date belong in metadata, not in the filename.
- If you find an artifact with a forbidden slug, rename it before any further work touches it. Slug drift compounds.

**Sources:** `<source-type>-<scope>-<date>.md`

Example: `notebooklm-aav-ellie-outreach-2026-05-06.md`, `transcript-q1-discovery-2026-04-12.md`, `intake-form-mcb-launch-2026-05-01.md`.

`<source-type>` names the kind of source (notebooklm, transcript, intake-form, vendor-doc, etc.). `<scope>` is a play slug when the source is play-specific, or a topic/period when broader. `<date>` is `YYYY-MM-DD`, the date the source was captured.

## Source of context (NotebookLM)

Client context (8 months of meeting transcripts, emails, documents) lives in a vector database (NotebookLM or equivalent). Claude cannot query it directly. Nick is the human in the loop... runs queries against NotebookLM, pastes responses into the client's `sources/` folder using the source filename convention.

Each skill tells Nick **specifically what to query NotebookLM for** at its stage. "Paste relevant context" is not enough; under-fetching produces thin output. The query specs are where Nick's RevOps expertise gets encoded.

## CLAUDE.md inheritance principles

Claude Code walks up the directory tree from launch directory, loading every CLAUDE.md it finds. Everything compounds. Treat this like environment variable inheritance.

**Layer rules:**
- **Global** (`~/.claude/CLAUDE.md`) = output constraints only. Currently 22 lines: format rules, voice, defaults. No philosophy, no role definition.
- **Project** (`~/code/work/CLAUDE.md` and `~/code/work/practices/<practice>/CLAUDE.md`) = role definition. Operator persona, workflow, pipeline.
- **Client** (`~/code/work/clients/<client>/CLAUDE.md`) = client-specific context. Tone, exclusions, named accounts, pointer to NotebookLM source.
- **Conversation** = the actual task at hand.

**Do not put project-specific rules at higher levels.** A file at `~/CLAUDE.md` that contains MCP routing rules for a specific tool will load into every session anywhere in the home directory and pollute unrelated work. Same for putting a manifesto at the global level when it should be a practice CLAUDE.md.

**Keep the load chain short and intentional.** Every loaded file is a potential source of weird behavior. Fewer files, each doing one job, is easier to debug.

## Migration approach

**Don't migrate. Cut.** Building `~/code/work/` from scratch is correct. Carefully porting everything from the old `~/code/aos/` and shrapnel will preserve the confusion that produced the mess.

**Order of operations:**
1. Stand up empty `~/code/work/` shell.
2. Produce a migration inventory: every folder in the old layout gets a port / archive / delete decision.
3. Separate application code from operator system. The aos application (api, functions, supabase, etc.) is its own product and lives in its own repo. The operator system goes in `~/code/work/`.
4. Port lean: do not copy old skills wholesale. Open each, decide if you want it, rewrite from scratch against the new meta-template. Most old skills are 80% noise.
5. Move active client context into `~/code/work/clients/<client>/context/`. Move shipped artifacts into `artifacts/`. Fill in each client's CLAUDE.md.
6. Archive the rest. Move old folders to `~/Archive/` with a date. Delete after 60 days of not touching it.
7. Validate by running one real campaign for one real client end-to-end through the new structure. Build skills as needed, against real work.

**Resist:** building all skills before doing real work; preserving folders out of nostalgia; mass-migration weekend.

## Status

**Done:**
- Replaced global `~/.claude/CLAUDE.md` with lean 22-line constraints-only file.
- `~/CLAUDE.md` archived. Resolved.
- `agentic-systems` practice stood up with `CLAUDE.md` and `architecture-notes.md`. Done.
- Designed top-level `~/code/work/CLAUDE.md`, practice CLAUDE.md template, client CLAUDE.md template.

**Open decisions:**
- `~/code/aos/` contains a mix of operator-system attempts and application code. Decision needed: which parts are the application (port to its own repo as a real product) vs which parts are operator-system attempts (cut, do not port; rewrite from scratch in `~/code/work/`).
- `~/code/CLAUDE.md` was suspected to exist but screenshot shows it does not. Confirm.

**Next steps:**
1. **Produce migration inventory** (`~/code/work/migration-inventory.md`) with port/archive/delete decisions for everything in the current `~/code/` layout.
2. Stand up remaining `~/code/work/` shell structure (revops, automation practices).
3. Pick one active client and stand them up in the new structure. Run a real campaign through manually (no skills yet) to validate the artifact schemas.
4. Lock artifact schemas in `~/code/work/practices/revops/skills/_shared/artifact-schemas.md`.
5. Write `skill-meta-template.md`.
6. Build first skill: `offer-extract`. Then `segment-criteria`. Then stop and review.

### 2026-05-06: Owned-asset studio model, not service firm
Strategic frame clarified: Nick is building an owned-asset studio with a JV venture arm. Service work funds the building. Assets and ventures are the destination. Restructured `~/code/work/` to add `assets/` and `ventures/` as peers to `clients/`. Added top-level `capabilities/` to hold shared skills, schemas, and agents. Added `content` practice placeholder for owned-asset work.

### 2026-05-06: Practice is a task property, not a client property
Client folders now have practice subdirectories (e.g., `revops/`, `automation/`). Client root CLAUDE.md is domain-agnostic. Practice-specific CLAUDE.md and artifacts live one level deeper. Same pattern will apply to assets and ventures as they're populated.

### 2026-05-06: Renamed "domain" to "practice"
"Domain" was technical-software-architecture jargon (DDD origins) and mapped poorly to the studio frame. "Practice" reflects what these things actually are: bodies of expertise applied repeatedly, deepening over time, like a medical or legal practice. Better fit for the venture-studio framing and for partner conversations. Locked in early to avoid harder migration later.

### 2026-05-06: Renamed "primitive" to "capability"
"Primitive" was CS jargon implying low-level building blocks. "Capability" is the more business-honest description of what these are: things the studio can do. Capability also has the right scope flexibility... it covers small skills and larger composed agents without forcing additional naming tiers.

### 2026-05-06: Renamed "coach" practice to "agentic-systems"
"Coach" was too generic and didn't describe what Boris actually coaches on. "Systems" was too dated and broad. "Agentic systems" is precise: it names the architectural era, the medium (autonomous agents composing into systems), and the actual subject Boris coaches Nick on. Boris remains the operator persona inside the agentic-systems practice.

### 2026-05-06: Renamed pipeline skill `segment-spec` → `segment-criteria`
The skill produces criteria for a segment, not a finalized segment specification. The downstream evaluation step is what turns criteria into a segment. Rename better reflects what the artifact is. Pipeline neighbors (`offer-extract`, `creative-brief`, `copy-draft`) keep their names; only this stage changed.

### 2026-05-06: Schema location: per-artifact files at `practices/<practice>/schemas/`
Original plan was a single `_shared/artifact-schemas.md` per practice. Per-artifact files scale better and are easier to edit and reference. Schemas live at `practices/revops/schemas/<artifact>.md`. The `_shared/` folder remains available for things genuinely shared across multiple skills (e.g., a criterion-types reference, if it ever needs to be lifted out of the segment-criteria skill folder).

### 2026-05-06: Vocabulary lock: "play," not "campaign"
The RevOps practice uses "play" as the unit of work, not "campaign." A play is a single unit of outbound (defined audience, defined offer, defined sequence) that gets approved, run, observed, and either repeated or retired. Plays compose into a program. Multiple plays may support one offer. "Campaign" is reserved for client-facing language only when the client uses it; internally we say "play." Plays are named for what they do, not when they run: `mcb-launch`, `cdmo-cell-therapy-process-dev`, `new-leader-abm-launch`. Date-based slugs like `may-play` are forbidden; the substance is in the slug, the timing is in the date metadata.

### 2026-05-06: First RevOps skill shipped: `segment-criteria`
Built `practices/revops/skills/segment-criteria/` (SKILL.md, criterion-types.md, example-output.md) and `practices/revops/schemas/segment-criteria.md`. Source-agnostic; produces a markdown criteria document that a downstream evaluation capability translates into a list. First real test: Teknova `aav-gene-therapy-ellie-outreach` play.

### 2026-05-06: Second RevOps skill shipped: `offer-extract`
Built `practices/revops/skills/offer-extract/` (SKILL.md, offer-anatomy.md, example-output.md) and `practices/revops/schemas/offer.md`. Same shape as `segment-criteria`. Produces the offer artifact (headline, audience, offer, why-now, proof, ask, out-of-scope, confidence-and-gaps) read by every downstream pipeline skill. The example output is the offer for the same fictional play used in the segment-criteria example, so the two artifacts compose visibly.

### 2026-05-06: Client folder structure: sources/artifacts elevated to client scope; renamed context to sources; practice-prefixed artifact filenames
Discovered during the first `offer-extract` run on the Teknova `aav-gene-therapy-ellie-outreach` play. Two problems surfaced:

1. **Duplicate folders.** Both `clients/teknova/artifacts/` (top-level) and `clients/teknova/revops/artifacts/` (practice-scoped) existed at different points. The skill referenced `<practice>/artifacts/` while practical use kept landing things at top-level.
2. **`context/` vs `artifacts/` was confusing.** Both hold context. The real distinction is provenance: ingested (from outside the agent) vs produced (by a capability).

Resolution:
- **Elevated `sources/` and `artifacts/` to client scope.** Top-level under each client folder, peer to practice subfolders. Practices are sub-namespaces; artifacts and sources are not practice-private.
- **Renamed `context/` to `sources/` everywhere.** Sharper noun, pairs cleanly with `artifacts/`.
- **Instituted artifact filename convention `<practice>-<capability>-<play>.md`.** Now that artifacts share a folder across practices, filenames carry practice and capability as metadata. Play slug links artifacts together across practices working on the same outbound effort.
- **Source filename convention `<source-type>-<scope>-<date>.md`.** Formalized from the existing pattern in the Teknova notebooklm export.

Applied to: Teknova client folder, `_template/` scaffold (added `sources/` and `artifacts/`), `offer-extract` and `segment-criteria` SKILL.md output paths, this architecture-notes.md (new sections: Client folder structure, Vocabulary: sources vs artifacts, Filename conventions; updated: RevOps pipeline filenames, Source of context).

Not applied to: ETA (no folders to migrate, just two top-level markdown files), MMS (legacy structure with own .git, docs/, n8n-workflows/, airtable/ — does not conform to new shape and was not in scope to restructure). When MMS gets a new engagement, restructure then.

Open questions deferred:
- `clients/teknova/automation/builds/` and `clients/teknova/revops/campaigns/` are practice-scoped non-artifact folders. They're not addressed by the new shape but also not contradicted. Kept in place; revisit when either practice produces real builds or plays.

### 2026-05-06: Skill registration via symlink into `~/.claude/skills/`
Discovered when `offer-extract` was authored in `practices/revops/skills/` but did not appear in Claude Code's slash menu from a Teknova session. Investigation: Claude Code only discovers skills from `~/.claude/skills/` (plus plugin paths in settings.json). It does not walk `practices/`, does not read CLAUDE.md to register skills, and there is no config key for additional paths. Symlinks into `~/.claude/skills/` are honored — already the pattern for `design-md`, `supabase`, and other external skills.

Decision: practices remain the architectural home for skills. Registration is a symlink from `~/.claude/skills/<skill-name>` to the authored location. Skill-authoring workflow now ends at the symlink, not at file write. Documented in the new "Skill registration" section above. Registered `offer-extract` and `segment-criteria` against `~/.claude/skills/`.

## Things to remember when coaching Nick

- He has been burned by AI running ahead of him in the wrong direction. Propose, get sign-off, then execute. Especially for destructive operations.
- He has been burned by his own past attempts to build everything at once. Push back when scope expands. Smallest version first.
- His instinct is to write more documentation when something fails. Often the answer is less documentation, sharper structure, real validation against real work.
- The chat session that produced these notes was unusually productive because it stayed diagnostic and pushed back hard on premise. Replicate that mode.