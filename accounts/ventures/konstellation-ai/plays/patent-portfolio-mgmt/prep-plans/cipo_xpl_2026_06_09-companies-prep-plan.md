# Prep Plan — cipo_xpl_2026_06_09 (companies)

batch_id: `cipo_xpl_2026_06_09` · entity: companies · rows: 25
play: ?
playbook: ?
guidance: ?
generated: 2026-06-09T21:37:25.264Z

## Processing ledger
- by stage: semantic=9, sql=16
- verdicts: IN=0 · NARROW=0 · OUT=25 · NEEDS_REVIEW=0
- **verified for play: 25/25** · needs-evidence (research-lane queue): 0

## Verdicts

### OUT — exclude (flagged, not dropped) (25)
- **Akraya, Inc.** — HIGH · ✓verified
  Akraya is a pure IT services, consulting, and talent/staffing firm with no indication of proprietary patentable technology; fails not_services_or_ip_firm and owns_patentable_tech outright.
- **Barrington James** — HIGH · ✓verified
  outside the patent-owning ICP (services / non-tech / IP-services competitor) -> OUT
- **BioTalent** — HIGH · ✓verified
  outside the patent-owning ICP (services / non-tech / IP-services competitor) -> OUT
- **Blue Signal Search** — HIGH · ✓verified
  outside the patent-owning ICP (services / non-tech / IP-services competitor) -> OUT
- **Cypress HCM** — HIGH · ✓verified
  outside the patent-owning ICP (services / non-tech / IP-services competitor) -> OUT
- **EarthStream Global** — HIGH · ✓verified
  outside the patent-owning ICP (services / non-tech / IP-services competitor) -> OUT
- **edX** — HIGH · ✓verified
  outside the patent-owning ICP (services / non-tech / IP-services competitor) -> OUT
- **Engadget** — HIGH · ✓verified
  Engadget is a technology news media brand — a content/publishing service with no proprietary patentable technology; fails owns_patentable_tech, patent_active_field, and not_services_or_ip_firm.
- **Engtal** — HIGH · ✓verified
  outside the patent-owning ICP (services / non-tech / IP-services competitor) -> OUT
- **Green Key Resources** — HIGH · ✓verified
  outside the patent-owning ICP (services / non-tech / IP-services competitor) -> OUT
- **Harnham** — HIGH · ✓verified
  outside the patent-owning ICP (services / non-tech / IP-services competitor) -> OUT
- **Lawrence Harvey** — HIGH · ✓verified
  outside the patent-owning ICP (services / non-tech / IP-services competitor) -> OUT
- **Liberty Personnel Services, Inc.** — HIGH · ✓verified
  outside the patent-owning ICP (services / non-tech / IP-services competitor) -> OUT
- **Neuroscience News** — HIGH · ✓verified
  Media/publishing platform with no proprietary patentable technology; plainly off-ICP field — clear OUT.
- **Orion Group** — HIGH · ✓verified
  outside the patent-owning ICP (services / non-tech / IP-services competitor) -> OUT
- **Pentagram** — HIGH · ✓verified
  Pure design services shop with no proprietary patentable technology; fails owns_patentable_tech, patent_active_field, and not_services_or_ip_firm simultaneously.
- **Piper Maddox** — HIGH · ✓verified
  Piper Maddox is a clean-energy staffing and recruiting firm — a pure services business with no proprietary patentable technology; plainly off-ICP.
- **Searchability®** — HIGH · ✓verified
  outside the patent-owning ICP (services / non-tech / IP-services competitor) -> OUT
- **Storm3** — HIGH · ✓verified
  outside the patent-owning ICP (services / non-tech / IP-services competitor) -> OUT
- **TechCrunch** — HIGH · ✓verified
  TechCrunch is a tech news publisher, not a technology developer or manufacturer — no patentable IP, no patent-active field, clearly out of ICP.
- **techolution** — HIGH · ✓verified
  Techolution is an IT consulting/services firm that builds AI solutions for clients; despite mention of 'proprietary IP,' the core business model is services delivery, placing it squarely in the not_services_or_ip_firm disqualifier.
- **Understanding Recruitment** — HIGH · ✓verified
  outside the patent-owning ICP (services / non-tech / IP-services competitor) -> OUT
- **Vivid Resourcing** — HIGH · ✓verified
  outside the patent-owning ICP (services / non-tech / IP-services competitor) -> OUT
- **ZDNET** — HIGH · ✓verified
  ZDNET is a technology media/publishing brand with no proprietary patentable technology — plainly off-ICP.
- **Zemoso Technologies** — HIGH · ✓verified
  Pure IT services and consulting shop building client-owned digital products; no proprietary patentable technology owned by Zemoso, and the business model is explicitly services delivery — clearly OUT.


## Gap + enrichment plan (research lane — parked)
- none flagged

## Dedup / hierarchy + acquired-routing
- none

## Execution operations (for the executor, on approval)
1. promote the IN set on-rails via promote_staging_batch (provenance-aware).
2. leave NARROW + OUT in staging, visibly flagged; do not drop.
3. hold NEEDS_REVIEW for the research lane.

## APPROVAL: <go | no-go> — Nick, <date>
