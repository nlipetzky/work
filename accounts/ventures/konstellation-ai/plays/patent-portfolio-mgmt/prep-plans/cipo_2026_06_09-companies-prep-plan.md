# Prep Plan — cipo_2026_06_09 (companies)

batch_id: `cipo_2026_06_09` · entity: companies · rows: 25
play: ?
playbook: ?
guidance: ?
generated: 2026-06-09T21:11:34.987Z

## Processing ledger
- by stage: semantic=24, sql=1
- verdicts: IN=9 · NARROW=0 · OUT=11 · NEEDS_REVIEW=5
- **verified for play: 18/25** · needs-evidence (research-lane queue): 7

## Verdicts

### IN — promote (9)
- **Carbon Robotics** — MED · ✓verified
  Robotics hardware developer with substantial revenue in a patent-active field and size consistent with ICP; public product profile (LaserWeeder) confirms proprietary technology ownership.
- **DEKA Research & Development** — MED · ✓verified
  DEKA is a well-known R&D and medical device developer with a substantial patent history; all four criteria pass with MED confidence due to thin company description (relying on external knowledge of the firm).
- **Gecko Robotics** — MED · ✓verified
  Gecko Robotics is a robotics hardware/software developer in a patent-active field at a size that fits the ICP; no conflicts detected, though confirming patent assignee records would raise confidence to HIGH.
- **Ghost Robotics** — MED · ✓verified
  Ghost Robotics is a known quadrupedal robotics developer in defense/robotics — a patent-active hardware field — with small-company size suggesting no in-house IP function; strong ICP fit.
- **Hai Robotics** — MED · ✓verified
  Hai Robotics is a robotics developer/manufacturer in a patent-active field with size consistent with ICP; thin description supplemented by well-known public profile of the company.
- **Mammoth Biosciences** — MED · ✓verified
  Mammoth Biosciences is a recognizable CRISPR biotech with publicly known proprietary technology and patent holdings; all four criteria pass cleanly at this revenue/stage size, though confidence is MED because the provided fields are thin and classification relies on external knowledge of the company.
- **Miso Robotics** — MED · ✓verified
  Miso Robotics is a publicly known robotics developer with proprietary hardware IP in a patent-active field; very low revenue signals early stage with no in-house IP function, strong fractional CIPO fit.
- **Onward Robotics** — MED · unverified · needs-evidence
  Robotics developer in a strongly patent-active field at a size consistent with lacking in-house IP counsel; passes all criteria but thin description warrants evidence confirmation before HIGH confidence.
- **Path Robotics** — MED · unverified · needs-evidence
  Path Robotics fits all criteria for a robotics technology developer at the right size, but the description is thin — patent assignee confirmation would elevate confidence from MED to HIGH.

### OUT — exclude (flagged, not dropped) (11)
- **Biotechnology Innovation Organization** — HIGH · ✓verified
  BIO is a biotech trade association, not a technology developer; it owns no patentable technology and is a services/advocacy org — clear OUT despite operating in a patent-active industry sector.
- **DeepLearning.AI** — HIGH · ✓verified
  outside the patent-owning ICP (services / non-tech / IP-services competitor) -> OUT
- **Genetic Engineering & Biotechnology News** — HIGH · ✓verified
  Media and publishing company covering biotech topics but owning no patentable technology; plainly off-ICP despite operating adjacent to the biotech industry.
- **IEEE Robotics and Automation Society** — HIGH · ✓verified
  Professional membership society with no proprietary patentable technology; not a technology developer or manufacturer — clearly off-ICP.
- **Modern Healthcare** — HIGH · ✓verified
  Media/publishing company with no patentable technology and no presence in a patent-active field; plainly off-ICP.
- **Neuroscience News** — HIGH · ✓verified
  Media/publishing company with no patentable technology and not in a patent-active field; plainly off-ICP.
- **RBW Consulting** — HIGH · ✓verified
  Pure Business/IT services consultancy with no proprietary technology, no patent-active field presence, and revenue too small to support a portfolio — clear OUT on all criteria.
- **TechCrunch** — HIGH · ✓verified
  TechCrunch is a media/publishing company with no proprietary patentable technology and operates in a plainly off-ICP field; OUT on all core criteria.
- **techolution** — HIGH · ✓verified
  Techolution is a pure IT/software services firm with no proprietary technology indicated; fails owns_patentable_tech and not_services_or_ip_firm, making it a clear OUT.
- **WIRED** — HIGH · ✓verified
  WIRED is a media/publishing company with no patentable technology and operates in a plainly off-ICP field; clear OUT on all relevant criteria.
- **Y Combinator** — MED · ✓verified
  Y Combinator is a well-known startup accelerator providing services to founders; it owns no patentable technology of its own and is a pure services organization — clearly OUT.

### NEEDS_REVIEW — not verified, do not promote yet (5)
- **Candela Medical** — MED · unverified · needs-evidence
  Candela Medical is a credible medtech manufacturer in a patent-active field, but the description is too thin to confirm patentable tech ownership or rule out an existing in-house IP function at this revenue level; NEEDS_REVIEW pending patent and headcount evidence.
- **Click Therapeutics, Inc.** — MED · unverified · needs-evidence
  Field and size are favorable, but the description is too thin to confirm ownership of meaningful patentable technology — public knowledge of Click as a digital therapeutics firm helps but does not resolve the IP-depth question without evidence of actual patent assets.
- **Locus Robotics** — MED · unverified · needs-evidence
  Industry label 'Engineering services' conflicts with Locus Robotics' known identity as an AMR robotics developer — data quality issue prevents confident IN; needs verification of proprietary tech ownership and correct company identity.
- **Open Robotics** — LOW · unverified · needs-evidence
  Industry tag 'Media / publishing / information' conflicts with the well-known Open Robotics robotics-software identity; cannot confirm patentable tech ownership or correct field without resolving the mismatch — NEEDS_REVIEW rather than a guessed IN.
- **Wyss Institute at Harvard University** — MED · unverified · needs-evidence
  Wyss clearly operates in a patent-active field and develops patentable tech, but IP ownership and management likely sit with Harvard's central OTD, making fit uncertain without confirmation of an independent portfolio-management need at the institute level.


## Gap + enrichment plan (research lane — parked)
- **Onward Robotics**: Robotics developer in a strongly patent-active field at a size consistent with lacking in-house IP counsel; passes all criteria but thin description warrants evidence confirmation before HIGH confidence.
- **Path Robotics**: Path Robotics fits all criteria for a robotics technology developer at the right size, but the description is thin — patent assignee confirmation would elevate confidence from MED to HIGH.
- **Candela Medical**: Candela Medical is a credible medtech manufacturer in a patent-active field, but the description is too thin to confirm patentable tech ownership or rule out an existing in-house IP function at this revenue level; NEEDS_REVIEW pending patent and headcount evidence.
- **Click Therapeutics, Inc.**: Field and size are favorable, but the description is too thin to confirm ownership of meaningful patentable technology — public knowledge of Click as a digital therapeutics firm helps but does not resolve the IP-depth question without evidence of actual patent assets.
- **Locus Robotics**: Industry label 'Engineering services' conflicts with Locus Robotics' known identity as an AMR robotics developer — data quality issue prevents confident IN; needs verification of proprietary tech ownership and correct company identity.
- **Open Robotics**: Industry tag 'Media / publishing / information' conflicts with the well-known Open Robotics robotics-software identity; cannot confirm patentable tech ownership or correct field without resolving the mismatch — NEEDS_REVIEW rather than a guessed IN.
- **Wyss Institute at Harvard University**: Wyss clearly operates in a patent-active field and develops patentable tech, but IP ownership and management likely sit with Harvard's central OTD, making fit uncertain without confirmation of an independent portfolio-management need at the institute level.

## Dedup / hierarchy + acquired-routing
- none

## Execution operations (for the executor, on approval)
1. promote the IN set on-rails via promote_staging_batch (provenance-aware).
2. leave NARROW + OUT in staging, visibly flagged; do not drop.
3. hold NEEDS_REVIEW for the research lane.

## APPROVAL: <go | no-go> — Nick, <date>
