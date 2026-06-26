# Handoff — Constellation map complete (2026-06-05)

Long session. Started on the canon-crm-feed CRM/Motions work, pivoted into a full redefinition of the
System Registry, and ended by decomposing all eight constellations of the agentic organization. This
is where things stand.

## What got done

1. **CRM + Motions** (early session): built the Motions table + state machine in the partner CRM
   (Airtable base `app5tsy6zjfA8H3rx`, Motions `tblK83JY2FUj3zR31`). Spec at
   `systems/canon-crm-feed/MOTIONS.md`. A feed-rewire plan exists but is NOT executed:
   `systems/canon-crm-feed/PLAN-motions-rewire.md` (gated; build in a session launched from
   `systems/canon-crm-feed/`). The canon-crm-feed system itself is paused (see its HANDOFF).

2. **Registry model rewrite.** Replaced the old `platform`/`client-engagement` axis with the locked
   **Konstellation Catalog five layers**: Asset → System → Cluster → Constellation → Trajectory. The
   studio dogfoods the same architecture KAI sells. Authoritative source:
   `accounts/ventures/konstellation-ai/reference/catalog.md` (do not re-litigate). Two deep-research
   passes grounded the System/Asset boundary and the decomposition method against convention.
   - Rubric: `practices/agentic-systems/reference/system-classification.md`
   - Methodology: `practices/agentic-systems/reference/constellation-decomposition-methodology.md`
   - Research: `reference/agentic-system-definition-research-2026-06-04.md`
   - Operating manual updated (Classification section) + bound Operating Model entry in the base.

3. **All eight constellations decomposed**, each with an authority doc (`constellations/<slug>.md`,
   bound to its Constellations row via Context Path), ~24 System rows with emit contracts, Class
   (Core/Supporting/Generic), Coverage heatmap (Have/Partial/Missing), headline gap, and dependencies.

## The doc shape (the bar, set this session)

A constellation doc leads with definition, not systems: **What it is** (the thesis: scope, stakes,
essence, boundary) → **What good looks like** (falsifiable signs of value + absence tell) → a slim
**Systems** table tying each system to the "good" it produces → dependencies → open questions.
Decompose backward from the signs of value, never from the slogan. Canon is the exemplar.

## Key findings

- **The org's biggest gap is one shape repeating.** Six of eight constellations are missing their
  "keep-live" Core system: Canon→Currency, Compass→Course-Correction, Signal→Monitoring,
  Voice→Listening, Garden→Health, Guard→Oversight. The studio built the do-it-once systems and is
  missing the stay-current ones. Highest-leverage cross-cutting build on the map. Feed it to Compass.
- **Two departures:** Pulse is greenfield AND mostly Generic (build only Closing, buy Billing/Ledger).
  Forge is the studio's strongest constellation (it's a build studio); frontier is production autonomy.
- **Cluster questions dissolved via the definitions:** "RevOps" is a Cluster drawing from Signal +
  Voice + Compass; CRM + Motions = Garden Cultivation; operator-os heading toward Surface, not System.

## What's next (all well-framed, none started)

1. **RevOps cluster unwind.** Stand up a Clusters table in the base; reassign the existing RevOps
   sourcing/enrichment assets to `signal-prospecting` and outreach assets to `voice-delivery`. The
   migration plan (`PLAN-registry-classification-migration-2026-06-04.md`) covers this; note it predates
   some of the final structure, so reconcile it against the live base first.
2. **operator-os resolution.** Confirm it's a Surface (Asset/human interface) over Compass + Canon, not
   its own System. Reclassify.
3. **Build the stay-live layer.** The cross-cutting keep-live finding → a Compass planning pass to
   sequence it. Likely the highest-ROI build decision on the table.
4. **canon-crm-feed motions rewire** (from session start) still pending, gated, separate session.

## Strategic decisions left open (these won't auto-resolve from structure)
- Compass autonomy boundary (decide vs stage-for-Nick); where Compass's scattered decision substrate lives.
- Forge production autonomy (where the human stays in the loop).
- Voice-fidelity guard (Guard Policy) — the most acute near-term Guard build; existential to the SME model.

## Base IDs
```
Registry base   apppQjlZiktpbO4aX
Constellations  tblCCPj7Sm9md86y3   (fields added: Headline Gap fldyzYYQgnh3aTF60; Kind+Owner deleted)
Systems         tbldwCzbavBcOlP2C   (fields added: Class fldVEbU6Z9Scr5tvj, Coverage flditRvjBcSxHEAWx)
Constellation rows: Canon recJW8tnOeVQc2QSe · Compass recoXsrc9H3kPQ4GX · Signal recASV9599DlYex3p ·
Forge rec01ZdLof6oa1OAk · Voice recyVyn5wN9bdMA62 · Pulse recmMrXOyGGxMLMr5 · Guard recznBzUl8KxaSzaH ·
Garden recjZAdbQiGBJNKyI
```

## How a future session picks this up
Launch from `practices/agentic-systems/`. Read the operating manual (Classification section), the
methodology, then any constellation doc. The base is the legible surface; the docs are the authority.
The eight are defined; the work now is (a) unwind the RevOps cluster into the systems, (b) resolve
operator-os, (c) decide the stay-live build sequence with Compass.
