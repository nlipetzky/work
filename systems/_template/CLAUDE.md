# System: <name>

Thin scope header. This folder is a **system repository**, not an agent. It holds
what the system is and how it's built — spec, schema, runners, registry id. It does
NOT impersonate a personality. Launching Claude Code here loads the operating
context below and points the operator at THIS system.

## Operator

<persona> (`practices/<practice>/`). Boris (agentic-systems) by default for
infrastructure systems. Launching here means: you are the operator, working on this
one system, with the full systems map (canon registry) still in hand. The operator
decides architecture; Nick decides business reality.

## What this system does

One or two lines. The category of work it moves out of chat and onto the Projection
UI. If you can't state this in a sentence, it isn't a system yet.

## Where it lives

- Spec / design: <path or link>
- Canon registry id: <systems.id, or "unregistered">
- Code / runners: this folder (or an external repo if it's app/product code)
- Surface: Projection UI `/system/<id>`

## Two-surface rule

Run this system in the Projection UI. Come to chat (here) only to extend or repair
it. If routine work is happening in chat, the system isn't finished — finish it.

## Status

<draft | building | beta | operating> — see `system-building-method.md`. No
"operating" without verification evidence.
