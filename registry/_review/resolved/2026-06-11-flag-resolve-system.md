---
type: new-system
system: flag-resolve
lifecycle: Designed
evidence: practices/agentic-systems/HANDOFF-flag-resolve-system-2026-06-11.md
also: accounts/clients/teknova/plays/mrna-therapeutics/classifier/flags-v0.sql
proposed: "Admit the flag-and-resolve layer to the registry at Designed; approve v0 (prep_flags + prep_attention + field-coverage gate) as proven on live data; next build is the AI resolver per Boris's contract."
created: 2026-06-11
---

## What changed this session

A new data-prep autonomy component was designed and built to v0 on the Teknova mrna-therapeutics
play (the proving ground):

- **Flag-and-resolve layer.** Row-level flags as work items (type / severity / owner / ai_attempt+
  confidence / status), an AI-first resolver (next build), and a rule-existence-gated escalation to
  the client SME. Design + full context in the handoff (evidence above). Reviewed by Boris; decisions
  recorded there (confidence is telemetry never a gate; decision flags resolve only with a rule_ref;
  Deepline disciplines adopted — strict escalation-packet contract, two-source rule for outreach-
  gating resolutions, stop-loss-then-drop on data flags, resolver pilots on one flag first).
- **v0 shipped on live data.** `flags-v0.sql` writes `prep_flags` (jsonb) + `prep_attention` onto the
  screened batch from three known rules (large_player ≥2000, missing_domain, oligo-name) + a field-
  coverage gate. Result on `staging.companies_mrna_pilot_2026_06_11` (10 rows): attention roll-up =
  8 clear / 1 open / 1 informational. The one open row is a genuine data+evidence problem; Moderna's
  size question is auto-resolved by rule and sits informational — i.e. the human attention list
  collapsed from 10 to 1. The flag-object shape is provisional, locks after operator reaction.

## Engine change folded in

- `loader/load-companies-csv-to-staging.mjs` gained a `--source PROVIDER` arg: the `source` column now
  names the data origin (`apollo`), not the batch id. Backward compatible (defaults to batchId).

## What approval means

Admit `flag-resolve` to the registry at **Designed**, with v0 as the proven floor. Next build is the
resolver agent (skill/sub-agent over existing runners) with the confidence gate and escalation-packet
contract from the handoff. The reusable pattern is meta-practice craft; the play runs the instance.
