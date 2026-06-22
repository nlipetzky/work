---
name: Demand context
slug: demand-context
home: signal
clusters: [revops]
class: core
lifecycle: defined
flags: []
autonomy: manual
outcome: >
  Outbound plays run on evidenced demand understanding, never a guessed ICP.
contract:
  inputs:
    - {name: Expert transcripts, status: manual}
  outputs:
    - {name: Observations, status: off}
  metrics:
    - {name: Claims traceable to evidence, value: null}
  stopping: All signal extracted with provenance.
assets:
  - {name: Observation store, type: database, ownership: own, status: to-build, verified_by: null}
  - {name: Canon corpus, type: database, ownership: "shared:canon-ingestion", status: connected, verified_by: null}
context:
  - {name: Extraction skill, version: null, status: to-write, verified_by: null}
---

Body prose here.
