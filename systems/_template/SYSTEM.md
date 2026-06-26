# SYSTEM: <name>

The contract for this system ... its own reality, read by any operator or persona
that works on it. Keep it current; this is the source of truth about what the
system is. It auto-loads when you launch Claude Code into this folder.

## Output

The defined output(s) this system produces. A system is a collection of activities
(automated or human) that produce a defined output. If you can't name the output,
it isn't a system yet.

## Activities

The steps that produce the output. Mark each automated or human.

- [ ] <activity> — automated | human
- [ ] <activity> — automated | human

## Depends on

Other systems / shared infrastructure this one needs.

- canon-engine (Supabase) — <why, or remove>
- revops-engine (Supabase) — <why, or remove>
- <other system> — <why>

## Surface

Where this system is operated and observed: Projection UI `/system/<id>`.

## Data contracts

Tables, schemas, and events this system reads/writes. Detail in `schemas/`.

## Operator

The persona that runs/builds this system ... a `practices/` persona for a
cross-cutting operator, or this folder's own `agents/` for system-specific agents.

## Registry

Canon `systems.id`: <id, or "unregistered">. Maturity:
<draft | building | beta | operating> (no "operating" without verification evidence).
