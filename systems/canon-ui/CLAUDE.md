# System: canon-ui (planned)

Planned system. Provisional purpose: a dedicated knowledge-workbench UI for canon-engine that's heavier than projection-ui's "everything-cockpit" pattern can carry cleanly ... canon entity browse/edit, lineage views across `canon_artifacts` + `canon_artifact_bindings`, source curation, the `_review/` registry queue, and direct asset/system editing without the operator-cockpit framing.

Open questions before this gets built:

- Is canon-ui justified as its own system, or should it stay a route group inside projection-ui? (The default is route group; promote to system only if the interaction model is genuinely product-like, e.g. a workflow designer.)
- If standalone, where does it run? (Second Next.js app on a different port + launchd service, or extracted from projection-ui after enough panels exist to warrant the split?)
- Does it own write paths to canon, or does it delegate to canon-engine RPCs the same way projection-ui does?

Until those resolve, this folder is a placeholder so the system shows up in the registry and the topology indexes; do not add code here yet.
