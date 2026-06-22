# AOS Inngest — Live Function Inventory

Source: served registry, verified against live endpoint https://aos-platform.vercel.app/api/inngest (cloud mode, function_count=158).

Total parsed: 160

## By domain

- packages/inngest/src/functions: 3
- workflows/agent: 12
- workflows/canon: 13
- workflows/canon/clusters: 2
- workflows/creative: 5
- workflows/ops: 5
- workflows/revops: 102
- workflows/sf: 1
- workflows/sync: 17

## All functions

| Domain | Function id | Trigger |
|---|---|---|
| packages/inngest/src/functions | hello-world | aos/hello.world |
| packages/inngest/src/functions | multi-step-flow | aos/flow.start \| aos/flow.confirmed |
| packages/inngest/src/functions | scheduled-check | cron: 0 9 * * * |
| workflows/agent | agent-exec8-orchestrator | cron: 0 12 * * 1-5 |
| workflows/agent | agent-exec8-proposal-approved | ops/exec8.proposal.approved |
| workflows/agent | agent-quality-director | cron: 0 8 * * * |
| workflows/agent | agents-approval-executor | agents/approval.granted |
| workflows/agent | agents-approval-granted | agents/approval.granted |
| workflows/agent | agents-execute-tool-call | agents/tool.call.requested |
| workflows/agent | classify-contacts | revops/contacts.classify.requested \| revops/gates.recalculate.completed |
| workflows/agent | company-brief | revops/company.brief.requested |
| workflows/agent | company-brief-pipeline | cron: 0 4 * * * |
| workflows/agent | exec8-triage-parser | ops/exec8.triage.completed \| ops/exec8.proposal.approved |
| workflows/agent | outreach-context | revops/outreach.context.requested \| revops/playbook.contact.ready |
| workflows/agent | revops-implementer | revops/agent.invoke \| agents/approval.granted \| agents/approval.granted |
| workflows/canon/clusters | canon-add-cluster-item | canon/cluster.item.add |
| workflows/canon/clusters | canon-extract-cluster-item | canon/cluster.item.extract |
| workflows/canon | canon-backfill-email-classification | canon/emails.backfill-classification |
| workflows/canon | canon-decompose-email-to-signals | cron: */30 * * * * |
| workflows/canon | canon-decompose-extraction-to-signals | cron: 15 */6 * * * |
| workflows/canon | canon-email-to-decision-queue | cron: 30 */4 * * * |
| workflows/canon | canon-ingest-all | cron: 0 6 * * * |
| workflows/canon | canon-ingest-documents | cron: 0 */12 * * * |
| workflows/canon | canon-ingest-emails | cron: 0 */4 * * * |
| workflows/canon | canon-ingest-transcripts | cron: 0 */6 * * * |
| workflows/canon | canon-ingest-uploaded-transcript | canon/transcript.file.uploaded |
| workflows/canon | canon-meeting-to-roadmap | cron: 0 */6 * * * |
| workflows/canon | canon-process-meeting-intelligence | cron: 30 */6 * * * |
| workflows/canon | canon-propose-email-reply | canon/email.signals.extracted |
| workflows/canon | canon-vault-auto-draft | canon/vault-draft.requested |
| workflows/creative | creative-content-to-site | creative/content.sync.requested \| creative/content.sync.approved |
| workflows/creative | creative-deploy-site | creative/site.deploy.requested |
| workflows/creative | creative-site-health-check | cron: TZ=America/Chicago 0 9 * * 1 |
| workflows/creative | creative-strategist | creative/agent.invoke \| creative/agent.approved |
| workflows/creative | creative-verify-deploy | creative/site.deploy.verify |
| workflows/ops | dq-spot-checker | cron: 0 2 * * * |
| workflows/ops | ops-operating-brief-refresh | cron: 0 18 * * 0 |
| workflows/ops | ops-operating-brief-write | ops/operating-brief.approved |
| workflows/ops | ops-wave-scheduler | cron: 30 5 * * * |
| workflows/ops | wave-progression-snapshot | cron: 30 3 * * * |
| workflows/revops | auto-enrichment-gate | revops/wave.complete |
| workflows/revops | auto-maintenance-wave | revops/segment.integrity.audit.completed |
| workflows/revops | autonomous-plan-trigger | cron: 0 6 * * * |
| workflows/revops | bounce-manager | revops/bounce.reported |
| workflows/revops | company-audit-explorium | revops/company.audit.explorium.requested |
| workflows/revops | company-classify | cron: 0 6 * * * |
| workflows/revops | company-classify-from-research | revops/company.classify-from-research.requested |
| workflows/revops | company-classify-v2 | cron: 0 9 * * * |
| workflows/revops | company-completeness-alert | cron: 0 8 * * * |
| workflows/revops | company-discover-exa | revops/company.discover.exa.requested |
| workflows/revops | company-enrich | cron: 0 7 * * 1 |
| workflows/revops | company-enrich-clinical-stage | revops/company.enrich-clinical-stage.requested |
| workflows/revops | company-playbook-fit | revops/company.playbook-fit.requested |
| workflows/revops | company-resolve-other | cron: 0 7 * * * |
| workflows/revops | company-type-classify | cron: 0 1 * * 0 |
| workflows/revops | completeness-snapshot | cron: 0 3 * * * |
| workflows/revops | composite-wave-runner | revops/wave.composite.run \| revops/wave.operation.completed |
| workflows/revops | compute-run-report-outcomes | cron: 10,40 * * * * |
| workflows/revops | ctgov-pipeline-scan | revops/ctgov.pipeline.scan.requested |
| workflows/revops | current-employer-resolve | revops/employer.resolve.requested |
| workflows/revops | data-hygiene | cron: 0 4 * * * |
| workflows/revops | domain-mismatch-remediate | cron: 0 4 1-7 * 0 |
| workflows/revops | drift-detection | cron: 0 10 1 1,4,7,10 * |
| workflows/revops | employment-departures-notify | revops/employment.departures.found |
| workflows/revops | employment-verify | cron: 0 2 1 * * |
| workflows/revops | engagement-feedback | revops/engagement.feedback.received |
| workflows/revops | enrichment-cost-alert | cron: 14 * * * * |
| workflows/revops | enrichment-level-reclassify | cron: 0 8 * * 1 |
| workflows/revops | enrichment-level-sync | cron: 0 6 * * * |
| workflows/revops | enrichment-retry | cron: 0 */4 * * * |
| workflows/revops | escalation-handler | revops/coverage.plateau \| revops/bounce.rate-warning \| revops/bounce.rate-critical \| revops/icp.drift-detected |
| workflows/revops | execution-plan-qa | revops/execution-plan.qa.requested |
| workflows/revops | execution-plan-review | revops/execution-plan.review.requested |
| workflows/revops | execution-plan-runner | revops/execution-plan.approved \| revops/execution-plan.advance |
| workflows/revops | execution-plan-watchdog | cron: */5 * * * * |
| workflows/revops | execution-step-failure-handler | revops/execution-step.failed |
| workflows/revops | execution-step-retry | revops/execution-step.retry |
| workflows/revops | execution-step-tracker | (none/invoke) |
| workflows/revops | exposure-monitor | cron: 0 2 * * * |
| workflows/revops | fit-score-compute | cron: 0 7 * * 1 |
| workflows/revops | funding-signal-enrichment | cron: 15 */1 * * * |
| workflows/revops | gate-recalculate | cron: 0 5 * * * |
| workflows/revops | gather-ctgov-company | cron: 30 8 * * * |
| workflows/revops | gather-exa-company | cron: 0 8 * * * |
| workflows/revops | gather-explorium-company | cron: 15 8 * * * |
| workflows/revops | job-hiring-signal | revops/job.hiring.signal.scan.requested |
| workflows/revops | lead-score-calculate | revops/lead-score.calculate.requested |
| workflows/revops | linkedin-company-enrich | revops/linkedin.company.enrich.requested |
| workflows/revops | linkedin-profile-enrich | revops/linkedin.profile.enrich.requested |
| workflows/revops | linkedin-url-discover | revops/linkedin.url.discover.requested |
| workflows/revops | list-company-enforce | revops/list.company.enforce.requested |
| workflows/revops | list-contact-enforce | revops/list.contact.enforce.requested |
| workflows/revops | list-enrichment-run | revops/list.enrichment.run.requested |
| workflows/revops | modality-enrich | revops/modality.enrich.requested |
| workflows/revops | monthly-hygiene | cron: 0 9 1 * * |
| workflows/revops | operation-run-complete | (none/invoke) |
| workflows/revops | operation-run-dispatcher | revops/operation.run.requested \| none |
| workflows/revops | orphan-contact-resolve | cron: 0 3 * * 3 |
| workflows/revops | orphan-evaluate | cron: 0 3 * * 0 |
| workflows/revops | pearl-export-cleanup | revops/pearl.export.cleanup |
| workflows/revops | pearl-reevaluate | cron: 0 */6 * * * |
| workflows/revops | pipeline-activity-tracker | cron: */15 * * * * |
| workflows/revops | pipeline-health-monitor | cron: */15 * * * * |
| workflows/revops | plan-generate | revops/plan.generate |
| workflows/revops | plan-notify | revops/plan.notify |
| workflows/revops | play-audit | cron: 0 6 * * * |
| workflows/revops | play-criteria-validate | revops/play.criteria.validate |
| workflows/revops | play-execute | revops/play.execute |
| workflows/revops | playbook-evaluate | revops/playbook.evaluate.requested \| revops/gates.recalculate.completed |
| workflows/revops | publication-conference-signal | revops/publication.signal.scan.requested |
| workflows/revops | quality-remediation | cron: 0 7 * * 1 |
| workflows/revops | quarterly-audit | cron: 0 9 1 1,4,7,10 * |
| workflows/revops | role-relevance-verify | revops/role.relevance.verify.requested |
| workflows/revops | routing-update | cron: 0 8 * * 1 |
| workflows/revops | score-retune | cron: 0 9 15 * * |
| workflows/revops | segment-cap-enforce | revops/segment.cap.enforce |
| workflows/revops | segment-hygiene-enforce | cron: 0 4 * * * |
| workflows/revops | segment-integrity-audit | cron: 0 6 * * * |
| workflows/revops | segment-membership-enforce | revops/segment.membership.enforce |
| workflows/revops | segment-revalidate-on-modality-change | revops/company.classified |
| workflows/revops | signal-decay | cron: 0 6 * * 1 |
| workflows/revops | signal-scan | cron: 0 6 * * * |
| workflows/revops | signal-to-wave | revops/signals.to.wave.requested |
| workflows/revops | signal-watcher | cron: */15 * * * * |
| workflows/revops | wave-build | revops/wave.build |
| workflows/revops | wave-complete | revops/wave.complete |
| workflows/revops | wave-create | revops/wave.create.requested |
| workflows/revops | wave-enrichment-completed | revops/wave.enrichment.completed |
| workflows/revops | wave-enrichment-requested | revops/wave.enrichment.requested |
| workflows/revops | wave-execute | revops/wave.execute |
| workflows/revops | wave-execution-ready | revops/wave.execution-ready |
| workflows/revops | wave-export-ready | revops/wave.ready.for.export |
| workflows/revops | wave-hygiene | revops/wave.hygiene.requested |
| workflows/revops | wave-initiate | revops/wave.initiate |
| workflows/revops | wave-rebuild | revops/wave.rebuild |
| workflows/revops | wave-recipe-bind | revops/wave.recipe.bind.requested |
| workflows/revops | wave-scheduler | cron: */15 * * * * |
| workflows/revops | wave-sourcing | revops/wave.sourcing.requested |
| workflows/revops | wave-verify | revops/wave.verify.requested |
| workflows/revops | wave-watchdog | cron: 0 */2 * * * |
| workflows/revops | weekly-rollup | cron: 0 23 * * 0 |
| workflows/revops | zombie-watchdog | cron: 0 * * * * |
| workflows/sf | sf-sync-batch | cron: 0 */6 * * * |
| workflows/sync | pearl-link-companies | revops/pearl.link-companies |
| workflows/sync | sync-activity-log-to-airtable | cron: */5 * * * * |
| workflows/sync | sync-activity-summary-to-airtable | cron: 0 4 * * * |
| workflows/sync | sync-data-standards-to-pearl | cron: 0 6 * * 1 |
| workflows/sync | sync-engagement-roadmap-to-airtable | cron: 16-59/30 * * * * |
| workflows/sync | sync-execution-plans-to-airtable | cron: 3-59/5 * * * * |
| workflows/sync | sync-gates-to-client | cron: 0 6 * * * |
| workflows/sync | sync-integrations-to-airtable | cron: 6-59/30 * * * * |
| workflows/sync | sync-plays-to-airtable | cron: 22 * * * * |
| workflows/sync | sync-providers-to-airtable | cron: 10-59/30 * * * * |
| workflows/sync | sync-recipes-to-airtable | cron: 12 * * * * |
| workflows/sync | sync-records-to-client | cron: 4-59/30 * * * * |
| workflows/sync | sync-run-reports-to-airtable | cron: 20-59/30 * * * * |
| workflows/sync | sync-scorecard-to-client | cron: 30 6 * * * |
| workflows/sync | sync-sf-reverse-sync | cron: */15 * * * * |
| workflows/sync | sync-sf-status-to-airtable | cron: 8-59/30 * * * * |
| workflows/sync | sync-waves-to-airtable | cron: 2-59/15 * * * * |
