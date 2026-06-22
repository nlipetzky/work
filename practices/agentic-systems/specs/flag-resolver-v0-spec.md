# Spec: Flag Resolver v0

**Component:** the AI-first resolver in the flag-and-resolve layer.
**Parent:** `practices/agentic-systems/HANDOFF-flag-resolve-system-2026-06-11.md` (the architecture).
**Status:** spec + one-flag pilot. Batch runner is NOT built until the pilot's resolution shape is ratified.
**Form (Boris):** a skill / sub-agent that orchestrates the existing runners + a research lane. NOT Inngest yet.

## What it does

Works the `prep_flags` queue on a screened staging batch. For each flag it gathers the data the
decision needs, attempts a resolution, and either resolves (with provenance) or escalates a clean
packet. It never silently changes a verdict; every write is labeled and reviewable on the surface.

## The control flow (Boris's rule-existence gate)

Per flag, by **type**:

- **decision** — resolve ONLY if a written rule covers it; cite the `rule_ref` and set
  `status=resolved_by_rule`. **No rule → escalate** (do not self-decide on confidence). The first
  human answer **mints a rule** (deterministic → stage1/config; judgment → `client-guidance.md §0` +
  classifier prompt, dated), and the resolver applies it thereafter.
- **data** — resolve by **procedure**: one waterfall pass to recover the field. **Stop-loss: if the
  pass fails, the row DROPS as incomplete.** Never chase missing rows. (Source ~1.4×N up front so drops
  don't trigger re-sourcing.)
  - **RATIFIED 2026-06-11 (operator):** over-source factor = **1.4×N**. A record with **no resolvable
    domain after one waterfall pass is dropped as incomplete, logged — autonomously, never escalated.**
    This is routine data hygiene, not a decision: completeness failures are culled, not puzzled over.
    Escalation is reserved for genuine scope/judgment novelties, not janitorial rows.
  - **Waterfall = multiple providers**, currently **Apollo + Explorium** (use Explorium too — it is
    available; the earlier MCP "insufficient credits" was a connection/account issue, not the balance).
- **evidence** — resolve by **research**: gather sources, re-screen. 

**Two-source rule:** anything that **gates outreach** (modality OUT, reparenting, competitor calls)
requires **two independent sources** before the resolver may `ai_resolve`. Single-source is fine for a
`note`. If two sources aren't reachable, escalate.

**Confidence is telemetry.** Record it on every `ai_attempt`; **never gate on it.** The gate is
rule-existence + two-source, not a confidence cutoff.

## Escalation packet (strict format contract — adopted from Deepline's approval gate)

A packet **cannot escalate** unless all four sections are present:

1. **Assumptions** — including the active `rule_ref`s the resolver leaned on.
2. **Evidence** — what was gathered, each with its source.
3. **Tentative read + options** — the resolver's lean and the concrete choices.
4. **Question** — the single decision asked.

Packets land on the **surface queue with an alert** — never only in chat. Every resolution and packet
**discloses its load-bearing `rule_ref`s.**

## Spend gate

The waterfall and research lanes hit paid providers. Until a coded gate exists, the resolver **halts
for approval** before paid research — it may offer a paid step as a packet *option*, but does not take
it unprompted.

## Pilot-first (Boris)

The resolver pilots on **one flag**, writes one resolution, and shows the operator the **resolution
shape** before any batch run. The v0 pilot target is the one open row in
`staging.companies_mrna_pilot_2026_06_11`.

## Resolution shape (written to the row as `prep_resolution` jsonb)

`{ resolver_version, outcome (ai_resolved|escalated|dropped), ai_attempt {tentative, confidence,
reasoning}, rule_refs[], escalation_packet {owner, assumptions[], evidence[], tentative_read,
options[], question} }`
