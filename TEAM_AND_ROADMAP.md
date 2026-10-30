# Team Structure & Delivery Roadmap

## 1. Six-member team

| Member | Role | Ownership | Deliverables |
|---|---|---|---|
| 1 | Product and Regulatory Architect | Problem interpretation, AICTE/UGC rules, data dictionary and acceptance | PRD, source-backed rule matrix, synthetic policy fixtures, stakeholder research |
| 2 | Backend and Database Engineer | NestJS domain modules, PostgreSQL schema, migrations and APIs | Core backend, OpenAPI and database migrations |
| 3 | Data and Integration Engineer | CSV ingestion, identity adapter, duplicate matching, event worker and reconciliation | Adapters, batch pipeline, worker and mock providers |
| 4 | Institution Frontend Engineer | Institution portal and admission/upload workflows | Institution UI, upload feedback and correction screens |
| 5 | AICTE Frontend and Analytics Engineer | Regulatory dashboard, alert/case workflow and verifier UI | AICTE command centre, analytics and review UI |
| 6 | Security, QA and DevOps Engineer | OIDC, tenant isolation, audit, testing, CI/CD, observability and deployment | Docker environment, security tests, pipelines and demo operations |

## 2. Team working agreements

- Freeze the domain glossary, data dictionary and API contracts before parallel implementation.
- Member 1 reviews policy fixtures and source clauses; policy decisions require independent review where possible.
- Member 2 owns the canonical data model; other members do not create competing student/admission models.
- Member 3 owns provider interfaces; UI developers use mock contracts, not direct third-party calls.
- Members 4 and 5 work against OpenAPI and deterministic mock JSON so frontend work can proceed in parallel.
- Member 6 maintains a working integration environment from day one.
- All changes go through branches and pull requests.
- Integrate daily; do not defer integration to final day.
- Keep a visible list of mocked, sandbox and authorised production integrations.

## 3. Responsibility matrix

Legend: `A` accountable, `R` responsible, `C` consulted, `I` informed.

| Workstream | M1 | M2 | M3 | M4 | M5 | M6 |
|---|---|---|---|---|---|---|
| Product requirements | A/R | C | C | I | I | C |
| Regulatory rule matrix | A/R | C | R | I | C | C |
| Database/schema | C | A/R | C | I | I | C |
| Core API | C | A/R | R | I | I | C |
| Batch ingestion | C | R | A/R | C | I | C |
| Identity adapter | C | C | A/R | I | I | C |
| Policy engine | A | R | R | I | C | C |
| Institution UI | C | C | I | A/R | I | C |
| AICTE dashboard/cases | C | C | I | I | A/R | C |
| IAM/security | C | C | C | I | I | A/R |
| CI/CD/deployment | I | C | C | C | C | A/R |
| E2E testing/demo | A | R | R | R | R | A/R |

## 4. Hackathon sprint — 30 October to 2 November 2026

| Day | Work | Owner focus | Exit criteria |
|---|---|---|---|
| 30 Oct | Product scope, source review, repository, schema, OpenAPI, wireframes | M1/M2/M6 lead; all review | One canonical contract and repo builds |
| 31 Oct AM | Institution login, approval seeds, student/admission APIs, CSV staging | M2/M4/M6 | Institution can create and submit a batch |
| 31 Oct PM | APAAR mock adapter, validation, seat-rule evaluator, initial dashboard | M1/M3/M5 | Rows produce status/issues and dashboard counts |
| 1 Nov AM | Event/outbox, duplicate/reconciliation, admission lifecycle | M2/M3/M6 | Withdrawal and duplicate scenarios are testable |
| 1 Nov PM | Case review, reports, verifier preview, tenant/security tests | M4/M5/M6 | Full vertical slice passes |
| 1 Nov night | Regression, Docker clean start, seeded demo, slides and rehearsal | All | Stable repeatable demo |
| 2 Nov | Final verification and submission | All | Presentation accurately reflects implemented features |

## 5. Suggested work breakdown

### M1 — Product/regulatory

- Build stakeholder map and process map.
- Extract AICTE APH rules into a source-linked matrix.
- Identify later AICTE notices to check.
- Define academic year, programme, route, category and event vocabularies.
- Prepare edge-case scenarios and acceptance criteria.
- Review all policy calculations before demo.

### M2 — Backend/database

- Create NestJS modules and global validation/error filters.
- Define Prisma/TypeORM models and migrations.
- Implement institution, programme, approval, student and admission APIs.
- Add tenant-aware repository/service guards.
- Implement transaction boundaries and state transition service.
- Maintain OpenAPI.

### M3 — Data/integration

- Implement quarantine/staging pipeline.
- Build CSV parser and row-level validation.
- Implement identity provider interface and mock adapter.
- Implement HMAC matching through protected service abstraction.
- Implement policy-evaluation service with M1 fixtures.
- Implement event/outbox worker and reconciliation logic.

### M4 — Institution frontend

- Login and institution context.
- Course/academic-year selection.
- Batch upload and column mapping.
- Batch processing screen.
- Row-level error/warning report.
- Admission list and status/correction actions.
- Institution seat-position dashboard.

### M5 — AICTE frontend/analytics

- National/institution summary dashboard.
- Approval and programme view.
- Seat and category analytics.
- Reconciliation case queue.
- Case detail/evidence/review decision.
- Restricted verifier result and synthetic QR page.

### M6 — Security/QA/DevOps

- Keycloak/OIDC demo setup.
- Institution scoping and role tests.
- Audit logging and sensitive-value redaction.
- Docker Compose, CI build and test pipeline.
- Database seed/reset scripts.
- E2E and API security tests.
- Demo fallback and operational checklist.

## 6. Product rollout beyond SIH

### Release 0 — Architecture and requirements

Confirm source-of-truth, policy applicability, data-flow legal basis, APIs, field minimisation, institution workflows and threat model.

### Release 1 — MVP

Build a central student-admission registry, approval snapshots, bulk ingestion, provider adapters, deterministic rules, event history, reconciliation cases, dashboards and audit.

### Release 2 — Controlled pilot

Pilot with varied AICTE-approved institutions and an affiliating university. Validate ERP formats, state counselling integration, category rules, data quality, usability and false-positive rates.

### Release 3 — Production hardening

Complete high availability, KMS/HSM, external identity integration, independent security audit, penetration test, disaster recovery, performance validation, operational support and legal/privacy sign-off.

### Release 4 — Scale

Expand institution connectors, state and university integration, analytics warehouse and ML prioritisation under governance.

## 7. Initial production NFR targets

Targets are proposed for planning and require validation by the platform owner:

| Measure | Initial target |
|---|---|
| Core API availability | 99.9% monthly |
| Standard query latency | P95 under 1.5 seconds under agreed workload |
| RPO | 15 minutes or better |
| RTO | 4 hours or better |
| Batch behaviour | Immediate acknowledgement; asynchronous processing |
| Retry safety | No duplicate committed admissions |
| Audit | All critical/privileged changes logged |
| Accessibility | WCAG 2.2 AA design target |

## 8. Meeting cadence

- 10-minute daily stand-up: yesterday, today, blocker.
- Daily integration checkpoint: demo actual working code, not status claims.
- Regulatory review before any policy change.
- End-of-day build and test report.
- Final demo rehearsal with a clean reset.
